import NextAuth from "next-auth"
import authConfig from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

// Re-export types for convenience
export type { ExtendedUser } from "./auth.config"