import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isProtected =
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/planner") ||
    request.nextUrl.pathname.startsWith("/companies") ||
    request.nextUrl.pathname.startsWith("/trades");

  if (!isProtected) {
    return NextResponse.next();
  }

  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return unauthorizedResponse();
  }

  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    const password = basicAuthPassword(auth);

    if (password === adminSecret) {
      const response = NextResponse.next();
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }
  }

  return unauthorizedResponse();
}

function unauthorizedResponse() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="GewerkeListe Admin"',
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "private, no-store",
    },
  });
}

function basicAuthPassword(auth: string) {
  try {
    const decoded = atob(auth.slice("Basic ".length));
    const separator = decoded.indexOf(":");
    return separator >= 0 ? decoded.slice(separator + 1) : "";
  } catch {
    return "";
  }
}

export const config = {
  matcher: ["/admin/:path*", "/planner/:path*", "/companies/:path*", "/trades/:path*"],
};
