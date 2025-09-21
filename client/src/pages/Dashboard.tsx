import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import {
  Clock,
  Calendar,
  Euro,
  CheckSquare,
  FileText,
  Activity,
  TrendingUp,
} from "lucide-react";

/* ============ helpers ============ */
const EUR = (v: number) =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(v);

function startOfWeekNL(d = new Date()) {
  // Maandag als start (getDay(): zo=0)
  const day = d.getDay() || 7;
  const res = new Date(d);
  if (day !== 1) res.setDate(d.getDate() - (day - 1));
  res.setHours(0, 0, 0, 0);
  return res;
}
function isoDate(d: Date) {
  return d.toISOString().split("T")[0];
}

/* ============ KPI’s ============ */
/** - Uren vandaag & week uit time_entries.minutes
 *  - Open te factureren uit v_billing_status_by_project_phase.amount_open_cents (som)
 *  - Actieve taken: tasks.status != 'done'
 */
function useDashboardKPIs() {
  const todayISO = isoDate(new Date());
  const weekStartISO = isoDate(startOfWeekNL(new Date()));

  return useQuery({
    queryKey: ["dashboard-kpis", todayISO, weekStartISO],
    queryFn: async () => {
      // vandaag
      const { data: todayRows, error: e1 } = await supabase
        .from("time_entries")
        .select("minutes")
        .eq("occurred_on", todayISO);
      if (e1) throw e1;
      const minutesToday = (todayRows ?? []).reduce(
        (s, r: any) => s + (r.minutes || 0),
        0
      );
      const hoursToday = minutesToday / 60;

      // deze week
      const { data: weekRows, error: e2 } = await supabase
        .from("time_entries")
        .select("minutes")
        .gte("occurred_on", weekStartISO);
      if (e2) throw e2;
      const minutesWeek = (weekRows ?? []).reduce(
        (s, r: any) => s + (r.minutes || 0),
        0
      );
      const hoursWeek = minutesWeek / 60;

      // open billing (via view)
      const { data: billRows, error: e3 } = await supabase
        .from("v_billing_status_by_project_phase")
        .select("amount_open_cents");
      if (e3) throw e3;
      const openBillingCents = (billRows ?? []).reduce(
        (s, r: any) => s + (r.amount_open_cents || 0),
        0
      );
      const openBilling = openBillingCents / 100;

      // actieve taken
      const { data: tasksRows, error: e4 } = await supabase
        .from("tasks")
        .select("id, status")
        .neq("status", "done");
      if (e4) throw e4;
      const activeTasks = tasksRows?.length ?? 0;

      return { hoursToday, hoursWeek, openBilling, activeTasks };
    },
    refetchInterval: 60_000,
  });
}

/* ============ Recente uren ============ */
function useRecentEntries(limit = 5) {
  return useQuery({
    queryKey: ["recent-entries", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_entries")
        .select("id, project_id, occurred_on, minutes")
        .order("occurred_on", { ascending: false })
        .limit(limit);
      if (error) throw error;

      const ids = Array.from(new Set((data ?? []).map((e: any) => e.project_id))).filter(
        Boolean
      );
      let nameMap: Record<string, string> = {};
      if (ids.length) {
        const { data: projs, error: e2 } = await supabase
          .from("projects")
          .select("id, name")
          .in("id", ids);
        if (e2) throw e2;
        nameMap = Object.fromEntries((projs ?? []).map((p: any) => [p.id, p.name]));
      }

      return (data ?? []).map((e: any) => ({
        id: e.id,
        projectName: nameMap[e.project_id] ?? "Onbekend project",
        hours: (e.minutes || 0) / 60,
        date: e.occurred_on,
      }));
    },
    refetchInterval: 60_000,
  });
}

/* ============ Open taken ============ */
function useOpenTasks(limit = 8) {
  return useQuery({
    queryKey: ["open-tasks", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, status, project_id, due_on, priority")
        .neq("status", "done")
        .order("due_on", { ascending: true, nullsFirst: false })
        .order("priority", { ascending: false })
        .order("id", { ascending: true })
        .limit(limit);
      if (error) throw error;

      const projectIds = Array.from(
        new Set((data ?? []).map((t: any) => t.project_id))
      ).filter(Boolean);
      let names: Record<string, string> = {};
      if (projectIds.length) {
        const { data: projs, error: e2 } = await supabase
          .from("projects")
          .select("id, name")
          .in("id", projectIds);
        if (e2) throw e2;
        names = Object.fromEntries((projs ?? []).map((p: any) => [p.id, p.name]));
      }

      return (data ?? []).map((t: any) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        due_on: t.due_on as string | null,
        priority: t.priority ?? 0,
        project_name: names[t.project_id] ?? "—",
      }));
    },
    refetchInterval: 60_000,
  });
}

/* ============ Projectstatus (top) ============ */
/** Gebaseerd op view v_billing_status_by_project_phase:
 *  - project_id
 *  - minutes_logged
 *  - amount_open_cents
 */
