"use client";

/**
 * CRM API helpers.
 *
 * Previously read the auth token from `localStorage.getItem("token")`.
 * That is an XSS exposure: any injected script could exfiltrate the
 * session. With the unified OIDC flow, the `auth_token` httpOnly cookie
 * is automatically included with `credentials: "include"` — no need to
 * read a token from JavaScript-accessible storage.
 */

const BASE = "/api/v1";

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`GET ${path} failed`);
  const json = await res.json();
  return (json?.data ?? json) as T;
}

export async function apiSend<T>(
  path: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} failed`);
  const text = await res.text();
  if (!text) return null as T;
  const json = JSON.parse(text);
  return (json?.data ?? json) as T;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiSend<T>(path, "POST", body);
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return apiSend<T>(path, "PUT", body);
}
