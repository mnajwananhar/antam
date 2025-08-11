import { NextRequest, NextResponse } from "next/server";
import { SessionManager } from "@/lib/session-manager";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Invalidate all sessions for the user
    await SessionManager.invalidateUserSessions(parseInt(userId));

    return NextResponse.json({ 
      success: true,
      message: "All sessions invalidated for user"
    });

  } catch (error) {
    console.error("Force logout API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}