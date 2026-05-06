import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import PortalUser from "@/models/PortalUser";
import { signToken } from "@/lib/auth";

// POST /api/auth/user-login
export async function POST(req: NextRequest) {
  try {
    const { userId, password } = await req.json();

    if (!userId || !password) {
      return NextResponse.json(
        { success: false, message: "User ID and password are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await PortalUser.findOne({ userId: userId.trim() });
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, message: "Invalid User ID or password" }, { status: 401 });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return NextResponse.json({ success: false, message: "Invalid User ID or password" }, { status: 401 });
    }

    const token = await signToken({ userId: user._id.toString(), email: user.userId, role: "user" });

    const response = NextResponse.json({
      success: true,
      token,
      user: { userId: user.userId, name: user.name, mobileNo: user.mobileNo },
    });

    response.cookies.set("user_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("POST /api/auth/user-login error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
