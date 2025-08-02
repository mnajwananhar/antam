import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { departmentUtils } from "@/lib/utils";
import { UserRole } from "@prisma/client";

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/input",
  "/notifikasi",
  "/order-list",
  "/admin",
  "/api/protected",
];

// Routes that are only accessible to admins
const adminOnlyRoutes = ["/admin"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );

  const isAdminRoute = adminOnlyRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );

  // Redirect to signin if accessing protected route without auth
  if (isProtectedRoute && !isLoggedIn) {
    const signInUrl = new URL("/auth/signin", nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect to dashboard if accessing public routes while logged in
  if (
    isLoggedIn &&
    (nextUrl.pathname === "/" || nextUrl.pathname === "/auth/signin")
  ) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  // Check admin-only routes
  if (isAdminRoute && isLoggedIn) {
    const userRole = req.auth?.user?.role;
    if (userRole !== UserRole.ADMIN) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
    }
  }

  // Role-based access control for specific input routes
  if (nextUrl.pathname.startsWith("/input/") && isLoggedIn) {
    const userRole = req.auth?.user?.role;

    // Extract department from URL
    const pathSegments = nextUrl.pathname.split("/");
    const routeDepartmentSlug = pathSegments[2];

    // Planner access control - only to their department
    if (userRole === UserRole.PLANNER && routeDepartmentSlug) {
      const userDepartmentName = req.auth?.user?.departmentName;
      const routeDepartmentName =
        departmentUtils.slugToName(routeDepartmentSlug);

      if (userDepartmentName && routeDepartmentName !== userDepartmentName) {
        return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
