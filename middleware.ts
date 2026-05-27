import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    if (!token) return NextResponse.next();

    const isDoctor = token.role === "DOCTOR";
    const profileComplete = token.isProfileComplete;

    if (
      isDoctor &&
      !profileComplete &&
      !pathname.startsWith("/setup-profile") &&
      !pathname.startsWith("/api")
    ) {
      return NextResponse.redirect(new URL("/setup-profile", req.url));
    }

    if (
      profileComplete &&
      pathname.startsWith("/setup-profile")
    ) {
      return NextResponse.redirect(new URL("/feed", req.url));
    }

    if (pathname === "/") {
      return NextResponse.redirect(new URL("/feed", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        const publicPaths = [
          "/signin",
          "/signup",
          "/verify-email",
          "/api/auth",
        ];
        const isPublic = publicPaths.some((p) => pathname.startsWith(p));
        if (isPublic) return true;
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
