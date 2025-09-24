import { supabase } from "./supabase";

const RAW_API_URL = import.meta.env.VITE_API_URL ?? "";
const API_URL = RAW_API_URL.replace(/\/+$/, ""); // strip trailing slashes

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function api<T>(
  path: string,
  init: RequestInit = {},
  opts: { withAuth?: boolean } = {}
): Promise<T> {
  const isForm = init.body instanceof FormData;
  const token = opts.withAuth ? await getToken() : null;

  const headers: HeadersInit = {
    ...(isForm ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers || {}),
  };

  const relPath = path.startsWith("/") ? path : `/${path}`;
  const url = API_URL ? `${API_URL}${relPath}` : relPath;

  const res = await fetch(url, { ...init, headers, credentials: "same-origin" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as unknown as T;

  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json")
    ? ((await res.json()) as T)
    : ((await res.text()) as unknown as T);
}
