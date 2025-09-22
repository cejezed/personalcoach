cd apps/client

# Backup huidige versie
cp src/pages/Time.tsx src/pages/Time.tsx.backup

# Update Time.tsx
cat > src/pages/Time.tsx << 'EOF'
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar, FileText, Euro, Download } from 'lucide-react';
import { api } from '@/lib/api';

const ArchitectTimeTracking = () => {
  const queryClient = useQueryClient();

  // Fallback mock data
  const mockProjects = [
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
  ];

  const mockPhases = [
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
  ];

  // API calls met fallback
  const { data: apiProjects = [], isError: projectsError } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api('/api/projects'),
    retry: false,
    staleTime: 5 * 60 * 1000
  });

  const { data: apiPhases = [], isError: phasesError } = useQuery({
    queryKey: ['phases'],
    queryFn: () => api('/api/phases'),
    retry: false,
    staleTime: 10 * 60 * 1000
  });

  const { data: apiTimeEntries = [], refetch: refetchTimeEntries } = useQuery({
    queryKey: ['time-entries'],
    queryFn: () => api('/api/time-entries'),
    retry: false,
    staleTime: 1 * 60 * 1000
  });

  // Use API data if available, otherwise fallback to mock data
  const projects = apiProjects.length > 0 ? apiProjects : mockProjects;
  const phases = apiPhases.length > 0 ? apiPhases : mockPhases;
  
  // Local state for form and time entries
  const [timeEntries, setTimeEntries] = useState(apiTimeEntries);
  
  React.useEffect(() => {
    if (apiTimeEntries.length > 0) {
      setTimeEntries(apiTimeEntries);
    }
  }, [apiTimeEntries]);

  // Mutations
  const addProjectMutation = useMutation({
    mutationFn: (newProject) => api('/api/projects', {
      method: 'POST',
      body: JSON.stringify(newProject)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
    },
    onError: (error) => {
      // Fallback to local state if API fails
      console.warn('API call failed, using local storage:', error);
    }
  });

  const addTimeEntryMutation = useMutation({
    mutationFn: (newEntry) => {
      // Convert hours to minutes for API
      const { hours, ...rest } = newEntry;
      const entryData = { ...rest, minutes: Math.round(parseFloat(hours) * 60) };
      return api('/api/time-entries', {
        method: 'POST',
        body: JSON.stringify(entryData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['time-entries']);
      refetchTimeEntries();
    },
    onError: (error, variables) => {
      // Fallback to local state if API fails
      console.warn('API call failed, adding to local state:', error);
      const newEntry = {
        id: Date.now().toString(),
        ...variables,
        project: projects.find(p => p.id === variables.project_id),
        phase: phases.find(p => p.code === variables.phase_code)
      };
      setTimeEntries(prev => [newEntry, ...prev]);
    }
  });

  const [newEntry, setNewEntry] = useState({
    project_id: '',
    phase_code: '',
    occurred_on: new Date().toISOString().split('T')[0],
    hours: '',
    notes: ''
  });

  const [newProject, setNewProject] = useState({
    name: '',
    city: '',
    client_name: '',
    default_rate_cents: 8500
  });

  const [showNewProject, setShowNewProject] = useState(false);
  const [viewMode, setViewMode] = useState('entries');
  const [filterProject, setFilterProject] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');

  const selectedProject = projects.find(p => p.id === newEntry.project_id);

  const addProject = () => {
    if (newProject.name && newProject.city && newProject.client_name) {
      if (!projectsError) {
        // Try API first
        addProjectMutation.mutate(newProject);
      } else {
        // Fallback to local state
        const project = { id: Date.now().toString(), ...newProject };
        setProjects(prev => [project, ...prev]);
      }
      setNewProject({ name: '', city: '', client_name: '', default_rate_cents: 8500 });
      setShowNewProject(false);
    }
  };

  const addTimeEntry = () => {
    if (newEntry.project_id && newEntry.phase_code && newEntry.occurred_on && newEntry.hours) {
      addTimeEntryMutation.mutate(newEntry);
      setNewEntry({
        project_id: '',
        phase_code: '',
        occurred_on: new Date().toISOString().split('T')[0],
        hours: '',
        notes: ''
      });
    }
  };

  // Export functionality
  const exportToCSV = () => {
    const headers = ['Project', 'Fase', 'Datum', 'Uren', 'Omschrijving', 'Uurtarief', 'Bedrag'];
    const rows = timeEntries.map(entry => [
      entry.projects?.name || entry.project?.name || 'Onbekend',
      entry.phases?.name || entry.phase?.name || 'Onbekend',
      entry.occurred_on,
      (entry.minutes ? entry.minutes / 60 : entry.hours || 0).toFixed(1),
      entry.notes || '',
      `€${((entry.projects?.default_rate_cents || entry.project?.default_rate_cents || 0) / 100).toFixed(2)}`,
      `€${((entry.minutes ? entry.minutes / 60 : entry.hours || 0) * ((entry.projects?.default_rate_cents || entry.project?.default_rate_cents || 0) / 100)).toFixed(2)}`
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uurenadministratie-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered entries
  const filteredEntries = useMemo(() => {
    let filtered = timeEntries;
    
    if (filterProject) {
      filtered = filtered.filter(entry => entry.project_id === filterProject);
    }
    
    if (filterPeriod !== 'all') {
      const now = new Date();
      filtered = filtered.filter(entry => {
        const date = new Date(entry.occurred_on);
        if (filterPeriod === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return date >= weekAgo;
        } else if (filterPeriod === 'month') {
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }
    
    return filtered;
  }, [timeEntries, filterProject, filterPeriod]);

  // Project summary
  const projectSummary = useMemo(() => {
    const summary = {};
    
    timeEntries.forEach(entry => {
      const project = entry.projects || entry.project;
      if (!project) return;
      
      if (!summary[entry.project_id]) {
        summary[entry.project_id] = {
          project,
          phases: {},
          totalHours: 0,
          totalAmount: 0
        };
      }
      
      const hours = entry.minutes ? entry.minutes / 60 : entry.hours || 0;
      const rate = (project.default_rate_cents || 0) / 100;
      const amount = hours * rate;
      
      if (!summary[entry.project_id].phases[entry.phase_code]) {
        summary[entry.project_id].phases[entry.phase_code] = {
          hours: 0,
          amount: 0,
          phase: entry.phases || entry.phase
        };
      }
      
      summary[entry.project_id].phases[entry.phase_code].hours += hours;
      summary[entry.project_id].phases[entry.phase_code].amount += amount;
      summary[entry.project_id].totalHours += hours;
      summary[entry.project_id].totalAmount += amount;
    });
    
    return summary;
  }, [timeEntries]);

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
            onClick={exportToCSV}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* API Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="text-sm text-blue-700">
          {projectsError ? (
            <span>⚠️ Backend niet bereikbaar - gebruikt lokale mock data</span>
          ) : (
            <span>✅ Verbonden met backend API</span>
          )}
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
              onChange={(e) => setNewProject({...newProject, default_rate_cents: parseInt(e.target.value)})}
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
                  value={newEntry.project_id}
                  onChange={(e) => setNewEntry({...newEntry, project_id: e.target.value})}
                  size="10"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white h-40 overflow-y-auto"
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
                  value={newEntry.phase_code}
                  onChange={(e) => setNewEntry({...newEntry, phase_code: e.target.value})}
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
                  value={newEntry.occurred_on}
                  onChange={(e) => setNewEntry({...newEntry, occurred_on: e.target.value})}
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
                  disabled={!newEntry.project_id || !newEntry.phase_code || !newEntry.occurred_on || !newEntry.hours}
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
                value={newEntry.notes}
                onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})}
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

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Alle projecten</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name} ({project.city})
                  </option>
                ))}
              </select>
              
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">Alle periodes</option>
                <option value="week">Afgelopen week</option>
                <option value="month">Deze maand</option>
              </select>
            </div>
          </div>

          {/* Time Entries List */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Geregistreerde uren ({filteredEntries.length})</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Project</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Fase</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Datum</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Uren</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Bedrag</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Omschrijving</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                        Geen uren gevonden voor de geselecteerde filters.
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map(entry => {
                      const project = entry.projects || entry.project;
                      const phase = entry.phases || entry.phase;
                      const hours = entry.minutes ? entry.minutes / 60 : entry.hours || 0;
                      const rate = project ? (project.default_rate_cents || 0) / 100 : 0;
                      const amount = hours * rate;
                      
                      return (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium">{project?.name || 'Onbekend'}</div>
                            <div className="text-sm text-gray-600">{project?.city}</div>
                          </td>
                          <td className="px-4 py-3 text-sm">{phase?.name}</td>
                          <td className="px-4 py-3 text-sm">{new Date(entry.occurred_on).toLocaleDateString('nl-NL')}</td>
                          <td className="px-4 py-3 text-sm font-mono">{hours.toFixed(1)}h</td>
                          <td className="px-4 py-3 text-sm font-mono">€{amount.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm">{entry.notes || '-'}</td>
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
                    <div className="text-sm text-green-600">Totaal bedrag: €{summary.totalAmount.toFixed(2)}</div>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Fase</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Uren</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Bedrag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(summary.phases).map(([phaseCode, data]) => (
                      <tr key={phaseCode}>
                        <td className="px-4 py-3 text-sm font-medium">{data.phase?.name || phaseCode}</td>
                        <td className="px-4 py-3 text-sm">{data.hours.toFixed(1)}h</td>
                        <td className="px-4 py-3 text-sm">€{data.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          
          {Object.keys(projectSummary).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Geen projecten met geregistreerde uren gevonden.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ArchitectTimeTracking;
EOF