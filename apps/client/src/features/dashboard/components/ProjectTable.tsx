import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "react-router-dom";

type Project = {
  id: string;
  name: string;
  city: string | null;
  client_name: string | null;
  default_rate: number; // in jouw tabel heet dit 'default_rate' (centen of euro?)
  status: string;       // 'active' bij jou
  // total_hours?: number; // kun je later via view/join toevoegen
};

export default function ProjectTable({ limit = 5 }: { limit?: number }) {
  const { data, isLoading, isError } = useQuery<Project[]>({
    queryKey: ["projects", { limit }],
    queryFn: () => apiRequest(`/projects?limit=${limit}`),
  });

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <header className="flex items-center justify-between px-4 pt-4">
        <h3 className="text-sm font-semibold text-slate-900">Projecten</h3>
        <Link to="/budgets" className="text-xs text-indigo-600">
          Alle
        </Link>
      </header>

      <div className="p-4">
        {isLoading && <div className="h-24 animate-pulse bg-slate-100 rounded-xl" />}
        {isError && <div className="text-sm text-red-600">Kan projecten niet laden.</div>}

        {!isLoading && !isError && (!data || data.length === 0) && (
          <div className="text-sm text-slate-500">Nog geen projecten.</div>
        )}

        {!isLoading && !isError && data && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-4">Project</th>
                  <th className="py-2 pr-4">Stad</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-0 text-right">Tarief</th>
                </tr>
              </thead>
              <tbody>
                {data.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="py-2 pr-4">{p.name}</td>
                    <td className="py-2 pr-4">{p.city ?? "-"}</td>
                    <td className="py-2 pr-4 capitalize">{p.status ?? "-"}</td>
                    <td className="py-2 pr-0 text-right">
                      {/* Als 'default_rate' in centen is → (p.default_rate/100).toFixed(2) */}
                      €{" "}
                      {Number.isFinite(p.default_rate)
                        ? p.default_rate.toLocaleString("nl-NL")
                        : "-"}
                      ,-
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
