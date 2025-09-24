import React from "react";
import { CheckCircle2, Circle, AlertTriangle, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { useTasks } from "../hooks/useTasks";

export default function TaskList({
  limit = 6,
  project_id,
  status,
}: { limit?: number; project_id?: string; status?: string }) {
  const { data, isLoading, isError } = useTasks({ project_id, status });

  const list = (data ?? []).slice(0, limit);

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <header className="flex items-center justify-between px-4 pt-4">
        <h3 className="text-sm font-semibold text-slate-900">Open taken</h3>
        <Link to="/tasks" className="text-xs text-indigo-600">Alle</Link>
      </header>
      <div className="p-4">
        {isLoading && <div className="h-24 animate-pulse bg-slate-100 rounded-xl" />}
        {isError && <div className="text-sm text-red-600">Kan taken niet laden.</div>}
        {!isLoading && !isError && list.length === 0 && (
          <div className="text-sm text-slate-500">Geen taken gevonden.</div>
        )}

        {list.map((t) => {
          const done = t.status === "done";
          const overdue = t.due_date
            ? new Date(t.due_date) < new Date(new Date().toDateString())
            : false;

          return (
            <div key={t.id} className="py-2 border-t first:border-t-0 border-slate-100">
              <div className="flex items-center gap-2 min-w-0">
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className={`text-sm truncate ${done ? "line-through text-slate-400" : "text-slate-900"}`} title={t.title}>
                    {t.title}
                  </div>

                  {/* project badge + meta */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    {t.projects?.name && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100">
                        <MapPin className="h-3 w-3" />
                        {t.projects.name}
                        {t.projects.city ? ` · ${t.projects.city}` : ""}
                      </span>
                    )}
                    {t.due_date && (
                      <span className={overdue && !done ? "text-red-600" : ""}>
                        due {new Date(t.due_date).toLocaleDateString("nl-NL")}
                      </span>
                    )}
                    <span className="opacity-70">prio {t.priority}</span>
                    {overdue && !done && (
                      <span className="inline-flex items-center gap-1 text-red-600">
                        <AlertTriangle className="h-3 w-3" /> overdue
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
