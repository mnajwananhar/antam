import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";

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
}

// Session management rules based on user role
const SINGLE_SESSION_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.INPUTTER];

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
          // Validate input
          const validatedFields = loginSchema.safeParse(credentials);
          if (!validatedFields.success) {
            return null;
          }

          const { username, password } = validatedFields.data;

          // Find user with department info
          const user = await prisma.user.findUnique({
            where: {
              username: username.toLowerCase(),
              isActive: true,
            },
            include: {
              department: {
                select: {
                  name: true,
                },
              },
            },
          });

          if (!user) {
            return null;
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (!isPasswordValid) {
            return null;
          }

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          });

          return {
            id: user.id.toString(),
            username: user.username,
            role: user.role,
            departmentId: user.departmentId,
            departmentName: user.department?.name || null,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
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
    async jwt({
      token,
      user,
      trigger,
    }: {
      token: JWT;
      user?: ExtendedUser;
      trigger?: string;
    }) {
      // Handle session update gracefully
      if (trigger === "update" && !user) {
        // Return existing token if this is just a session update
        return token;
      }
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.departmentId = user.departmentId ?? null;
        token.departmentName = user.departmentName ?? null;

        // Check for single session enforcement
        if (SINGLE_SESSION_ROLES.includes(user.role)) {
          token.enforcesSingleSession = true;
        }
      }

      // Add timestamp for token validation
      token.iat = Math.floor(Date.now() / 1000);

      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token) {
        session.user = {
          id: token.id as string,
          username: token.username as string,
          role: token.role as UserRole,
          departmentId: (token.departmentId as number | null) || null,
          departmentName: (token.departmentName as string | null) || null,
        };
      }
      return session;
    },
    async signIn() {
      // Additional sign-in logic can be added here
      // For example, checking if user is active, rate limiting, etc.
      return true;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
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
};

export default authConfig;
