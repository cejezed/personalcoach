import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Download, X, Archive, ArchiveRestore, MoreHorizontal } from "lucide-react";
import { api } from "@/lib/api";

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
  archived?: boolean;            // ✅ toegevoegd
  archived_at?: string | null;   // blijft
  is_archived?: boolean;         // backward compat / computed
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

const phaseShortcodes: Record<string, string> = {
  "schetsontwerp": "SO",
  "voorlopig-ontwerp": "VO",
  "vo-tekeningen": "VO-tek",
  "definitief-ontwerp": "DO",
  "do-tekeningen": "DO-tek",
  "bouwvoorbereiding": "BV",
  "bv-tekeningen": "BV-tek",
  "uitvoering": "UTV",
  "uitvoering-tekeningen": "UTV-tek",
  "oplevering-nazorg": "OP",
};

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
  const [showArchived, setShowArchived] = React.useState<boolean>(false);
  const [showProjectForm, setShowProjectForm] = React.useState(false);
  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);

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

  // Filter projecten op basis van archief status
const filteredProjects = React.useMemo(() => {
  return projects.filter(project => {
    const isArchived = !!(project.archived || project.archived_at !== null || project.is_archived);
    return showArchived ? isArchived : !isArchived;
  });
}, [projects, showArchived]);

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

  // Nieuw: Archive/Unarchive project mutation
