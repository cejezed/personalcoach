import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN ?? "*";

function setCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
}
function json(res: VercelResponse, code: number, payload: unknown) {
  setCors(res);
  res.status(code).json(payload);
}
function parseJsonBody(body: unknown) {
  if (body == null) return {};
  if (typeof body === "string") return JSON.parse(body);
  if (typeof body === "object") return body as Record<string, unknown>;
  throw new Error("Invalid body");
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "OPTIONS") {
      setCors(res);
      return res.status(204).end();
    }
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return json(res, 500, { message: "SUPABASE env mist." });
    }

    if (req.method === "GET") {
      const { project_id, status } = req.query as {
        project_id?: string;
        status?: string;
      };
      let q = supabase
        .from("tasks")
        .select("*, projects(name, city, client_name)")
        .order("created_at", { ascending: false });
      if (project_id) q = q.eq("project_id", project_id);
      if (status) q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return json(res, 200, data);
    }

    if (req.method === "POST") {
      const body = parseJsonBody(req.body);
      const { data, error } = await supabase
        .from("tasks")
        .insert(body)
        .select("*, projects(name, city, client_name)")
        .single();
      if (error) throw error;
      return json(res, 201, data);
    }

    res.setHeader("Allow", "GET, POST, OPTIONS");
    return json(res, 405, { message: "Method Not Allowed" });
  } catch (err: any) {
    console.error("Tasks API error:", err);
    return json(res, 500, { message: err?.message ?? "Server error" });
  }
}
