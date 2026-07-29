import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { buildReceiptPdf } from "@/lib/receipt/generatePdf";
import { uploadReceipt, buildReceiptS3Key } from "@/lib/aws/s3";
import { sendReceiptSms } from "@/lib/aws/sns";
import { signQrToken, buildQrPageUrl } from "@/lib/qrToken";
import { isSupportedState } from "@/lib/states/registry";
import { getStateServer } from "@/lib/states/registry.server";
import VehicleCache from "@/models/VehicleCache";

export const runtime = "nodejs";

function makeTransactionId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TXN${ts}${rand}`;
}

// Decode the portal user from the user_token cookie if present. Returns
// { userId, userIdLabel } so the receipt can identify who paid. Failures are
// soft — an unauthenticated request still gets a transaction saved (with
// empty userId) so the user always sees their receipt.
async function readPortalUser(req: NextRequest): Promise<{ userId: string; userIdLabel: string }> {
  try {
    const token = req.cookies.get("user_token")?.value;
    if (!token) return { userId: "", userIdLabel: "" };
    const payload = await verifyToken(token);
    return { userId: payload.userId ?? "", userIdLabel: payload.email ?? "" };
  } catch {
    return { userId: "", userIdLabel: "" };
  }
}

// Coerce a possibly-empty date-ish input into a Date or null.
function toDateOrNull(v: unknown): Date | null {
  if (!v || typeof v !== "string" || v.trim() === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

// POST /api/payment — create a new payment transaction.
//
// Multi-state aware: the body must include `state` (RJ / BR / AP / …), which
// selects the per-state Mongo collection and per-state PDF generator. The
// state code is also embedded in the QR JWT so /r/<token> can later route the
// public PDF stream back to the right collection without having to scan all
// of them.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      state,
      vehicleNo, chassisNo, ownerName, mobileNo,
      visitingState, fromState,
      vehicleType, vehicleClass,
      permitType, districtEntering,
      checkpostName, purposeOfVisit,
      aitpValidity, aitpAuthValidity,
      taxFrom, taxTo, taxMode, noOfPeriods,
      seatingCap, sleeperCap,
      receiptNo, orderRef,
      amount, paymentMethod, bankName,
      // ── Haryana-specific (other states send these undefined) ─────────
      vehicleCategory, serviceType, distance, borderDistrict,
      fitnessValidity, insuranceValidity, puccValidity,
      // ── Punjab-shared (Uttarakhand / Himachal Pradesh also use these) ─
      userCharge, infraCess,
      // ── Himachal Pradesh-specific (other states send this undefined) ─
      fuelType,
      // ── Uttarakhand / Uttar Pradesh-specific (others send undefined) ─
      permitNumber, permitFrom, permitUpto,
      // ── Haryana-specific — "HH:MM" time part of the tax window ─────────
      taxFromTime, taxToTime,
      // ── Punjab-specific — vehicle weight fields ───────────────────────
      grossVehicleWt, unladenWt,
      // ── Andhra Pradesh-specific ───────────────────────────────────────
      nameOfGoods, route, paymentInitDate, apTaxItemsJson,
      // ── HP-specific user-override dates ─────────────────────────────
      paymentConfDate, printedOn,
      // ── Jharkhand-specific — string weight/validity fields ─────────────────────
      grossCombinationWeight, jhFitnessValidity, jhInsuranceValidity,
      jhPuccValidity, jhGrossVehicleWt, jhUnladenWt,
      // ── Bihar-specific — string weight/validity fields ───────────────────────
      brGrossVehicleWt, brUnladenWt, brFitnessValidity, brInsuranceValidity, brPuccValidity,
      // ── Maharashtra-specific ─────────────────────────────────────────
      mhLadenWeight, mhUnladenWeight, mhMvTax, mhPermitFee,
      // ── Gujarat-specific ─────────────────────────────────────────────
      gjLadenWeight, gjUnladenWeight, gjMvTax, gjPermitFee, gjMakerStatus,
      // ── Chhattisgarh-specific ────────────────────────────────────────
      cgLadenWeight, cgUnladenWeight, cgMvTax, cgPermitFee,
      // ── Telangana-specific ───────────────────────────────────────────
      tsLadenWeight, tsUnladenWeight, tsMvTax, tsPermitFee,
      // ── Madhya Pradesh-specific ──────────────────────────────────────
      mpDto, mpStandingCap, mpRoadTaxValidity, mpPermitFee, mpMvTax, mpUserCharge, mpSgst, mpCgst,
      // ── Tamil Nadu-specific ──────────────────────────────────────────
      tnPermitFee, tnMvTax, tnWelfareTax, tnUserCharge, tnGreenTaxValidity, tnBasePermitValidity,
      // ── Odisha-specific ──────────────────────────────────────────────
      orStandingCap,
      // ── Karnataka-specific ───────────────────────────────────────────
      kaFloorArea, kaTaxValidity,
    } = body;

    const missing: string[] = [];
    if (!state || !isSupportedState(state))                   missing.push("state");
    if (!vehicleNo)                                           missing.push("vehicleNo");
    if (!taxFrom)                                             missing.push("taxFrom");
    if (!taxTo)                                               missing.push("taxTo");
    if (amount === undefined || amount === null || amount === "") missing.push("amount");
    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, message: `Missing required field(s): ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    // ── Mock mode: skip DB save, S3, and SMS — return a fake transactionId ───
    if (process.env.MOCK_DB === "true") {
      const mockTxnId = makeTransactionId();
      return NextResponse.json({
        success: true,
        transactionId: mockTxnId,
        receiptNo: receiptNo ?? "MOCK-RECEIPT",
        _mock: true,
      });
    }

    await connectDB();

    const stateServer = getStateServer(state);
    const TransactionModel = stateServer.getModel();

    const transactionId = body.transactionId && typeof body.transactionId === "string"
      ? body.transactionId
      : makeTransactionId();
    const { userId, userIdLabel } = await readPortalUser(req);

    const txn = await TransactionModel.create({
      transactionId,
      state,
      userId,
      userIdLabel,
      receiptNo:        receiptNo        ?? "",
      orderRef:         orderRef         ?? "",
      vehicleNo:        String(vehicleNo).toUpperCase().trim(),
      chassisNo:        chassisNo        ?? "",
      ownerName:        ownerName        ?? "",
      mobileNo:         mobileNo         ?? "",
      visitingState:    visitingState    ?? state,
      fromState:        fromState        ?? "",
      vehicleType:      vehicleType      ?? "",
      vehicleClass:     vehicleClass     ?? "",
      permitType:       permitType       ?? "",
      districtEntering: districtEntering ?? "",
      checkpostName:    checkpostName    ?? "",
      purposeOfVisit:   purposeOfVisit   ?? "",
      aitpValidity:     toDateOrNull(aitpValidity),
      aitpAuthValidity: toDateOrNull(aitpAuthValidity),
      taxFrom:          new Date(taxFrom),
      taxTo:            new Date(taxTo),
      taxMode:          taxMode          ?? "",
      noOfPeriods:      Number(noOfPeriods) || 1,
      seatingCap:       parseInt(seatingCap) || 0,
      sleeperCap:       parseInt(sleeperCap) || 0,
      amount:           parseFloat(amount),
      paymentMethod:    paymentMethod    ?? "ONLINE",
      bankName:         bankName         ?? "",
      status:           "SUCCESS",
      paidAt:           new Date(),
      // ── State-specific extras ─────────────────────────────────────────
      // Every per-state schema declares whatever subset of these it cares
      // about as optional fields on the shared baseSchema, so unknown keys
      // are silently dropped by Mongoose strict-mode for states that don't
      // need them. Sending them all unconditionally keeps the route fully
      // state-agnostic — adding a new state with a new field is just a
      // schema change, no edits here.
      vehicleCategory:   vehicleCategory  ?? "",
      serviceType:       serviceType      ?? "",
      distance:          Number(distance) || 0,
      borderDistrict:    borderDistrict   ?? "",
      fitnessValidity:   toDateOrNull(fitnessValidity),
      insuranceValidity: toDateOrNull(insuranceValidity),
      puccValidity:      toDateOrNull(puccValidity),
      userCharge:        Number(userCharge) || 0,
      infraCess:         Number(infraCess)  || 0,
      fuelType:          fuelType         ?? "",
      permitNumber:      permitNumber     ?? "",
      permitFrom:        toDateOrNull(permitFrom),
      permitUpto:        toDateOrNull(permitUpto),
      taxFromTime:       typeof taxFromTime === "string" ? taxFromTime : "",
      taxToTime:         typeof taxToTime   === "string" ? taxToTime   : "",
      grossVehicleWt:    Number(grossVehicleWt) || 0,
      unladenWt:         Number(unladenWt)       || 0,
      nameOfGoods:       nameOfGoods      ?? "",
      route:             route            ?? "",
      paymentInitDate:   paymentInitDate  ?? "",
      apTaxItemsJson:    apTaxItemsJson   ?? "",
      paymentConfDate:   paymentConfDate  ?? "",
      printedOn:         printedOn        ?? "",
      // ── Jharkhand-specific (silently ignored by other states' Mongoose schemas)
      grossCombinationWeight: grossCombinationWeight ?? "",
      jhFitnessValidity:      jhFitnessValidity      ?? "",
      jhInsuranceValidity:    jhInsuranceValidity    ?? "",
      jhPuccValidity:         jhPuccValidity         ?? "",
      jhGrossVehicleWt:       jhGrossVehicleWt       ?? "",
      jhUnladenWt:            jhUnladenWt            ?? "",
      // ── Bihar-specific (silently ignored by other states' Mongoose schemas)
      brGrossVehicleWt:       brGrossVehicleWt       ?? "",
      brUnladenWt:            brUnladenWt            ?? "",
      brFitnessValidity:      brFitnessValidity      ?? "",
      brInsuranceValidity:    brInsuranceValidity    ?? "",
      brPuccValidity:         brPuccValidity         ?? "",
      // ── Maharashtra-specific (silently ignored by other states' Mongoose schemas)
      mhLadenWeight:          mhLadenWeight          ?? "",
      mhUnladenWeight:        mhUnladenWeight        ?? "",
      mhMvTax:                Number(mhMvTax)         || 0,
      mhPermitFee:            Number(mhPermitFee)     || 0,
      gjLadenWeight:          gjLadenWeight          ?? "",
      gjUnladenWeight:        gjUnladenWeight        ?? "",
      gjMvTax:                Number(gjMvTax)         || 0,
      gjPermitFee:            Number(gjPermitFee)     || 0,
      gjMakerStatus:          gjMakerStatus          ?? "",
      cgLadenWeight:          cgLadenWeight          ?? "",
      cgUnladenWeight:        cgUnladenWeight        ?? "",
      cgMvTax:                Number(cgMvTax)         || 0,
      cgPermitFee:            Number(cgPermitFee)     || 0,
      tsLadenWeight:          tsLadenWeight          ?? "",
      tsUnladenWeight:        tsUnladenWeight        ?? "",
      tsMvTax:                Number(tsMvTax)         || 0,
      tsPermitFee:            Number(tsPermitFee)     || 0,
      mpDto:                  mpDto                  ?? "",
      mpStandingCap:          Number(mpStandingCap)   || 0,
      mpRoadTaxValidity:      mpRoadTaxValidity      ?? "",
      mpPermitFee:            Number(mpPermitFee)     || 0,
      mpMvTax:                Number(mpMvTax)         || 0,
      mpUserCharge:           Number(mpUserCharge)    || 0,
      mpSgst:                 Number(mpSgst)          || 0,
      mpCgst:                 Number(mpCgst)          || 0,
      // ── Tamil Nadu-specific (silently ignored by other states' Mongoose schemas)
      tnPermitFee:            Number(tnPermitFee)     || 0,
      tnMvTax:                Number(tnMvTax)         || 0,
      tnWelfareTax:           Number(tnWelfareTax)    || 0,
      tnUserCharge:           Number(tnUserCharge)    || 0,
      tnGreenTaxValidity:     tnGreenTaxValidity     ?? "",
      tnBasePermitValidity:   tnBasePermitValidity   ?? "",
      // ── Odisha-specific (silently ignored by other states' Mongoose schemas)
      orStandingCap:          orStandingCap          ?? "",
      // ── Karnataka-specific (silently ignored by other states' Mongoose schemas)
      kaFloorArea:            kaFloorArea            ?? "",
      kaTaxValidity:          kaTaxValidity          ?? "",
    });

    // ── Upsert VehicleCache with grey-field values ────────────────────────
    // Fire-and-forget: a cache failure must never block the payment response.
    // Weight fields are normalised across state-specific naming conventions so
    // a single grossVehicleWt / unladenWt pair covers all states.
    try {
      const normVehicleNo = String(vehicleNo).toUpperCase().trim();
      const resolvedGvw  = String(grossVehicleWt  || jhGrossVehicleWt  || brGrossVehicleWt  || mhLadenWeight  || gjLadenWeight  || cgLadenWeight  || tsLadenWeight  || "");
      const resolvedUwt  = String(unladenWt        || jhUnladenWt       || brUnladenWt       || mhUnladenWeight || gjUnladenWeight || cgUnladenWeight || tsUnladenWeight || "");
      await VehicleCache.findOneAndUpdate(
        { vehicleNo: normVehicleNo },
        {
          $set: {
            chassisNo:       chassisNo        ?? "",
            ownerName:       ownerName        ?? "",
            mobileNo:        mobileNo         ?? "",
            vehicleType:     vehicleType      ?? "",
            vehicleCategory: vehicleCategory  ?? "",
            vehicleClass:    vehicleClass     ?? "",
            seatingCap:      String(seatingCap  ?? ""),
            sleeperCap:      String(sleeperCap  ?? ""),
            grossVehicleWt:  resolvedGvw,
            unladenWt:       resolvedUwt,
            fuelType:        fuelType         ?? "",
            permitType:      permitType       ?? "",
            permitNumber:    permitNumber     ?? "",
            taxMode:         taxMode          ?? "",
            noPeriods:       String(noOfPeriods ?? ""),
          },
        },
        { upsert: true, new: true }
      );
    } catch (cacheErr) {
      console.error("[payment] vehicle cache upsert failed:", cacheErr);
    }

    // ── Side-effects after a successful save ──────────────────────────────
    // 1. Compute the canonical S3 key  <state>/<portalUserId>/<MonthName>/<txnId>.pdf
    //    so receipts are foldered per state, per portal user, per month.
    // 2. Mint a 3-day QR token that resolves to /r/<token> on this app — that
    //    public page streams the PDF from S3 without requiring login. The
    //    token also carries the state code so the lookup is direct.
    // 3. Render the receipt PDF with the state's PDF generator.
    // 4. Upload the PDF to S3.
    // 5. Publish the post-payment SMS via SNS.
    //
    // S3 upload is awaited so the iframe on the success screen has something
    // to show. SMS failures are logged but never propagate — payments must
    // never roll back because of a downstream notification glitch.
    const s3Key = buildReceiptS3Key({
      state,
      portalUserId:  userIdLabel,
      paidAt:        txn.paidAt,
      transactionId,
    });
    const qrToken = await signQrToken({ tid: transactionId, s3: s3Key, st: state });
    const qrUrl   = buildQrPageUrl(qrToken);

    let storedS3Key = "";
    let smsMessageId = "";
    try {
      const pdf = await buildReceiptPdf(
        state,
        txn.toObject() as unknown as Record<string, unknown>,
        { qrUrl }
      );
      storedS3Key = await uploadReceipt(s3Key, pdf);
    } catch (s3Err) {
      console.error("[payment] receipt upload to S3 failed:", s3Err);
    }
    try {
      const id = await sendReceiptSms({
        mobileNo:      String(mobileNo ?? ""),
        vehicleNo:     String(vehicleNo).toUpperCase().trim(),
        amount:        parseFloat(amount),
        receiptNo:     String(receiptNo ?? ""),
        transactionId,
      });
      smsMessageId = id ?? "";
    } catch (smsErr) {
      console.error("[payment] SMS publish failed:", smsErr);
    }

    if (storedS3Key || smsMessageId) {
      await TransactionModel.updateOne(
        { transactionId },
        { $set: { s3Key: storedS3Key, smsMessageId } }
      ).catch((e) => console.error("[payment] failed to persist s3Key/smsMessageId:", e));
    }

    return NextResponse.json(
      {
        success: true,
        transactionId,
        state,
        data: txn,
        s3Key: storedS3Key,
        smsMessageId,
        qrUrl,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/payment error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

// GET /api/payment?txnId=XXX[&state=XX] — get payment by transaction ID.
//
// `state` is optional: when provided we hit a single per-state collection
// directly; when absent we scan every state collection in parallel. Production
// callers (admin, success screen) are expected to pass it.
export async function GET(req: NextRequest) {
  try {
    const txnId     = req.nextUrl.searchParams.get("txnId");
    const vehicleNo = req.nextUrl.searchParams.get("vehicleNo");
    const stateHint = req.nextUrl.searchParams.get("state");

    if (!txnId && !vehicleNo) {
      return NextResponse.json({ success: false, message: "txnId or vehicleNo required" }, { status: 400 });
    }

    await connectDB();

    if (txnId) {
      if (stateHint && isSupportedState(stateHint)) {
        const result = await getStateServer(stateHint).getModel().findOne({ transactionId: txnId }).lean();
        if (!result) return NextResponse.json({ success: false, message: "Transaction not found" }, { status: 404 });
        return NextResponse.json({ success: true, data: result, state: stateHint });
      }
      // No state hint — fan out across every collection.
      const { findTransactionAcrossStates } = await import("@/lib/states/registry.server");
      const found = await findTransactionAcrossStates(txnId);
      if (!found) return NextResponse.json({ success: false, message: "Transaction not found" }, { status: 404 });
      return NextResponse.json({ success: true, data: found.doc, state: found.state });
    }

    // vehicleNo lookup — search every state's collection in parallel and merge.
    const { getAllStateServers } = await import("@/lib/states/registry.server");
    const upperVeh = vehicleNo!.toUpperCase();
    const lists = await Promise.all(
      getAllStateServers().map((s) =>
        s.getModel().find({ vehicleNo: upperVeh }).sort({ createdAt: -1 }).lean()
      )
    );
    const merged = lists.flat().sort((a, b) => {
      const ta = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
      const tb = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
      return tb - ta;
    });
    return NextResponse.json({ success: true, data: merged });
  } catch (err) {
    console.error("GET /api/payment error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
