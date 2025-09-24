import React, { useState, useEffect, useRef } from "react";
import {
  Download,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  X,
  Calendar as CalendarIcon,
  Clock,
} from "lucide-react";

/* -------------------- Types -------------------- */
type ImportResult = {
  success: boolean;
  message: string;
  imported?: number;
  errors?: string[];
};

type CalendarEvent = {
  summary: string;
  start: string;   // ISO string
  end: string;     // ISO string
  location?: string;
};

/* -------------------- ICS helpers -------------------- */
function parseICalDate(v: string): Date {
  const tzSplit = v.split(":");
  const val = tzSplit.length > 1 ? tzSplit[1] : tzSplit[0];
  const clean = val.replace(/;VALUE=DATE/g, "");
  if (clean.endsWith("Z")) {
    const iso =
      clean.slice(0, 4) +
      "-" +
      clean.slice(4, 6) +
      "-" +
      clean.slice(6, 8) +
      "T" +
      clean.slice(9, 11) +
      ":" +
      clean.slice(11, 13) +
      ":" +
      clean.slice(13, 15) +
      "Z";
    return new Date(iso);
  }
  if (/^\d{8}T\d{6}$/.test(clean)) {
    const iso =
      clean.slice(0, 4) +
      "-" +
      clean.slice(4, 6) +
      "-" +
      clean.slice(6, 8) +
      "T" +
      clean.slice(9, 11) +
      ":" +
      clean.slice(11, 13) +
      ":" +
      clean.slice(13, 15);
    return new Date(iso);
  }
  if (/^\d{8}$/.test(clean)) {
    const iso =
      clean.slice(0, 4) + "-" + clean.slice(4, 6) + "-" + clean.slice(6, 8);
    return new Date(iso + "T00:00:00");
  }
  return new Date(clean);
}

function parseICS(text: string): CalendarEvent[] {
  const lines = text.split(/\r?\n/);
  const events: CalendarEvent[] = [];
  let inEvent = false;
  let cur: Partial<CalendarEvent & { rawStart?: string; rawEnd?: string }> = {};

  for (const line of lines) {
    if (line.startsWith("BEGIN:VEVENT")) {
      inEvent = true;
      cur = {};
      continue;
    }
    if (line.startsWith("END:VEVENT")) {
      if (cur.rawStart && cur.rawEnd) {
        const start = parseICalDate(cur.rawStart).toISOString();
        const end = parseICalDate(cur.rawEnd).toISOString();
        events.push({
          summary: cur.summary || "(geen titel)",
          start,
          end,
          location: cur.location,
        });
      }
      inEvent = false;
      cur = {};
      continue;
    }
    if (!inEvent) continue;

    if (line.startsWith("SUMMARY")) {
      const [, val = ""] = line.split(":");
      cur.summary = val.trim();
    } else if (line.startsWith("DTSTART")) {
      cur.rawStart = line.replace(/^DTSTART(;[^:]*)?:/, "");
    } else if (line.startsWith("DTEND")) {
      cur.rawEnd = line.replace(/^DTEND(;[^:]*)?:/, "");
    } else if (line.startsWith("LOCATION")) {
      const [, val = ""] = line.split(":");
      cur.location = val.trim();
    }
  }
  return events;
}

