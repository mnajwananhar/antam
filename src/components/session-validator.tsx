"use client";

import { useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ExtendedUser } from "@/lib/auth.config";

interface SessionValidatorProps {
  children: React.ReactNode;
}

export function SessionValidator({ children }: SessionValidatorProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isValidatingRef = useRef(false);

  useEffect(() => {
    if (status === "loading" || !session?.user) return;

    // Only validate for non-VIEWER roles (ADMIN, INPUTTER, PLANNER need single session)
    if (session.user.role === "VIEWER") return;

    const validateSession = async (): Promise<void> => {
      // Prevent concurrent validation calls
      if (isValidatingRef.current) {
        return;
      }
      
      isValidatingRef.current = true;
      
      try {
        // Get sessionToken from the JWT token if available
        const sessionToken =
          (session.user as ExtendedUser)?.sessionToken || null;

        console.log(
          "Validating session with token:",
          sessionToken ? "present" : "null"
        );

        const requestBody = {
          sessionToken,
        };

        console.log("Request body:", requestBody);

        const response = await fetch("/api/auth/validate-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const data = await response.json();
          console.warn("Session validation failed:", data.error);

          // Handle session invalidation (user logged in from another device)
          if (response.status === 401 && data.error && 
              (data.error.includes("invalidated") || data.error.includes("No active session"))) {
            console.log("Session has been invalidated by another login - signing out");
            
            try {
              // Sign out without redirect to avoid race conditions
              await signOut({ 
                redirect: false,
                callbackUrl: "/auth/signin?message=Another device has logged in with your account."
              });
              
              // Use replace instead of push to avoid navigation issues
              window.location.replace("/auth/signin?message=Another device has logged in with your account.");
            } catch (signOutError) {
              console.error("Error during signout:", signOutError);
              // Force redirect even if signout fails
              window.location.replace("/auth/signin?message=Session expired. Please sign in again.");
            }
            
            return; // Exit early to prevent further execution
          }
          
          // For other errors, just log but don't force logout
          console.warn("Session validation failed - consider manual re-authentication if issues persist");
        }
      } catch (error) {
        console.error("Session validation error:", error);
        
        // If it's a network error or fetch failed completely, 
        // don't force logout as this could be temporary
        if (error instanceof TypeError && error.message.includes('fetch')) {
          console.warn("Network error during session validation - will retry on next interval");
          return;
        }
        
        // For other errors that might indicate session issues,
        // log them but don't auto-logout to prevent false positives
        console.warn("Unexpected session validation error - manual re-authentication may be needed");
      } finally {
        isValidatingRef.current = false;
      }
    };

    // Validate session on component mount
    validateSession();

    // Set up periodic validation every 5 minutes
    const intervalId = setInterval(validateSession, 5 * 60 * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [session, status, router]);

  return <>{children}</>;
}
