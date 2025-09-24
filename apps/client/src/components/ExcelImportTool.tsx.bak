import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Download, AlertCircle, CheckCircle, X, FileSpreadsheet } from "lucide-react";
import { api } from "@/lib/api";

/* =======================
   Types
======================= */
type ImportRow = {
  project_name?: string;
  project_id?: string;
  phase_code: string;
  phase_name?: string;
  occurred_on: string;
  hours?: number;
  minutes?: number;
  notes?: string;
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

/* =======================
   Helpers
======================= */
const parseExcelDate = (value: any): string => {
  if (!value) return '';
  
  // Als het al een geldige datum string is
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  
  // Excel datum nummer (aantal dagen sinds 1900-01-01)
  if (typeof value === 'number') {
    const excelEpoch = new Date(1900, 0, 1);
    const date = new Date(excelEpoch.getTime() + (value - 2) * 24 * 60 * 60 * 1000);
    return date.toISOString().split('T')[0];
  }
  
  // Probeer string te parsen
  if (typeof value === 'string') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  
  return '';
};

const normalizePhaseCode = (phaseName: string): string => {
  const phaseMap: Record<string, string> = {
    'schetsontwerp': 'schetsontwerp',
    'so': 'schetsontwerp',
    'voorlopig ontwerp': 'voorlopig-ontwerp',
    'voorlopig-ontwerp': 'voorlopig-ontwerp',
    'vo': 'voorlopig-ontwerp',
    'vo tekeningen': 'vo-tekeningen',
    'vo-tekeningen': 'vo-tekeningen',
    'definitief ontwerp': 'definitief-ontwerp',
    'definitief-ontwerp': 'definitief-ontwerp',
    'do': 'definitief-ontwerp',
    'do tekeningen': 'do-tekeningen',
    'do-tekeningen': 'do-tekeningen',
    'bouwvoorbereiding': 'bouwvoorbereiding',
    'bv': 'bouwvoorbereiding',
    'bv tekeningen': 'bv-tekeningen',
    'bv-tekeningen': 'bv-tekeningen',
    'uitvoering': 'uitvoering',
    'ut': 'uitvoering',
    'uitvoering tekeningen': 'uitvoering-tekeningen',
    'uitvoering-tekeningen': 'uitvoering-tekeningen',
    'oplevering': 'oplevering-nazorg',
    'oplevering nazorg': 'oplevering-nazorg',
    'oplevering-nazorg': 'oplevering-nazorg',
    'nazorg': 'oplevering-nazorg',
  };
  
  const normalized = phaseName.toLowerCase().trim();
  return phaseMap[normalized] || normalized;
};

/* =======================
   Component
======================= */
export default function ExcelImportTool() {
  const queryClient = useQueryClient();
  
  /* ---- State ---- */
  const [showImportDialog, setShowImportDialog] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [importData, setImportData] = React.useState<ImportRow[]>([]);
  const [previewMode, setPreviewMode] = React.useState(true);
  const [importResult, setImportResult] = React.useState<ImportResult | null>(null);
  const [projects, setProjects] = React.useState<any[]>([]);

  /* ---- File upload handler ---- */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;
    
    setFile(uploadedFile);
    
    try {
      await parseExcelFile(uploadedFile);
    } catch (error) {
      console.error('Fout bij lezen Excel bestand:', error);
      alert('Kon Excel bestand niet lezen. Controleer of het een geldig Excel/.csv bestand is.');
    }
  };

  const parseExcelFile = async (file: File) => {
    if (file.name.endsWith('.csv')) {
      // Handle CSV files
      const text

  const processImportData = async (rawData: any[]) => {
    // Haal projecten op voor matching
    try {
      const projectsResponse = await api<any[]>('/api/projects');
      setProjects(projectsResponse);
    } catch (error) {
      console.error('Kon projecten niet ophalen:', error);
      setProjects([]);
    }
    
    const processedData: ImportRow[] = rawData.map((row, index) => {
      const errors: string[] = [];
      
      // Project matching
      const projectName = row.Project || row.project || row.project_name || '';
      const matchedProject = projects.find(p => 
        p.name.toLowerCase().includes(projectName.toLowerCase()) ||
        projectName.toLowerCase().includes(p.name.toLowerCase())
      );
      
      if (!projectName) {
        errors.push('Project naam ontbreekt');
      } else if (!matchedProject) {
        errors.push(`Project "${projectName}" niet gevonden`);
      }
      
      // Fase normalisatie
      const phaseName = row.Fase || row.fase || row.phase || '';
      const phaseCode = normalizePhaseCode(phaseName);
      if (!phaseName) {
        errors.push('Fase ontbreekt');
      }
      
      // Datum parsing
      const dateValue = row.Datum || row.datum || row.date || row.occurred_on || '';
      const occurredOn = parseExcelDate(dateValue);
      if (!occurredOn) {
        errors.push('Ongeldige of ontbrekende datum');
      }
      
      // Uren conversie
      const hoursValue = row.Uren || row.uren || row.hours || row.tijd || 0;
      const hours = typeof hoursValue === 'number' ? hoursValue : parseFloat(hoursValue) || 0;
      if (hours <= 0) {
        errors.push('Ongeldige of ontbrekende uren');
      }
      
      return {
        project_name: projectName,
        project_id: matchedProject?.id,
        phase_code: phaseCode,
        phase_name: phaseName,
        occurred_on: occurredOn,
        hours: hours,
        minutes: Math.round(hours * 60),
        notes: row.Omschrijving || row.omschrijving || row.notes || row.description || '',
        isValid: errors.length === 0,
        errors
      };
    });
    
    setImportData(processedData);
    setPreviewMode(true);
  };

  /* ---- Import mutation ---- */
  const importMutation = useMutation({
    mutationFn: async (data: ImportRow[]) => {
      const validRows = data.filter(row => row.isValid);
      const results = {
        total: data.length,
        successful: 0,
        failed: 0,
        errors: [] as string[]
      };
      
      for (const row of validRows) {
        try {
          await api('/api/time-entries', {
            method: 'POST',
            body: JSON.stringify({
              project_id: row.project_id,
              phase_code: row.phase_code,
              occurred_on: row.occurred_on,
              minutes: row.minutes,
              notes: row.notes
            })
          });
          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Rij ${validRows.indexOf(row) + 1}: ${error}`);
        }
      }
      
      return results;
    },
    onSuccess: (result) => {
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      setPreviewMode(false);
    }
  });

  const handleImport = () => {
    importMutation.mutate(importData);
  };

  const downloadTemplate = () => {
    const csv = [
      'Project,Fase,Datum,Uren,Omschrijving',
      'Villa Amsterdam,Schetsontwerp,2024-09-20,4.5,Eerste schetsen',
      'Kantoor Rotterdam,VO,2024-09-21,6,Voorlopig ontwerp',
      'Woning Utrecht,DO,2024-09-22,3.25,Definitief ontwerp tekeningen'
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'uren_import_template.csv';
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Excel Import</h3>
              <button
                onClick={() => setShowImportDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {!file && (
              <div className="space-y-6">
                {/* Template download */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Template downloaden</h4>
                  <p className="text-blue-800 text-sm mb-3">
                    Download eerst de template om te zien welk formaat verwacht wordt.
                  </p>
                  <button
                    onClick={downloadTemplate}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Template
                  </button>
                </div>

                {/* Format instructions */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-3">Verwachte kolommen:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Project:</strong> Projectnaam (wordt automatisch gematcht)
                    </div>
                    <div>
                      <strong>Fase:</strong> SO, VO, DO, BV, UT of volledige naam
                    </div>
                    <div>
                      <strong>Datum:</strong> YYYY-MM-DD formaat
                    </div>
                    <div>
                      <strong>Uren:</strong> Decimaal getal (bijv. 4.5)
                    </div>
                    <div>
                      <strong>Omschrijving:</strong> Optionele beschrijving
                    </div>
                  </div>
                </div>

                {/* File upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="font-medium mb-2">Excel bestand uploaden</h4>
                  <p className="text-gray-600 mb-4">Sleep je .xlsx bestand hierheen of klik om te selecteren</p>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="excel-upload"
                  />
                  <label
                    htmlFor="excel-upload"
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded cursor-pointer inline-block"
                  >
                    Bestand kiezen
                  </label>
                </div>
              </div>
            )}

            {file && importData.length > 0 && previewMode && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium">Preview Import Data</h4>
                  <button
                    onClick={resetImport}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Nieuw bestand
                  </button>
                </div>

                {/* Samenvatting */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{importData.length}</div>
                    <div className="text-sm text-blue-800">Totaal rijen</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {importData.filter(row => row.isValid).length}
                    </div>
                    <div className="text-sm text-green-800">Geldige rijen</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {importData.filter(row => !row.isValid).length}
                    </div>
                    <div className="text-sm text-red-800">Fouten</div>
                  </div>
                </div>

                {/* Data preview */}
                <div className="max-h-96 overflow-y-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-left">Project</th>
                        <th className="px-3 py-2 text-left">Fase</th>
                        <th className="px-3 py-2 text-left">Datum</th>
                        <th className="px-3 py-2 text-left">Uren</th>
                        <th className="px-3 py-2 text-left">Omschrijving</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {importData.map((row, index) => (
                        <tr key={index} className={row.isValid ? 'bg-green-50' : 'bg-red-50'}>
                          <td className="px-3 py-2">
                            {row.isValid ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <div className="group relative">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                                <div className="absolute left-6 top-0 bg-red-600 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                                  {row.errors.join(', ')}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2">{row.project_name}</td>
                          <td className="px-3 py-2">{row.phase_name}</td>
                          <td className="px-3 py-2">{row.occurred_on}</td>
                          <td className="px-3 py-2">{row.hours}h</td>
                          <td className="px-3 py-2">{row.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Import button */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={resetImport}
                    className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importData.filter(row => row.isValid).length === 0 || importMutation.isPending}
                    className="px-6 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-300"
                  >
                    {importMutation.isPending ? 'Importeren...' : `${importData.filter(row => row.isValid).length} rijen importeren`}
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
                  <button
                    onClick={() => setShowImportDialog(false)}
                    className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
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