import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Calendar,
  CheckSquare,
  Plus,
  Euro,
  Activity,
  Star,
  Circle,
  CheckCircle,
  Calendar as CalendarIcon,
  MapPin,
  X,
  ExternalLink,
  Lightbulb,
  Upload,
  Image,
} from "lucide-react";
import { api } from "@/lib/api";

/* =======================
   Types
======================= */
type Task = {
  id: string;
  title: string;
  notes?: string | null;
  status: "todo" | "in_progress" | "done" | "cancelled";
  priority: number;
  due_date?: string | null;
  project_id?: string | null;
  type: "work" | "personal";
  created_at: string;
  projects?: {
    name: string;
    city: string;
  };
};

type CalendarEvent = {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  location?: string;
  attendees?: string[];
  description?: string;
  is_all_day: boolean;
  source: "gmail" | "manual";
};

type Project = {
  id: string;
  name: string;
  city?: string;
  client_name?: string;
};

type Idea = {
  id?: string;
  title: string;
  description: string;
  category: "business" | "project" | "personal" | "creative" | "other";
  priority: "low" | "medium" | "high";
  image?: File | null;
};

/* =======================
   Helpers
======================= */
const formatTime = (dateString: string) =>
  new Date(dateString).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("nl-NL", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

const isToday = (dateString: string) => {
  const today = new Date().toDateString();
  const date = new Date(dateString).toDateString();
  return today === date;
};

const isTomorrow = (dateString: string) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = new Date(dateString).toDateString();
  return tomorrow.toDateString() === date;
};