const toggleArchiveProject = useMutation({
  mutationFn: async ({ projectId, archive }: { projectId: string; archive: boolean }) => {
    return api<Project>(`/api/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify({
        archived: archive,                                 // ✅ nieuw
        archived_at: archive ? new Date().toISOString() : null
      }),
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    setActiveDropdown(null);
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

  const enhancedProjectSummary = React.useMemo(() => {
    // Start met gefilterde projecten (actief of gearchiveerd)
    const summary = filteredProjects.map(project => {
      const projectEntries = timeEntries.filter(entry => entry.project_id === project.id);
      const totalHours = projectEntries.reduce((sum, entry) => {
        return sum + (entry.minutes ? entry.minutes / 60 : entry.hours || 0);
      }, 0);
      
      const rate = (project.default_rate_cents || 0) / 100;
      const totalAmount = totalHours * rate;
      
      // Per fase breakdown - start met alle fases
      const phaseBreakdown = phases.reduce((acc, phase) => {
        const phaseEntries = projectEntries.filter(entry => entry.phase_code === phase.code);
        const phaseHours = phaseEntries.reduce((sum, entry) => {
          return sum + (entry.minutes ? entry.minutes / 60 : entry.hours || 0);
        }, 0);
        
        acc[phase.code] = {
          phase: phase,
          hours: phaseHours,
          amount: phaseHours * rate,
          entryCount: phaseEntries.length,
          lastEntry: phaseEntries.length > 0 ? 
            phaseEntries.sort((a, b) => new Date(b.occurred_on).getTime() - new Date(a.occurred_on).getTime())[0] : null
        };
        return acc;
      }, {} as Record<string, { phase: Phase; hours: number; amount: number; entryCount: number; lastEntry: any }>);

      const isArchived = !!(project.archived || project.archived_at !== null || project.is_archived);

      return {
        project,
        totalHours,
        totalAmount,
        phaseBreakdown,
        hasEntries: projectEntries.length > 0,
        isArchived,
        lastActivity: projectEntries.length > 0 ? 
          projectEntries.sort((a, b) => new Date(b.occurred_on).getTime() - new Date(a.occurred_on).getTime())[0].occurred_on : null
      };
    });

    // Sorteer: bij actieve projecten - recente activiteit eerst, bij gearchiveerde - archiveringsdatum
    return summary.sort((a, b) => {
      if (showArchived) {
        // Gearchiveerde projecten: sorteer op archiveringsdatum (nieuwst eerst)
        const aArchived = new Date(a.project.archived_at || 0).getTime();
        const bArchived = new Date(b.project.archived_at || 0).getTime();
        return bArchived - aArchived;
      } else {
        // Actieve projecten: sorteer op activiteit
        if (a.hasEntries && !b.hasEntries) return -1;
        if (!a.hasEntries && b.hasEntries) return 1;
        if (a.lastActivity && b.lastActivity) {
          return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
        }
        return a.project.name.localeCompare(b.project.name);
      }
    });
  }, [filteredProjects, timeEntries, phases, showArchived]);

  // State voor uitklapbare projecten
  const [expandedProjects, setExpandedProjects] = React.useState<Set<string>>(new Set());

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

  const toggleProjectExpansion = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const handleArchiveToggle = (projectId: string, isCurrentlyArchived: boolean) => {
    toggleArchiveProject.mutate({
      projectId,
      archive: !isCurrentlyArchived
    });
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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Plaats
                      </label>
                      <input
                        type="text"
                        placeholder="Stad/plaats"
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
                        placeholder="Naam opdrachtgever"
                        value={projectForm.client_name}
                        onChange={(e) => setProjectForm((f) => ({ ...f, client_name: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  {/* Facturatie type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Facturatie methode
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="hourly"
                          checked={projectForm.billing_type === "hourly"}
                          onChange={(e) => setProjectForm((f) => ({ ...f, billing_type: e.target.value as "hourly" | "fixed" }))}
                          className="mr-2"
                        />
                        Op uurbasis
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="fixed"
                          checked={projectForm.billing_type === "fixed"}
                          onChange={(e) => setProjectForm((f) => ({ ...f, billing_type: e.target.value as "hourly" | "fixed" }))}
                          className="mr-2"
                        />
                        Vaste honoraria per fase
                      </label>
                    </div>
                  </div>

                  {/* Uurtarief (alleen bij hourly) */}
                  {projectForm.billing_type === "hourly" && (
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
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm max-w-32"
                      />
                    </div>
                  )}

                  {/* Fase */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Fase *</label>
                <div className="relative">
                  <select
                    value={form.phase_code}
                    onChange={(e) => setForm((f) => ({ ...f, phase_code: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
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
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Datum *</label>
                <input
                  type="date"
                  value={form.occurred_on}
                  onChange={(e) => setForm((f) => ({ ...f, occurred_on: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
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
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
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
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 text-white px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 shadow-sm transition-all"
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
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              />
            </div>

            {selectedProject && form.hours && (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">Kostenoverzicht</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      <div><strong>Project:</strong> {selectedProject.name} {selectedProject.city ? `(${selectedProject.city})` : ""}</div>
                      <div><strong>Uurtarief:</strong> {EUR((selectedProject.default_rate_cents || 0) / 100)}</div>
                      <div><strong>Bedrag:</strong> <span className="text-green-600 font-semibold">{EUR((parseFloat(form.hours || "0") || 0) * ((selectedProject.default_rate_cents || 0) / 100))}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Project</label>
                <select
                  value={filterProject}
                  onChange={(e) => setFilterProject(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                >
                  <option value="">Alle projecten</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.city ? ` (${p.city})` : ""}{(p.archived || p.archived_at || p.is_archived) ? " (gearchiveerd)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Periode</label>
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value as typeof filterPeriod)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                >
                  <option value="all">Alle periodes</option>
                  <option value="week">Afgelopen week</option>
                  <option value="month">Deze maand</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lijst entries */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                Geregistreerde uren ({entriesLoading ? "…" : filteredEntries.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Project</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Fase</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Datum</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Uren</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Bedrag</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Omschrijving</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {!entriesLoading && filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
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
                        <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{prj?.name || "Onbekend"}</div>
                            <div className="text-sm text-gray-600">{prj?.city}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{ph?.name || e.phase_code}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(e.occurred_on).toLocaleDateString("nl-NL")}
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-gray-900">{hours.toFixed(2)}h</td>
                          <td className="px-6 py-4 text-sm font-mono text-green-600 font-medium">{EUR(hours * rate)}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{e.notes || "—"}</td>
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
          {/* Archive Toggle */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Project weergave</h3>
                <p className="text-sm text-gray-600 mt-1">Schakel tussen actieve en gearchiveerde projecten</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm ${!showArchived ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                  Actieve projecten
                </span>
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    showArchived ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${
                      showArchived ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className={`text-sm ${showArchived ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                  Gearchiveerde projecten
                </span>
              </div>
            </div>
          </div>

          {enhancedProjectSummary.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                {showArchived ? (
                  <Archive className="w-8 h-8 text-gray-400" />
                ) : (
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {showArchived ? "Geen gearchiveerde projecten" : "Nog geen projecten"}
              </h3>
              <p className="text-gray-600">
                {showArchived 
                  ? "Er zijn nog geen projecten gearchiveerd" 
                  : "Maak je eerste project aan om te beginnen met urenregistratie"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {enhancedProjectSummary.map((summary) => {
                const isExpanded = expandedProjects.has(summary.project.id);
                
                return (
                  <div key={summary.project.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                    {/* Project Header */}
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => toggleProjectExpansion(summary.project.id)}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">{summary.project.name}</h3>
                            
                            {/* Status indicators */}
                            <div className="flex items-center gap-2">
                              {summary.isArchived ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  <Archive className="w-3 h-3 mr-1" />
                                  Gearchiveerd
                                </span>
                              ) : summary.hasEntries ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></div>
                                  Actief
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-1"></div>
                                  Nieuw
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            {summary.project.city && (
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {summary.project.city}
                              </div>
                            )}
                            {summary.project.client_name && (
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {summary.project.client_name}
                              </div>
                            )}
                            {summary.lastActivity && (
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Laatste activiteit: {new Date(summary.lastActivity).toLocaleDateString("nl-NL")}
                              </div>
                            )}
                            {summary.isArchived && summary.project.archived_at && (
                              <div className="flex items-center gap-1">
                                <Archive className="w-4 h-4" />
                                Gearchiveerd: {new Date(summary.project.archived_at).toLocaleDateString("nl-NL")}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          {/* Statistieken */}
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                              {summary.totalHours.toFixed(1)}<span className="text-sm font-normal text-gray-500">h</span>
                            </div>
                            <div className="text-sm text-gray-600">Totaal uren</div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">{EUR(summary.totalAmount)}</div>
                            <div className="text-sm text-gray-600">Totaal bedrag</div>
                          </div>

                          {/* Action Menu */}
                          <div className="relative ml-4">
                            <button
                              onClick={() => setActiveDropdown(activeDropdown === summary.project.id ? null : summary.project.id)}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <MoreHorizontal className="w-5 h-5" />
                            </button>

                            {activeDropdown === summary.project.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                <button
                                  onClick={() => handleArchiveToggle(summary.project.id, summary.isArchived)}
                                  disabled={toggleArchiveProject.isPending}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                  {summary.isArchived ? (
                                    <>
                                      <ArchiveRestore className="mr-3 h-4 w-4" />
                                      Project herstellen
                                    </>
                                  ) : (
                                    <>
                                      <Archive className="mr-3 h-4 w-4" />
                                      Project archiveren
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {/* Expand/Collapse indicator */}
                          <div 
                            className="ml-2 cursor-pointer"
                            onClick={() => toggleProjectExpansion(summary.project.id)}
                          >
                            <svg 
                              className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Project Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50">
                        <div className="p-6">
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Projectfases</h4>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(summary.phaseBreakdown)
                              .sort(([,a], [,b]) => a.phase.sort_order - b.phase.sort_order)
                              .map(([phaseCode, phaseData]) => {
                                const isActive = phaseData.hours > 0;
                                
                                return (
                                  <div 
                                    key={phaseCode} 
                                    className={`p-4 rounded-lg border-2 transition-all ${
                                      isActive 
                                        ? 'bg-white border-blue-200 shadow-sm' 
                                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <h5 className={`font-medium text-sm ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                                        {phaseData.phase.name}
                                      </h5>
                                      {isActive && (
                                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                      )}
                                    </div>
                                    
                                    <div className="space-y-1">
                                      <div className={`text-lg font-bold ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                                        {phaseData.hours > 0 ? `${phaseData.hours.toFixed(1)}h` : '0h'}
                                      </div>
                                      
                                      {isActive && (
                                        <div className="text-sm text-gray-600">
                                          {EUR(phaseData.amount)} • {phaseData.entryCount} entries
                                        </div>
                                      )}
                                      
                                      {!isActive && (
                                        <div className="text-xs text-gray-500">Nog geen uren</div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Click outside handler for dropdowns */}
      {activeDropdown && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setActiveDropdown(null)}
        />
      )}
    </div>
  );
} honoraria (alleen bij fixed) */}
                  {projectForm.billing_type === "fixed" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Afgesproken honorarium per fase (€)
                      </label>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-3">
                          {phases
                            .slice()
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map((phase) => (
                              <div key={phase.code} className="flex items-center gap-2">
                                <span className="text-sm font-medium w-20 shrink-0">
                                  {phaseShortcodes[phase.code] || phase.code}:
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="0"
                                  value={projectForm.phase_budgets[phase.code] || ""}
                                  onChange={(e) => 
                                    setProjectForm((f) => ({
                                      ...f,
                                      phase_budgets: {
                                        ...f.phase_budgets,
                                        [phase.code]: e.target.value
                                      }
                                    }))
                                  }
                                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                                />
                              </div>
                            ))}
                        </div>
                        <div className="mt-2 text-xs text-gray-600">
                          Vul alleen de fases in waarvoor een vast bedrag is afgesproken. Lege velden worden overgeslagen.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Totaaloverzicht bij fixed */}
                  {projectForm.billing_type === "fixed" && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm text-blue-800">
                        <span className="font-medium">Totaal project honorarium: </span>
                        {EUR(
                          Object.values(projectForm.phase_budgets)
                            .filter(amount => amount && parseFloat(amount) > 0)
                            .reduce((sum, amount) => sum + parseFloat(amount), 0)
                        )}
                      </div>
                    </div>
                  )}
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Uren registreren</h2>
                <p className="text-sm text-gray-600 mt-1">Voeg nieuwe uren toe aan je projecten</p>
              </div>
              <button
                onClick={() => setShowProjectForm(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                Project toevoegen
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Project */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Project *</label>
                <div className="relative">
                  <select
                    value={form.project_id}
                    onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    required
                  >
                    <option value="">— Selecteer project —</option>
                    {/* Alleen actieve projecten tonen in het formulier */}
                    {projects.filter(p => !p.archived && !p.archived_at && !p.is_archived).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}{p.city ? ` (${p.city})` : ""}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Fase