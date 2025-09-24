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
      const { days, project_id, from, to } = req.query as {
        days?: string;
        project_id?: string;
        from?: string; // YYYY-MM-DD
        to?: string;   // YYYY-MM-DD
      };

      // basisselect (voorkom * op producties)
      let q = supabase
        .from("time_entries")
        .select(
          `
          id,
          project_id,
          phase_code,
          occurred_on,
          minutes,
          notes,
          created_at,
          projects ( name, city, client_name, default_rate_cents ),
          phases ( name )
        `
        )
        .order("occurred_on", { ascending: true });

      // rolling window: ?days=7
      if (days) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - (Number(days) - 1));
        const iso = d.toISOString().slice(0, 10);
        q = q.gte("occurred_on", iso);
      }
      // expliciet venster: ?from=YYYY-MM-DD&to=YYYY-MM-DD
      if (from) q = q.gte("occurred_on", from);
      if (to) q = q.lte("occurred_on", to);

      if (project_id) q = q.eq("project_id", project_id);

      const { data, error } = await q;
      if (error) throw error;
      return json(res, 200, data);
    }

    if (req.method === "POST") {
      const body = parseJsonBody(req.body);
      // verwacht minimaal: project_id, occurred_on (YYYY-MM-DD), minutes (int)
      const { data, error } = await supabase
        .from("time_entries")
        .insert([body])
        .select(
          `
          id,
          project_id,
          phase_code,
          occurred_on,
          minutes,
          notes,
          created_at,
          projects ( name, city, client_name, default_rate_cents ),
          phases ( name )
        `
        )
        .single();
      if (error) throw error;
      return json(res, 201, data);
    }

    res.setHeader("Allow", "GET, POST, OPTIONS");
    return json(res, 405, { message: "Method Not Allowed" });
  } catch (err: any) {
    console.error("time_entries API error:", err);
    return json(res, 500, { message: err?.message ?? "Server error" });
  }
}
