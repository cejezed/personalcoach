// apps/client/src/lib/queryClient.ts
import { QueryClient } from "@tanstack/react-query";

/** 
 * Gebruik altijd dezelfde BASE voor API calls.
 * - Zet in .env: VITE_API_BASE_URL=https://personalcoach-black.vercel.app
 * - Valt anders terug op dezelfde origin (handig lokaal) 
 */
const BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  (typeof window !== "undefined" ? window.location.origin : "");

/** Normaliseer pad naar /api/... en plak BASE ervoor als het een relatieve url is */
function toApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;           // al absolute URL
  const rel = path.startsWith("/api/") ? path : path.startsWith("/")
    ? `/api${path}`                                      // "/tasks" -> "/api/tasks"
    : `/api/${path}`;                                    // "tasks"  -> "/api/tasks"
  return `${BASE}${rel}`;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 30_000 },
    mutations: { retry: 0 },
  },
});

/** Lage-level: geeft Response terug (als je zelf .json() wilt doen) */
export async function apiRaw(
  method: string,
  path: string,
  body?: unknown,
  init?: RequestInit
): Promise<Response> {
  const url = toApiUrl(path);
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${method} ${url} failed: ${res.status} ${res.statusText} ${text}`);
  }
  return res;
}

/** Hoog-niveau: parsed JSON terug (sluit aan op React Query hooks) */
export async function apiJson<T = any>(
  method: string,
  path: string,
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  const res = await apiRaw(method, path, body, init);
  return res.json() as Promise<T>;
}

/** Shorthands: */
export const getJson = <T = any>(path: string, init?: RequestInit) =>
  apiJson<T>("GET", path, undefined, init);
export const postJson = <T = any>(path: string, body?: unknown, init?: RequestInit) =>
  apiJson<T>("POST", path, body, init);
export const putJson = <T = any>(path: string, body?: unknown, init?: RequestInit) =>
  apiJson<T>("PUT", path, body, init);
export const delJson = <T = any>(path: string, init?: RequestInit) =>
  apiJson<T>("DELETE", path, undefined, init);

/** Backwards-compat: apiRequest(path, options) -> parsed JSON */
export async function apiRequest<T = any>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const method = (options?.method || "GET").toUpperCase();

  // Probeer body te parsen als het een JSON-string is; anders raw doorgeven
  let body: unknown = undefined;
  if (options && "body" in options && options.body !== undefined) {
    try {
      body = typeof options.body === "string" ? JSON.parse(options.body) : options.body;
    } catch {
      body = options.body;
    }
  }

  // Voorkom dubbele method/body in init
  const { method: _m, body: _b, ...restInit } = options || {};
  return apiJson<T>(method, path, body, restInit);
}
