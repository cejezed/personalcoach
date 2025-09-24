import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, X, Edit, Trash2, Clock, CheckSquare, Square, Building, Calendar, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Calendar as CalendarIcon } from "lucide-react";

type TaskStatus = "todo" | "in_progress" | "done" | "cancelled";
type TaskType = "work" | "personal";
type FilterType = "all" | "active" | "completed";

interface Task {
  id: string;
  title: string;
  notes?: string | null;
  status: TaskStatus;
  priority: number;
  due_date?: string | null;
  project_id?: string | null;
  type: TaskType;
  created_at: string;
  projects?: {
    name: string;
    city: string;
    client_name: string;
  };
}

const Tasks = () => {
  const queryClient = useQueryClient();
  
  // API calls (met auth + relatieve paden)
  const { data: tasks = [], isLoading: tasksLoading, isError: tasksError, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api<Task[]>('/api/tasks', {}, { withAuth: true }),
    staleTime: 2 * 60 * 1000
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api<any[]>('/api/projects', {}, { withAuth: true }),
    staleTime: 5 * 60 * 1000
  });

  // Mutations (ook met auth)
  const addTaskMutation = useMutation({
    mutationFn: (newTask: Partial<Task>) =>
      api<Task>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(newTask)
      }, { withAuth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setFormData({ title: "", notes: "", project_id: "", priority: 3, due_date: "", type: "work" });
      setShowCreateDialog(false);
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<Task> & { id: string }) =>
      api<Task>(`/api/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }, { withAuth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) =>
      api<null>(`/api/tasks/${id}`, {
        method: 'DELETE'
      }, { withAuth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  // Local state
  const [filter, setFilter] = useState<FilterType>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | TaskType>("all");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    notes: "",
    project_id: "",
    priority: 3,
    due_date: "",
    type: "work" as TaskType
  });

  // Filter tasks
  const filteredTasks = Array.isArray(tasks)
    ? tasks.filter((task: Task) => {
        if (typeFilter === "work" && task.type !== "work") return false;
        if (typeFilter === "personal" && task.type !== "personal") return false;
        if (selectedProjectFilter && task.project_id !== selectedProjectFilter) return false;
        if (filter === "active") return task.status !== "done";
        if (filter === "completed") return task.status === "done";
        return true;
      })
    : [];

  // Statistics
  const activeWorkTasks = tasks.filter((t: Task) => t.type === "work" && t.status !== "done").length;
  const activePersonalTasks = tasks.filter((t: Task) => t.type === "personal" && t.status !== "done").length;
  const inProgressTasks = tasks.filter((t: Task) => t.status === "in_progress").length;
  const overdueTasks = tasks.filter((t: Task) =>
    t.due_date && new Date(t.due_date) < new Date() && t.status !== "done"
  ).length;

  const handleCreateTask = () => {
    if (!formData.title.trim()) return;
    const newTask = {
      ...formData,
      priority: Number(formData.priority),
      status: "todo" as TaskStatus,
      project_id: formData.project_id || null,
      due_date: formData.due_date || null,
      notes: formData.notes || null
    };
    addTaskMutation.mutate(newTask);
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    updateTaskMutation.mutate({ id: taskId, ...updates });
  };

  const handleToggleComplete = (task: Task) => {
    const newStatus: TaskStatus = task.status === "done" ? "todo" : "done";
    handleUpdateTask(task.id, { status: newStatus });
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      notes: task.notes || "",
      project_id: task.project_id || "",
      priority: task.priority,
      due_date: task.due_date || "",
      type: task.type
    });
  };

  const handleEditTask = () => {
    if (!editingTask || !formData.title.trim()) return;
    const updates: Partial<Task> = {
      title: formData.title,
      notes: formData.notes || null,
      project_id: formData.project_id || null,
      priority: Number(formData.priority),
      due_date: formData.due_date || null,
      type: formData.type
    };
    handleUpdateTask(editingTask.id, updates);
    setEditingTask(null);
    setFormData({ title: "", notes: "", project_id: "", priority: 3, due_date: "", type: "work" });
  };

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return "text-red-600 bg-red-50 border-red-200";
    if (priority === 2) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  const getPriorityText = (priority: number) => {
    if (priority === 1) return "Hoog";
    if (priority === 2) return "Medium";
    return "Laag";
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "done": return <Check className="h-4 w-4 text-green-500" />;
      case "in_progress": return <Clock className="h-4 w-4 text-blue-500" />;
      case "cancelled": return <X className="h-4 w-4 text-red-500" />;
      default: return <Square className="h-4 w-4 text-gray-400" />;
    }
  };

  if (tasksLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Taken laden...</div>
        </div>
      </div>
    );
  }

  if (tasksError) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-red-600">Kon taken niet laden: {(error as Error)?.message || 'Onbekende fout'}</div>
      </div>
    );
  }

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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="border border-gray-300 rounded-md px-3 py-2 w-full"
            >
              <option value="all">Alle taken</option>
              <option value="active">Actieve taken</option>
              <option value="completed">Afgeronde taken</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as "all" | TaskType)}
              className="border border-gray-300 rounded-md px-3 py-2 w-full"
            >
              <option value="all">Alle types</option>
              <option value="work">Werk</option>
              <option value="personal">Privé</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
            <select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 w-full"
            >
              <option value="">Alle projecten</option>
              {projects.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Taken ({filteredTasks.length})</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Geen taken gevonden</h3>
              <p className="text-gray-600">Maak je eerste taak aan om te beginnen</p>
            </div>
          ) : (
            filteredTasks.map((task: Task) => (
              <div key={task.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className="mt-1"
                    >
                      {task.status === "done" ? 
                        <CheckSquare className="h-5 w-5 text-green-500" /> :
                        <Square className="h-5 w-5 text-gray-400" />
                      }
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className={`font-medium ${task.status === "done" ? "line-through text-gray-500" : "text-gray-900"}`}>
                          {task.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(task.priority)}`}>
                          {getPriorityText(task.priority)}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${task.type === "work" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
                          {task.type === "work" ? "Werk" : "Privé"}
                        </span>
                      </div>
                      
                      {task.notes && (
                        <p className="text-sm text-gray-600 mb-2">{task.notes}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {task.due_date && (
                          <span className="flex items-center space-x-1">
                            <CalendarIcon className="h-3 w-3" />
                            <span>{new Date(task.due_date).toLocaleDateString('nl-NL')}</span>
                          </span>
                        )}
                        
                        {task.projects && (
                          <span className="flex items-center space-x-1">
                            <Building className="h-3 w-3" />
                            <span>{task.projects.name}</span>
                          </span>
                        )}
                        
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(task.status)}
                          <span>{task.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    <button
                      onClick={() => openEditDialog(task)}
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Weet je zeker dat je deze taak wilt verwijderen?')) {
                          deleteTaskMutation.mutate(task.id);
                        }
                      }}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Task Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4">Nieuwe taak aanmaken</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full"
                  placeholder="Taak titel..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notities</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full h-20"
                  placeholder="Optionele notities..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as TaskType})}
                    className="border border-gray-300 rounded-md px-3 py-2 w-full"
                  >
                    <option value="work">Werk</option>
                    <option value="personal">Privé</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioriteit</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                    className="border border-gray-300 rounded-md px-3 py-2 w-full"
                  >
                    <option value={3}>Laag</option>
                    <option value={2}>Medium</option>
                    <option value={1}>Hoog</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Verloopdatum</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full"
                >
                  <option value="">Geen project</option>
                  {projects.map((project: any) => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Annuleren
              </button>
              <button
                onClick={handleCreateTask}
                disabled={!formData.title.trim() || addTaskMutation.isPending}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-300"
              >
                {addTaskMutation.isPending ? 'Aanmaken...' : 'Taak aanmaken'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Dialog */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4">Taak bewerken</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notities</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full h-20"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as TaskType})}
                    className="border border-gray-300 rounded-md px-3 py-2 w-full"
                  >
                    <option value="work">Werk</option>
                    <option value="personal">Privé</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioriteit</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                    className="border border-gray-300 rounded-md px-3 py-2 w-full"
                  >
                    <option value={3}>Laag</option>
                    <option value={2}>Medium</option>
                    <option value={1}>Hoog</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Verloopdatum</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full"
                >
                  <option value="">Geen project</option>
                  {projects.map((project: any) => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setEditingTask(null);
                  setFormData({ title: "", notes: "", project_id: "", priority: 3, due_date: "", type: "work" });
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Annuleren
              </button>
              <button
                onClick={handleEditTask}
                disabled={!formData.title.trim() || updateTaskMutation.isPending}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-300"
              >
                {updateTaskMutation.isPending ? 'Opslaan...' : 'Wijzigingen opslaan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
