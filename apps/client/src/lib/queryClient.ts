// apps/client/src/lib/queryClient.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 30_000 },
    mutations: { retry: 0 },
  },
});

// Normaliseer pad naar absolute /api/...
function toApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;          // al volledige URL
  if (path.startsWith("/api/")) return path;            // juist
  if (path === "/api") return "/api";                   // edge case
  if (path.startsWith("/")) return `/api${path}`;       // "/tasks" -> "/api/tasks"
  return `/api/${path}`;                                // "tasks" -> "/api/tasks"
}

/**
 * Gebruik: const res = await apiRequest("POST", "/api/workouts", data)
 * returnt de Response zodat je zelf .json() kunt doen (sluit aan op je code).
 */
export async function apiRequest(
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
