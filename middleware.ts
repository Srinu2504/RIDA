import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    if (!token) return NextResponse.next();

    const profileComplete = token.isProfileComplete;
    const role = token.role as string;

    if (!profileComplete && !pathname.startsWith("/api")) {
      let setupPath = "/setup-profile/physician";
      if (role === "MEDICAL_STUDENT") setupPath = "/setup-profile/student";
      if (role === "PRACTICING_PHYSICIAN") setupPath = "/setup-profile/physician";
      if (role === "RETIRED_PHYSICIAN") setupPath = "/setup-profile/retired";

      if (!pathname.startsWith(setupPath)) {
        return NextResponse.redirect(new URL(setupPath, req.url));
      }
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
