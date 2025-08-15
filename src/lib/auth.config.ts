import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

// Login schema validation
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Extended user type for session
export interface ExtendedUser {
  id: string;
  username: string;
  role: UserRole;
  departmentId: number | null;
  departmentName?: string | null;
  sessionToken?: string;
}

// Session management rules based on user role
const SINGLE_SESSION_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.INPUTTER, UserRole.PLANNER];

export const authConfig: NextAuthConfig = {
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const validatedFields = loginSchema.safeParse(credentials);
          if (!validatedFields.success) {
            throw new Error("Invalid input.");
          }

          const { username, password } = validatedFields.data;

          const user = await prisma.user.findUnique({
            where: { username: username.toLowerCase(), isActive: true },
            include: { department: { select: { name: true } } },
          });

          if (!user) {
            throw new Error("Username atau password salah.");
          }

          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (!isPasswordValid) {
            throw new Error("Username atau password salah.");
          }

          // Single Session Logic for specific roles
          let sessionToken: string | undefined;
          
          if (SINGLE_SESSION_ROLES.includes(user.role)) {
            sessionToken = uuidv4();
            // Update user with new session token (this invalidates previous sessions)
            await prisma.user.update({
              where: { id: user.id },
              data: { 
                lastLogin: new Date(), 
                sessionToken 
              },
            });
          } else {
            // For VIEWER role, just update last login without session token
            await prisma.user.update({
              where: { id: user.id },
              data: { lastLogin: new Date() },
            });
          }

          return {
            id: user.id.toString(),
            username: user.username,
            role: user.role,
            departmentId: user.departmentId,
            departmentName: user.department?.name || null,
            sessionToken,
          };
        } catch (error) {
          // Handle authentication errors gracefully
          if (
            error instanceof Error &&
            error.message === "Username atau password salah."
          ) {
            // Don't log authentication failures to console
            throw error;
          }
          // Only log actual system errors, not authentication failures
          console.error("Auth error:", error);
          throw new Error("Terjadi kesalahan saat login.");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // Update session every hour
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign-in
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.departmentId = user.departmentId;
        token.departmentName = user.departmentName ?? null;
        if (SINGLE_SESSION_ROLES.includes(user.role as UserRole)) {
          token.sessionToken = (user as ExtendedUser).sessionToken;
        } else {
          // Ensure no sessionToken for VIEWER role
          token.sessionToken = undefined;
        }
      }

      // We'll handle session validation in API routes instead of middleware
      // to avoid Edge Runtime issues with Prisma

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        const userWithCustomFields = {
          ...session.user, // Keep original fields like email, name
          id: token.id as string,
          username: token.username as string,
          role: token.role as UserRole,
          departmentId: (token.departmentId as number | null) || null,
          departmentName: (token.departmentName as string | null) || null,
          sessionToken: token.sessionToken as string | undefined,
        };
        session.user = userWithCustomFields;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error", // You can create a custom error page to display messages
  },
  events: {
    async signIn({ user }) {
      // Log successful sign-ins for audit purposes
      console.log(
        `User ${user.username} signed in at ${new Date().toISOString()}`
      );
    },
    async signOut() {
      // Log sign-outs for audit purposes
      console.log(`User signed out at ${new Date().toISOString()}`);
    },
  },
  debug: process.env.NODE_ENV === "development",
  logger: {
    error: (error: Error) => {
      // Only log actual system errors, suppress auth failures
      if (!error.message.includes("Username atau password salah") && 
          !error.message.includes("CallbackRouteError")) {
        console.error("NextAuth Error:", error.message);
      }
    },
    warn: (code: string) => {
      if (process.env.NODE_ENV === "development") {
        console.warn(`NextAuth Warning: ${code}`);
      }
    },
    debug: (code: string, metadata?: unknown) => {
      if (process.env.NODE_ENV === "development") {
        console.debug(`NextAuth Debug [${code}]:`, metadata);
      }
    },
  },
};

export default authConfig;
