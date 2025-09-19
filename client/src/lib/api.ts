// client/src/lib/api.ts
import { supabase } from "@/lib/supabase";

export const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

async function getToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session?.access_token ?? null;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const isFormData = init.body instanceof FormData;

  const headers: HeadersInit = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers || {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }

  // 204/no content?
  const contentLength = res.headers.get("content-length");
  if (res.status === 204 || contentLength === "0") {
    // @ts-expect-error – void return ok
    return undefined;
  }

  // Probeer JSON; val terug op text
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await res.json()) as T;
  } else {
    // @ts-expect-error – soms wil je raw text
    return (await res.text()) as T;
  }
}
