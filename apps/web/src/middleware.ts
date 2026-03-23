import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = new Set(["/login", "/about"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/health") ||
    PUBLIC_PATHS.has(pathname)
  ) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);

  const tenantCookie = request.cookies.get("afenda_tenant_id")?.value?.trim();
  if (tenantCookie && /^\d+$/.test(tenantCookie)) {
    requestHeaders.set("x-tenant-id", tenantCookie);
  }

  const userCookie = request.cookies.get("afenda_user_id")?.value?.trim();
  if (userCookie && /^\d+$/.test(userCookie)) {
    requestHeaders.set("x-user-id", userCookie);
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } });

  if (tenantCookie && /^\d+$/.test(tenantCookie)) {
    res.headers.set("x-tenant-id", tenantCookie);
  }
  if (userCookie && /^\d+$/.test(userCookie)) {
    res.headers.set("x-user-id", userCookie);
  }

  // Phase 1: optional cookie `afenda_session` — stub until real auth lands
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/hr") ||
    pathname.startsWith("/core")
  ) {
    const session = request.cookies.get("afenda_session");
    if (!session && process.env.AFENDA_REQUIRE_AUTH === "1") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
