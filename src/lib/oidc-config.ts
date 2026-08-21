import { OidcClient, type OidcClientConfig } from "@kannan19302/shared/auth-client";

/**
 * This platform's own OIDC client registration — client id
 * "unierp-tenant-apps", seeded by data/prisma/seed-oidc-clients.ts as a PUBLIC
 * client (no secret; PKCE-only, same as every browser client in this system).
 * Registered in W1; wired up as this app's actual auth mechanism in W6.
 */
export const oidcConfig: OidcClientConfig = {
  issuer: process.env.NEXT_PUBLIC_OIDC_ISSUER || "http://localhost:3005",
  clientId: "unierp-tenant-apps",
  redirectUri:
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:4003") +
    "/auth/callback",
  scope: ["openid", "profile", "email", "tenant", "offline_access", "erp.read", "erp.write"],
};

export function createOidcClient(): OidcClient {
  return new OidcClient(oidcConfig);
}
