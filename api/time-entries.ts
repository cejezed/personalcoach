import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "./_supabase";

function cors(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "GET") {
      // join projectgegevens meegeven zoals je UI verwacht
      const { data, error } = await supabase
        .from("time_entries")
        .select(`
          id,
          project_id,
          phase_code,
          occurred_on,
          minutes,
          notes,
          projects:project_id (
            id, name, city, client_name, default_rate_cents
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // client verwacht 'project' of 'projects' en eventueel 'phase' met name
      const PHASE_NAME_MAP: Record<string, string> = {
        "schetsontwerp": "Schetsontwerp",
        "voorlopig-ontwerp": "Voorlopig ontwerp",
        "vo-tekeningen": "VO tekeningen",
        "definitief-ontwerp": "Definitief ontwerp",
        "do-tekeningen": "DO tekeningen",
        "bouwvoorbereiding": "Bouwvoorbereiding",
        "bv-tekeningen": "BV tekeningen",
        "uitvoering": "Uitvoering",
        "uitvoering-tekeningen": "Uitvoering tekeningen",
        "oplevering-nazorg": "Oplevering/nazorg",
      };

      const mapped = (data ?? []).map((r: any) => ({
        ...r,
        project: r.projects, // voor clients die `project` gebruiken
        phase: { code: r.phase_code, name: PHASE_NAME_MAP[r.phase_code] ?? r.phase_code },
      }));

      return res.status(200).json(mapped);
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

      const project_id = String(body.project_id ?? "");
      const phase_code  = String(body.phase_code ?? "");
      const occurred_on = String(body.occurred_on ?? "");
      const minutes     = Math.round(+body.minutes || 0);
      const notes       = body.notes == null ? null : String(body.notes).trim();

      if (!project_id) return res.status(400).json({ error: "project_id is required" });
      if (!phase_code)  return res.status(400).json({ error: "phase_code is required" });
      if (!ISO_DATE.test(occurred_on)) return res.status(400).json({ error: "occurred_on must be YYYY-MM-DD" });
      if (!Number.isFinite(minutes) || minutes <= 0) return res.status(400).json({ error: "minutes must be > 0" });

      // (optioneel) duplicate guard: check bestaand record
      // const { data: dup } = await supabase
      //   .from("time_entries")
      //   .select("id")
      //   .eq("project_id", project_id)
      //   .eq("phase_code", phase_code)
      //   .eq("occurred_on", occurred_on)
      //   .eq("minutes", minutes)
      //   .eq("notes", notes ?? null)
      //   .maybeSingle();
      // if (dup) return res.status(409).json({ error: "duplicate entry" });

      const { data, error } = await supabase
        .from("time_entries")
        .insert([{ project_id, phase_code, occurred_on, minutes, notes }])
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    res.setHeader("Allow", "GET, POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    console.error("time-entries API error:", err);
    return res.status(500).json({ error: err?.message ?? "Internal server error" });
  }
}
