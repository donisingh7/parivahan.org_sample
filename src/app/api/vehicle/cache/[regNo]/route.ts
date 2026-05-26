import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import VehicleCache from "@/models/VehicleCache";

/**
 * GET /api/vehicle/cache/[regNo]
 *
 * Returns the cached grey-field data for the given registration number.
 * Used by each state's TaxCollectionForm "Get Details" button to pre-fill
 * chassis number, owner name, vehicle type/category/class, and weight fields.
 *
 * Responds:
 *   200  { success: true,  data: IVehicleCache }
 *   404  { success: false, message: "VEHICLE DATA DOES NOT EXIST" }
 *   500  { success: false, message: "Server error" }
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ regNo: string }> }
) {
  try {
    const { regNo } = await params;
    const normalised = regNo.toUpperCase().replace(/\s/g, "");

    await connectDB();
    const entry = await VehicleCache.findOne({ vehicleNo: normalised }).lean();

    if (!entry) {
      return NextResponse.json(
        { success: false, message: "VEHICLE DATA DOES NOT EXIST" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: entry });
  } catch (err) {
    console.error("GET /api/vehicle/cache error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
