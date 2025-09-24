import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Download, AlertCircle, CheckCircle, X, FileSpreadsheet, Filter } from "lucide-react";
import * as XLSX from "xlsx";
import { api } from "@/lib/api";

/* =======================
   Types
======================= */
type ImportRow = {
  project_name: string;
  project_id?: string;
  phase_code: string;
  phase_name: string;
  occurred_on: string; // ISO yyyy-mm-dd
  hours: number;
  minutes: number;
  notes: string;
  // Validation
  isValid: boolean;
  errors: string[];
};

type ImportResult = {
  total: number;
  successful: number;
  failed: number;
  errors: string[];
};

type ProjectRef = { id: string; name: string };

/* =======================
   Helpers
======================= */
// dd-mm-jjjj, Excel-nummer of ISO -> ISO
const parseNlDate = (v: any): string => {
  if (!v && v !== 0) return "";
  if (typeof v === "number") {
    const excelEpoch = new Date(1900, 0, 1);
    const d = new Date(excelEpoch.getTime() + (v - 2) * 24 * 60 * 60 * 1000);
    return d.toISOString().split("T")[0];
  }
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (m) {
    const [_, d, mo, y] = m;
    const year = (+y < 100 ? 2000 + +y : +y);
    const iso = new Date(year, +mo - 1, +d).toISOString().split("T")[0];
    return iso;
  }
  const d2 = new Date(s);
  return isNaN(d2.getTime()) ? "" : d2.toISOString().split("T")[0];
};

const parseDecimalNl = (v: any): number => {
  if (typeof v === "number") return v;
  if (v === null || v === undefined) return 0;
  const s = String(v).trim().replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
};

// Verwerk “1 - Schets ontwerp”, “3 - Definitief ontwerp tekeningen”, etc.
const normalizePhaseCode = (raw: string): string => {
  if (!raw) return "";
  const cleaned = raw.toLowerCase().trim().replace(/^\d+\s*[-–]\s*/, "");
  const map: Record<string, string> = {
    "schets ontwerp": "schetsontwerp",
    "schetsontwerp": "schetsontwerp",
    "voorlopig ontwerp": "voorlopig-ontwerp",
    "voorlopig ontwerp tekeningen": "vo-tekeningen",
    "definitief ontwerp": "definitief-ontwerp",
    "definitief ontwerp tekeningen": "do-tekeningen",
    "bouwvoorbereiding": "bouwvoorbereiding",
    "bouwvoorbereiding tekeningen": "bv-tekeningen",
    "uitvoering": "uitvoering",
    "oplevering": "oplevering-nazorg",
    "oplevering nazorg": "oplevering-nazorg",
  };
  return map[cleaned] || cleaned.replace(/\s+/g, "-");
};

const validateRow = (row: ImportRow, projects: ProjectRef[]): ImportRow => {
  const errors: string[] = [];
  const matched = projects.find(
    (p) =>
      p.name?.toLowerCase() === row.project_name.toLowerCase() ||
      row.project_name.toLowerCase().includes(String(p.name).toLowerCase())
  );

  const project_id = matched?.id;
  if (!row.project_name) errors.push("Projectnaam ontbreekt");
  if (!project_id) errors.push(`Project "${row.project_name}" niet gevonden`);

  if (!row.phase_name) errors.push("Projectfase ontbreekt");

  const occurred_on = parseNlDate(row.occurred_on);
  if (!occurred_on) errors.push("Ongeldige of ontbrekende datum");

  const hours = parseDecimalNl(row.hours);
  if (hours <= 0) errors.push("Ongeldige of ontbrekende uren");

  return {
    ...row,
    project_id,
    occurred_on,
    hours,
    minutes: Math.round(hours * 60),
    phase_code: normalizePhaseCode(row.phase_name),
    isValid: errors.length === 0,
    errors,
  };
};

