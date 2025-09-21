import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useIdeas(limit = 5) {
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

export function useCreateIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; note?: string; tags?: string[]; priority?: number }) => {
      const { data, error } = await supabase
        .from("ideas")
        .insert({
          title: payload.title,
          note: payload.note ?? null,
          tags: payload.tags ?? [],
          priority: payload.priority ?? 0,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ideas"] });
    },
  });
}
