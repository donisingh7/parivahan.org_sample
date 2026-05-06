import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Vehicle from "@/models/Vehicle";

// GET /api/vehicle/[regNo] — lookup vehicle by registration number
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ regNo: string }> }
) {
  try {
    const { regNo } = await params;
    const normalised = regNo.toUpperCase().replace(/\s/g, "");

    await connectDB();
    const vehicle = await Vehicle.findOne({ registrationNo: normalised }).lean();

    if (!vehicle) {
      return NextResponse.json({ success: false, message: "Vehicle not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: vehicle });
  } catch (err) {
    console.error("GET /api/vehicle error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
