import { NextRequest, NextResponse } from "next/server";

/**
 * P3 — Tenant Applications. Every route requires a signed-in user.
 *
 * This file used to do two things, and it has stopped doing both.
 *
 * **1. Host routing (removed).** It rewrote any non-app host into
 * `/_sites/<host>/…`, which made the login-mandated business application the
 * anonymous web host for every tenant's public website. That is P4's job
 * (`tenant-sites`, :4004, audience PUBLIC in the platform register), and the
 * middleware there now does it. P3 no longer serves any anonymous surface.
 *
 * **2. A plane-2 permission check that had stopped working (removed).** It
 * decoded an `auth_token` cookie to 403 non-admins on `/settings`, `/apps`,
 * `/saas` and friends. Its own comment recorded that the cookie is never set
 * under OIDC — the access token lives in memory in `<UniErpAuthProvider>`,
 * deliberately out of reach of this middleware AND of any XSS payload — so the
 * branch always took the "not authenticated, defer" path. It enforced nothing.
 * A dead check that reads like a security boundary is worse than no check,
 * because the next person to look assumes the boundary exists.
 *
 * **Where the enforcement actually is**, so nobody has to guess:
 *
 *   - Session: `<RequireSession>` in `AuthShell`, wrapping the whole tree from
 *     `app/layout.tsx`. Every route in this app is inside it.
 *   - Permissions: the API's `RbacGuard` + `@Permissions(...)`, server-side, on
 *     every request. That is the authoritative check and always was; this file
 *     was only ever defence-in-depth.
 *
 * What is left here is the one thing Edge middleware can do correctly without a
 * verified token: keep the platform's own asset and API paths out of the way.
 * Re-adding a permission check here needs a signed cookie or a verified token —
 * not a base64 decode of something that no longer exists.
 */
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
