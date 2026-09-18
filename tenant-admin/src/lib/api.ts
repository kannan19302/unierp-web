/**
 * `apiGet` — was missing entirely; blocked 7 pages under `settings/` and
 * `subscriptions/`, invisible until W5 unshadowed the tree that imported it.
 *
 * Requests go through the app's own `/api/v1/*` route (see next.config.mjs's
 * `rewrites()`), which Next.js proxies server-side to the business API on
 * :3001 — the same convention every fetch elsewhere in this app already
 * relies on, so this file adds no new request path, only a thin, typed
 * wrapper around it for the pages that were calling a function that did not
 * exist.
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function apiPath(path: string): string {
  const withLeadingSlash = path.startsWith("/") ? path : `/${path}`;
  return withLeadingSlash.startsWith("/api/v1")
    ? withLeadingSlash
    : `/api/v1${withLeadingSlash}`;
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  const res = await fetch(apiPath(path), {
    method: "GET",
    credentials: "include",
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new ApiError(res.status, `GET ${path} failed with ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function apiPost<T = unknown>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(apiPath(path), {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new ApiError(res.status, `POST ${path} failed with ${res.status}`);
  }
  return res.json() as Promise<T>;
}
