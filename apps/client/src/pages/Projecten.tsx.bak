import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building, MapPin, User, Euro, Archive, RotateCcw, Plus } from "lucide-react";
import { getJson, postJson, apiJson } from "@/lib/queryClient";

type Project = {
  id: string;
  name: string;
  city: string | null;
  client_name: string | null;
  default_rate_cents: number | null;
  archived: boolean;
  archived_at?: string | null;
  created_at: string;
  status?: string | null;
};

function rateStr(cents?: number | null) {
  if (!Number.isFinite(cents as number)) return "—";
  return `€${Math.round((cents as number) / 100)}/uur`;
}
function dateNL(s: string | null | undefined) {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(+d)) return "—";
  return d.toLocaleDateString("nl-NL");
}

export default function Projecten() {
  const qc = useQueryClient();

  // UI state
  const [showArchived, setShowArchived] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    client_name: "",
    default_rate_euros: "85",
  });

  // Data ophalen (server geeft alleen gevraagde status terug)
  const { data, isLoading, isError } = useQuery<{
    data: Project[];
    count: number;
    limit: number;
    offset: number;
  }>({
    queryKey: ["projects", { archived: showArchived }],
    queryFn: () =>
      getJson(`/projects?archived=${showArchived ? "true" : "false"}&order=created_at&dir=desc&limit=60`),
    staleTime: 30_000,
  });

  const projects = useMemo<Project[]>(() => data?.data ?? [], [data]);

  // Mutations
  const createProject = useMutation({
    mutationFn: async () => {
      const payload = {
        name: formData.name.trim(),
        city: formData.city.trim() || null,
        client_name: formData.client_name.trim() || null,
        default_rate_cents: Math.round((parseFloat(formData.default_rate_euros || "0") || 0) * 100),
        archived: false,
        status: "active",
      };
      return postJson<Project>("/projects", payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      setShowForm(false);
      setFormData({ name: "", city: "", client_name: "", default_rate_euros: "85" });
    },
  });

  const toggleArchive = useMutation({
    mutationFn: async ({ id, archive }: { id: string; archive: boolean }) => {
      return apiJson<Project>("PATCH", `/projects/${id}`, {
        archived: archive,
        archived_at: archive ? new Date().toISOString() : null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Projecten</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nieuw project
        </button>
      </div>

      {/* Form: nieuw project */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Nieuw project toevoegen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Projectnaam *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Projectnaam"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Woonplaats</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Amsterdam, Haarlem, …"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Opdrachtgever</label>
              <input
                type="text"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                placeholder="BV Vastgoed, Familie Jansen, …"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Standaard uurtarief (€)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.default_rate_euros}
                onChange={(e) => setFormData({ ...formData, default_rate_euros: e.target.value })}
                placeholder="85"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">Wordt opgeslagen als cents (×100) in de database.</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowForm(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg"
              type="button"
            >
              Annuleren
            </button>
            <button
              onClick={() => createProject.mutate()}
              disabled={!formData.name.trim() || createProject.isPending}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg"
              type="button"
            >
              {createProject.isPending ? "Toevoegen…" : "Project toevoegen"}
            </button>
          </div>
        </div>
      )}

      {/* Tabs: actief / archief */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowArchived(false)}
          className={`px-4 py-2 rounded-lg ${!showArchived ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
        >
          Actieve projecten ({!isLoading && !isError ? projects.length : "…"})
        </button>
        <button
          onClick={() => setShowArchived(true)}
          className={`px-4 py-2 rounded-lg ${showArchived ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
        >
          Gearchiveerd ({showArchived && !isLoading && !isError ? projects.length : "…"})
        </button>
      </div>

      {/* Status */}
      {isError && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded p-3 text-sm">Kan projecten niet laden.</div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 bg-gray-100 animate-pulse rounded-lg border" />
          ))}

        {!isLoading &&
          projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2 truncate">{project.name}</h3>

                  {project.city && (
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <MapPin className="w-4 h-4 mr-1 shrink-0" />
                      <span className="truncate">{project.city}</span>
                    </div>
                  )}

                  {project.client_name && (
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <User className="w-4 h-4 mr-1 shrink-0" />
                      <span className="truncate">{project.client_name}</span>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Euro className="w-4 h-4 mr-1 shrink-0" />
                    {rateStr(project.default_rate_cents)}
                  </div>

                  <div className="text-xs text-gray-500">Aangemaakt: {dateNL(project.created_at)}</div>
                </div>

                <div className="flex flex-col gap-2 ml-3">
                  {project.archived ? (
                    <button
                      onClick={() => toggleArchive.mutate({ id: project.id, archive: false })}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                      title="Project herstellen"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Herstel
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleArchive.mutate({ id: project.id, archive: true })}
                      className="flex items-center gap-1 text-gray-600 hover:text-gray-800 text-sm"
                      title="Project archiveren"
                    >
                      <Archive className="w-4 h-4" />
                      Archiveer
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    project.archived ? "bg-gray-100 text-gray-800" : "bg-green-100 text-green-800"
                  }`}
                >
                  {project.archived ? "Gearchiveerd" : "Actief"}
                </span>
              </div>
            </div>
          ))}
      </div>

      {/* Leeg state */}
      {!isLoading && projects.length === 0 && (
        <div className="text-center py-12">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-500 mb-2">
            {showArchived ? "Geen gearchiveerde projecten" : "Nog geen actieve projecten"}
          </div>
          {!showArchived && (
            <button onClick={() => setShowForm(true)} className="text-blue-600 hover:text-blue-800">
              Voeg je eerste project toe
            </button>
          )}
        </div>
      )}
    </div>
  );
}
