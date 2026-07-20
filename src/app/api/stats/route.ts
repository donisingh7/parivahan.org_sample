import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { getAllStateServers } from "@/lib/states/registry.server";

export const runtime = "nodejs";

// "Total Payment" for the logged-in portal user = the SUM of `amount` over all
// their SUCCESS transactions across EVERY per-state collection (transactions
// are stored per state, not in one collection). Falls back to 0 when there's
// no valid user_token cookie (not logged in).
export async function GET(req: NextRequest) {
  if (process.env.MOCK_DB === "true") {
    return NextResponse.json({ totalPayments: 0 });
  }

  // Identify the logged-in portal user from the user_token cookie.
  let userId = "";
  try {
    const token = req.cookies.get("user_token")?.value;
    if (token) {
      const payload = await verifyToken(token);
      userId = payload.userId ?? "";
    }
  } catch {
    userId = "";
  }

  // No logged-in user → nothing to total.
  if (!userId) {
    return NextResponse.json({ totalPayments: 0 });
  }

  try {
    await connectDB();
    const servers = getAllStateServers();
    const sums = await Promise.all(
      servers.map(async (s) => {
        const rows = await s.getModel().aggregate<{ total: number }>([
          { $match: { userId, status: "SUCCESS" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);
        return rows[0]?.total ?? 0;
      })
    );
    const totalPayments = sums.reduce((sum, n) => sum + n, 0);
    return NextResponse.json({ totalPayments });
  } catch {
    return NextResponse.json({ totalPayments: 0 });
  }
}
