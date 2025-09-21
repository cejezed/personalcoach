import React, { useState } from 'react';
import { Plus, Check, X, Edit, Trash2, Clock, CheckSquare, Square, Building, Calendar, AlertCircle } from 'lucide-react';

const Tasks = () => {
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    notes: "",
    project_id: "",
    priority: 3,
    due_date: "",
    type: "work"
  });

  // Mock data - later vervangen door echte API calls
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
    }
  ];

  // Filter en helper functies
  const filteredTasks = tasks.filter(task => {
    if (typeFilter === "work" && task.type !== "work") return false;
    if (typeFilter === "personal" && task.type !== "personal") return false;
    if (filter === "active") return task.status !== "done";
    if (filter === "completed") return task.status === "done";
    return true;
  });

  const activeWorkTasks = tasks.filter(task => task.type === "work" && task.status !== "done").length;
  const activePersonalTasks = tasks.filter(task => task.type === "personal" && task.status !== "done").length;
  const inProgressTasks = tasks.filter(task => task.status === "in_progress").length;
  const overdueTasks = tasks.filter(task => 
    task.due_date && new Date(task.due_date) < new Date() && task.status !== "done"
  ).length;

  const handleCreateTask = () => {
    console.log('Taak aanmaken:', formData);
    setFormData({ title: "", notes: "", project_id: "", priority: 3, due_date: "", type: "work" });
    setShowCreateDialog(false);
    alert('Taak zou worden aangemaakt!');
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

      {/* Task List placeholder */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h2 className="text-lg font-semibold mb-4">Takenlijst</h2>
        <div className="text-center py-8">
          <p className="text-gray-500">Takenlijst wordt geladen...</p>
        </div>
      </div>
    </div>
  );
};

export default Tasks;