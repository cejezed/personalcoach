import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

type Project = {
  id: string;
    name: string;
      description: string | null;
        status: "active" | "on_hold" | "done" | "archived";
          hourlyRate: string | null;
          };

          function useProjects(status: Project["status"] = "active") {
            return useQuery<Project[]>({
                queryKey: ["projects", status],
                    queryFn: () => api(`/api/projects?status=${status}`),
                      });
                      }

                      function useCreateProject() {
                        const qc = useQueryClient();
                          return useMutation({
                              mutationFn: (payload: { name: string; description?: string; hourly_rate?: number }) =>
                                    api<Project>("/api/projects", { method: "POST", body: JSON.stringify(payload) }),
                                        onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
                                          });
                                          }

                                          function useArchiveProject() {
                                            const qc = useQueryClient();
                                              return useMutation({
                                                  mutationFn: (id: string) => api<{ ok: true }>(`/api/projects/${id}`, { method: "DELETE" }),
                                                      onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
                                                        });
                                                        }

                                                        function useRestoreProject() {
                                                          const qc = useQueryClient();
                                                            return useMutation({
                                                                mutationFn: (id: string) => api<Project>(`/api/projects/${id}/restore`, { method: "PATCH" }),
                                                                    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
                                                                      });
                                                                      }

                                                                      export default function Projecten() {
                                                                        const [status, setStatus] = React.useState<Project["status"]>("active");
                                                                          const { data, isLoading, error } = useProjects(status);
                                                                            const create = useCreateProject();
                                                                              const archive = useArchiveProject();
                                                                                const restore = useRestoreProject();

                                                                                  const [name, setName] = React.useState("");
                                                                                    const [description, setDescription] = React.useState("");
                                                                                      const [hourly, setHourly] = React.useState("");

                                                                                        const submit = (e: React.FormEvent) => {
                                                                                            e.preventDefault();
                                                                                                create.mutate(
                                                                                                      { name, description: description || undefined, hourly_rate: hourly ? Number(hourly) : undefined },
                                                                                                            { onSuccess: () => { setName(""); setDescription(""); setHourly(""); } }
                                                                                                                );
                                                                                                                  };

                                                                                                                    return (
                                                                                                                        <div>
                                                                                                                              <div className="card">
                                                                                                                                      <h2>Nieuw project</h2>
                                                                                                                                              <form onSubmit={submit}>
                                                                                                                                                        <label>Naam</label>
                                                                                                                                                                  <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Bijv. Villa Muiderbos" />
                                                                                                                                                                            <label>Omschrijving</label>
                                                                                                                                                                                      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Korte toelichting" />
                                                                                                                                                                                                <label>Uurtarief (€)</label>
                                                                                                                                                                                                          <input type="number" step="0.01" value={hourly} onChange={(e) => setHourly(e.target.value)} placeholder="Bijv. 110" />
                                                                                                                                                                                                                    <div style={{ marginTop: 8 }}>
                                                                                                                                                                                                                                <button type="submit" disabled={create.isPending}>{create.isPending ? "Toevoegen…" : "Project toevoegen"}</button>
                                                                                                                                                                                                                                          </div>
                                                                                                                                                                                                                                                  </form>
                                                                                                                                                                                                                                                        </div>

                                                                                                                                                                                                                                                              <div className="nav">
                                                                                                                                                                                                                                                                      {(["active","on_hold","done","archived"] as const).map(s => (
                                                                                                                                                                                                                                                                                <button key={s} className={status===s ? "" : "ghost"} onClick={() => setStatus(s)}>
                                                                                                                                                                                                                                                                                            {s === "active" ? "Actief" : s === "on_hold" ? "On hold" : s === "done" ? "Afgerond" : "Archief"}
                                                                                                                                                                                                                                                                                                      </button>
                                                                                                                                                                                                                                                                                                              ))}
                                                                                                                                                                                                                                                                                                                    </div>

                                                                                                                                                                                                                                                                                                                          {isLoading && <div>Laden…</div>}
                                                                                                                                                                                                                                                                                                                                {error && <div style={{ color: "crimson" }}>{String(error)}</div>}

                                                                                                                                                                                                                                                                                                                                      {data?.map(p => (
                                                                                                                                                                                                                                                                                                                                              <div key={p.id} className="card">
                                                                                                                                                                                                                                                                                                                                                        <div className="row" style={{ justifyContent: "space-between" }}>
                                                                                                                                                                                                                                                                                                                                                                    <div>
                                                                                                                                                                                                                                                                                                                                                                                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                                                                                                                                                                                                                                                                                                                                                                                                {p.description && <div className="badge">{p.description}</div>}
                                                                                                                                                                                                                                                                                                                                                                                                              <div className="badge">{p.status}{p.hourlyRate ? ` • €${p.hourlyRate}/uur` : ""}</div>
                                                                                                                                                                                                                                                                                                                                                                                                                          </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                      {p.status === "archived" ? (
                                                                                                                                                                                                                                                                                                                                                                                                                                                    <button className="ghost" onClick={() => restore.mutate(p.id)}>Herstellen</button>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                ) : (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                              <button className="ghost" onClick={() => archive.mutate(p.id)}>Archiveer</button>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          )}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  ))}

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        {!isLoading && (data?.length ?? 0) === 0 && <div className="badge">Geen projecten in deze lijst.</div>}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              );
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              