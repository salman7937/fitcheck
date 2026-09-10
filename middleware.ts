import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/cookie-name";

/**
 * Edge runtime: firebase-admin is Node-only, so this can only check that the
 * cookie exists — it cannot verify it. This is a UX optimization (avoids a
 * flash of protected UI before redirecting) and must NEVER be treated as the
 * real security boundary. That boundary is requireSession() in the Node
 * runtime, called first in every route/Server Component touching user data.
 */
export function middleware(req: NextRequest) {
  const hasCookie = req.cookies.has(SESSION_COOKIE_NAME);

  if (!hasCookie && req.nextUrl.pathname.startsWith("/history")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/history/:path*"],
};
