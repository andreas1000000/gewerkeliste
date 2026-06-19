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
    return new NextResponse("ADMIN_SECRET is required", { status: 500 });
  }

  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    const decoded = atob(auth.slice("Basic ".length));
    const separator = decoded.indexOf(":");
    const password = separator >= 0 ? decoded.slice(separator + 1) : "";

    if (password === adminSecret) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="GewerkeListe Admin"',
    },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/planner/:path*", "/companies/:path*", "/trades/:path*"],
};
