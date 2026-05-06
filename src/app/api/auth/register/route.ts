import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { requireAuth } from "@/lib/auth";

// POST /api/auth/register — protected: only superadmin or first-run (no users exist)
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: "name, email and password are required" }, { status: 400 });
    }

    // Allow first-time creation if no users exist; otherwise require superadmin
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      const caller = await requireAuth(req);
      if (caller.role !== "superadmin") {
        return NextResponse.json({ success: false, message: "Only superadmin can add new users" }, { status: 403 });
      }
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ success: false, message: "Email already registered" }, { status: 409 });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: userCount === 0 ? "superadmin" : (role ?? "admin"),
    });

    return NextResponse.json({
      success: true,
      message: userCount === 0 ? "Superadmin created" : "Admin created",
      user: { name: user.name, email: user.email, role: user.role },
    }, { status: 201 });
  } catch (err) {
    console.error("POST /api/auth/register error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
