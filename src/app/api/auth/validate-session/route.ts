import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { SessionManager } from "@/lib/session-manager";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { valid: false, error: "No active session" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionToken } = body;

    const userId = parseInt(session.user.id);
    const isValid = await SessionManager.validateSession(userId, sessionToken);

    if (!isValid) {
      return NextResponse.json(
        { valid: false, error: "Session has been invalidated" },
        { status: 401 }
      );
    }

    return NextResponse.json({ 
      valid: true,
      user: {
        id: session.user.id,
        username: session.user.username,
        role: session.user.role,
      }
    });

  } catch (error) {
    console.error("Session validation API error:", error);
    return NextResponse.json(
      { valid: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}