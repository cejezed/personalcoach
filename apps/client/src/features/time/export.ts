import { EUR } from "./money"; // optioneel; of inline formatter

export function exportTimeCSV() {
  // verwacht dat je Time-entries via API ophaalt op /api/time_entries (desnoods maak hier ook een fetch)
  fetch(`${import.meta.env.VITE_API_BASE_URL ?? ""}/api/time_entries?days=365`)
    .then((r) => r.json())
    .then((timeEntries) => {
      const headers = ["Project","Fase","Datum","Uren","Omschrijving","Uurtarief","Bedrag"];
      const rows = (timeEntries ?? []).map((e: any) => {
        const prj = e.projects || e.project;
        const ph = e.phases || e.phase;
        const hours = e.minutes ? e.minutes / 60 : e.hours || 0;
        const rate = (prj?.default_rate_cents || 0) / 100;
        const bedrag = hours * rate;
        const fmt = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
        return [
          prj?.name || "Onbekend",
          ph?.name || e.phase_code,
          e.occurred_on,
          hours.toFixed(2),
          e.notes || "",
          fmt.format(rate),
          fmt.format(bedrag),
        ];
      });

      const csv = [headers, ...rows]
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `urenexport-${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
}
