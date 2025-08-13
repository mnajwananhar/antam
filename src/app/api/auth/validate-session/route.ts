import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { SessionManager } from "@/lib/session-manager";

interface ValidateSessionRequest {
  sessionToken: string | null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { valid: false, error: "No active session" },
        { status: 401 }
      );
    }

    // Validate request body exists and is valid JSON
    let body;
    try {
      const text = await request.text();
      if (!text || text.trim() === "") {
        return NextResponse.json(
          { valid: false, error: "Request body is empty" },
          { status: 400 }
        );
      }
      body = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { valid: false, error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { sessionToken } = body as ValidateSessionRequest;

    // Validate sessionToken exists in request
    if (sessionToken === undefined) {
      return NextResponse.json(
        { valid: false, error: "sessionToken is required" },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);
    const isValid = await SessionManager.validateSession(
      userId,
      sessionToken ?? undefined
    );

    if (!isValid) {
      return NextResponse.json(
        { valid: false, error: "Session has been invalidated by another login" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      user: {
        id: session.user.id,
        username: session.user.username,
        role: session.user.role,
      },
    });
  } catch (error) {
    console.error("Session validation API error:", error);
    return NextResponse.json(
      { valid: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