const getPriorityColor = (priority: number) => {
  switch (priority) {
    case 1:
      return "text-red-600 bg-red-50 border-red-200";
    case 2:
      return "text-orange-600 bg-orange-50 border-orange-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
};

const getPriorityText = (priority: number) => {
  switch (priority) {
    case 1:
      return "Hoog";
    case 2:
      return "Medium";
    default:
      return "Laag";
  }
};

/* =======================
   Component
======================= */
export default function Dashboard() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  const [currentTime, setCurrentTime] = useState(new Date());
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showCalendarAuth, setShowCalendarAuth] = useState(false);
  const [showIdeaForm, setShowIdeaForm] = useState(false);

  /* ---- Task Form State ---- */
  const [taskForm, setTaskForm] = useState({
    title: "",
    notes: "",
    priority: 3,
    due_date: "",
    project_id: "",
    type: "work" as "work" | "personal",
  });

  /* ---- Idea Form State ---- */
  const [ideaForm, setIdeaForm] = useState({
    title: "",
    description: "",
    category: "other" as "business" | "project" | "personal" | "creative" | "other",
    priority: "medium" as "low" | "medium" | "high",
    image: null as File | null,
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* ---- Queries ---- */
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: () => api<Task[]>("/api/tasks"),
    staleTime: 5 * 60 * 1000,
  });

  const { data: ideas = [] } = useQuery<Idea[]>({
    queryKey: ["ideas"],
    queryFn: () => api<Idea[]>("/api/ideas"),
    staleTime: 5 * 60 * 1000,
  });

  const { data: todayEvents = [] } = useQuery<CalendarEvent[]>({
    queryKey: ["calendar-events", today],
    queryFn: () => api<CalendarEvent[]>(`/api/calendar/events?date=${today}`),
    staleTime: 5 * 60 * 1000,
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: () => api<Project[]>("/api/projects"),
    staleTime: 10 * 60 * 1000,
  });

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => ({
      hoursToday: 7.5,
      hoursWeek: 32.5,
      openBilling: 2450,
      activeTasks: tasks.filter((t) => t.status !== "done").length,
      stepsToday: 8432,
      workoutsToday: 2,
      energyLevel: 4,
    }),
    staleTime: 5 * 60 * 1000,
  });

  /* ---- Mutations ---- */
  const addTaskMutation = useMutation({
    mutationFn: (newTask: Partial<Task>) =>
      api<Task>("/api/tasks", {
        method: "POST",
        body: JSON.stringify(newTask),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setTaskForm({
        title: "",
        notes: "",
        priority: 3,
        due_date: "",
        project_id: "",
        type: "work",
      });
      setShowTaskForm(false);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<Task> & { id: string }) =>
      api<Task>(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const addIdeaMutation = useMutation({
    mutationFn: async (newIdea: Partial<Idea> & { image?: File }) => {
      const formData = new FormData();
      formData.append("title", newIdea.title || "");
      formData.append("description", newIdea.description || "");
      formData.append("category", (newIdea.category as string) || "other");
      formData.append("priority", (newIdea.priority as string) || "medium");
      if (newIdea.image) formData.append("image", newIdea.image);

      const res = await fetch("/api/ideas", { method: "POST", body: formData });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      setIdeaForm({
        title: "",
        description: "",
        category: "other",
        priority: "medium",
        image: null,
      });
      setShowIdeaForm(false);
    },
  });

  const connectCalendarMutation = useMutation({
    mutationFn: () => api("/api/calendar/connect", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      setShowCalendarAuth(false);
    },
  });

  /* ---- Handlers ---- */
  const handleTaskSubmit = () => {
    if (!taskForm.title.trim()) return;
    addTaskMutation.mutate({
      ...taskForm,
      status: "todo",
      project_id: taskForm.project_id || null,
      due_date: taskForm.due_date || null,
      notes: taskForm.notes || null,
    });
  };

  const handleIdeaSubmit = () => {
    if (!ideaForm.title.trim()) return;
    addIdeaMutation.mutate({
      title: ideaForm.title,
      description: ideaForm.description,
      category: ideaForm.category,
      priority: ideaForm.priority,
      image: ideaForm.image || undefined,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) setIdeaForm((f) => ({ ...f, image: file }));
  };

  const toggleTaskComplete = (task: Task) => {
    const newStatus = task.status === "done" ? "todo" : "done";
    updateTaskMutation.mutate({ id: task.id, status: newStatus });
  };

  /* ---- Derived ---- */
  const todayTasks = tasks.filter(
    (task) => isToday(task.created_at) || (task.due_date && isToday(task.due_date))
  );

  const upcomingTasks = tasks
    .filter((task) => task.status !== "done" && task.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5);

  const upcomingEvents = todayEvents
    .filter((event) => new Date(event.start_time) > currentTime)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 3);

  /* ---- UI ---- */
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            {currentTime.toLocaleDateString("nl-NL", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">
            {currentTime.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div className="text-sm text-gray-500">Live tijd</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => setShowTaskForm(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl px-6 py-4 text-left transition-all shadow-sm"
        >
          <div className="flex items-center gap-3">
            <Plus className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">Nieuwe Taak</h3>
              <p className="text-sm opacity-90">Voeg een taak toe aan je lijst</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setShowIdeaForm(true)}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-xl px-6 py-4 text-left transition-all shadow-sm"
        >
          <div className="flex items-center gap-3">
            <Lightbulb className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">Snel Idee</h3>
              <p className="text-sm opacity-90">Noteer een plotseling inzicht</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setShowCalendarAuth(true)}
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl px-6 py-4 text-left transition-all shadow-sm"
        >
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">Gmail Agenda</h3>
              <p className="text-sm opacity-90">Koppel je Google agenda</p>
            </div>
          </div>
        </button>

        <button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl px-6 py-4 text-left transition-all shadow-sm">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">Timer Starten</h3>
              <p className="text-sm opacity-90">Begin met tijd registreren</p>
            </div>
          </div>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Uren Vandaag</p>
              <p className="text-2xl font-bold text-blue-600">{stats?.hoursToday || 0}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Actieve Taken</p>
              <p className="text-2xl font-bold text-green-600">
                {tasks.filter((t) => t.status !== "done").length}
              </p>
            </div>
            <CheckSquare className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ideeën</p>
              <p className="text-2xl font-bold text-yellow-600">{ideas.length}</p>
            </div>
            <Lightbulb className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open Facturatie</p>
              <p className="text-2xl font-bold text-orange-600">€{stats?.openBilling || 0}</p>
            </div>
            <Euro className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stappen</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats?.stepsToday?.toLocaleString() || 0}
              </p>
            </div>
            <Activity className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Tasks */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-blue-500" />
                  Taken Vandaag
                </h2>
                <span className="text-sm text-gray-500">
                  {todayTasks.filter((t) => t.status === "done").length} van {todayTasks.length} voltooid
                </span>
              </div>
            </div>

            <div className="p-6">
              {todayTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nog geen taken voor vandaag
                  </h3>
                  <button
                    onClick={() => setShowTaskForm(true)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Voeg je eerste taak toe
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayTasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all hover:shadow-sm ${
                        task.status === "done"
                          ? "bg-green-50 border-green-200"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <button onClick={() => toggleTaskComplete(task)} className="mt-0.5">
                        {task.status === "done" ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400 hover:text-green-400" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3
                            className={`font-medium ${
                              task.status === "done" ? "line-through text-gray-500" : "text-gray-900"
                            }`}
                          >
                            {task.title}
                          </h3>
                          <span
                            className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(
                              task.priority
                            )}`}
                          >
                            {getPriorityText(task.priority)}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              task.type === "work"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {task.type === "work" ? "Werk" : "Privé"}
                          </span>
                        </div>

                        {task.notes && <p className="text-sm text-gray-600 mb-2">{task.notes}</p>}

                        {task.projects && (
                          <div className="text-xs text-gray-500">📁 {task.projects.name}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-500" />
                Aankomende Taken
              </h2>
            </div>

            <div className="p-6">
              {upcomingTasks.length === 0 ? (
                <p className="text-gray-600 text-center py-4">Geen taken met deadlines</p>
              ) : (
                <div className="space-y-3">
                  {upcomingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                        {task.projects && (
                          <p className="text-sm text-gray-600">📁 {task.projects.name}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-sm font-medium ${
                            task.due_date && isToday(task.due_date)
                              ? "text-red-600"
                              : task.due_date && isTomorrow(task.due_date)
                              ? "text-orange-600"
                              : "text-gray-600"
                          }`}
                        >
                          {task.due_date &&
                            (isToday(task.due_date)
                              ? "Vandaag"
                              : isTomorrow(task.due_date)
                              ? "Morgen"
                              : formatDate(task.due_date))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Today's Schedule */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-green-500" />
                Agenda Vandaag
              </h2>
            </div>

            <div className="p-6">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-6">
                  <CalendarIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm mb-3">Geen afspraken vandaag</p>
                  <button
                    onClick={() => setShowCalendarAuth(true)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Koppel Gmail agenda
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="font-medium text-gray-900">{event.title}</div>
                      <div className="text-sm text-gray-600">
                        {formatTime(event.start_time)} - {formatTime(event.end_time)}
                      </div>
                      {event.location && (
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Health Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200 p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Health Snapshot
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700">Energie Level:</span>
                <div className="flex">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < (stats?.energyLevel || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700">Stappen:</span>
                <span className="font-medium text-blue-900">
                  {stats?.stepsToday?.toLocaleString() || 0}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700">Workouts:</span>
                <span className="font-medium text-blue-900">{stats?.workoutsToday || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Nieuwe Taak Aanmaken</h3>
              <button onClick={() => setShowTaskForm(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titel *</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Wat moet er gedaan worden?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notities</label>
                <textarea
                  value={taskForm.notes}
                  onChange={(e) => setTaskForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                  placeholder="Aanvullende details..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={taskForm.type}
                    onChange={(e) =>
                      setTaskForm((f) => ({ ...f, type: e.target.value as "work" | "personal" }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="work">Werk</option>
                    <option value="personal">Privé</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prioriteit</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm((f) => ({ ...f, priority: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={3}>Laag</option>
                    <option value={2}>Medium</option>
                    <option value={1}>Hoog</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
                <input
                  type="date"
                  value={taskForm.due_date}
                  onChange={(e) => setTaskForm((f) => ({ ...f, due_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
                <select
                  value={taskForm.project_id}
                  onChange={(e) => setTaskForm((f) => ({ ...f, project_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Geen project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} {project.city ? `(${project.city})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTaskForm(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleTaskSubmit}
                disabled={!taskForm.title.trim() || addTaskMutation.isPending}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
              >
                {addTaskMutation.isPending ? "Bezig..." : "Taak Aanmaken"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Idea Form Modal */}
      {showIdeaForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-yellow-500" />
                <h3 className="text-xl font-semibold">Nieuw Idee Vastleggen</h3>
              </div>
              <button onClick={() => setShowIdeaForm(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Idee Titel *</label>
                <input
                  type="text"
                  value={ideaForm.title}
                  onChange={(e) => setIdeaForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Wat is je idee in één zin?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Beschrijving</label>
                <textarea
                  value={ideaForm.description}
                  onChange={(e) => setIdeaForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent h-32 resize-none"
                  placeholder="Werk je idee uit... wat houdt het in? Waarom is het interessant?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categorie</label>
                  <select
                    value={ideaForm.category}
                    onChange={(e) => setIdeaForm((f) => ({ ...f, category: e.target.value as any }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  >
                    <option value="business">Business</option>
                    <option value="project">Project</option>
                    <option value="creative">Creatief</option>
                    <option value="personal">Persoonlijk</option>
                    <option value="other">Overig</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Urgentie</label>
                  <select
                    value={ideaForm.priority}
                    onChange={(e) => setIdeaForm((f) => ({ ...f, priority: e.target.value as any }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  >
                    <option value="low">Ooit eens</option>
                    <option value="medium">Interessant</option>
                    <option value="high">Prioriteit!</option>
                  </select>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Afbeelding (optioneel)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-yellow-400 transition-colors">
                  {ideaForm.image ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center">
                        <Image className="w-8 h-8 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-700">{ideaForm.image.name}</p>
                        <p className="text-xs text-gray-500">
                          {(ideaForm.image.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIdeaForm((f) => ({ ...f, image: null }))}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Verwijderen
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                      <div>
                        <label className="cursor-pointer">
                          <span className="text-sm text-yellow-600 hover:text-yellow-800 font-medium">
                            Klik om afbeelding te uploaden
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG tot 10MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowIdeaForm(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleIdeaSubmit}
                disabled={!ideaForm.title.trim() || addIdeaMutation.isPending}
                className="flex-1 px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
              >
                <Lightbulb className="w-4 h-4" />
                {addIdeaMutation.isPending ? "Opslaan..." : "Idee Opslaan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Auth Modal */}
      {showCalendarAuth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Gmail Agenda Koppelen</h3>
              <button onClick={() => setShowCalendarAuth(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Calendar className="w-8 h-8 text-green-600" />
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Verbind met Google Agenda</h4>
                <p className="text-gray-600 text-sm">
                  Koppel je Google agenda om je afspraken automatisch te synchroniseren met je dashboard.
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <button
                  onClick={() => connectCalendarMutation.mutate()}
                  disabled={connectCalendarMutation.isPending}
                  className="w-full bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  {connectCalendarMutation.isPending ? "Verbinden..." : "Verbind met Google"}
                </button>

                <button
                  onClick={() => setShowCalendarAuth(false)}
                  className="w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuleren
                </button>

                <p className="text-xs text-gray-500">
                  We openen een nieuw venster voor Google OAuth. Na het verbinden worden je afspraken
                  automatisch gesynchroniseerd.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
