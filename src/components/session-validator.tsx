"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ExtendedUser } from "@/lib/auth.config";

interface SessionValidatorProps {
  children: React.ReactNode;
}

export function SessionValidator({ children }: SessionValidatorProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading" || !session?.user) return;

    // Only validate for non-VIEWER roles (ADMIN, INPUTTER, PLANNER need single session)
    if (session.user.role === "VIEWER") return;

    const validateSession = async (): Promise<void> => {
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

          // Don't auto-signout to avoid refresh issues during temporary network problems
          console.warn(
            "Session validation failed - consider manual re-authentication if issues persist"
          );

          // Only signout after multiple consecutive failures
          if (data.error && data.error.includes("invalidated")) {
            await signOut({
              callbackUrl:
                "/auth/signin?message=Session expired. Please sign in again.",
              redirect: false,
            });

            router.push(
              "/auth/signin?message=Your session has expired. Please sign in again."
            );
          }
        }
      } catch (error) {
        console.error("Session validation error:", error);
        // Don't force logout on network errors, just log
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
