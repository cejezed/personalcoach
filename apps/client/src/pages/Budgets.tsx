import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, TrendingUp, Clock, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";
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
  billing_type?: "hourly" | "fixed";
  phase_budgets?: Record<string, number>;
  created_at?: string;
};

type TimeEntry = {
  id: string;
  project_id: string;
  phase_code: string;
  occurred_on: string;
  minutes?: number;
  hours?: number;
  notes?: string | null;
  projects?: Project;
  project?: Project;
};

type Phase = {
  code: string;
  name: string;
  sort_order: number;
};

type BudgetStatus = "under_budget" | "on_track" | "over_budget" | "budget_exceeded";

/* =======================
   Fallback phases
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
    maximumFractionDigits: 0,
  }).format(v);

const getProjectFromEntry = (e: TimeEntry): Project | undefined => e.projects || e.project;

const getBudgetStatus = (spent: number, budget: number): BudgetStatus => {
  if (budget === 0) return "on_track";
  const percentage = (spent / budget) * 100;
  if (percentage <= 75) return "under_budget";
  if (percentage <= 90) return "on_track";
  if (percentage <= 100) return "over_budget";
  return "budget_exceeded";
};

const getStatusColor = (status: BudgetStatus) => {
  switch (status) {
    case "under_budget": return "text-green-600 bg-green-50 border-green-200";
    case "on_track": return "text-blue-600 bg-blue-50 border-blue-200";
    case "over_budget": return "text-orange-600 bg-orange-50 border-orange-200";
    case "budget_exceeded": return "text-red-600 bg-red-50 border-red-200";
  }
};

const getStatusIcon = (status: BudgetStatus) => {
  switch (status) {
    case "under_budget": return <CheckCircle className="w-4 h-4 text-green-600" />;
    case "on_track": return <TrendingUp className="w-4 h-4 text-blue-600" />;
    case "over_budget": return <AlertTriangle className="w-4 h-4 text-orange-600" />;
    case "budget_exceeded": return <AlertTriangle className="w-4 h-4 text-red-600" />;
  }
};

const getStatusText = (status: BudgetStatus) => {
  switch (status) {
    case "under_budget": return "Onder budget";
    case "on_track": return "Op schema";
    case "over_budget": return "Budget overschrijd";
    case "budget_exceeded": return "Budget overschreden";
  }
};

/* =======================
   Component
======================= */
export default function Budgets() {
  const queryClient = useQueryClient();

  /* ---- Data ophalen ---- */
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: () => api<Project[]>("/api/projects"),
    staleTime: 5 * 60 * 1000,
  });

  const { data: timeEntries = [] } = useQuery<TimeEntry[]>({
    queryKey: ["time-entries"],
    queryFn: () => api<TimeEntry[]>("/api/time-entries"),
    staleTime: 60 * 1000,
  });

  const { data: phasesData } = useQuery<Phase[]>({
    queryKey: ["phases"],
    queryFn: () => api<Phase[]>("/api/phases"),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
  const phases: Phase[] = phasesData?.length ? phasesData : FALLBACK_PHASES;

  /* ---- State ---- */
  const [editingProject, setEditingProject] = React.useState<Project | null>(null);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [editForm, setEditForm] = React.useState<{
    billing_type: "hourly" | "fixed";
    default_rate_euros: string;
    phase_budgets: Record<string, string>;
  }>({
    billing_type: "hourly",
    default_rate_euros: "75",
    phase_budgets: {},
  });

  /* ---- Mutations ---- */
  const updateProjectMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      billing_type: "hourly" | "fixed";
      default_rate_cents?: number;
      phase_budgets?: Record<string, number>;
    }) => {
      return api<Project>(`/api/projects/${payload.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setShowEditModal(false);
      setEditingProject(null);
    },
  });

  /* ---- Budget berekeningen ---- */
  const projectBudgets = React.useMemo(() => {
    return projects.map(project => {
      const projectEntries = timeEntries.filter(entry => entry.project_id === project.id);
      const totalSpentHours = projectEntries.reduce((sum, entry) => {
        return sum + (entry.minutes ? entry.minutes / 60 : entry.hours || 0);
      }, 0);

      const isHourlyProject = project.billing_type === "hourly" || !project.billing_type;
      const hourlyRate = (project.default_rate_cents || 0) / 100;
      
      let totalBudget = 0;
      let totalSpent = 0;
      let phaseBreakdown: Record<string, { spent: number; budget: number; hours: number }> = {};

      if (isHourlyProject) {
        totalSpent = totalSpentHours * hourlyRate;
        totalBudget = 0; // Geen vaste budget bij uurtarief
      } else {
        // Fixed price project
        totalBudget = Object.values(project.phase_budgets || {}).reduce((sum, budget) => sum + budget, 0) / 100;
        totalSpent = totalSpentHours * hourlyRate; // Kosten gebaseerd op uren
      }

      // Per fase breakdown
      phases.forEach(phase => {
        const phaseEntries = projectEntries.filter(entry => entry.phase_code === phase.code);
        const phaseHours = phaseEntries.reduce((sum, entry) => {
          return sum + (entry.minutes ? entry.minutes / 60 : entry.hours || 0);
        }, 0);
        const phaseSpent = phaseHours * hourlyRate;
        const phaseBudget = project.phase_budgets?.[phase.code] ? project.phase_budgets[phase.code] / 100 : 0;

        if (phaseHours > 0 || phaseBudget > 0) {
          phaseBreakdown[phase.code] = {
            spent: phaseSpent,
            budget: phaseBudget,
            hours: phaseHours
          };
        }
      });

      const status = getBudgetStatus(totalSpent, totalBudget);

      return {
        project,
        totalBudget,
        totalSpent,
        totalHours: totalSpentHours,
        status,
        phaseBreakdown,
        isHourlyProject
      };
    });
  }, [projects, timeEntries, phases]);

  /* ---- Edit handlers ---- */
  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setEditForm({
      billing_type: project.billing_type || "hourly",
      default_rate_euros: ((project.default_rate_cents || 7500) / 100).toString(),
      phase_budgets: Object.entries(project.phase_budgets || {}).reduce((acc, [phase, cents]) => {
        acc[phase] = (cents / 100).toString();
        return acc;
      }, {} as Record<string, string>),
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingProject) return;

    const payload: any = {
      id: editingProject.id,
      billing_type: editForm.billing_type,
    };

    if (editForm.billing_type === "hourly") {
      payload.default_rate_cents = Math.round(parseFloat(editForm.default_rate_euros) * 100);
      payload.phase_budgets = null;
    } else {
      payload.phase_budgets = Object.entries(editForm.phase_budgets).reduce((acc, [phase, amount]) => {
        if (amount && parseFloat(amount) > 0) {
          acc[phase] = Math.round(parseFloat(amount) * 100);
        }
        return acc;
      }, {} as Record<string, number>);
    }

    updateProjectMutation.mutate(payload);
  };

  /* ---- UI ---- */
  if (projectsLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Budget Management</h1>
        <div className="text-center py-8">Budgetten laden...</div>
      </div>
    );
  }

  const totalProjectValue = projectBudgets.reduce((sum, pb) => sum + pb.totalBudget, 0);
  const totalSpent = projectBudgets.reduce((sum, pb) => sum + pb.totalSpent, 0);
  const totalHours = projectBudgets.reduce((sum, pb) => sum + pb.totalHours, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Budget Management</h1>
          <p className="text-gray-600 mt-1">Overzicht van project budgetten en gerealiseerde uren</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Totaal Budget</p>
              <p className="text-2xl font-bold text-blue-600">{EUR(totalProjectValue)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gerealiseerd</p>
              <p className="text-2xl font-bold text-green-600">{EUR(totalSpent)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Totaal Uren</p>
              <p className="text-2xl font-bold text-purple-600">{totalHours.toFixed(1)}h</p>
            </div>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gemiddeld Tarief</p>
              <p className="text-2xl font-bold text-orange-600">
                {totalHours > 0 ? EUR(totalSpent / totalHours) : EUR(0)}/u
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Project budget lijst */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Project Budgetten</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {projectBudgets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nog geen projecten aangemaakt
            </div>
          ) : (
            projectBudgets.map(({ project, totalBudget, totalSpent, totalHours, status, phaseBreakdown, isHourlyProject }) => (
              <div key={project.id} className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{project.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(status)}`}>
                        {getStatusIcon(status)}
                        <span className="ml-1">{getStatusText(status)}</span>
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${isHourlyProject ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
                        {isHourlyProject ? "Uurbasis" : "Vast honorarium"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {project.city} {project.client_name ? `— ${project.client_name}` : ""}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        {isHourlyProject ? "Gerealiseerd" : "Budget vs Gerealiseerd"}
                      </div>
                      <div className="font-semibold">
                        {isHourlyProject ? EUR(totalSpent) : `${EUR(totalBudget)} / ${EUR(totalSpent)}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {totalHours.toFixed(1)} uren
                      </div>
                    </div>
                    <button
                      onClick={() => openEditModal(project)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Budget progress bar (alleen voor fixed price) */}
                {!isHourlyProject && totalBudget > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Voortgang</span>
                      <span>{Math.round((totalSpent / totalBudget) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          status === "budget_exceeded" ? "bg-red-500" :
                          status === "over_budget" ? "bg-orange-500" :
                          status === "on_track" ? "bg-blue-500" :
                          "bg-green-500"
                        }`}
                        style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Fase breakdown */}
                {Object.keys(phaseBreakdown).length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(phaseBreakdown).map(([phaseCode, data]) => {
                      const phase = phases.find(p => p.code === phaseCode);
                      const phaseStatus = getBudgetStatus(data.spent, data.budget);
                      return (
                        <div key={phaseCode} className="bg-gray-50 rounded p-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">{phase?.name || phaseCode}</span>
                            {!isHourlyProject && data.budget > 0 && (
                              <span className={`px-1 py-0.5 text-xs rounded ${getStatusColor(phaseStatus)}`}>
                                {Math.round((data.spent / data.budget) * 100)}%
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600">
                            {!isHourlyProject && data.budget > 0 ? 
                              `${EUR(data.budget)} / ${EUR(data.spent)}` : 
                              EUR(data.spent)
                            }
                          </div>
                          <div className="text-xs text-gray-500">{data.hours.toFixed(1)} uren</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Budget bewerken: {editingProject.name}</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Billing type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facturatie methode
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="hourly"
                      checked={editForm.billing_type === "hourly"}
                      onChange={(e) => setEditForm(f => ({ ...f, billing_type: e.target.value as "hourly" | "fixed" }))}
                      className="mr-2"
                    />
                    Op uurbasis
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="fixed"
                      checked={editForm.billing_type === "fixed"}
                      onChange={(e) => setEditForm(f => ({ ...f, billing_type: e.target.value as "hourly" | "fixed" }))}
                      className="mr-2"
                    />
                    Vaste honoraria per fase
                  </label>
                </div>
              </div>

              {/* Hourly rate */}
              {editForm.billing_type === "hourly" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Uurtarief (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.default_rate_euros}
                    onChange={(e) => setEditForm(f => ({ ...f, default_rate_euros: e.target.value }))}
                    className="w-32 border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </div>
              )}

              {/* Phase budgets */}
              {editForm.billing_type === "fixed" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget per fase (€)
                  </label>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-3">
                      {phases.map(phase => (
                        <div key={phase.code} className="flex items-center gap-2">
                          <span className="text-sm w-24 shrink-0">{phase.name}:</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            value={editForm.phase_budgets[phase.code] || ""}
                            onChange={(e) => 
                              setEditForm(f => ({
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
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Annuleren
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={updateProjectMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
              >
                {updateProjectMutation.isPending ? "Opslaan..." : "Opslaan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}