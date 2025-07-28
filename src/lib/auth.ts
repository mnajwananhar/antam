import NextAuth from "next-auth"
import authConfig from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

// Export authOptions for backward compatibility
export const authOptions = authConfig

// Re-export types for convenience
export type { ExtendedUser } from "./auth.config"