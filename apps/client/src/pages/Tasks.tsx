import React, { useState } from 'react';
import { Plus, Check, X, Edit, Trash2, Clock, CheckSquare, Square, Building, Calendar, AlertCircle } from 'lucide-react';

const TasksDemo = () => {
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all"); // "all", "work", "personal"
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    notes: "",
    project_id: "",
    priority: 3,
    due_date: "",
    type: "work" // "work" or "personal"
  });

  // Mock data
  const projects = [
    { id: '1', name: 'Villa Waterfront', city: 'Amstelveen', client_name: 'Familie Jansen' },
    { id: '2', name: 'Kantoorgebouw Centrum', city: 'Amsterdam', client_name: 'BV Vastgoed' },
    { id: '3', name: 'Wooncomplex Noord', city: 'Haarlem', client_name: 'Woningcorporatie Haarlem' }
  ];

  const tasks = [
    {
      id: '1',
      title: 'Technische tekeningen controleren',
      notes: 'Constructiedetails doorlopen met constructeur',
      status: 'todo',
      priority: 1,
      due_date: '2024-09-25',
      project_id: '1',
      type: 'work',
      created_at: '2024-09-20',
      projects: { name: 'Villa Waterfront', city: 'Amstelveen', client_name: 'Familie Jansen' }
    },
    {
      id: '2',
      title: 'Vergunning aanvraag voorbereiden',
      notes: 'Alle documenten verzamelen voor gemeente',
      status: 'in_progress',
      priority: 2,
      due_date: '2024-09-30',
      project_id: '2',
      type: 'work',
      created_at: '2024-09-18',
      projects: { name: 'Kantoorgebouw Centrum', city: 'Amsterdam', client_name: 'BV Vastgoed' }
    },
    {
      id: '3',
      title: 'Materiaalspecificaties opstellen',
      notes: null,
      status: 'done',
      priority: 3,
      due_date: null,
      project_id: '1',
      type: 'work',
      created_at: '2024-09-15',
      projects: { name: 'Villa Waterfront', city: 'Amstelveen', client_name: 'Familie Jansen' }
    },
    {
      id: '4',
      title: 'Klantpresentatie voorbereiden',
      notes: 'Visualisaties en kostenraming meenemen',
      status: 'todo',
      priority: 2,
      due_date: '2024-09-22',
      project_id: '3',
      type: 'work',
      created_at: '2024-09-19',
      projects: { name: 'Wooncomplex Noord', city: 'Haarlem', client_name: 'Woningcorporatie Haarlem' }
    },
    {
      id: '5',
      title: 'Bouwplaats inspectie',
      notes: 'Voortgang fundering controleren',
      status: 'todo',
      priority: 1,
      due_date: '2024-09-21',
      project_id: '2',
      type: 'work',
      created_at: '2024-09-20',
      projects: { name: 'Kantoorgebouw Centrum', city: 'Amsterdam', client_name: 'BV Vastgoed' }
    },
    // Privé taken
    {
      id: '6',
      title: 'Tandarts afspraak maken',
      notes: 'Halfjaarlijkse controle',
      status: 'todo',
      priority: 3,
      due_date: '2024-09-28',
      project_id: null,
      type: 'personal',
      created_at: '2024-09-19',
      projects: null
    },
    {
      id: '7',
      title: 'Boodschappen doen',
      notes: 'Melk, brood, groenten voor weekend',
      status: 'todo',
      priority: 2,
      due_date: '2024-09-21',
      project_id: null,
      type: 'personal',
      created_at: '2024-09-21',
      projects: null
    },
    {
      id: '8',
      title: 'Auto APK',
      notes: 'Vervalt eind september',
      status: 'in_progress',
      priority: 2,
      due_date: '2024-09-30',
      project_id: null,
      type: 'personal',
      created_at: '2024-09-18',
      projects: null
    },
    {
      id: '9',
      title: 'Verjaardag Moeder',
      notes: 'Cadeau bedenken en kopen',
      status: 'todo',
      priority: 1,
      due_date: '2024-09-24',
      project_id: null,
      type: 'personal',
      created_at: '2024-09-20',
      projects: null
    },
    {
      id: '10',
      title: 'Sportschool abonnement opzeggen',
      notes: 'Ga toch niet vaak genoeg',
      status: 'done',
      priority: 3,
      due_date: null,
      project_id: null,
      type: 'personal',
      created_at: '2024-09-15',
      projects: null
    }
  ];

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    // First filter by type (work/personal/all)
    if (typeFilter === "work" && task.type !== "work") return false;
    if (typeFilter === "personal" && task.type !== "personal") return false;
    
    // Then filter by status
    if (filter === "active") return task.status !== "done" && task.status !== "cancelled";
    if (filter === "completed") return task.status === "done";
    if (filter === "project" && selectedProjectFilter) return task.project_id === selectedProjectFilter;
    return true;
  });

  // Calculate statistics with work/personal split
  const workTasks = tasks.filter(task => task.type === "work");
  const personalTasks = tasks.filter(task => task.type === "personal");
  
  const activeWorkTasks = workTasks.filter(task => 
    task.status !== "done" && task.status !== "cancelled"
  ).length;
  const activePersonalTasks = personalTasks.filter(task => 
    task.status !== "done" && task.status !== "cancelled"
  ).length;
  
  const completedTasks = tasks.filter(task => task.status === "done").length;
  const inProgressTasks = tasks.filter(task => task.status === "in_progress").length;
  const overdueTasks = tasks.filter(task => 
    task.due_date && new Date(task.due_date) < new Date() && task.status !== "done"
  ).length;

  const getStatusIcon = (status) => {
    switch (status) {
      case "done": return <Check className="h-4 w-4 text-green-500" />;
      case "in_progress": return <Clock className="h-4 w-4 text-blue-500" />;
      case "cancelled": return <X className="h-4 w-4 text-red-500" />;
      default: return <Square className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "todo": return "Te doen";
      case "in_progress": return "Bezig";
      case "done": return "Afgerond";
      case "cancelled": return "Geannuleerd";
      default: return status;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1: return "text-red-600 bg-red-50";
      case 2: return "text-orange-600 bg-orange-50";
      case 3: return "text-yellow-600 bg-yellow-50";
      case 4: return "text-blue-600 bg-blue-50";
      case 5: return "text-gray-600 bg-gray-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 1: return "Zeer hoog";
      case 2: return "Hoog";
      case 3: return "Normaal";
      case 4: return "Laag";
      case 5: return "Zeer laag";
      default: return "Normaal";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const isOverdue = date < now;
    
    return {
      formatted: date.toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'short'
      }),
      isOverdue
    };
  };

  const formatCreatedDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleCreateTask = () => {
    console.log('Taak aanmaken:', formData);
    setFormData({ title: "", notes: "", project_id: "", priority: 3, due_date: "", type: "work" });
    setShowCreateDialog(false);
    alert('Taak zou worden aangemaakt!');
  };

  const handleToggleComplete = (taskId) => {
    console.log('Toggle complete voor taak:', taskId);
    alert('Status zou worden gewijzigd!');
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Taken</h1>
          <p className="text-gray-600 mt-1">Beheer je taken en project activiteiten</p>
        </div>
        
        <button
          onClick={() => setShowCreateDialog(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nieuwe taak</span>
        </button>
      </div>

      {/* Create Task Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4">Nieuwe taak aanmaken</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type taak *</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="taskType"
                      value="work"
                      checked={formData.type === "work"}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      className="mr-2"
                    />
                    <Building className="h-4 w-4 mr-1 text-blue-500" />
                    Werk
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="taskType"
                      value="personal"
                      checked={formData.type === "personal"}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      className="mr-2"
                    />
                    <CheckSquare className="h-4 w-4 mr-1 text-purple-500" />
                    Privé
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taak titel *</label>
                <input
                  type="text"
                  placeholder={formData.type === "work" ? "Bijv. Technische tekeningen controleren" : "Bijv. Tandarts afspraak maken"}
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notities (optioneel)</label>
                <input
                  type="text"
                  placeholder={formData.type === "work" ? "Extra details over het project..." : "Persoonlijke notities..."}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              {formData.type === "work" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project (optioneel)</label>
                    <select
                      value={formData.project_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, project_id: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Geen project</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name} ({project.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioriteit</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value={1}>Zeer hoog</option>
                      <option value={2}>Hoog</option>
                      <option value={3}>Normaal</option>
                      <option value={4}>Laag</option>
                      <option value={5}>Zeer laag</option>
                    </select>
                  </div>
                </div>
              )}

              {formData.type === "personal" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioriteit</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value={1}>Urgent</option>
                    <option value={2}>Belangrijk</option>
                    <option value={3}>Normaal</option>
                    <option value={4}>Kan wachten</option>
                    <option value={5}>Ooit</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.type === "work" ? "Deadline (optioneel)" : "Gewenste datum (optioneel)"}
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowCreateDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={!formData.title.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300"
                >
                  Taak aanmaken
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Werk taken</p>
              <p className="text-2xl font-bold text-blue-600">{activeWorkTasks}</p>
            </div>
            <Building className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Privé taken</p>
              <p className="text-2xl font-bold text-purple-600">{activePersonalTasks}</p>
            </div>
            <CheckSquare className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In behandeling</p>
              <p className="text-2xl font-bold text-orange-600">{inProgressTasks}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Verlopen</p>
              <p className="text-2xl font-bold text-red-600">{overdueTasks}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters and Task List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Takenlijst</h2>
            <div className="flex gap-2 flex-wrap">
              {/* Type filters */}
              <div className="flex gap-1 mr-4">
                <button
                  onClick={() => setTypeFilter("all")}
                  className={`px-3 py-1 rounded text-sm ${typeFilter === "all" ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Alles
                </button>
                <button
                  onClick={() => setTypeFilter("work")}
                  className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${typeFilter === "work" ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  <Building className="h-3 w-3" />
                  Werk
                </button>
                <button
                  onClick={() => setTypeFilter("personal")}
                  className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${typeFilter === "personal" ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  <CheckSquare className="h-3 w-3" />
                  Privé
                </button>
              </div>

              {/* Status filters */}
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 rounded text-sm ${filter === "all" ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Alle statussen
              </button>
              <button
                onClick={() => setFilter("active")}
                className={`px-3 py-1 rounded text-sm ${filter === "active" ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Actief
              </button>
              <button
                onClick={() => setFilter("completed")}
                className={`px-3 py-1 rounded text-sm ${filter === "completed" ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Afgerond
              </button>
              
              {/* Project filter - only show for work tasks */}
              {typeFilter !== "personal" && (
                <select
                  className="px-3 py-1 border rounded text-sm"
                  value={selectedProjectFilter}
                  onChange={(e) => {
                    setSelectedProjectFilter(e.target.value);
                    setFilter("project");
                  }}
                >
                  <option value="">Filter op project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>              <select
                className="px-3 py-1 border rounded text-sm"
                value={selectedProjectFilter}
                onChange={(e) => {
                  setSelectedProjectFilter(e.target.value);
                  setFilter("project");
                }}
              >
                <option value="">Filter op project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="p-4">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Geen taken gevonden</h3>
              <p className="text-gray-600 mb-4">
                {filter === "all" 
                  ? "Maak je eerste taak aan om te beginnen"
                  : `Geen ${filter === "active" ? "actieve" : filter === "completed" ? "afgeronde" : "project"} taken op dit moment`
                }
              </p>
              {filter === "all" && (
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>Taak aanmaken</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks
                .sort((a, b) => {
                  if (a.priority !== b.priority) return a.priority - b.priority;
                  if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                  const statusOrder = { "in_progress": 0, "todo": 1, "done": 2, "cancelled": 3 };
                  return statusOrder[a.status] - statusOrder[b.status];
                })
                .map((task) => {
                  const dueDate = formatDate(task.due_date);
                  return (
                    <div 
                      key={task.id} 
                      className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                        task.type === 'work' ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-purple-500'
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <button
                          onClick={() => handleToggleComplete(task.id)}
                          className="p-1 h-8 w-8 hover:bg-gray-100 rounded"
                        >
                          {task.status === "done" ? 
                            <CheckSquare className="h-5 w-5 text-green-500" /> :
                            <Square className="h-5 w-5 text-gray-400" />
                          }
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            {/* Type indicator */}
                            {task.type === 'work' ? (
                              <Building className="h-4 w-4 text-blue-500" />
                            ) : (
                              <CheckSquare className="h-4 w-4 text-purple-500" />
                            )}
                            
                            <h4 className={`font-medium ${task.status === "done" ? "line-through text-gray-500" : ""}`}>
                              {task.title}
                            </h4>
                            
                            {/* Priority with different text for work vs personal */}
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.type === 'work' ? getPriorityText(task.priority) : getPersonalPriorityText(task.priority)}
                            </span>
                            
                            <div className="flex items-center gap-1">
                              {getStatusIcon(task.status)}
                              <span className="text-xs text-gray-500">
                                {getStatusText(task.status)}
                              </span>
                            </div>
                          </div>
                          
                          {task.notes && (
                            <p className="text-sm text-gray-600 mb-1">{task.notes}</p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {/* Only show project info for work tasks */}
                            {task.type === 'work' && task.projects && (
                              <div className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                <span>{task.projects.name} ({task.projects.city})</span>
                              </div>
                            )}
                            
                            {/* Show type badge for clarity */}
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                              task.type === 'work' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {task.type === 'work' ? 'Werk' : 'Privé'}
                            </span>
                            
                            {dueDate && (
                              <div className={`flex items-center gap-1 ${dueDate.isOverdue ? 'text-red-600 font-medium' : ''}`}>
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {task.type === 'work' ? 'Deadline:' : 'Datum:'} {dueDate.formatted}
                                </span>
                                {dueDate.isOverdue && <AlertCircle className="h-3 w-3" />}
                              </div>
                            )}
                            
                            <span>Aangemaakt: {formatCreatedDate(task.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => alert('Edit functionaliteit!')}
                          className="p-2 hover:bg-gray-100 rounded text-gray-600"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => alert('Delete functionaliteit!')}
                          className="p-2 hover:bg-gray-100 rounded text-gray-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TasksDemo;