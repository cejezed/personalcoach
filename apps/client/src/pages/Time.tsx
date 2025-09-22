import React, { useState, useMemo } from 'react';
import { Plus, Calendar, FileText, Euro, Download } from 'lucide-react';

const ArchitectTimeTracking = () => {
  const [projects, setProjects] = useState([
    { 
      id: '1', 
      name: 'Villa Waterfront', 
      city: 'Amstelveen', 
      client_name: 'Familie Jansen',
      default_rate_cents: 8500,
      created_at: '2024-01-15'
    },
    { 
      id: '2', 
      name: 'Kantoorgebouw Centrum', 
      city: 'Amsterdam', 
      client_name: 'BV Vastgoed',
      default_rate_cents: 9500,
      created_at: '2024-02-20'
    }
  ]);

  const [phases] = useState([
    { code: 'schetsontwerp', name: 'Schetsontwerp', sort_order: 1 },
    { code: 'voorlopig-ontwerp', name: 'Voorlopig ontwerp', sort_order: 2 },
    { code: 'vo-tekeningen', name: 'VO tekeningen', sort_order: 3 },
    { code: 'definitief-ontwerp', name: 'Definitief ontwerp', sort_order: 4 },
    { code: 'do-tekeningen', name: 'DO tekeningen', sort_order: 5 },
    { code: 'bouwvoorbereiding', name: 'Bouwvoorbereiding', sort_order: 6 },
    { code: 'bv-tekeningen', name: 'BV tekeningen', sort_order: 7 },
    { code: 'uitvoering', name: 'Uitvoering', sort_order: 8 },
    { code: 'uitvoering-tekeningen', name: 'Uitvoering tekeningen', sort_order: 9 },
    { code: 'oplevering-nazorg', name: 'Oplevering/nazorg', sort_order: 10 }
  ]);

  const [timeEntries, setTimeEntries] = useState([
    {
      id: '1',
      project_id: '1',
      phase_code: 'schetsontwerp',
      occurred_on: '2024-09-15',
      hours: 4,
      notes: 'Eerste schetsen en ruimtelijke opzet',
      invoiced: false,
      invoiceAmount: 0
    },
    {
      id: '2',
      project_id: '1',
      phase_code: 'voorlopig-ontwerp',
      occurred_on: '2024-09-18',
      hours: 6,
      notes: 'VO uitwerking plattegronden',
      invoiced: true,
      invoiceAmount: 510
    }
  ]);

  const [newEntry, setNewEntry] = useState({
    projectId: '',
    phaseCode: '',
    date: new Date().toISOString().split('T')[0],
    hours: '',
    description: '',
    invoiced: false,
    invoiceAmount: 0
  });

  const [newProject, setNewProject] = useState({
    name: '',
    city: '',
    client_name: '',
    default_rate_cents: 8500
  });

  const [showNewProject, setShowNewProject] = useState(false);
  const [viewMode, setViewMode] = useState('entries');

  const selectedProject = projects.find(p => p.id === newEntry.projectId);

  const addProject = () => {
    if (newProject.name && newProject.city && newProject.client_name) {
      const project = {
        id: Date.now().toString(),
        ...newProject,
        created_at: new Date().toISOString().split('T')[0]
      };
      setProjects([project, ...projects]);
      setNewProject({ name: '', city: '', client_name: '', default_rate_cents: 8500 });
      setShowNewProject(false);
    }
  };

  const addTimeEntry = () => {
    if (newEntry.projectId && newEntry.phaseCode && newEntry.date && newEntry.hours) {
      const entry = {
        id: Date.now().toString(),
        project_id: newEntry.projectId,
        phase_code: newEntry.phaseCode,
        occurred_on: newEntry.date,
        hours: parseFloat(newEntry.hours),
        notes: newEntry.description || null,
        invoiced: newEntry.invoiced,
        invoiceAmount: newEntry.invoiced ? newEntry.invoiceAmount : 0
      };

      setTimeEntries([entry, ...timeEntries]);
      setNewEntry({
        projectId: '',
        phaseCode: '',
        date: new Date().toISOString().split('T')[0],
        hours: '',
        description: '',
        invoiced: false,
        invoiceAmount: 0
      });
    }
  };

  const toggleInvoiced = (entryId, amount = 0) => {
    setTimeEntries(timeEntries.map(entry => 
      entry.id === entryId 
        ? { ...entry, invoiced: !entry.invoiced, invoiceAmount: !entry.invoiced ? amount : 0 }
        : entry
    ));
  };

  const getProjectById = (id) => projects.find(p => p.id === id);
  const getPhaseByCode = (code) => phases.find(p => p.code === code);

  // Export function
  const exportToCSV = () => {
    const csvHeader = 'Datum,Project,Woonplaats,Opdrachtgever,Fase,Uren,Omschrijving,Uurtarief,Bedrag,Status\n';
    
    const csvRows = timeEntries.map(entry => {
      const project = getProjectById(entry.project_id) || {};
      const phase = getPhaseByCode(entry.phase_code) || {};
      const rate = (project.default_rate_cents || 0) / 100;
      const amount = (entry.hours || 0) * rate;
      
      return [
        new Date(entry.occurred_on).toLocaleDateString('nl-NL'),
        `"${project.name || ''}"`,
        `"${project.city || ''}"`,
        `"${project.client_name || ''}"`,
        `"${phase.name || ''}"`,
        entry.hours?.toFixed(2) || '0',
        `"${entry.notes || ''}"`,
        rate.toFixed(2),
        amount.toFixed(2),
        entry.invoiced ? 'Gefactureerd' : 'Open'
      ].join(',');
    }).join('\n');
    
    const csvContent = csvHeader + csvRows;
    const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(csvBlob);
    link.download = `uurenadministratie-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Summary calculations
  const projectSummary = useMemo(() => {
    const summary = {};
    
    timeEntries.forEach(entry => {
      const project = getProjectById(entry.project_id);
      if (!project) return;
      
      if (!summary[entry.project_id]) {
        summary[entry.project_id] = {
          project,
          phases: {},
          totalHours: 0,
          totalInvoiced: 0,
          totalUnbilled: 0
        };
      }
      
      if (!summary[entry.project_id].phases[entry.phase_code]) {
        summary[entry.project_id].phases[entry.phase_code] = {
          hours: 0,
          invoiced: 0,
          unbilled: 0
        };
      }
      
      summary[entry.project_id].phases[entry.phase_code].hours += entry.hours;
      summary[entry.project_id].totalHours += entry.hours;
      
      if (entry.invoiced) {
        summary[entry.project_id].phases[entry.phase_code].invoiced += entry.invoiceAmount;
        summary[entry.project_id].totalInvoiced += entry.invoiceAmount;
      } else {
        const unbilledAmount = entry.hours * (project.default_rate_cents / 100);
        summary[entry.project_id].phases[entry.phase_code].unbilled += unbilledAmount;
        summary[entry.project_id].totalUnbilled += unbilledAmount;
      }
    });
    
    return summary;
  }, [timeEntries, projects]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Architectenbureau Uurenadministratie</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('entries')}
            className={`px-4 py-2 rounded-lg ${viewMode === 'entries' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Uren invoer
          </button>
          <button
            onClick={() => setViewMode('summary')}
            className={`px-4 py-2 rounded-lg ${viewMode === 'summary' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Project overzicht
          </button>
          <button
            onClick={() => setViewMode('invoicing')}
            className={`px-4 py-2 rounded-lg ${viewMode === 'invoicing' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Facturatie
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* New Project Form */}
      {showNewProject && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h2 className="text-lg font-semibold mb-4">Nieuw project toevoegen</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <input
              type="text"
              placeholder="Projectnaam"
              value={newProject.name}
              onChange={(e) => setNewProject({...newProject, name: e.target.value})}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
            <input
              type="text"
              placeholder="Woonplaats"
              value={newProject.city}
              onChange={(e) => setNewProject({...newProject, city: e.target.value})}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
            <input
              type="text"
              placeholder="Opdrachtgever"
              value={newProject.client_name}
              onChange={(e) => setNewProject({...newProject, client_name: e.target.value})}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
            <input
              type="number"
              placeholder="Uurtarief (eurocent)"
              value={newProject.default_rate_cents}
              onChange={(e) => setNewProject({...newProject, default_rate_cents: parseInt(e.target.value) || 0})}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={addProject}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              Project toevoegen
            </button>
            <button
              onClick={() => setShowNewProject(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}

      {viewMode === 'entries' && (
        <>
          {/* Add Time Entry Form */}
          <div className="bg-white rounded-lg shadow-sm border p-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Uren registreren</h2>
              <button
                onClick={() => setShowNewProject(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-sm flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Nieuw project</span>
              </button>
            </div>
            
            {/* Eerste rij: Project en Fase */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Project *</label>
                <select
                  value={newEntry.projectId}
                  onChange={(e) => setNewEntry({...newEntry, projectId: e.target.value})}
                  size="11"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white min-h-[200px]"
                  required
                >
                  <option value="">-- Selecteer project --</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.city})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fase *</label>
                <select
                  value={newEntry.phaseCode}
                  onChange={(e) => setNewEntry({...newEntry, phaseCode: e.target.value})}
                  size="11"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white min-h-[200px]"
                  required
                >
                  <option value="">-- Selecteer fase --</option>
                  {phases.map(phase => (
                    <option key={phase.code} value={phase.code}>{phase.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Tweede rij: Datum, Uren, Toevoegen knop */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Datum *</label>
                <input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Uren *</label>
                <input
                  type="number"
                  step="0.25"
                  placeholder="0"
                  value={newEntry.hours}
                  onChange={(e) => setNewEntry({...newEntry, hours: e.target.value})}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Actie</label>
                <button
                  onClick={addTimeEntry}
                  disabled={!newEntry.projectId || !newEntry.phaseCode || !newEntry.date || !newEntry.hours}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-2 py-1 rounded text-sm font-medium h-8"
                >
                  Toevoegen
                </button>
              </div>
            </div>
            
            {/* Optionele omschrijving */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Omschrijving (optioneel)</label>
              <input
                type="text"
                placeholder="Beschrijving van werkzaamheden..."
                value={newEntry.description}
                onChange={(e) => setNewEntry({...newEntry, description: e.target.value})}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            
            {selectedProject && newEntry.hours && (
              <div className="text-sm text-gray-600 mb-2 p-2 bg-blue-50 rounded">
                <span className="font-medium">Project:</span> {selectedProject.name} | 
                <span className="font-medium"> Uurtarief:</span> €{(selectedProject.default_rate_cents / 100).toFixed(2)} | 
                <span className="font-medium"> Bedrag:</span> €{(parseFloat(newEntry.hours || 0) * (selectedProject.default_rate_cents / 100)).toFixed(2)}
              </div>
            )}
          </div>

          {/* Time Entries List */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Geregistreerde uren</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Project</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Fase</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Datum</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Uren</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Omschrijving</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Acties</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {timeEntries.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                        Nog geen uren geregistreerd.
                      </td>
                    </tr>
                  ) : (
                    timeEntries.map(entry => {
                      const project = getProjectById(entry.project_id);
                      const phase = getPhaseByCode(entry.phase_code);
                      return (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium">{project?.name || 'Onbekend'}</div>
                            <div className="text-sm text-gray-600">{project?.city}</div>
                          </td>
                          <td className="px-4 py-3 text-sm">{phase?.name}</td>
                          <td className="px-4 py-3 text-sm">{new Date(entry.occurred_on).toLocaleDateString('nl-NL')}</td>
                          <td className="px-4 py-3 text-sm font-mono">{entry.hours?.toFixed(1)}h</td>
                          <td className="px-4 py-3 text-sm">{entry.notes || '-'}</td>
                          <td className="px-4 py-3">
                            {entry.invoiced ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Gefactureerd (€{entry.invoiceAmount})
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Te factureren (€{project ? (entry.hours * (project.default_rate_cents / 100)).toFixed(2) : '0'})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleInvoiced(entry.id, project ? entry.hours * (project.default_rate_cents / 100) : 0)}
                              className="text-blue-600 hover:text-blue-900 text-sm"
                            >
                              {entry.invoiced ? 'Markeer als onbetaald' : 'Markeer als gefactureerd'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {viewMode === 'summary' && (
        <div className="space-y-6">
          {Object.values(projectSummary).map(summary => (
            <div key={summary.project.id} className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{summary.project.name}</h3>
                    <p className="text-sm text-gray-600">{summary.project.city} - {summary.project.client_name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Totaal uren: <span className="font-semibold">{summary.totalHours.toFixed(1)}h</span></div>
                    <div className="text-sm text-green-600">Gefactureerd: €{summary.totalInvoiced.toFixed(2)}</div>
                    <div className="text-sm text-yellow-600">Te factureren: €{summary.totalUnbilled.toFixed(2)}</div>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Fase</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Uren</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Gefactureerd</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Te factureren</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(summary.phases).map(([phaseCode, data]) => {
                      const phase = getPhaseByCode(phaseCode);
                      return (
                        <tr key={phaseCode}>
                          <td className="px-4 py-3 text-sm font-medium">{phase?.name || phaseCode}</td>
                          <td className="px-4 py-3 text-sm">{data.hours.toFixed(1)}h</td>
                          <td className="px-4 py-3 text-sm text-green-600">€{data.invoiced.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-yellow-600">€{data.unbilled.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'invoicing' && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold flex items-center">
              <Euro className="w-5 h-5 mr-2" />
              Facturatie overzicht
            </h2>
          </div>
          
          <div className="p-4 space-y-4">
            {Object.values(projectSummary).map(summary => (
              <div key={summary.project.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">{summary.project.name} ({summary.project.city})</h3>
                  <div className="text-sm text-gray-600">Uurtarief: €{(summary.project.default_rate_cents / 100).toFixed(2)}</div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="text-sm text-blue-600 font-medium">Totaal uren</div>
                    <div className="text-xl font-bold text-blue-900">{summary.totalHours.toFixed(1)}h</div>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded">
                    <div className="text-sm text-green-600 font-medium">Gefactureerd</div>
                    <div className="text-xl font-bold text-green-900">€{summary.totalInvoiced.toFixed(2)}</div>
                  </div>
                  
                  <div className="bg-yellow-50 p-3 rounded">
                    <div className="text-sm text-yellow-600 font-medium">Te factureren</div>
                    <div className="text-xl font-bold text-yellow-900">€{summary.totalUnbilled.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Time;