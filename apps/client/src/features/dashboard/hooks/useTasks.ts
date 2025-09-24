// apps/client/src/features/dashboard/hooks/useTasks.ts
import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/queryClient";

export type TaskRow = {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done" | "cancelled";
  priority: number;
  due_date: string | null;
  created_at: string;
  project_id: string | null;
  projects?: { name?: string | null; city?: string | null; client_name?: string | null } | null;
};

export function useTasks(params: { project_id?: string; status?: string } = {}) {
  const q = new URLSearchParams();
  if (params.project_id) q.set("project_id", params.project_id);
  if (params.status) q.set("status", params.status);
  const qs = q.toString();
  return useQuery<TaskRow[]>({
    queryKey: ["tasks", params],
    queryFn: () => getJson<TaskRow[]>(`/tasks${qs ? `?${qs}` : ""}`),
    staleTime: 30_000,
  });
}