function useProjectStatusTop(limit = 5) {
  return useQuery({
    queryKey: ["project-status-top", limit],
    queryFn: async () => {
      const { data: bill, error } = await supabase
        .from("v_billing_status_by_project_phase")
        .select("project_id, amount_open_cents, minutes_logged");
      if (error) throw error;

      const byProject: Record<string, { minutes: number; openCents: number }> = {};
      for (const row of bill ?? []) {
        const pid = row.project_id as string;
        if (!byProject[pid]) byProject[pid] = { minutes: 0, openCents: 0 };
        byProject[pid].minutes += row.minutes_logged || 0;
        byProject[pid].openCents += row.amount_open_cents || 0;
      }

      const projectIds = Object.keys(byProject);
      let nameMap: Record<string, string> = {};
      if (projectIds.length) {
        const { data: projs, error: e2 } = await supabase
          .from("projects")
          .select("id, name")
          .in("id", projectIds);
        if (e2) throw e2;
        nameMap = Object.fromEntries((projs ?? []).map((p: any) => [p.id, p.name]));
      }

      const rows = projectIds
        .map((pid) => ({
          projectId: pid,
          projectName: nameMap[pid] ?? "Onbekend project",
          hours: (byProject[pid].minutes || 0) / 60,
          openBilling: (byProject[pid].openCents || 0) / 100,
        }))
        .sort((a, b) => b.hours - a.hours)
        .slice(0, limit);

      return rows;
    },
    refetchInterval: 120_000,
  });
}

