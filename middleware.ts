import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware with two responsibilities:
 *
 * 1. HOST ROUTING — requests on the main app host are served normally;
 *    requests on any other host are rewritten into the Web Studio site
 *    renderer at /_sites/<host>/...
 *
 * 2. PLANE-2 BOUNDARY (D01) — tenant administration routes (/settings,
 *    /subscriptions, /apps, /profile) return HTTP 403 to any authenticated
 *    user who does not hold an admin-level permission. This is an enforced
 *    access boundary, not a hidden-menu trick. The canonical authoritative
 *    check is in the API's RbacGuard; this layer provides an early return
 *    so the browser never renders a page the user cannot use.
 *
 *    Implementation note: Next.js middleware runs in the Edge runtime, which
 *    cannot use Node crypto. Rather than shipping a full JWT verify library,
 *    we decode the payload section of the auth_token cookie (base64url) and
 *    check the permissions array. The API still verifies the signature on
 *    every data request — this boundary is defence-in-depth, not the sole
 *    enforcement point.
 */

const APP_HOSTS = new Set(
  [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    process.env.NEXT_PUBLIC_APP_HOST,
  ]
    .filter(Boolean)
    .map((h: any) => (h as string).toLowerCase()),
);

/**
 * Plane-2 routes require an admin grant.
 * These are the routes a tenant administrator sees; a tenant user without
 * the grant receives 403 on every one of them — not a missing menu item.
 */
const PLANE_2_PREFIXES = [
  "/settings",
  "/subscriptions",
  "/apps",
  "/profile",
  "/saas",
  "/workflows",
  "/builder",
];

/**
 * Decodes the payload section of a JWT without verifying the signature.
 * Used only for routing decisions; the API verifies the signature on every
 * authenticated request.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    // base64url → base64 → decode
    const b64 = (parts[1] as string)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
    const decoded = atob(padded);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Returns true when the JWT payload contains at least one permission that
 * matches admin access (admin.* wildcard or any admin.* explicit entry).
 */
function hasAdminPermission(permissions: unknown): boolean {
  if (!Array.isArray(permissions)) return false;
  return (permissions as string[]).some(
    (p) => p === "*" || p === "admin.*" || p.startsWith("admin."),
  );
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostHeader = req.headers.get("host") || "";
  const hostname = (hostHeader.split(":")[0] || hostHeader).toLowerCase();

  // ── 1. Site routing ────────────────────────────────────────────────────────
  if (!APP_HOSTS.has(hostname)) {
    const rewritten = url.clone();
    const suffix = url.pathname === "/" ? "" : url.pathname;
    rewritten.pathname = `/_sites/${hostname}${suffix}`;
    return NextResponse.rewrite(rewritten);
  }

  // ── 2. Plane-2 boundary ────────────────────────────────────────────────────
  const isPlane2 = PLANE_2_PREFIXES.some((prefix) =>
    url.pathname === prefix || url.pathname.startsWith(`${prefix}/`),
  );

  if (isPlane2) {
    // Try auth_token cookie first (httpOnly, set by IDP on login).
    const authCookie = req.cookies.get("auth_token")?.value;

    if (!authCookie) {
      // Not authenticated at all — let the app's normal auth redirect handle it.
      return NextResponse.next();
    }

    const payload = decodeJwtPayload(authCookie);

    if (!payload) {
      // Malformed token — treat as unauthenticated.
      return NextResponse.next();
    }

    if (!hasAdminPermission(payload["permissions"])) {
      return new NextResponse("403 Forbidden - Plane 2 Boundary", {
        status: 403,
        headers: { "Content-Type": "text/plain" },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  // Skip API, Next internals, static assets, and the site renderer itself.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|_sites).*)" ],
};