/* -------------------- Component -------------------- */
export default function Settings() {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const [importData, setImportData] = useState<any[]>([]);
  const [showImportPreview, setShowImportPreview] = useState(false);

  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState("");

  // Calendar import UI state
  const [showCalendarPreview, setShowCalendarPreview] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  // <-- nieuw: ref voor .ics input
  const icsInputRef = useRef<HTMLInputElement>(null);

  /* ---------- Data loaders ---------- */
  const loadProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects((data || []).filter((p: any) => !p.archived));
    } catch (e) {
      console.error("Failed to load projects:", e);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  /* ---------- Export helpers ---------- */
  const exportTimeCSV = async () => {
    try {
      const response = await fetch("/api/time-entries");
      const timeEntries = await response.json();

      const headers = [
        "Project",
        "Fase",
        "Datum",
        "Uren",
        "Omschrijving",
        "Uurtarief",
        "Bedrag",
      ];
      const csvRows = timeEntries.map((entry: any) => [
        entry.project?.name || "Onbekend",
        entry.phase?.name || entry.phase_code,
        entry.occurred_on,
        entry.minutes ? (entry.minutes / 60).toFixed(2) : "0",
        entry.notes || "",
        entry.project?.default_rate_cents
          ? (entry.project.default_rate_cents / 100).toFixed(2)
          : "0",
        entry.project?.default_rate_cents
          ? (
              ((entry.minutes || 0) / 60) *
              (entry.project.default_rate_cents / 100)
            ).toFixed(2)
          : "0",
      ] as const);

      const csvContent = [headers, ...csvRows]
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `urenexport-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Er ging iets mis bij het exporteren");
    }
  };

  const exportProjectsExcel = async () => {
    try {
      const [projectsRes, entriesRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/time-entries"),
      ]);

      const projects = await projectsRes.json();
      const entries = await entriesRes.json();

      const workbookData = {
        projects: projects.map((p: any) => ({
          "Project ID": p.id,
          Naam: p.name,
          Stad: p.city || "",
          Opdrachtgever: p.client_name || "",
          Uurtarief: p.default_rate_cents ? p.default_rate_cents / 100 : 0,
          Status: p.archived ? "Gearchiveerd" : "Actief",
          Aangemaakt: p.created_at,
        })),
        timeEntries: entries.map((e: any) => ({
          "Entry ID": e.id,
          "Project ID": e.project_id,
          Project: e.project?.name || "Onbekend",
          Fase: e.phase?.name || e.phase_code,
          Datum: e.occurred_on,
          Uren: e.minutes ? (e.minutes / 60).toFixed(2) : "0",
          Omschrijving: e.notes || "",
          Uurtarief: e.project?.default_rate_cents
            ? e.project.default_rate_cents / 100
            : 0,
          Bedrag: e.project?.default_rate_cents
            ? (
                ((e.minutes || 0) / 60) *
                (e.project.default_rate_cents / 100)
              ).toFixed(2)
            : "0",
        })),
      };

      const XLSX = (window as any).XLSX;
      if (!XLSX) {
        await exportTimeCSV();
        return;
      }

      const wb = XLSX.utils.book_new();
      const projectsWs = XLSX.utils.json_to_sheet(workbookData.projects);
      XLSX.utils.book_append_sheet(wb, projectsWs, "Projecten");
      const entriesWs = XLSX.utils.json_to_sheet(workbookData.timeEntries);
      XLSX.utils.book_append_sheet(wb, entriesWs, "Uren");

      XLSX.writeFile(
        wb,
        `coach-app-export-${new Date().toISOString().split("T")[0]}.xlsx`
      );
    } catch (error) {
      console.error("Excel export failed:", error);
      exportTimeCSV();
    }
  };

  /* ---------- Excel import ---------- */
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const XLSX = (window as any).XLSX;
      if (!XLSX) {
        throw new Error(
          "Excel library niet beschikbaar. Voeg SheetJS toe aan je project."
        );
      }

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);

      const allData: any[] = [];
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        for (const row of jsonData as any[]) {
          const hours = parseFloat(row.Uren || row.Hours || row.Tijd || "0");
          if (hours > 0) {
            allData.push({
              datum: row.Datum || row.Date || row.datum || "",
              uren: hours,
              fase:
                row.Fase ||
                row.Phase ||
                row["Fase Code"] ||
                row["Phase Code"] ||
                "algemeen",
              omschrijving:
                row.Omschrijving || row.Description || row.Notes || row.omschrijving || "",
              origineleRij: row,
            });
          }
        }
      }

      if (allData.length === 0) {
        throw new Error(
          'Geen uren gevonden in het Excel bestand. Controleer of er een kolom "Uren", "Hours" of "Tijd" bestaat.'
        );
      }

      setImportData(allData);
      setShowImportPreview(true);
    } catch (error) {
      setImportResult({
        success: false,
        message: `Import mislukt: ${error}`,
        errors: [String(error)],
      });
    } finally {
      setIsImporting(false);
      event.target.value = "";
    }
  };

  const executeImport = async () => {
    if (!selectedProject || importData.length === 0) return;

    setIsImporting(true);
    let imported = 0;
    const errors: string[] = [];

    for (const entry of importData) {
      try {
        const entryData = {
          project_id: selectedProject,
          phase_code: entry.fase,
          occurred_on: entry.datum,
          minutes: Math.round(entry.uren * 60),
          notes: entry.omschrijving || null,
        };

        const response = await fetch("/api/time-entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entryData),
        });

        if (response.ok) {
          imported++;
        } else {
          const errorText = await response.text();
          errors.push(`Rij ${imported + errors.length + 1}: ${errorText}`);
        }
      } catch (error) {
        errors.push(`Rij ${imported + errors.length + 1}: ${error}`);
      }
    }

    setImportResult({
      success: imported > 0,
      message: `${imported} van ${importData.length} uren geïmporteerd${
        errors.length > 0 ? ` met ${errors.length} fouten` : ""
      }`,
      imported,
      errors: errors.slice(0, 5),
    });

    setShowImportPreview(false);
    setImportData([]);
    setSelectedProject("");
    setIsImporting(false);
  };

  /* ---------- ICS import ---------- */
  function handleCalendarImport() {
    // open verborgen .ics file input
    icsInputRef.current?.click();
  }

  async function handleICSImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const events = parseICS(text);
      if (!events.length) {
        setImportResult({
          success: false,
          message:
            "Geen afspraken gevonden in .ics. Controleer DTSTART/DTEND/SUMMARY velden.",
        });
        return;
      }
      setCalendarEvents(events);
      setShowCalendarPreview(true);
    } catch (err) {
      console.error("ICS parse error:", err);
      setImportResult({
        success: false,
        message: `ICS import mislukt: ${err}`,
        errors: [String(err)],
      });
    } finally {
      e.target.value = "";
    }
  }

  async function importCalendarEvents() {
    if (!selectedProject || !calendarEvents.length) return;

    setIsImporting(true);
    let imported = 0;
    const errors: string[] = [];

    for (const ev of calendarEvents) {
      try {
        const start = new Date(ev.start);
        const end = new Date(ev.end);
        const minutes = Math.max(
          0,
          Math.round((end.getTime() - start.getTime()) / 60000)
        );

        const entryData = {
          project_id: selectedProject,
          phase_code: "agenda",
          occurred_on: start.toISOString().slice(0, 10), // YYYY-MM-DD
          minutes,
          notes: ev.summary + (ev.location ? ` @ ${ev.location}` : ""),
        };

        const res = await fetch("/api/time-entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entryData),
        });

        if (res.ok) imported++;
        else errors.push(await res.text());
      } catch (e) {
        errors.push(String(e));
      }
    }

    setImportResult({
      success: imported > 0,
      message: `${imported} van ${calendarEvents.length} afspraken geïmporteerd`,
      imported,
      errors: errors.slice(0, 5),
    });

    setShowCalendarPreview(false);
    setCalendarEvents([]);
    setSelectedProject("");
    setIsImporting(false);
  }

  /* -------------------- Render -------------------- */
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Instellingen</h1>
        <p className="text-muted-foreground mt-2">Beheer je account en data</p>
      </div>

      {/* Data Import/Export Section */}
      <section className="bg-card rounded-2xl border p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-2">
            Data beheer
          </h2>
        </div>

        <div className="space-y-6">
          {/* Export */}
          <div>
            <h3 className="font-medium text-card-foreground mb-4">Exporteren</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportTimeCSV}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <Download className="w-4 h-4" />
                Exporteer uren (CSV)
              </button>

              <button
                onClick={exportProjectsExcel}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Volledige export (Excel)
              </button>
            </div>
          </div>

          {/* Import */}
          <div>
            <h3 className="font-medium text-card-foreground mb-4">Importeren</h3>
            <div className="space-y-6">
              {/* Excel Import */}
              <div>
                <h4 className="text-sm font-medium text-card-foreground mb-3">
                  Excel uren import
                </h4>
                <div className="border-2 border-dashed border-border rounded-lg p-6">
                  <div className="text-center">
                    <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Sleep een Excel bestand hierheen of klik om te selecteren
                    </p>
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-accent-foreground hover:bg-accent/80 transition-colors cursor-pointer">
                      <Upload className="w-4 h-4" />
                      {isImporting ? "Importeren..." : "Excel bestand kiezen"}
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileImport}
                        disabled={isImporting}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Calendar Import */}
              <div>
                <h4 className="text-sm font-medium text-card-foreground mb-3">
                  Agenda import
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Google Calendar knop opent .ics input */}
                  <div className="border border-border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <CalendarIcon className="w-8 h-8 text-blue-600" />
                      <div>
                        <h5 className="font-medium text-card-foreground">
                          Google Agenda
                        </h5>
                        <p className="text-xs text-muted-foreground">
                          Afspraken via .ics export
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleCalendarImport}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <CalendarIcon className="w-4 h-4" />
                      Importeer agenda
                    </button>
                  </div>

                  {/* ICS File */}
                  <div className="border border-border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Clock className="w-8 h-8 text-green-600" />
                      <div>
                        <h5 className="font-medium text-card-foreground">
                          ICS Bestand
                        </h5>
                        <p className="text-xs text-muted-foreground">
                          Calendar export (.ics)
                        </p>
                      </div>
                    </div>
                    <label className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
                      <Upload className="w-4 h-4" />
                      ICS bestand kiezen
                      <input
                        type="file"
                        accept=".ics"
                        onChange={handleICSImport}
                        ref={icsInputRef}   // <-- nieuw
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Import Result */}
              {importResult && (
                <div
                  className={`p-4 rounded-lg flex items-start gap-3 ${
                    importResult.success
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  {importResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        importResult.success ? "text-green-800" : "text-red-800"
                      }`}
                    >
                      {importResult.message}
                    </p>
                    {importResult.errors && importResult.errors.length > 0 && (
                      <ul className="mt-2 text-sm text-red-700 space-y-1">
                        {importResult.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button
                    onClick={() => setImportResult(null)}
                    className="p-1 hover:bg-black/10 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Excel formaat uitleg */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Excel formaat</h4>
                <div className="text-sm text-blue-800 space-y-2">
                  <p>
                    <strong>Vereiste kolommen:</strong> Datum, Uren (of
                    Hours/Tijd), Fase (optioneel), Omschrijving (optioneel)
                  </p>
                  <p className="text-xs">
                    Na upload kun je kiezen naar welk project de uren moeten
                    worden toegevoegd
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Calendar Import Preview Modal */}
      {showCalendarPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">
                  Agenda import preview
                </h3>
                <p className="text-sm text-muted-foreground">
                  {calendarEvents.length} afspraken gevonden. Kies het project:
                </p>
              </div>
              <button
                onClick={() => setShowCalendarPreview(false)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Project Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-card-foreground mb-2">
                Doel project *
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground"
                required
              >
                <option value="">-- Kies een project --</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} {project.city ? `(${project.city})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Calendar Events Preview */}
            <div className="flex-1 overflow-hidden">
              <h4 className="font-medium text-card-foreground mb-3">
                Te importeren afspraken als uren:
              </h4>
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">
                          Afspraak
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          Datum
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          Tijd
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          Duur
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          Locatie
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {calendarEvents.map((event, index) => {
                        const start = new Date(event.start);
                        const end = new Date(event.end);
                        const hours =
                          (end.getTime() - start.getTime()) / (1000 * 60 * 60);

                        return (
                          <tr key={index} className="border-t border-border">
                            <td
                              className="px-4 py-2 max-w-xs truncate"
                              title={event.summary}
                            >
                              {event.summary}
                            </td>
                            <td className="px-4 py-2">
                              {start.toLocaleDateString("nl-NL")}
                            </td>
                            <td className="px-4 py-2">
                              {start.toLocaleTimeString("nl-NL", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              -{" "}
                              {end.toLocaleTimeString("nl-NL", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="px-4 py-2 font-mono">
                              {hours.toFixed(1)}h
                            </td>
                            <td
                              className="px-4 py-2 max-w-xs truncate"
                              title={event.location}
                            >
                              {event.location || "--"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={() => setShowCalendarPreview(false)}
                className="flex-1 px-4 py-2.5 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={importCalendarEvents}
                disabled={!selectedProject || isImporting}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {isImporting
                  ? "Importeren..."
                  : `${calendarEvents.length} afspraken als uren importeren`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Preview Modal (Excel) */}
      {showImportPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">
                  Import preview
                </h3>
                <p className="text-sm text-muted-foreground">
                  {importData.length} uren gevonden. Kies het project:
                </p>
              </div>
              <button
                onClick={() => setShowImportPreview(false)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Project Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-card-foreground mb-2">
                Doel project *
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground"
                required
              >
                <option value="">-- Kies een project --</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} {project.city ? `(${project.city})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Data Preview */}
            <div className="flex-1 overflow-hidden">
              <h4 className="font-medium text-card-foreground mb-3">
                Te importeren uren:
              </h4>
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Datum</th>
                        <th className="px-4 py-2 text-left font-medium">Uren</th>
                        <th className="px-4 py-2 text-left font-medium">Fase</th>
                        <th className="px-4 py-2 text-left font-medium">
                          Omschrijving
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {importData.map((entry, index) => (
                        <tr key={index} className="border-t border-border">
                          <td className="px-4 py-2">{entry.datum || "Geen datum"}</td>
                          <td className="px-4 py-2 font-mono">{entry.uren}h</td>
                          <td className="px-4 py-2">{entry.fase}</td>
                          <td
                            className="px-4 py-2 max-w-xs truncate"
                            title={entry.omschrijving}
                          >
                            {entry.omschrijving || "--"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={() => setShowImportPreview(false)}
                className="flex-1 px-4 py-2.5 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={executeImport}
                disabled={!selectedProject || isImporting}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {isImporting
                  ? "Importeren..."
                  : `${importData.length} uren importeren`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Settings */}
      <section className="bg-card rounded-2xl border p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-2">
            Account
          </h2>
          <p className="text-muted-foreground">Beheer je accountinstellingen</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium text-card-foreground">Thema</p>
              <p className="text-sm text-muted-foreground">
                Kies tussen licht en donker thema
              </p>
            </div>
            <select className="px-3 py-2 border border-border rounded-lg bg-background text-foreground">
              <option value="light">Licht</option>
              <option value="dark">Donker</option>
              <option value="system">Systeem</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium text-card-foreground">Notificaties</p>
              <p className="text-sm text-muted-foreground">
                Ontvang meldingen over deadlines
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </section>
    </div>
  );
}
