// apps/server/api/projects/[id].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN ?? "*";

function setCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET,PATCH,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
}
function json(res: VercelResponse, code: number, payload: unknown) {
  setCors(res);
  res.status(code).json(payload);
}
function parseBody(b: any) {
  if (!b) return {};
  if (typeof b === "string") return JSON.parse(b);
  if (typeof b === "object") return b;
  return {};
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // CORS preflight
    if (req.method === "OPTIONS") {
      setCors(res);
      return res.status(204).end();
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return json(res, 500, { error: "SUPABASE env mist." });
    }

    const id = req.query.id as string | undefined;
    if (!id) return json(res, 400, { error: "Missing project id" });

    if (req.method === "PATCH") {
      const body = parseBody(req.body);

      // Sta expliciet velden toe die we mogen updaten
      const patch: Record<string, any> = {};
      if ("name" in body) patch.name = body.name;
      if ("city" in body) patch.city = body.city;
      if ("client_name" in body) patch.client_name = body.client_name;
      if ("default_rate_cents" in body)
        patch.default_rate_cents = Number(body.default_rate_cents) || 0;
      if ("status" in body) patch.status = body.status;

      // archiveren/herstellen
      if ("archived" in body) patch.archived = !!body.archived;
      if ("archived_at" in body) patch.archived_at = body.archived_at; // mag ook null zijn

      if (Object.keys(patch).length === 0) {
        return json(res, 400, { error: "No updatable fields provided" });
      }

      const { data, error } = await supabase
        .from("projects")
        .update(patch)
        .eq("id", id)
        .select(
          "id,name,city,client_name,default_rate_cents,archived,archived_at,created_at,status"
        )
        .single();

      if (error) throw error;
      return json(res, 200, data);
    }

    // eventueel later: GET / DELETE
    res.setHeader("Allow", "PATCH, OPTIONS");
    return json(res, 405, { error: "Method not allowed" });
  } catch (e: any) {
    console.error("projects/[id] error", e);
    return json(res, 500, { error: e?.message ?? "Server error" });
  }
}
