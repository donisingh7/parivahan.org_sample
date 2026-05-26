import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

export async function GET() {
  if (process.env.MOCK_DB === "true") {
    return NextResponse.json({ totalPayments: 0 });
  }

  try {
    await connectDB();
    const count = await Transaction.countDocuments({ status: "SUCCESS" });
    return NextResponse.json({ totalPayments: count });
  } catch {
    return NextResponse.json({ totalPayments: 0 });
  }
}
