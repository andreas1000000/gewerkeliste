import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server.js";
import { isAuthorized } from "./lib/admin-auth.ts";
import { canAccessRequiredRole, getRequiredRole } from "./lib/internal-access-policy.ts";

const PRIVATE_RESPONSE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

export async function middleware(request: NextRequest) {
  const requiredRole = getRequiredRole(request.nextUrl.pathname);
  const isBusinessArea = request.nextUrl.pathname === "/mein-betrieb" || request.nextUrl.pathname.startsWith("/mein-betrieb/");

  if (requiredRole === null && !isBusinessArea) return NextResponse.next();

  if (requiredRole !== null) {
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) {
      return new NextResponse("Internal server error", {
        status: 500,
        headers: PRIVATE_RESPONSE_HEADERS,
      });
    }

    if (!(canAccessRequiredRole("admin", requiredRole) && (await isAuthorized(request.headers.get("authorization"), adminSecret)))) {
      return new NextResponse("Authentication required", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="GewerkeListe Admin"',
          ...PRIVATE_RESPONSE_HEADERS,
        },
      });
    }
  }

  return refreshSupabaseSession(request);
}

async function refreshSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/planner/:path*", "/companies/:path*", "/trades/:path*", "/mein-betrieb/:path*"],
};
