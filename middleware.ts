import { NextResponse, type NextRequest } from "next/server.js";
import { isAuthorized, isProtectedPath } from "./lib/admin-auth.ts";

const PRIVATE_RESPONSE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

export async function middleware(request: NextRequest) {
  const isProtected = isProtectedPath(request.nextUrl.pathname);

  if (!isProtected) {
    return NextResponse.next();
  }

  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return new NextResponse("Internal authentication configuration error", {
      status: 500,
      headers: PRIVATE_RESPONSE_HEADERS,
    });
  }

  if (await isAuthorized(request.headers.get("authorization"), adminSecret)) {
    return NextResponse.next();
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="GewerkeListe Admin"',
      ...PRIVATE_RESPONSE_HEADERS,
    },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/planner/:path*", "/companies/:path*", "/trades/:path*"],
};
