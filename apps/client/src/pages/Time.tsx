import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Archive, ArchiveRestore, MoreHorizontal } from "lucide-react";
import { api } from "@/lib/api"; // jouw helper die JSON returned

/* =======================
   Types
======================= */
type Project = {
  id: string;
  name: string;
  city?: string | null;
  client_name?: string | null;
  default_rate_cents?: number | null;
  created_at?: string;
  archived?: boolean;
  archived_at?: string | null;
  is_archived?: boolean; // backward compat
};

type Phase = {
  code: string;
  name: string;
  sort_order: number;
};

type TimeEntry = {
  id: string;
  project_id: string;
  phase_code: string;
  occurred_on: string; // YYYY-MM-DD
  minutes?: number | null;
  notes?: string | null;
  // optional joins
  projects?: Project | null;
  project?: Project | null;
  phases?: Phase | null;
  phase?: Phase | null;
};

/* =======================
   Phases (fallback)
======================= */
const FALLBACK_PHASES: Phase[] = [
  { code: "schetsontwerp", name: "Schetsontwerp", sort_order: 1 },
  { code: "voorlopig-ontwerp", name: "Voorlopig ontwerp", sort_order: 2 },
  { code: "vo-tekeningen", name: "VO tekeningen", sort_order: 3 },
  { code: "definitief-ontwerp", name: "Definitief ontwerp", sort_order: 4 },
  { code: "do-tekeningen", name: "DO tekeningen", sort_order: 5 },
  { code: "bouwvoorbereiding", name: "Bouwvoorbereiding", sort_order: 6 },
  { code: "bv-tekeningen", name: "BV tekeningen", sort_order: 7 },
  { code: "uitvoering", name: "Uitvoering", sort_order: 8 },
  { code: "uitvoering-tekeningen", name: "Uitvoering tekeningen", sort_order: 9 },
  { code: "oplevering-nazorg", name: "Oplevering/nazorg", sort_order: 10 },
];

/* =======================
   Helpers
======================= */
const EUR = (v: number) =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(v);

const todayISO = () => new Date().toISOString().split("T")[0];

function getProjectFromEntry(e: TimeEntry): Project | undefined {
  return e.projects || e.project || undefined;
}
function getPhaseFromEntry(e: TimeEntry): Phase | undefined {
  return e.phases || e.phase || undefined;
}