/* =======================
   Component
======================= */
export default function ExcelImportTool() {
  const queryClient = useQueryClient();

  // UI state
  const [showImportDialog, setShowImportDialog] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [importData, setImportData] = React.useState<ImportRow[]>([]);
  const [previewMode, setPreviewMode] = React.useState(true);
  const [importResult, setImportResult] = React.useState<ImportResult | null>(null);
  const [projects, setProjects] = React.useState<ProjectRef[]>([]);
  const [selectedProject, setSelectedProject] = React.useState<string>("(Alle)");

  // Unieke projectnamen uit de file
  const projectOptions = React.useMemo(() => {
    const names = Array.from(new Set(importData.map((r) => r.project_name).filter(Boolean))).sort();
    return ["(Alle)", ...names];
  }, [importData]);

  const visibleRows = React.useMemo(
    () =>
      selectedProject === "(Alle)"
        ? importData
        : importData.filter((r) => r.project_name === selectedProject),
    [importData, selectedProject]
  );

  /* ---- File upload handler ---- */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);

    try {
      // 1) projecten ophalen voor matching
      try {
        const projectsResponse = await api<ProjectRef[]>("/api/projects");
        setProjects(projectsResponse || []);
      } catch (error) {
        console.error("Kon projecten niet ophalen:", error);
        setProjects([]);
      }

      // 2) parse Excel
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });

      // 3) map naar ImportRow
      const processed: ImportRow[] = rows.map((row) =>
        validateRow(
          {
            project_name:
              (row["Projectnaam"] || row["Projectnaam "] || row.projectnaam || row.Project || "")
                .toString()
                .trim(),
            project_id: undefined,
            phase_name: (row["Projectfase"] || row.projectfase || row.Fase || "").toString().trim(),
            phase_code: "",
            occurred_on: (row["Datum"] || row.datum || row.Date || "").toString().trim(),
            hours: parseDecimalNl(row["Aantal uur"] ?? row["Aantal uren"] ?? row.uren ?? row.hours ?? ""),
            minutes: 0,
            notes: "", // Excel heeft geen opmerkingenkolom; kan hier ingevuld worden
            isValid: false,
            errors: [],
          },
          projects
        )
      );

      setImportData(processed);
      setPreviewMode(true);
      setSelectedProject("(Alle)");
      setImportResult(null);
    } catch (error) {
      console.error("Fout bij Excel lezen:", error);
      alert("Kon Excel niet lezen. Controleer of het een geldig .xlsx of .csv bestand is.");
    }
  };

  /* ---- Inline editing helpers ---- */
  const updateRow = (index: number, patch: Partial<ImportRow>) => {
    setImportData((prev) => {
      const next = [...prev];
      const updated = { ...next[index], ...patch };
      next[index] = validateRow(updated, projects);
      return next;
    });
  };

  /* ---- Import mutation ---- */
  const importMutation = useMutation({
    mutationFn: async (data: ImportRow[]) => {
      const validRows = data.filter((r) => r.isValid);
      const results: ImportResult = { total: data.length, successful: 0, failed: 0, errors: [] };

      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];
        try {
          await api("/api/time-entries", {
            method: "POST",
            body: JSON.stringify({
              project_id: row.project_id,
              phase_code: row.phase_code,
              occurred_on: row.occurred_on,
              minutes: row.minutes,
              notes: row.notes,
            }),
          });
          results.successful++;
        } catch (err: any) {
          results.failed++;
          results.errors.push(`Rij ${i + 1}: ${err?.message || String(err)}`);
        }
      }
      return results;
    },
    onSuccess: (result) => {
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      setPreviewMode(false);
    },
  });

  const handleImport = () => {
    importMutation.mutate(visibleRows);
  };

  const downloadTemplate = () => {
    const csv = [
      "Projectnaam,Projectfase,Datum,Aantal uur",
      "Maarssen Binnenweg 44,1 - Schets ontwerp,20-04-2023,2",
      "Maarssen Binnenweg 44,2 - Voorlopig ontwerp,19-09-2023,3,5",
      "Maarssen Binnenweg 44,4 - Bouwvoorbereiding,12-04-2024,3.25",
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "uren_import_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetImport = () => {
    setFile(null);
    setImportData([]);
    setPreviewMode(true);
    setImportResult(null);
    setSelectedProject("(Alle)");
  };

  return (
    <div>
      <button
        onClick={() => setShowImportDialog(true)}
        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
      >
        <Upload className="w-4 h-4" />
        Import Excel
      </button>

      {showImportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Excel Import</h3>
              <button onClick={() => setShowImportDialog(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {!file && (
              <div className="space-y-6">
                {/* Template download */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Template downloaden</h4>
                  <p className="text-blue-800 text-sm mb-3">
                    Verwacht: <strong>Projectnaam</strong>, <strong>Projectfase</strong> (mag met cijfer + streep),{" "}
                    <strong>Datum</strong> (dd-mm-jjjj of ISO), <strong>Aantal uur</strong> (komma of punt).
                  </p>
                  <button onClick={downloadTemplate} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download Template
                  </button>
                </div>

                {/* File upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="font-medium mb-2">Excel/CSV uploaden</h4>
                  <p className="text-gray-600 mb-4">Sleep je bestand hierheen of klik om te selecteren</p>
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" id="excel-upload" />
                  <label htmlFor="excel-upload" className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded cursor-pointer inline-block">
                    Bestand kiezen
                  </label>
                </div>
              </div>
            )}

            {file && importData.length > 0 && previewMode && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="border rounded px-2 py-1"
                    >
                      {projectOptions.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button onClick={resetImport} className="text-gray-500 hover:text-gray-700">
                    Nieuw bestand
                  </button>
                </div>

                {/* Samenvatting */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{visibleRows.length}</div>
                    <div className="text-sm text-blue-800">Totaal (filter)</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {visibleRows.filter((r) => r.isValid).length}
                    </div>
                    <div className="text-sm text-green-800">Geldige rijen</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {visibleRows.filter((r) => !r.isValid).length}
                    </div>
                    <div className="text-sm text-red-800">Fouten</div>
                  </div>
                </div>

                {/* Data preview + inline edit */}
                <div className="max-h-[50vh] overflow-y-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-left">Project</th>
                        <th className="px-3 py-2 text-left">Fase</th>
                        <th className="px-3 py-2 text-left">Datum</th>
                        <th className="px-3 py-2 text-left">Uren</th>
                        <th className="px-3 py-2 text-left">Notities</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {visibleRows.map((row, visIndex) => {
                        // vind absolute index van de rij in importData zodat updates kloppen
                        const index = importData.indexOf(row);
                        return (
                          <tr key={index} className={row.isValid ? "bg-green-50" : "bg-red-50"}>
                            <td className="px-3 py-2">
                              {row.isValid ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <div className="group relative">
                                  <AlertCircle className="w-5 h-5 text-red-600" />
                                  {row.errors.length > 0 && (
                                    <div className="absolute left-6 top-0 bg-red-600 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                                      {row.errors.join(", ")}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Project: keuze uit bekende projecten (server) of vrij invullen */}
                            <td className="px-3 py-2">
                              <div className="flex gap-2 items-center">
                                <input
                                  value={row.project_name}
                                  onChange={(e) => updateRow(index, { project_name: e.target.value })}
                                  className="border rounded px-2 py-1 w-48"
                                  placeholder="Projectnaam"
                                  list={`project-suggest`}
                                />
                                <datalist id="project-suggest">
                                  {projects.map((p) => (
                                    <option key={p.id} value={p.name} />
                                  ))}
                                </datalist>
                              </div>
                            </td>

                            {/* Fase: vrije tekst -> slug met normalizePhaseCode */}
                            <td className="px-3 py-2">
                              <input
                                value={row.phase_name}
                                onChange={(e) => updateRow(index, { phase_name: e.target.value })}
                                className="border rounded px-2 py-1 w-56"
                                placeholder="bv. 3 - Definitief ontwerp"
                              />
                            </td>

                            {/* Datum */}
                            <td className="px-3 py-2">
                              <input
                                type="date"
                                value={row.occurred_on || ""}
                                onChange={(e) => updateRow(index, { occurred_on: e.target.value })}
                                className="border rounded px-2 py-1"
                              />
                            </td>

                            {/* Uren */}
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                step="0.25"
                                min="0"
                                value={row.hours}
                                onChange={(e) => updateRow(index, { hours: parseDecimalNl(e.target.value) })}
                                className="border rounded px-2 py-1 w-24"
                              />
                            </td>

                            {/* Notities */}
                            <td className="px-3 py-2">
                              <input
                                value={row.notes}
                                onChange={(e) => updateRow(index, { notes: e.target.value })}
                                className="border rounded px-2 py-1 w-full"
                                placeholder="Optioneel"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Import knop */}
                <div className="flex justify-end gap-3">
                  <button onClick={resetImport} className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50">
                    Annuleren
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={
                      visibleRows.filter((r) => r.isValid).length === 0 || importMutation.isPending
                    }
                    className="px-6 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-300"
                  >
                    {importMutation.isPending
                      ? "Importeren..."
                      : `${visibleRows.filter((r) => r.isValid).length} rijen importeren`}
                  </button>
                </div>
              </div>
            )}

            {importResult && (
              <div className="space-y-6">
                <h4 className="text-lg font-medium">Import Resultaat</h4>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{importResult.total}</div>
                    <div className="text-sm text-blue-800">Totaal verwerkt</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{importResult.successful}</div>
                    <div className="text-sm text-green-800">Succesvol</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                    <div className="text-sm text-red-800">Mislukt</div>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h5 className="font-medium text-red-900 mb-2">Fouten:</h5>
                    <ul className="text-red-800 text-sm space-y-1">
                      {importResult.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end">
                  <button onClick={() => setShowImportDialog(false)} className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    Sluiten
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
