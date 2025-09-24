// apps/client/src/features/dashboard/hooks/useProjects.ts
import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/queryClient";

export type Project = {
  id: string;
  name: string;
  city: string | null;
  client_name: string | null;
  default_rate_cents: number;
  archived: boolean;
  created_at: string;
};

export function useProjects(limit = 5) {
  return useQuery<Project[]>({
    queryKey: ["projects", { limit }],
    queryFn: () => getJson<Project[]>(`/projects?limit=${limit}`),
  });
}
