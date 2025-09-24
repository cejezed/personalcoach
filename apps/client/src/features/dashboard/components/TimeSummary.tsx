import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Calendar as CalendarIcon, Clock } from "lucide-react"; // ✅

type TimeEntry = {
  id: string;
  occurred_on: string; // 'YYYY-MM-DD'
  minutes: number;
};

function daysBackISO(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export default function TimeSummary({ days = 7 }: { days?: number }) {
  const { data, isLoading, isError } = useQuery<TimeEntry[]>({
    queryKey: ["time_entries", { days }],
  queryFn: () => apiRequest(`/time-entries?days=${days}`),
  });

  const { totalHours, bars } = useMemo(() => {
    // Init per dag (0=today back to days-1)
    const bucket = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) bucket.set(daysBackISO(i), 0);

    (data ?? []).forEach((e) => {
      const key = e.occurred_on?.slice(0, 10);
      if (bucket.has(key)) bucket.set(key, (bucket.get(key) || 0) + (e.minutes || 0));
    });

    const minutesPerDay = Array.from(bucket.values());
    const max = Math.max(1, ...minutesPerDay);
    const bars = minutesPerDay.map((m) => Math.round((m / max) * 100));
    const total = minutesPerDay.reduce((s, m) => s + m, 0);

    return { totalHours: (total / 60).toFixed(1), bars };
  }, [data, days]);

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <header className="flex items-center justify-between px-4 pt-4">
        <h3 className="text-sm font-semibold text-slate-900">
          Uren (laatste {days} dagen)
        </h3>
      </header>
      <div className="p-4">
        {isLoading && <div className="h-20 animate-pulse bg-slate-100 rounded-xl" />}
        {isError && <div className="text-sm text-red-600">Kan uren niet laden.</div>}

        {!isLoading && !isError && (
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-3xl font-bold">{totalHours} u</div>
              <div className="text-xs text-slate-500 mt-1">
                Inclusief alle projecten
              </div>
            </div>
            <div className="flex items-end gap-1 h-16">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="w-3 rounded bg-indigo-500/80"
                  style={{ height: `${Math.max(6, h)}%` }}
                  title={`Dag ${i + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
