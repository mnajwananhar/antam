import type { UserRole } from "@prisma/client"
import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username: string
      role: UserRole
      departmentId: number | null
      departmentName: string | null
    }
  }

  interface User {
    id: string
    username: string
    role: UserRole
    departmentId: number | null
    departmentName?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    username: string
    role: UserRole
    departmentId: number | null
    departmentName: string | null
    enforcesSingleSession?: boolean
  }
}