// client/src/pages/Projecten.tsx
import * as React from "react";
import { useProjects, useCreateProject, useDeleteProject } from "@/features/projects/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2 } from "lucide-react";

function eur(v?: number) {
  if (v == null || Number.isNaN(v)) return "";
  return `€${v.toFixed(2)}`;
}

export default function ProjectenPage() {
  const { data, isLoading, error } = useProjects();
  const create = useCreateProject();
  const del = useDeleteProject();

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [hourlyRate, setHourlyRate] = React.useState<string>("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(
      { 
        name, 
        description, 
        // houd API en UI consistent: API verwacht hourly_rate in euro's (number)
        hourly_rate: hourlyRate ? Number(hourlyRate) : undefined 
      },
      { onSuccess: () => { setName(""); setDescription(""); setHourlyRate(""); } }
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Projecten</h1>

      <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border p-4">
        <div>
          <label className="text-sm">Naam</label>
          <Input 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Bijv. Villa Muiderbos" 
            required 
            disabled={create.isPending}
          />
        </div>
        <div>
          <label className="text-sm">Omschrijving</label>
          <Textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            placeholder="Korte toelichting" 
            disabled={create.isPending}
          />
        </div>
        <div>
          <label className="text-sm">Uurtarief (€)</label>
          <Input 
            type="number" 
            step="0.01" 
            value={hourlyRate} 
            onChange={(e) => setHourlyRate(e.target.value)} 
            placeholder="Bijv. 110" 
            disabled={create.isPending}
          />
        </div>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Project toevoegen
        </Button>
      </form>

      <div className="space-y-2">
        {isLoading && <div className="text-sm opacity-70">Laden…</div>}
        {error && <div className="text-sm text-red-600">{String(error)}</div>}

        {data?.map((p: any) => {
          // Verwacht p.hourly_rate (snake_case) en evt. p.status; geef fallback
          const status = p.status ?? "actief";
          const rate = typeof p.hourly_rate === "number" ? p.hourly_rate : undefined;

          return (
            <div key={p.id} className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <div className="font-medium">{p.name}</div>
                {p.description && <div className="text-sm opacity-80">{p.description}</div>}
                <div className="text-xs opacity-60">
                  {status}{rate != null ? ` • ${eur(rate)}/uur` : ""}
                </div>
              </div>
              <Button 
                variant="ghost" 
                type="button" 
                onClick={() => del.mutate(p.id)} 
                title="Verwijderen"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}

        {!isLoading && (data?.length ?? 0) === 0 && (
          <div className="text-sm opacity-70">Nog geen projecten. Voeg de eerste toe hierboven.</div>
        )}
      </div>
    </div>
  );
}
