import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar, FileText, Euro, Download, Archive, Edit, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

const ArchitectTimeTracking = () => {
  const queryClient = useQueryClient();

  // API calls
  const { data: projects = [], isLoading: projectsLoading, refetch: refetchProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api('/api/projects'),
    staleTime: 5 * 60 * 1000
  });

  const { data: phases = [], isLoading: phasesLoading } = useQuery({
    queryKey: ['phases'],
    queryFn: () => api('/api/phases'),
    staleTime: 10 * 60 * 1000
  });

  const { data: timeEntries = [], refetch: refetchTimeEntries } = useQuery({
    queryKey: ['time-entries'],
    queryFn: () => api('/api/time-entries'),
    staleTime: 1 * 60 * 1000
  });

  // Mutations
  const addProjectMutation = useMutation({
    mutationFn: (newProject) => api('/api/projects', {
      method: 'POST',
      body: JSON.stringify(newProject)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
    }
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, ...data }) => api(`/api/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
    }
  });

  const archiveProjectMutation = useMutation({
    mutationFn: (id) => api(`/api/projects/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
    }
  });

  const addTimeEntryMutation = useMutation({
    mutationFn: (newEntry) => {
      const { hours, ...rest } = newEntry;
      const entryData = { ...rest, minutes: Math.round(parseFloat(hours) * 60) };
      return api('/api/time-entries', {
        method: 'POST',
        body: JSON.stringify(entryData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['time-entries']);
    }
  });

  // Local state
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
    hourly_rate: '',
    phase_rates: {
      'schetsontwerp': '',
      'voorlopig-ontwerp': '',
      'definitief-ontwerp': '',
      'bouwvoorbereiding': '',
      'uitvoering': ''
    }
  });

  const [editingProject, setEditingProject] = useState(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [viewMode, setViewMode] = useState('entries');
  const [filterProject, setFilterProject] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');

  const selectedProject = projects.find(p => p.id === newEntry.project_id);

  const addProject = () => {
    if (newProject.name && newProject.city && newProject.client_name && newProject.hourly_rate) {
      const projectData = {
        ...newProject,
        hourly_rate: parseFloat(newProject.hourly_rate),
        phase_rates: Object.fromEntries(
          Object.entries(newProject.phase_rates)
            .filter(([_, value]) => value !== '')
            .map(([key, value]) => [key, parseFloat(value)])
        )
      };
      
      addProjectMutation.mutate(projectData);
      setNewProject({
        name: '',
        city: '',
        client_name: '',
        hourly_rate: '',
        phase_rates: {
          'schetsontwerp': '',
          'voorlopig-ontwerp': '',
          'definitief-ontwerp': '',
          'bouwvoorbereiding': '',
          'uitvoering': ''
        }
      });
      setShowNewProject(false);
    }
  };

  const updateProject = () => {
    if (editingProject && editingProject.name && editingProject.city && editingProject.client_name && editingProject.hourly_rate) {
      const projectData = {
        ...editingProject,
        hourly_rate: parseFloat(editingProject.hourly_rate),
        phase_rates: Object.fromEntries(
          Object.entries(editingProject.phase_rates || {})
            .filter(([_, value]) => value !== '')
            .map(([key, value]) => [key, parseFloat(value)])
        )
      };
      
      updateProjectMutation.mutate({ id: editingProject.id, ...projectData });
      setEditingProject(null);
    }
  };

  const archiveProject = (id) => {
    if (window.confirm('Weet je zeker dat je dit project wilt archiveren?')) {
      archiveProjectMutation.mutate(id);
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

  // Calculate rate for selected project and phase
  const getEffectiveRate = (project, phaseCode) => {
    if (!project) return 0;
    
    // Check if there's a specific rate for this phase
    const phaseRate = project.phase_rates?.[phaseCode];
    if (phaseRate) return phaseRate;
    
    // Fall back to hourly rate
    return project.hourly_rate || 0;
  };

  // Export functionality
  const exportToCSV = () => {
    const headers = ['Project', 'Fase', 'Datum', 'Uren', 'Omschrijving', 'Uurtarief', 'Bedrag'];
    const rows = timeEntries.map(entry => {
      const project = entry.projects || entry.project;
      const phase = entry.phases || entry.phase;
      const hours = entry.minutes ? entry.minutes / 60 : entry.hours || 0;
      const rate = getEffectiveRate(project, entry.phase_code);
      const amount = hours * rate;
      
      return [
        project?.name || 'Onbekend',
        phase?.name || 'Onbekend',
        entry.occurred_on,
        hours.toFixed(1),
        entry.notes || '',
        `€${rate.toFixed(2)}`,
        `€${amount.toFixed(2)}`
      ];
    });

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
      const rate = getEffectiveRate(project, entry.phase_code);
      const amount = hours * rate;
      
      if (!summary[entry.project_id].phases[entry.phase_code]) {
        summary[entry.project_id].phases[entry.phase_code] = {
          hours: 0,
          amount: 0,
          phase: entry.phases || entry.phase,
          rate: rate
        };
      }
      
      summary[entry.project_id].phases[entry.phase_code].hours += hours;
      summary[entry.project_id].phases[entry.phase_code].amount += amount;
      summary[entry.project_id].totalHours += hours;
      summary[entry.project_id].totalAmount += amount;
    });
    
    return summary;
  }, [timeEntries]);

  if (projectsLoading || phasesLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Gegevens laden...</div>
        </div>
      </div>
    );
  }

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
            onClick={() => setViewMode('projects')}
            className={`px-4 py-2 rounded-lg ${viewMode === 'projects' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Projecten
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
              placeholder="Standaard uurtarief (€)"
              value={newProject.hourly_rate}
              onChange={(e) => setNewProject({...newProject, hourly_rate: e.target.value})}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          
          <div className="mb-4">
            <h3 className="text-md font-medium mb-2">Vaste bedragen per fase (optioneel)</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Object.entries(newProject.phase_rates).map(([phaseCode, value]) => {
                const phaseName = phases.find(p => p.code === phaseCode)?.name || phaseCode;
                return (
                  <div key={phaseCode}>
                    <label className="block text-sm text-gray-700 mb-1">{phaseName}</label>
                    <input
                      type="number"
                      placeholder="€"
                      value={value}
                      onChange={(e) => setNewProject({
                        ...newProject,
                        phase_rates: { ...newProject.phase_rates, [phaseCode]: e.target.value }
                      })}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    />
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={addProject}
              disabled={addProjectMutation.isLoading}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              {addProjectMutation.isLoading ? 'Toevoegen...' : 'Project toevoegen'}
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

      {/* Edit Project Form */}
      {editingProject && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h2 className="text-lg font-semibold mb-4">Project bewerken</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <input
              type="text"
              placeholder="Projectnaam"
              value={editingProject.name}
              onChange={(e) => setEditingProject({...editingProject, name: e.target.value})}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
            <input
              type="text"
              placeholder="Woonplaats"
              value={editingProject.city}
              onChange={(e) => setEditingProject({...editingProject, city: e.target.value})}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
            <input
              type="text"
              placeholder="Opdrachtgever"
              value={editingProject.client_name}
              onChange={(e) => setEditingProject({...editingProject, client_name: e.target.value})}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
            <input
              type="number"
              placeholder="Standaard uurtarief (€)"
              value={editingProject.hourly_rate}
              onChange={(e) => setEditingProject({...editingProject, hourly_rate: e.target.value})}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          
          <div className="mb-4">
            <h3 className="text-md font-medium mb-2">Vaste bedragen per fase</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {['schetsontwerp', 'voorlopig-ontwerp', 'definitief-ontwerp', 'bouwvoorbereiding', 'uitvoering'].map(phaseCode => {
                const phaseName = phases.find(p => p.code === phaseCode)?.name || phaseCode;
                const value = editingProject.phase_rates?.[phaseCode] || '';
                return (
                  <div key={phaseCode}>
                    <label className="block text-sm text-gray-700 mb-1">{phaseName}</label>
                    <input
                      type="number"
                      placeholder="€"
                      value={value}
                      onChange={(e) => setEditingProject({
                        ...editingProject,
                        phase_rates: { ...editingProject.phase_rates, [phaseCode]: e.target.value }
                      })}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    />
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={updateProject}
              disabled={updateProjectMutation.isLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              {updateProjectMutation.isLoading ? 'Opslaan...' : 'Wijzigingen opslaan'}
            </button>
            <button
              onClick={() => setEditingProject(null)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}

      {viewMode === 'projects' && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Projecten beheer</h2>
              <button
                onClick={() => setShowNewProject(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nieuw project</span>
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Project</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Locatie</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Opdrachtgever</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Uurtarief</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Vaste bedragen</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {projects.map(project => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{project.name}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">{project.city}</td>
                    <td className="px-4 py-3 text-sm">{project.client_name}</td>
                    <td className="px-4 py-3 text-sm">€{project.hourly_rate?.toFixed(2) || '0.00'}</td>
                    <td className="px-4 py-3 text-sm">
                      {project.phase_rates && Object.keys(project.phase_rates).length > 0 ? (
                        <div className="text-xs">
                          {Object.entries(project.phase_rates).map(([phase, rate]) => (
                            <div key={phase}>{phases.find(p => p.code === phase)?.name}: €{rate}</div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">Geen vaste bedragen</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingProject({
                            ...project,
                            hourly_rate: project.hourly_rate?.toString() || '',
                            phase_rates: project.phase_rates || {}
                          })}
                          className="text-blue-600 hover:text-blue-900"
                          title="Bewerken"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => archiveProject(project.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Archiveren"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                  disabled={!newEntry.project_id || !newEntry.phase_code || !newEntry.occurred_on || !newEntry.hours || addTimeEntryMutation.isLoading}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-2 py-1 rounded text-sm font-medium h-8"
                >
                  {addTimeEntryMutation.isLoading ? 'Bezig...' : 'Toevoegen'}
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
            
            {selectedProject && newEntry.phase_code && newEntry.hours && (
              <div className="text-sm text-gray-600 mb-2 p-2 bg-blue-50 rounded">
                <span className="font-medium">Project:</span> {selectedProject.name} | 
                <span className="font-medium"> Tarief:</span> €{getEffectiveRate(selectedProject, newEntry.phase_code).toFixed(2)} | 
                <span className="font-medium"> Bedrag:</span> €{(parseFloat(newEntry.hours || 0) * getEffectiveRate(selectedProject, newEntry.phase_code)).toFixed(2)}
                {selectedProject.phase_rates?.[newEntry.phase_code] && (
                  <span className="text-blue-600"> (vast bedrag)</span>
                )}
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
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tarief</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Bedrag</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Omschrijving</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                        Geen uren gevonden voor de geselecteerde filters.
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map(entry => {
                      const project = entry.projects || entry.project;
                      const phase = entry.phases || entry.phase;
                      const hours = entry.minutes ? entry.minutes / 60 : entry.hours || 0;
                      const rate = getEffectiveRate(project, entry.phase_code);
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
                          <td className="px-4 py-3 text-sm font-mono">
                            €{rate.toFixed(2)}
                            {project?.phase_rates?.[entry.phase_code] && (
                              <span className="text-blue-600 ml-1">(vast)</span>
                            )}
                          </td>
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
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tarief</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Bedrag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(summary.phases).map(([phaseCode, data]) => (
                      <tr key={phaseCode}>
                        <td className="px-4 py-3 text-sm font-medium">{data.phase?.name || phaseCode}</td>
                        <td className="px-4 py-3 text-sm">{data.hours.toFixed(1)}h</td>
                        <td className="px-4 py-3 text-sm">
                          €{data.rate?.toFixed(2)}
                          {summary.project.phase_rates?.[phaseCode] && (
                            <span className="text-blue-600 ml-1">(vast)</span>
                          )}
                        </td>
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