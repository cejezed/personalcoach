// apps/client/src/features/dashboard/hooks/useTimeEntries.ts
import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/queryClient";

export type TimeEntry = {
  id: string;
  occurred_on: string;
  minutes: number;
  project_id: string;
  phase_code: string;
};

export function useTimeEntries(params: { days?: number; project_id?: string; from?: string; to?: string } = {}) {
  const q = new URLSearchParams();
  if (params.days) q.set("days", String(params.days));
  if (params.project_id) q.set("project_id", params.project_id);
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  const qs = q.toString();
  return useQuery<TimeEntry[]>({
    queryKey: ["time_entries", params],
    queryFn: () => getJson<TimeEntry[]>(`/time_entries${qs ? `?${qs}` : ""}`),
  });
}
