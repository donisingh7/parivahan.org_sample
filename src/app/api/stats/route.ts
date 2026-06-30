import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAllStateServers } from "@/lib/states/registry.server";

export const runtime = "nodejs";

// Real total bookings = SUCCESS transactions summed across EVERY per-state
// collection (transactions are stored per state, not in one collection).
export async function GET() {
  if (process.env.MOCK_DB === "true") {
    return NextResponse.json({ totalPayments: 0 });
  }

  try {
    await connectDB();
    const servers = getAllStateServers();
    const counts = await Promise.all(
      servers.map((s) => s.getModel().countDocuments({ status: "SUCCESS" }))
    );
    const totalPayments = counts.reduce((sum, n) => sum + n, 0);
    return NextResponse.json({ totalPayments });
  } catch {
    return NextResponse.json({ totalPayments: 0 });
  }
}
