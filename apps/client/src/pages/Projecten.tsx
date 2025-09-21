import React, { useState } from 'react';
import { Building, MapPin, User, Euro, Archive, RotateCcw, Plus } from 'lucide-react';

const ProjectenDemo = () => {
  const [showArchived, setShowArchived] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    client_name: "",
    default_rate_cents: 8500,
  });

  // Mock data
  const activeProjects = [
    {
      id: '1',
      name: 'Villa Waterfront',
      city: 'Amstelveen',
      client_name: 'Familie Jansen',
      default_rate_cents: 8500,
      archived: false,
      created_at: '2024-01-15'
    },
    {
      id: '2',
      name: 'Kantoorgebouw Centrum',
      city: 'Amsterdam',
      client_name: 'BV Vastgoed',
      default_rate_cents: 9500,
      archived: false,
      created_at: '2024-02-20'
    },
    {
      id: '3',
      name: 'Wooncomplex Noord',
      city: 'Haarlem',
      client_name: 'Woningcorporatie Haarlem',
      default_rate_cents: 7500,
      archived: false,
      created_at: '2024-03-10'
    }
  ];

  const archivedProjects = [
    {
      id: '4',
      name: 'Renovatie Herenhuis',
      city: 'Utrecht',
      client_name: 'Familie De Vries',
      default_rate_cents: 8000,
      archived: true,
      created_at: '2023-08-15'
    }
  ];

  const projects = showArchived ? archivedProjects : activeProjects;

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Project toevoegen:', formData);
    setFormData({
      name: "",
      city: "",
      client_name: "",
      default_rate_cents: 8500,
    });
    setShowForm(false);
    alert('Project zou worden toegevoegd!');
  };

  const formatRate = (cents) => {
    if (!cents) return "Geen tarief";
    return `€${(cents / 100).toFixed(0)}/uur`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('nl-NL');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Projecten</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nieuw project</span>
        </button>
      </div>

      {/* Project Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Nieuw project toevoegen</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Projectnaam *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Villa Waterfront, Kantoorgebouw Centrum, etc."
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Woonplaats
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  placeholder="Amsterdam, Haarlem, etc."
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opdrachtgever
                </label>
                <input
                  type="text"
                  value={formData.client_name}
                  onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                  placeholder="Familie Jansen, BV Vastgoed, etc."
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Standaard uurtarief (€)
                </label>
                <input
                  type="number"
                  value={formData.default_rate_cents / 100}
                  onChange={(e) => setFormData({
                    ...formData, 
                    default_rate_cents: Math.round(parseFloat(e.target.value || "0") * 100)
                  })}
                  placeholder="85"
                  step="1"
                  min="0"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={!formData.name}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg"
              >
                Project toevoegen
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Annuleren
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex space-x-2">
        <button
          onClick={() => setShowArchived(false)}
          className={`px-4 py-2 rounded-lg ${!showArchived ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Actieve projecten ({activeProjects.length})
        </button>
        <button
          onClick={() => setShowArchived(true)}
          className={`px-4 py-2 rounded-lg ${showArchived ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Gearchiveerde projecten ({archivedProjects.length})
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(project => (
          <div key={project.id} className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  {project.name}
                </h3>
                
                {project.city && (
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {project.city}
                  </div>
                )}
                
                {project.client_name && (
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <User className="w-4 h-4 mr-1" />
                    {project.client_name}
                  </div>
                )}
                
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <Euro className="w-4 h-4 mr-1" />
                  {formatRate(project.default_rate_cents)}
                </div>
                
                <div className="text-xs text-gray-500">
                  Aangemaakt: {formatDate(project.created_at)}
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                {project.archived ? (
                  <button
                    onClick={() => alert('Project zou worden hersteld!')}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                    title="Project herstellen"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Herstel</span>
                  </button>
                ) : (
                  <button
                    onClick={() => alert('Project zou worden gearchiveerd!')}
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 text-sm"
                    title="Project archiveren"
                  >
                    <Archive className="w-4 h-4" />
                    <span>Archiveer</span>
                  </button>
                )}
              </div>
            </div>

            {/* Project Status Badge */}
            <div className="flex justify-between items-center">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                project.archived 
                  ? 'bg-gray-100 text-gray-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {project.archived ? 'Gearchiveerd' : 'Actief'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {projects.length === 0 && (
        <div className="text-center py-8">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-500 mb-2">
            {showArchived ? 'Geen gearchiveerde projecten' : 'Nog geen actieve projecten'}
          </div>
          {!showArchived && (
            <button
              onClick={() => setShowForm(true)}
              className="text-blue-600 hover:text-blue-800"
            >
              Voeg je eerste project toe
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectenDemo;