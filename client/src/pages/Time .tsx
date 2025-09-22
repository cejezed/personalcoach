import React, { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Download } from "lucide-react";
import { api } from "@/lib/api";

type Project = {
  id: string;
  name: string;
  city: string;
  client_name: string;
  default_rate_cents: number;
  created_at?: string;
};

type Phase = { code: string; name: string; sort_order: number };

type TimeEntry = {
  id: string;
  project_id: string;
  phase_code: string;
  occurred_on: string; // yyyy-mm-dd
  minutes?: number;    // API gebruikt minutes
  hours?: number;      // lokale fallback
  notes?: string | null;
  // joined/fallback fields:
  projects?: Project;
  project?: Project;
  phases?: Phase;
  phase?: Phase;
};

const mockProjects: Project[] = [
  {
    id: "1",
    name: "Villa Waterfront",
    city: "Amstelveen",
    client_name: "Familie Jansen",
    default_rate_cents: 8500,
    created_at: "2024-01-15",
  },
  {
    id: "2",
    name: "Kantoorgebouw Centrum",
    city: "Amsterdam",
    client_name: "BV Vastgoed",
    default_rate_cents: 9500,
    created_at: "2024-02-20",
  },
];

const mockPhases: Phase[] = [
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

export default function Time() {
  const qc = useQueryClient();

  // ===== Queries (API + withAuth) =====
  const {
    data: apiProjects = [],
    isError: projectsError,
    isPending: projectsLoading,
  } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: () => api<Project[]>("/api/projects", {}, { withAuth: true }),
    retry: false,
    staleTime: 5 * 60_000,
  });

  const {
    data: apiPhases = [],
    isError: phasesError,
  } = useQuery({
    queryKey: ["/api/phases"],
    queryFn: () => api<Phase[]>("/api/phases", {}, { withAuth: true }),
    retry: false,
    staleTime: 10 * 60_000,
  });

  const {
    data: apiTimeEntries = [],
    isPending: entriesLoading,
  } = useQuery({
    queryKey: ["/api/time-entries"],
    queryFn: () => api<TimeEntry[]>("/api/time-entries", {}, { withAuth: true }),
    retry: false,
    staleTime: 60_000,
  });

  // ===== Fallback/logica =====
  // Projecten: gebruik API als die werkt, anders houden we een lokale lijst bij
  const [localProjects, setLocalProjects] = useState<Project[]>(mockProjects);
  const projects: Project[] = projectsError
    ? localProjects
    : apiProjects.length > 0
    ? apiProjects
    : mockProjects;

  // Phases: simpel fallback
  const phases: Phase[] = phasesError
    ? mockPhases
    : apiPhases.length > 0
    ? apiPhases
    : mockPhases;

  // Time entries in lokale state (voor fallback bij mislukte POST)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(apiTimeEntries);
  useEffect(() => {
    if (Array.isArray(apiTimeEntries)) setTimeEntries(apiTimeEntries);
  }, [apiTimeEntries]);

  // ===== Mutations =====
  const addProjectMutation = useMutation({
    mutationFn: (newProject: Omit<Project, "id">) =>
      api<Project>("/api/projects", { method: "POST", body: JSON.stringify(newProject) }, { withAuth: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: (err, variables) => {
      // fallback: push lokaal
      const fallback: Project = { id: String(Date.now()), ...variables };
      setLocalProjects((prev) => [fallback, ...prev]);
      console.warn("Project API faalde, lokaal opgeslagen:", err);
    },
  });

  const addTimeEntryMutation = useMutation({
    mutationFn: (newEntry: {
      project_id: string;
      phase_code: string;
      occurred_on: string;
      hours: string; // UI input
      notes?: string;
    }) => {
      const hoursNum = Number.parseFloat(newEntry.hours || "0");
      const minutes = Math.round((isFinite(hoursNum) ? hoursNum : 0) * 60);
      const payload = {
        project_id: newEntry.project_id,
        phase_code: newEntry.phase_code,
        occurred_on: newEntry.occurred_on,
        minutes,
        notes: newEntry.notes || null,
      };
      return api<TimeEntry>("/api/time-entries", { method: "POST", body: JSON.stringify(payload) }, { withAuth: true });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/time-entries"] });
    },
    onError: (error, variables) => {
      // fallback lokaal
      const project = projects.find((p) => p.id === variables.project_id);
      const phase = phases.find((p) => p.code === variables.phase_code);
      const hoursNum = Number.parseFloat(variables.hours || "0");
      const fallback: TimeEntry = {
        id: String(Date.now()),
        project_id: variables.project_id,
        phase_code: variables.phase_code,
        occurred_on: variables.occurred_on,
        hours: isFinite(hoursNum) ? hoursNum : 0,
        notes: variables.notes || null,
        project,
        phase,
      };
      setTimeEntries((prev) => [fallback, ...prev]);
      console.warn("Time entry API faalde, lokaal toegevoegd:", error);
    },
  });

  // ===== Form state =====
  const [newProject, setNewProject] = useState<Omit<Project, "id">>({
    name: "",
    city: "",
    client_name: "",
    default_rate_cents: 8500,
  });

  const [newEntry, setNewEntry] = useState<{
    project_id: string;
    phase_code: string;
    occurred_on: string;
    hours: string;
    notes: string;
  }>({
    project_id: "",
    phase_code: "",
    occurred_on: new Date().toISOString().split("T")[0],
    hours: "",
    notes: "",
  });

  const [showNewProject, setShowNewProject] = useState(false);
  const [viewMode, setViewMode] = useState<"entries" | "summary">("entries");
  const [filterProject, setFilterProject] = useState("");
  const [filterPeriod, setFilterPeriod] = useState<"all" | "week" | "month">("all");

  const selectedProject = projects.find((p) => p.id === newEntry.project_id);

  // ===== Handlers =====
  const addProject = () => {
    if (!newProject.name || !newProject.city || !newProject.client_name) return;
    addProjectMutation.mutate(newProject);
    setNewProject({ name: "", city: "", client_name: "", default_rate_cents: 8500 });
    setShowNewProject(false);
  };

  const addTimeEntry = () => {
    if (!newEntry.project_id || !newEntry.phase_code || !newEntry.occurred_on || !newEntry.hours) return;
    addTimeEntryMutation.mutate(newEntry);
    setNewEntry({
      project_id: "",
      phase_code: "",
      occurred_on: new Date().toISOString().split("T")[0],
      hours: "",
      notes: "",
    });
  };

  // ===== Export =====
  const exportToCSV = () => {
    const headers = ["Project", "Fase", "Datum", "Uren", "Omschrijving", "Uurtarief", "Bedrag"];
    const rows = timeEntries.map((entry) => {
      const project = entry.projects || entry.project;
      const phase = entry.phases || entry.phase;
      const hours = entry.minutes ? entry.minutes / 60 : entry.hours || 0;
      const rate = project ? (project.default_rate_cents || 0) / 100 : 0;
      const amount = hours * rate;
      return [
        project?.name || "Onbekend",
        phase?.name || entry.phase_code || "Onbekend",
        entry.occurred_on,
        hours.toFixed(1),
        entry.notes || "",
        `€${rate.toFixed(2)}`,
        `€${amount.toFixed(2)}`,
      ];
    });

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `urenadministratie-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ===== Filtering & Summary =====
  const filteredEntries = useMemo(() => {
    let arr = timeEntries;
    if (filterProject) arr = arr.filter((e) => e.project_id === filterProject);
    if (filterPeriod !== "all") {
      const now = new Date();
      arr = arr.filter((e) => {
        const d = new Date(e.occurred_on);
        if (filterPeriod === "week") {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
          return d >= weekAgo;
        }
        if (filterPeriod === "month") {
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }
    return arr;
  }, [timeEntries, filterProject, filterPeriod]);

  const projectSummary = useMemo(() => {
    const summary: Record<
      string,
      {
        project: Project;
        phases: Record<string, { hours: number; amount: number; phase?: Phase }>;
        totalHours: number;
        totalAmount: number;
      }
    > = {};

    timeEntries.forEach((e) => {
      const project = (e.projects || e.project) as Project | undefined;
      if (!project) return;

      if (!summary[e.project_id]) {
        summary[e.project_id] = { project, phases: {}, totalHours: 0, totalAmount: 0 };
      }

      const hours = e.minutes ? e.minutes / 60 : e.hours || 0;
      const rate = (project.default_rate_cents || 0) / 100;
      const amount = hours * rate;

      if (!summary[e.project_id].phases[e.phase_code]) {
        summary[e.project_id].phases[e.phase_code] = {
          hours: 0,
          amount: 0,
          phase: (e.phases || e.phase) as Phase | undefined,
        };
      }

      summary[e.project_id].phases[e.phase_code].hours += hours;
      summary[e.project_id].phases[e.phase_code].amount += amount;
      summary[e.project_id].totalHours += hours;
      summary[e.project_id].totalAmount += amount;
    });

    return summary;
  }, [timeEntries]);

  // ===== UI =====
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Urenregistratie</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("entries")}
            className={`px-4 py-2 rounded-lg ${viewMode === "entries" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            Uren invoer
          </button>
          <button
            onClick={() => setViewMode("summary")}
            className={`px-4 py-2 rounded-lg ${viewMode === "summary" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            Project overzicht
          </button>
          <button
            onClick={exportToCSV}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* API Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
        {projectsError ? "⚠️ Backend niet bereikbaar — gebruik lokale mock data" : "✅ Verbonden met backend API"}
      </div>

      {/* Nieuw project */}
      {showNewProject && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h2 className="text-lg font-semibold mb-4">Nieuw project toevoegen</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <input
              type="text"
              placeholder="Projectnaam"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              className="border rounded-md px-3 py-2"
            />
            <input
              type="text"
              placeholder="Woonplaats"
              value={newProject.city}
              onChange={(e) => setNewProject({ ...newProject, city: e.target.value })}
              className="border rounded-md px-3 py-2"
            />
            <input
              type="text"
              placeholder="Opdrachtgever"
              value={newProject.client_name}
              onChange={(e) => setNewProject({ ...newProject, client_name: e.target.value })}
              className="border rounded-md px-3 py-2"
            />
            <input
              type="number"
              placeholder="Uurtarief (eurocent)"
              value={newProject.default_rate_cents}
              onChange={(e) => setNewProject({ ...newProject, default_rate_cents: Number(e.target.value || 0) })}
              className="border rounded-md px-3 py-2"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={addProject} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">
              Project toevoegen
            </button>
            <button onClick={() => setShowNewProject(false)} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">
              Annuleren
            </button>
          </div>
        </div>
      )}

      {viewMode === "entries" && (
        <>
          {/* Uren invoer */}
          <div className="bg-white rounded-lg shadow-sm border p-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Uren registreren</h2>
              <button
                onClick={() => setShowNewProject(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Nieuw project</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              {/* Project */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Project *</label>
                <select
                  value={newEntry.project_id}
                  onChange={(e) => setNewEntry({ ...newEntry, project_id: e.target.value })}
                  size={10}
                  className="w-full border rounded px-2 py-1 text-sm bg-white h-40 overflow-y-auto"
                  required
                >
                  <option value="">-- Selecteer project --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.city})
                    </option>
                  ))}
                </select>
              </div>
              {/* Fase */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fase *</label>
                <select
                  value={newEntry.phase_code}
                  onChange={(e) => setNewEntry({ ...newEntry, phase_code: e.target.value })}
                  size={11}
                  className="w-full border rounded px-2 py-1 text-sm bg-white min-h-[200px]"
                  required
                >
                  <option value="">-- Selecteer fase --</option>
                  {phases.map((ph) => (
                    <option key={ph.code} value={ph.code}>
                      {ph.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Datum *</label>
                <input
                  type="date"
                  value={newEntry.occurred_on}
                  onChange={(e) => setNewEntry({ ...newEntry, occurred_on: e.target.value })}
                  className="w-full border rounded px-2 py-1 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Uren *</label>
                <input
                  type="number"
                  step="0.25"
                  placeholder="0"
                  value={newEntry.hours}
                  onChange={(e) => setNewEntry({ ...newEntry, hours: e.target.value })}
                  className="w-full border rounded px-2 py-1 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Actie</label>
                <button
                  onClick={addTimeEntry}
                  disabled={!newEntry.project_id || !newEntry.phase_code || !newEntry.occurred_on || !newEntry.hours}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-2 py-1 rounded text-sm font-medium h-8"
                >
                  Toevoegen
                </button>
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Omschrijving (optioneel)</label>
              <input
                type="text"
                placeholder="Beschrijving van werkzaamheden..."
                value={newEntry.notes}
                onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>

            {selectedProject && newEntry.hours && (
              <div className="text-sm text-gray-600 mb-2 p-2 bg-blue-50 rounded">
                <span className="font-medium">Project:</span> {selectedProject.name} •{" "}
                <span className="font-medium">Uurtarief:</span> €
                {(selectedProject.default_rate_cents / 100).toFixed(2)} •{" "}
                <span className="font-medium">Bedrag:</span> €
                {(
                  (Number.parseFloat(newEntry.hours || "0") || 0) *
                  (selectedProject.default_rate_cents / 100)
                ).toFixed(2)}
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
                className="border rounded-md px-3 py-2"
              >
                <option value="">Alle projecten</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.city})
                  </option>
                ))}
              </select>

              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value as "all" | "week" | "month")}
                className="border rounded-md px-3 py-2"
              >
                <option value="all">Alle periodes</option>
                <option value="week">Afgelopen week</option>
                <option value="month">Deze maand</option>
              </select>
            </div>
          </div>

          {/* Lijst */}
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
                  {entriesLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        Laden…
                      </td>
                    </tr>
                  ) : filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        Geen uren gevonden voor de geselecteerde filters.
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((e) => {
                      const project = e.projects || e.project;
                      const phase = e.phases || e.phase;
                      const hours = e.minutes ? e.minutes / 60 : e.hours || 0;
                      const rate = project ? (project.default_rate_cents || 0) / 100 : 0;
                      const amount = hours * rate;

                      return (
                        <tr key={e.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium">{project?.name || "Onbekend"}</div>
                            <div className="text-sm text-gray-600">{project?.city}</div>
                          </td>
                          <td className="px-4 py-3 text-sm">{phase?.name || e.phase_code}</td>
                          <td className="px-4 py-3 text-sm">
                            {new Date(e.occurred_on).toLocaleDateString("nl-NL")}
                          </td>
                          <td className="px-4 py-3 text-sm font-mono">{hours.toFixed(1)}h</td>
                          <td className="px-4 py-3 text-sm font-mono">€{amount.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm">{e.notes || "-"}</td>
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

      {viewMode === "summary" && (
        <div className="space-y-6">
          {Object.values(projectSummary).map((s) => (
            <div key={s.project.id} className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{s.project.name}</h3>
                    <p className="text-sm text-gray-600">
                      {s.project.city} — {s.project.client_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      Totaal uren: <span className="font-semibold">{s.totalHours.toFixed(1)}h</span>
                    </div>
                    <div className="text-sm text-green-600">Totaal bedrag: €{s.totalAmount.toFixed(2)}</div>
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
                    {Object.entries(s.phases).map(([code, d]) => (
                      <tr key={code}>
                        <td className="px-4 py-3 text-sm font-medium">{d.phase?.name || code}</td>
                        <td className="px-4 py-3 text-sm">{d.hours.toFixed(1)}h</td>
                        <td className="px-4 py-3 text-sm">€{d.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {Object.keys(projectSummary).length === 0 && (
            <div className="text-center py-8 text-gray-500">Geen projecten met geregistreerde uren gevonden.</div>
          )}
        </div>
      )}
    </div>
  );
}
