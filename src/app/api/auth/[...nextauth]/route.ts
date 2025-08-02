import { handlers } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// Wrap handlers with error handling
const wrappedGET = async (request: NextRequest) => {
  try {
    return await handlers.GET(request);
  } catch (error) {
    console.error("NextAuth GET error:", error);
    
    // Return a more graceful error response
    return NextResponse.json(
      { 
        error: "Session service temporarily unavailable",
        code: "SESSION_ERROR"
      }, 
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
};

const wrappedPOST = async (request: NextRequest) => {
  try {
    return await handlers.POST(request);
  } catch (error) {
    console.error("NextAuth POST error:", error);
    
    return NextResponse.json(
      { 
        error: "Authentication service temporarily unavailable",
        code: "AUTH_ERROR"
      }, 
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
};

export { wrappedGET as GET, wrappedPOST as POST };
