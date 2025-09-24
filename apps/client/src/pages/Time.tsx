import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Download, X } from "lucide-react";
import { api } from "@/lib/api";
import ExcelImportTool from "@/components/ExcelImportTool";

/* =======================
   Types
======================= */
type Project = {
  id: string;
  name: string;
  city?: string;
  client_name?: string;
  default_rate_cents?: number;
  created_at?: string;
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
  occurred_on: string; // ISO date (YYYY-MM-DD)
  minutes?: number;
  hours?: number; // client-side only convenience
  notes?: string | null;
  // optional joined data if backend verstrekt:
  projects?: Project;
  project?: Project;
  phases?: Phase;
  phase?: Phase;
};

/* =======================
   Fallback phases (als /api/phases nog niet bestaat)
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
  return e.projects || e.project;
}
function getPhaseFromEntry(e: TimeEntry): Phase | undefined {
  return e.phases || e.phase;
}

/* =======================
   Component
======================= */
export default function Time() {
  const queryClient = useQueryClient();

  /* ---- Data ophalen ---- */
  const {
    data: projects = [],
    isError: projectsError,
    isLoading: projectsLoading,
  } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: () => api<Project[]>("/api/projects"),
    staleTime: 5 * 60 * 1000,
  });

  // Probeer /api/phases; zo niet, gebruik fallback
  const {
    data: phasesData,
    isError: phasesError,
    isLoading: phasesLoading,
  } = useQuery<Phase[]>({
    queryKey: ["phases"],
    queryFn: () => api<Phase[]>("/api/phases"),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
  const phases: Phase[] = phasesError || !phasesData?.length ? FALLBACK_PHASES : phasesData!;

  const {
    data: timeEntries = [],
    isLoading: entriesLoading,
    refetch: refetchEntries,
  } = useQuery<TimeEntry[]>({
    queryKey: ["time-entries"],
    queryFn: () => api<TimeEntry[]>("/api/time-entries"),
    staleTime: 60 * 1000,
  });

  /* ---- State ---- */
  const [view, setView] = React.useState<"entries" | "summary">("entries");
  const [filterProject, setFilterProject] = React.useState<string>("");
  const [filterPeriod, setFilterPeriod] = React.useState<"all" | "week" | "month">("all");
  const [showProjectForm, setShowProjectForm] = React.useState(false);

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

  const [projectForm, setProjectForm] = React.useState<{
    name: string;
    city: string;
    client_name: string;
    default_rate_euros: string;
    billing_type: "hourly" | "fixed";
    phase_budgets: Record<string, string>;
  }>({
    name: "",
    city: "",
    client_name: "",
    default_rate_euros: "75",
    billing_type: "hourly",
    phase_budgets: {
      "schetsontwerp": "",
      "voorlopig-ontwerp": "",
      "vo-tekeningen": "",
      "definitief-ontwerp": "",
      "do-tekeningen": "",
      "bouwvoorbereiding": "",
      "bv-tekeningen": "",
      "uitvoering": "",
      "uitvoering-tekeningen": "",
      "oplevering-nazorg": "",
    },
  });

  const selectedProject = React.useMemo(
    () => projects.find((p) => p.id === form.project_id),
    [projects, form.project_id]
  );

  /* ---- Mutations ---- */
  const addTimeEntry = useMutation({
    mutationFn: async (payload: {
      project_id: string;
      phase_code: string;
      occurred_on: string;
      hours: string;
      notes?: string;
    }) => {
      // API verwacht minuten
      const minutes = Math.round(parseFloat(payload.hours) * 60);
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
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      refetchEntries();
      setForm((f) => ({
        project_id: "",
        phase_code: "",
        occurred_on: todayISO(),
        hours: "",
        notes: "",
      }));
    },
  });

  const addProject = useMutation({
    mutationFn: async (payload: {
      name: string;
      city?: string;
      client_name?: string;
      default_rate_cents: number;
      billing_type: "hourly" | "fixed";
      phase_budgets?: Record<string, number>;
    }) => {
      return api<Project>("/api/projects", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setProjectForm({
        name: "",
        city: "",
        client_name: "",
        default_rate_euros: "75",
        billing_type: "hourly",
        phase_budgets: {
          "schetsontwerp": "",
          "voorlopig-ontwerp": "",
          "vo-tekeningen": "",
          "definitief-ontwerp": "",
          "do-tekeningen": "",
          "bouwvoorbereiding": "",
          "bv-tekeningen": "",
          "uitvoering": "",
          "uitvoering-tekeningen": "",
          "oplevering-nazorg": "",
        },
      });
      setShowProjectForm(false);
    },
  });

  /* ---- Afgeleide data ---- */
  const filteredEntries = React.useMemo(() => {
    let rows = timeEntries.slice();
    if (filterProject) {
      rows = rows.filter((e) => e.project_id === filterProject);
    }
    if (filterPeriod !== "all") {
      const now = new Date();
      rows = rows.filter((e) => {
        const d = new Date(e.occurred_on);
        if (filterPeriod === "week") {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return d >= weekAgo;
        }
        if (filterPeriod === "month") {
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }
    return rows;
  }, [timeEntries, filterProject, filterPeriod]);

  const projectSummary = React.useMemo(() => {
    const map: Record<
      string,
      {
        project: Project;
        phases: Record<
          string,
          { hours: number; amount: number; phase?: Phase }
        >;
        totalHours: number;
        totalAmount: number;
      }
    > = {};

    for (const entry of timeEntries) {
      const prj = getProjectFromEntry(entry);
      if (!prj) continue;

      const key = entry.project_id;
      if (!map[key]) {
        map[key] = { project: prj, phases: {}, totalHours: 0, totalAmount: 0 };
      }
      const phaseKey = entry.phase_code;
      if (!map[key].phases[phaseKey]) {
        map[key].phases[phaseKey] = { hours: 0, amount: 0, phase: getPhaseFromEntry(entry) };
      }

      const hours = entry.minutes ? entry.minutes / 60 : entry.hours || 0;
      const rate = (prj.default_rate_cents || 0) / 100;
      const amount = hours * rate;

      map[key].phases[phaseKey].hours += hours;
      map[key].phases[phaseKey].amount += amount;
      map[key].totalHours += hours;
      map[key].totalAmount += amount;
    }
    return map;
  }, [timeEntries]);

  /* ---- Export CSV ---- */
  const exportToCSV = React.useCallback(() => {
    const headers = [
      "Project",
      "Fase",
      "Datum",
      "Uren",
      "Omschrijving",
      "Uurtarief",
      "Bedrag",
    ];
    const rows = timeEntries.map((e) => {
      const prj = getProjectFromEntry(e);
      const ph = getPhaseFromEntry(e);
      const hours = e.minutes ? e.minutes / 60 : e.hours || 0;
      const rate = (prj?.default_rate_cents || 0) / 100;
      return [
        prj?.name || "Onbekend",
        ph?.name || e.phase_code,
        e.occurred_on,
        hours.toFixed(2),
        e.notes || "",
        EUR(rate),
        EUR(hours * rate),
      ];
    });
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `urenexport-${todayISO()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [timeEntries]);

  /* ---- Handle project form submit ---- */
  const handleProjectSubmit = () => {
    if (!projectForm.name.trim()) return;
    
    const rateInCents = Math.round(parseFloat(projectForm.default_rate_euros) * 100);
    
    // Converteer fase budgetten naar cents
    const phaseBudgets: Record<string, number> = {};
    if (projectForm.billing_type === "fixed") {
      Object.entries(projectForm.phase_budgets).forEach(([phase, amount]) => {
        if (amount && parseFloat(amount) > 0) {
          phaseBudgets[phase] = Math.round(parseFloat(amount) * 100);
        }
      });
    }
    
    addProject.mutate({
      name: projectForm.name.trim(),
      city: projectForm.city.trim() || undefined,
      client_name: projectForm.client_name.trim() || undefined,
      default_rate_cents: rateInCents,
      billing_type: projectForm.billing_type,
      phase_budgets: Object.keys(phaseBudgets).length > 0 ? phaseBudgets : undefined,
    });
  };

  // Fase shortcodes voor compacte weergave
  const phaseShortcodes: Record<string, string> = {
    "schetsontwerp": "SO",
    "voorlopig-ontwerp": "VO", 
    "vo-tekeningen": "VO tek",
    "definitief-ontwerp": "DO",
    "do-tekeningen": "DO tek",
    "bouwvoorbereiding": "BV",
    "bv-tekeningen": "BV tek",
    "uitvoering": "UT",
    "uitvoering-tekeningen": "UT tek",
    "oplevering-nazorg": "Oplev",
  };

  /* ---- UI ---- */
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Uren</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setView("entries")}
            className={`px-4 py-2 rounded-lg ${view === "entries" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            Uren invoer
          </button>
          <button
            onClick={() => setView("summary")}
            className={`px-4 py-2 rounded-lg ${view === "summary" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            Project overzicht
          </button>

          {/* Excel import knop/modaal */}
          <ExcelImportTool />

          <button
            onClick={exportToCSV}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* API status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        {projectsError ? "⚠️ Backend niet bereikbaar voor projecten." : "✅ Projecten geladen"}
        {" · "}
        {phasesLoading ? "Fases laden…" : phasesError ? "⚠️ Fases via fallback" : "✅ Fases geladen"}
      </div>

      {view === "entries" && (
        <>
          {/* Project toevoegen modal */}
          {showProjectForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Nieuw project toevoegen</h3>
                  <button
                    onClick={() => setShowProjectForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Projectnaam *
                    </label>
                    <input
                      type="text"
                      placeholder="Naam van het project"
                      value={projectForm.name}
                      onChange={(e) => setProjectForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Plaats
                    </label>
                    <input
                      type="text"
                      placeholder="Stad/plaats van het project"
                      value={projectForm.city}
                      onChange={(e) => setProjectForm((f) => ({ ...f, city: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Opdrachtgever
                    </label>
                    <input
                      type="text"
                      placeholder="Naam van de opdrachtgever"
                      value={projectForm.client_name}
                      onChange={(e) => setProjectForm((f) => ({ ...f, client_name: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Uurtarief (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="75.00"
                      value={projectForm.default_rate_euros}
                      onChange={(e) => setProjectForm((f) => ({ ...f, default_rate_euros: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setShowProjectForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={handleProjectSubmit}
                    disabled={!projectForm.name.trim() || addProject.isPending}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {addProject.isPending ? "Toevoegen..." : "Project toevoegen"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Invoerformulier */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Uren registreren</h2>
              <button
                onClick={() => setShowProjectForm(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Project toevoegen
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              {/* Project */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Project *</label>
                <select
                  value={form.project_id}
                  onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white h-40"
                  size={10}
                  required
                >
                  <option value="">— Selecteer project —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.city ? ` (${p.city})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fase */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fase *</label>
                <select
                  value={form.phase_code}
                  onChange={(e) => setForm((f) => ({ ...f, phase_code: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white min-h-[200px]"
                  size={10}
                  required
                >
                  <option value="">— Selecteer fase —</option>
                  {phases
                    .slice()
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((ph) => (
                      <option key={ph.code} value={ph.code}>
                        {ph.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Datum *</label>
                <input
                  type="date"
                  value={form.occurred_on}
                  onChange={(e) => setForm((f) => ({ ...f, occurred_on: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Uren *</label>
                <input
                  type="number"
                  step="0.25"
                  inputMode="decimal"
                  placeholder="0"
                  value={form.hours}
                  onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
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
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-3 py-2 rounded text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Toevoegen
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Omschrijving (optioneel)</label>
              <input
                type="text"
                placeholder="Beschrijving van werkzaamheden…"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>

            {selectedProject && form.hours && (
              <div className="text-sm text-gray-700 mt-3 p-2 bg-blue-50 rounded">
                <span className="font-medium">Project:</span> {selectedProject.name}{" "}
                {selectedProject.city ? `(${selectedProject.city})` : ""} •{" "}
                <span className="font-medium">Uurtarief:</span>{" "}
                {EUR((selectedProject.default_rate_cents || 0) / 100)} •{" "}
                <span className="font-medium">Bedrag:</span>{" "}
                {EUR((parseFloat(form.hours || "0") || 0) * ((selectedProject.default_rate_cents || 0) / 100))}
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Alle projecten</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.city ? ` (${p.city})` : ""}
                  </option>
                ))}
              </select>

              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value as typeof filterPeriod)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">Alle periodes</option>
                <option value="week">Afgelopen week</option>
                <option value="month">Deze maand</option>
              </select>
            </div>
          </div>

          {/* Lijst entries */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">
                Geregistreerde uren ({entriesLoading ? "…" : filteredEntries.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Project</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Fase</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Datum</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Uren</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Bedrag</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Omschrijving</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {!entriesLoading && filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        Geen uren gevonden voor de geselecteerde filters.
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((e) => {
                      const prj = getProjectFromEntry(e);
                      const ph = getPhaseFromEntry(e);
                      const hours = e.minutes ? e.minutes / 60 : e.hours || 0;
                      const rate = (prj?.default_rate_cents || 0) / 100;
                      return (
                        <tr key={e.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium">{prj?.name || "Onbekend"}</div>
                            <div className="text-sm text-gray-600">{prj?.city}</div>
                          </td>
                          <td className="px-4 py-3 text-sm">{ph?.name || e.phase_code}</td>
                          <td className="px-4 py-3 text-sm">
                            {new Date(e.occurred_on).toLocaleDateString("nl-NL")}
                          </td>
                          <td className="px-4 py-3 text-sm font-mono">{hours.toFixed(2)}h</td>
                          <td className="px-4 py-3 text-sm font-mono">{EUR(hours * rate)}</td>
                          <td className="px-4 py-3 text-sm">{e.notes || "—"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {view === "summary" && (
        <div className="space-y-6">
          {Object.values(projectSummary).length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nog geen geregistreerde uren.</div>
          ) : (
            Object.values(projectSummary).map((s) => (
              <div key={s.project.id} className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{s.project.name}</h3>
                      <p className="text-sm text-gray-600">
                        {s.project.city} {s.project.client_name ? `— ${s.project.client_name}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-700">
                        Totaal uren: <span className="font-semibold">{s.totalHours.toFixed(1)}h</span>
                      </div>
                      <div className="text-sm text-green-700">
                        Totaal bedrag: {EUR(s.totalAmount)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Fase</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Uren</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Bedrag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Object.entries(s.phases).map(([code, data]) => (
                        <tr key={code}>
                          <td className="px-4 py-3 text-sm font-medium">{data.phase?.name || code}</td>
                          <td className="px-4 py-3 text-sm">{data.hours.toFixed(1)}h</td>
                          <td className="px-4 py-3 text-sm">{EUR(data.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