/* =======================
   Component
======================= */
export default function Time() {
  const qc = useQueryClient();

  /* ---- Data ---- */
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: () => api<Project[]>("/api/projects"),
    staleTime: 5 * 60 * 1000,
  });

  const { data: phasesData, isError: phasesError } = useQuery<Phase[]>({
    queryKey: ["phases"],
    queryFn: () => api<Phase[]>("/api/phases"),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
  const phases: Phase[] = phasesError || !phasesData?.length ? FALLBACK_PHASES : phasesData!;

  // haal entries op met een rolling venster (bv. 90 dagen) – past bij overzicht
  const { data: timeEntries = [], refetch: refetchEntries } = useQuery<TimeEntry[]>({
    queryKey: ["time_entries", { days: 90 }],
    queryFn: () => api<TimeEntry[]>("/api/time-entries?days=90"),
    staleTime: 60 * 1000,
  });

  /* ---- UI state ---- */
  const [view, setView] = React.useState<"entries" | "summary">("summary"); // standaard overzicht
  const [showArchived, setShowArchived] = React.useState<boolean>(false);

  // uren formulier
  const [form, setForm] = React.useState<{
    project_id: string;
    phase_code: string;
    occurred_on: string;
    hours: string;
    notes: string;
  }>({
    project_id: "",
    phase_code: "",
    occurred_on: todayISO(),
    hours: "",
    notes: "",
  });

  // project kiezen via lijst + zoek
  const [projectSearch, setProjectSearch] = React.useState("");

  const activeProjects = React.useMemo(
    () => Array.isArray(projects) ? projects.filter((p) => !(p.archived || p.archived_at || p.is_archived)) : [],
    [projects]
  );
  const archivedProjects = React.useMemo(
    () => Array.isArray(projects) ? projects.filter((p) => (p.archived || p.archived_at || p.is_archived)) : [],
    [projects]
  );
  const selectableProjects = showArchived ? archivedProjects : activeProjects;

  const visibleProjects = React.useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return Array.isArray(selectableProjects) ? selectableProjects : [];
    return Array.isArray(selectableProjects)
      ? selectableProjects.filter((p) =>
          [p.name, p.city, p.client_name]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q))
        )
      : [];
  }, [selectableProjects, projectSearch]);

  const selectedProject = React.useMemo(
    () => (Array.isArray(projects) ? projects.find((p) => p.id === form.project_id) : undefined),
    [projects, form.project_id]
  );

  /* ---- Mutations ---- */
  const addTimeEntry = useMutation({
    mutationFn: async (payload: typeof form) => {
      const minutes = Math.round((parseFloat(payload.hours) || 0) * 60);
      const body = {
        project_id: payload.project_id,
        phase_code: payload.phase_code,
        occurred_on: payload.occurred_on,
        minutes,
        notes: payload.notes?.trim() || null,
      };
      return api<TimeEntry>("/api/time-entries", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["time_entries"] });
      refetchEntries();
      setForm({ project_id: "", phase_code: "", occurred_on: todayISO(), hours: "", notes: "" });
    },
  });

  const toggleArchiveProject = useMutation({
    mutationFn: async ({ projectId, archive }: { projectId: string; archive: boolean }) => {
      return api<Project>(`/api/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ archived: archive, archived_at: archive ? new Date().toISOString() : null }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  /* ---- Overzicht per project (fase breakdown) ---- */
  const projectSummaries = React.useMemo(() => {
    // gebruik alle entries binnen het venster (query) → groepeer per project
    const byProject = new Map<string, TimeEntry[]>();
    for (const e of timeEntries) {
      const pid = e.project_id;
      if (!byProject.has(pid)) byProject.set(pid, []);
      byProject.get(pid)!.push(e);
    }

    const list = Array.from(byProject.entries()).map(([project_id, entries]) => {
      const project = Array.isArray(projects) ? projects.find((p) => p.id === project_id) : undefined;
      const rate = ((project?.default_rate_cents || 0) as number) / 100;

      // init alle fases zodat je altijd alle rijen ziet
      const init: Record<string, { phase: Phase; hours: number; amount: number; entryCount: number }> = {};
      for (const ph of phases) {
        init[ph.code] = { phase: ph, hours: 0, amount: 0, entryCount: 0 };
      }

      for (const e of entries) {
        const hours = (e.minutes || 0) / 60;
        const code = e.phase_code;
        if (!init[code]) continue; // fase niet bekend
        init[code].hours += hours;
        init[code].amount += hours * rate;
        init[code].entryCount += 1;
      }

      const totalHours = entries.reduce((s, e) => s + (e.minutes || 0) / 60, 0);
      const totalAmount = totalHours * rate;
      const lastActivity =
        entries.length > 0
          ? entries.slice().sort((a, b) => +new Date(b.occurred_on) - +new Date(a.occurred_on))[0].occurred_on
          : null;

      const isArchived = !!(project?.archived || project?.archived_at || project?.is_archived);

      return {
        project,
        project_id,
        isArchived,
        totalHours,
        totalAmount,
        lastActivity,
        phaseBreakdown: init,
      };
    });

    // filter op showArchived toggle
  const filtered = Array.isArray(list) ? list.filter((s) => (showArchived ? s.isArchived : !s.isArchived)) : [];

    // sort: recentst actief bovenaan
    filtered.sort((a, b) => {
      if (a.totalHours && !b.totalHours) return -1;
      if (!a.totalHours && b.totalHours) return 1;
      if (a.lastActivity && b.lastActivity) {
        return +new Date(b.lastActivity) - +new Date(a.lastActivity);
      }
      return (a.project?.name || "").localeCompare(b.project?.name || "");
    });

    return filtered;
  }, [timeEntries, projects, phases, showArchived]);

  /* ---- UI builders ---- */
  function pickProject(id: string) {
    setForm((f) => ({ ...f, project_id: id }));
  }
  function pickPhase(code: string) {
    setForm((f) => ({ ...f, phase_code: code }));
  }

  /* =======================
     Render
  ======================= */
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Uren</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setView("entries")}
            className={`px-4 py-2 rounded-lg ${view === "entries" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            Uren invoer
          </button>
          <button
            onClick={() => setView("summary")}
            className={`px-4 py-2 rounded-lg ${view === "summary" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            Project overzicht
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        ✅ Projecten & fases geladen · {timeEntries.length} entries in venster
      </div>

      {/* === Invoer === */}
      {view === "entries" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Uren registreren</h2>
            <p className="text-sm text-gray-600 mt-1">Voeg nieuwe uren toe aan je projecten</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project (lijst + zoek) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Project *</label>
              <input
                type="text"
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                placeholder="Zoek op naam / plaats / klant…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2"
              />
              <div className="rounded-lg border border-gray-200 divide-y max-h-64 overflow-auto">
                {visibleProjects.length === 0 && (
                  <div className="p-3 text-sm text-gray-500">Geen projecten gevonden</div>
                )}
                {visibleProjects.map((p) => {
                  const active = form.project_id === p.id;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => pickProject(p.id)}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between
                                  ${active ? "bg-blue-50" : "bg-white"} hover:bg-gray-50`}
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-600">
                          {[p.city, p.client_name].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      {active && <span className="text-xs text-blue-600 font-medium">geselecteerd</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fase (chip grid) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Fase *</label>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(phases) && phases
                  .slice()
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((ph) => {
                    const active = form.phase_code === ph.code;
                    return (
                      <button
                        type="button"
                        key={ph.code}
                        onClick={() => pickPhase(ph.code)}
                        className={`px-3 py-1.5 rounded-full text-sm border 
                                    ${active
                                      ? "bg-blue-600 text-white border-blue-600"
                                      : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"}`}
                      >
                        {ph.name}
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Datum / Uren / Omschrijving */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Datum *</label>
              <input
                type="date"
                value={form.occurred_on}
                onChange={(e) => setForm((f) => ({ ...f, occurred_on: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Uren *</label>
              <input
                type="number"
                step="0.25"
                inputMode="decimal"
                placeholder="0"
                value={form.hours}
                onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => addTimeEntry.mutate(form)}
                disabled={
                  addTimeEntry.isPending ||
                  !form.project_id ||
                  !form.phase_code ||
                  !form.occurred_on ||
                  !form.hours
                }
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Toevoegen
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Omschrijving (optioneel)</label>
            <input
              type="text"
              placeholder="Beschrijving van werkzaamheden…"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Kostenhint */}
          {selectedProject && form.hours && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-sm">
                <strong>Project:</strong> {selectedProject.name}{" "}
                {selectedProject.city ? `(${selectedProject.city})` : ""} ·{" "}
                <strong>Uurtarief:</strong> {EUR(((selectedProject.default_rate_cents || 0) as number) / 100)} ·{" "}
                <strong>Bedrag:</strong>{" "}
                {EUR((parseFloat(form.hours || "0") || 0) * (((selectedProject.default_rate_cents || 0) as number) / 100))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* === Overzicht === */}
      {view === "summary" && (
        <div className="space-y-6">
          {/* Toggle Actief / Archief */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Project weergave</h3>
                <p className="text-sm text-gray-600 mt-1">Schakel tussen actieve en gearchiveerde projecten</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm ${!showArchived ? "font-medium text-gray-900" : "text-gray-500"}`}>
                  Actieve projecten
                </span>
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    showArchived ? "bg-blue-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition ${
                      showArchived ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className={`text-sm ${showArchived ? "font-medium text-gray-900" : "text-gray-500"}`}>
                  Gearchiveerde projecten
                </span>
              </div>
            </div>
          </div>

          {/* Projecten + fase-overzicht */}
          {projectSummaries.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Archive className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {showArchived ? "Geen gearchiveerde projecten" : "Nog geen projecten"}
              </h3>
              <p className="text-gray-600">
                {showArchived
                  ? "Er zijn nog geen projecten gearchiveerd."
                  : "Maak je eerste project aan en registreer uren."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {projectSummaries.map((s) => (
                <div key={s.project_id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Header */}
                  <div className="p-6 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {s.project?.name || "Onbekend"}{" "}
                          {s.project?.city ? <span className="text-gray-500 font-normal">({s.project.city})</span> : null}
                        </h3>
                        {s.isArchived ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            <Archive className="w-3 h-3 mr-1" />
                            Gearchiveerd
                          </span>
                        ) : s.totalHours > 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></div>
                            Actief
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                            Nieuw
                          </span>
                        )}
                      </div>
                      {s.lastActivity && (
                        <div className="text-sm text-gray-600">Laatste activiteit: {new Date(s.lastActivity).toLocaleDateString("nl-NL")}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {s.totalHours.toFixed(1)}
                          <span className="text-sm font-normal text-gray-500">h</span>
                        </div>
                        <div className="text-sm text-gray-600">Totaal uren</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{EUR(s.totalAmount)}</div>
                        <div className="text-sm text-gray-600">Totaal bedrag</div>
                      </div>

                      {/* Acties: archive/restore */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            toggleArchiveProject.mutate({
                              projectId: s.project_id,
                              archive: !s.isArchived,
                            })
                          }
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title={s.isArchived ? "Project herstellen" : "Project archiveren"}
                        >
                          {s.isArchived ? <ArchiveRestore className="w-5 h-5" /> : <Archive className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Fase tabel */}
                  <div className="border-t border-gray-100">
                    <div className="p-6 overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500">
                            <th className="py-2 pr-4">Fase</th>
                            <th className="py-2 pr-4">Uren</th>
                            <th className="py-2 pr-0 text-right">Bedrag</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(Object.values(s.phaseBreakdown)) &&
                            Object.values(s.phaseBreakdown)
                              .sort((a, b) => a.phase.sort_order - b.phase.sort_order)
                              .map((row) => (
                                <tr key={row.phase.code} className="border-t border-gray-100">
                                  <td className="py-2 pr-4">{row.phase.name}</td>
                                  <td className="py-2 pr-4">{row.hours.toFixed(1)}h</td>
                                  <td className="py-2 pr-0 text-right">{EUR(row.amount)}</td>
                                </tr>
                              ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