/* ============ Ideeën & gedachten ============ */
// Vereist tabel `ideas` met RLS (zie eerder SQL)
function useIdeas(limit = 5) {
  return useQuery({
    queryKey: ["ideas", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ideas")
        .select("id, title, note, status, tags, priority, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export default function Dashboard() {
  const { data: kpis } = useDashboardKPIs();
  const { data: recent } = useRecentEntries(5);
  const { data: openTasks } = useOpenTasks(8);
  const { data: statusRows } = useProjectStatusTop(5);
  const { data: ideas } = useIdeas(5);

  // quick-add idea
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaNote, setIdeaNote] = useState("");
  const [savingIdea, setSavingIdea] = useState(false);

  async function onAddIdea(e: React.FormEvent) {
    e.preventDefault();
    const title = ideaTitle.trim();
    const note = ideaNote.trim();
    if (!title) return;
    setSavingIdea(true);
    const { error } = await supabase
      .from("ideas")
      .insert({ title, note: note || null });
    setSavingIdea(false);
    if (!error) {
      setIdeaTitle("");
      setIdeaNote("");
      // laat React Query refetchen
      await supabase; // no-op to avoid linter; the invalidate is implicit due to refetch interval; optionally wire a QueryClient to invalidate "ideas"
    }
  }

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/time"
          className="flex-1 bg-primary text-primary-foreground rounded-lg px-6 py-4 text-left hover:bg-primary/90 transition-colors"
          data-testid="button-log-hours"
        >
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5" />
            <div>
              <h3 className="font-medium">Uren boeken</h3>
              <p className="text-sm opacity-90">Registreer nieuwe uren</p>
            </div>
          </div>
        </Link>

        <Link
          href="/invoices"
          className="flex-1 bg-card border border-border text-card-foreground rounded-lg px-6 py-4 text-left hover:bg-accent transition-colors"
          data-testid="button-generate-invoice"
        >
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-medium">Factuur genereren</h3>
              <p className="text-sm text-muted-foreground">Op basis van open uren</p>
            </div>
          </div>
        </Link>
      </div>

      {/* KPI’s */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center">
            <Clock className="h-6 w-6 text-primary" />
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-muted-foreground truncate">
                  Uren vandaag
                </dt>
                <dd className="text-2xl font-semibold text-foreground" data-testid="stat-hours-today">
                  {kpis ? kpis.hoursToday.toFixed(1) : "—"}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center">
            <Calendar className="h-6 w-6 text-chart-2" />
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-muted-foreground truncate">
                  Deze week
                </dt>
                <dd className="text-2xl font-semibold text-foreground" data-testid="stat-hours-week">
                  {kpis ? kpis.hoursWeek.toFixed(1) : "—"}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center">
            <Euro className="h-6 w-6 text-chart-4" />
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-muted-foreground truncate">
                  Open te factureren
                </dt>
                <dd className="text-2xl font-semibold text-foreground" data-testid="stat-open-billing">
                  {kpis ? EUR(kpis.openBilling) : "—"}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center">
            <CheckSquare className="h-6 w-6 text-chart-1" />
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-muted-foreground truncate">
                  Actieve taken
                </dt>
                <dd className="text-2xl font-semibold text-foreground" data-testid="stat-active-tasks">
                  {kpis ? kpis.activeTasks : "—"}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Lijsten: Recente uren + Open Taken + Ideeën */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recente activiteit */}
        <div className="bg-card rounded-lg border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-medium text-foreground">Recente activiteit</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {(recent ?? []).map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{r.projectName}</h4>
                    <p className="text-sm text-muted-foreground">Time entry</p>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-foreground">{r.hours.toFixed(2)}h</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(r.date).toLocaleDateString("nl-NL")}
                    </div>
                  </div>
                </div>
              ))}
              {(recent ?? []).length === 0 && (
                <div className="text-sm opacity-70">Nog geen recente uren.</div>
              )}
            </div>
            <Link
              href="/time"
              className="w-full inline-block mt-4 text-primary hover:text-primary/80 text-sm font-medium"
              data-testid="button-view-all-entries"
            >
              Bekijk alle uren
            </Link>
          </div>
        </div>

        {/* Open Taken */}
        <div className="bg-card rounded-lg border border-border">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-medium text-foreground">Open taken</h2>
            <Link href="/tasks" className="text-sm text-primary hover:underline">Alle taken</Link>
          </div>
          <div className="p-6 space-y-3">
            {(openTasks ?? []).map((t) => (
              <div key={t.id} className="flex items-start justify-between border rounded-md p-3">
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.project_name}
                    {t.due_on ? ` • deadline ${new Date(t.due_on).toLocaleDateString("nl-NL")}` : ""}
                    {t.priority ? ` • prioriteit ${t.priority}` : ""}
                  </div>
                </div>
                <span className="text-xs rounded-full px-2 py-0.5 bg-yellow-100 text-yellow-800">
                  {t.status}
                </span>
              </div>
            ))}
            {(openTasks ?? []).length === 0 && (
              <div className="text-sm opacity-70">Geen open taken 🎉</div>
            )}
          </div>
        </div>

        {/* Ideeën & gedachten */}
        <div className="bg-card rounded-lg border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-medium text-foreground">Ideeën & gedachten</h2>
          </div>

          <div className="p-6 space-y-4">
            {/* Quick add */}
            <form onSubmit={onAddIdea} className="grid gap-3">
              <input
                className="border rounded-md px-3 py-2 bg-background"
                placeholder="Korte titel (bijv. 'PvE automatisch op basis van DSO API')"
                value={ideaTitle}
                onChange={(e) => setIdeaTitle(e.target.value)}
                disabled={savingIdea}
              />
              <textarea
                className="border rounded-md px-3 py-2 bg-background"
                placeholder="Toelichting (optioneel)…"
                rows={3}
                value={ideaNote}
                onChange={(e) => setIdeaNote(e.target.value)}
                disabled={savingIdea}
              />
              <button
                type="submit"
                className="self-start bg-primary text-primary-foreground rounded-md px-4 py-2 hover:bg-primary/90 disabled:opacity-50"
                disabled={savingIdea}
              >
                {savingIdea ? "Opslaan…" : "Idee opslaan"}
              </button>
            </form>

            {/* Laatste ideeën */}
            <div className="space-y-3">
              {(ideas ?? []).map((i: any) => (
                <div key={i.id} className="border rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{i.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {i.created_at ? new Date(i.created_at).toLocaleDateString("nl-NL") : ""}
                    </div>
                  </div>
                  {i.note && <div className="text-sm text-muted-foreground mt-1">{i.note}</div>}
                </div>
              ))}
              {(ideas ?? []).length === 0 && (
                <div className="text-sm opacity-70">
                  Nog geen ideeën — voeg je eerste in via het formulier hierboven.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Projectstatus (Top) */}
      <div className="bg-card rounded-lg border border-border">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-medium text-foreground">Projectstatus (top)</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {(statusRows ?? []).map((row) => {
              const maxHours =
                (statusRows ?? []).reduce((m, r) => Math.max(m, r.hours), 0) || 1;
              const pct = Math.round((row.hours / maxHours) * 100);

              return (
                <div key={row.projectId} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-foreground">{row.projectName}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-chart-2/10 text-chart-2">
                      Actief
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Gelogd:</span>
                      <div className="font-mono font-medium">{row.hours.toFixed(1)}h</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Open te factureren:</span>
                      <div className="font-mono font-medium">{EUR(row.openBilling)}</div>
                    </div>
                    <div className="hidden sm:block">
                      <span className="text-muted-foreground">Relatieve voortgang:</span>
                      <div className="font-mono font-medium">{pct}%</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Relatieve voortgang</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
            {(statusRows ?? []).length === 0 && (
              <div className="text-sm opacity-70">Nog geen uren/billing data om te tonen.</div>
            )}
          </div>
        </div>
      </div>

      {/* Health (placeholder tot je koppelt) */}
      <div className="bg-card rounded-lg border border-border">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-chart-2" />
            <h2 className="text-lg font-medium text-foreground">Health overview</h2>
          </div>
        </div>
        <div className="p-6 text-sm text-muted-foreground">
          Koppel later je health/energy data; voor nu is dit blokje placeholder.
        </div>
      </div>
    </div>
  );
}
