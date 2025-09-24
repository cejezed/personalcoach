import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN ?? "*";

function setCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
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
      return json(res, 500, { error: "SUPABASE env mist." });
    }

    if (req.method === "GET") {
      const {
        limit = "20",
        offset = "0",
        q = "",
        archived = "false",
        order = "created_at",
        dir = "desc",
      } = req.query as Record<string, string>;

      const orderField = ["created_at", "name"].includes(order) ? order : "created_at";
      const ascending = String(dir).toLowerCase() === "asc";

      let query = supabase
        .from("projects")
        .select(
          "id,name,city,client_name,default_rate_cents,archived,created_at,status",
          { count: "exact" }
        )
        .order(orderField, { ascending });

      // archived filter (default: only active)
      if (archived === "true") query = query.eq("archived", true);
      else query = query.eq("archived", false);

      // simpele text-zoeker
      if (q) {
        const like = `%${q}%`;
        query = query.or(
          `name.ilike.${like},city.ilike.${like},client_name.ilike.${like}`
        );
      }

      // paginatie
      const l = Math.max(1, Math.min(100, Number(limit) || 20));
      const o = Math.max(0, Number(offset) || 0);
      query = query.range(o, o + l - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      return json(res, 200, {
        data: data ?? [],
        count: count ?? 0,
        limit: l,
        offset: o,
      });
    }

    if (req.method === "POST") {
      const body = parseJsonBody(req.body);
      const name = String(body?.name ?? "").trim();
      if (!name) return json(res, 400, { error: "Project name is required" });

      const payload = {
        name,
        city: body?.city ?? null,
        client_name: body?.client_name ?? null,
        // verwacht cents (integer). Als je in euro’s post, doe Math.round(euros * 100).
        default_rate_cents:
          typeof body?.default_rate_cents === "number"
            ? Math.round(body.default_rate_cents)
            : Math.round(Number(body?.default_rate_cents || 0)),
        archived: false,
        status: body?.status ?? "active",
      };

      const { data, error } = await supabase
        .from("projects")
        .insert([payload])
        .select("id,name,city,client_name,default_rate_cents,archived,created_at,status")
        .single();

      if (error) throw error;
      return json(res, 201, data);
    }

    res.setHeader("Allow", "GET, POST, OPTIONS");
    return json(res, 405, { error: "Method not allowed" });
  } catch (err: any) {
    console.error("projects API error:", err);
    return json(res, 500, { error: err?.message ?? "Internal server error" });
  }
}
