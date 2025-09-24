import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Activity, 
  Footprints, 
  Clock, 
  Zap, 
  Star, 
  Target,
  TrendingUp,
  Calendar,
  X
} from "lucide-react";
import { api } from "@/lib/api";

/* =======================
   Types
======================= */
type Workout = {
  id: string;
  name: string;
  description?: string | null;
  duration_minutes?: number | null;
  intensity: "low" | "medium" | "high";
  logged_at: string;
};

type Steps = {
  id: string;
  step_count: number;
  step_date: string;
  source: string;
};

type EnergyCheck = {
  id: string;
  energy_level: number;
  mood?: string | null;
  notes?: string | null;
  logged_at: string;
};

/* =======================
   Helpers
======================= */
const todayYMD = () => new Date().toISOString().split("T")[0];

const formatDate = (dateString: string | Date | null) => {
  if (!dateString) return "N/A";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return date.toLocaleDateString("nl-NL", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateShort = (dateString: string | Date | null) => {
  if (!dateString) return "N/A";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return date.toLocaleDateString("nl-NL", {
    month: "short",
    day: "numeric",
  });
};

const getIntensityColor = (intensity: string) => {
  switch (intensity) {
    case "high": return "text-red-500 bg-red-50";
    case "medium": return "text-orange-500 bg-orange-50";
    case "low": return "text-green-500 bg-green-50";
    default: return "text-gray-500 bg-gray-50";
  }
};

const getEnergyText = (level: number) => {
  switch (level) {
    case 1: return { text: "Zeer Laag", color: "text-red-600" };
    case 2: return { text: "Laag", color: "text-orange-500" };
    case 3: return { text: "Gemiddeld", color: "text-yellow-500" };
    case 4: return { text: "Hoog", color: "text-green-500" };
    case 5: return { text: "Zeer Hoog", color: "text-green-600" };
    default: return { text: "Onbekend", color: "text-gray-500" };
  }
};

const renderStars = (level: number, interactive: boolean = false, onClick?: (rating: number) => void) => {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`h-4 w-4 ${interactive ? 'cursor-pointer' : ''} transition-colors ${
        i < level
          ? "fill-yellow-400 text-yellow-400"
          : "text-gray-300 hover:text-yellow-400"
      }`}
      onClick={() => interactive && onClick && onClick(i + 1)}
    />
  ));
};

/* =======================
   Component
======================= */
export default function Health() {
  const queryClient = useQueryClient();
  const today = todayYMD();

  /* ---- Modal States ---- */
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showStepsModal, setShowStepsModal] = useState(false);
  const [showEnergyModal, setShowEnergyModal] = useState(false);

  /* ---- Form States ---- */
  const [workoutForm, setWorkoutForm] = useState({
    name: "",
    description: "",
    duration_minutes: "",
    intensity: "medium" as "low" | "medium" | "high",
  });

  const [stepsForm, setStepsForm] = useState({
    step_count: "",
    step_date: today,
    source: "manual",
  });

  const [energyForm, setEnergyForm] = useState({
    energy_level: 3,
    mood: "",
    notes: "",
  });

  /* ---- Data Queries ---- */
  const { data: workouts = [] } = useQuery<Workout[]>({
    queryKey: ["workouts"],
    queryFn: () => api<Workout[]>("/api/workouts"),
    staleTime: 5 * 60 * 1000,
  });

  const { data: todaysSteps } = useQuery<Steps | null>({
    queryKey: ["steps", today],
    queryFn: () => api<Steps | null>(`/api/steps/${today}`),
    staleTime: 5 * 60 * 1000,
  });

  const { data: energyChecks = [] } = useQuery<EnergyCheck[]>({
    queryKey: ["energy-checks"],
    queryFn: () => api<EnergyCheck[]>("/api/energy-checks"),
    staleTime: 5 * 60 * 1000,
  });

  /* ---- Mutations ---- */
  const addWorkoutMutation = useMutation({
    mutationFn: (data: any) => api("/api/workouts", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      setWorkoutForm({ name: "", description: "", duration_minutes: "", intensity: "medium" });
      setShowWorkoutModal(false);
    },
  });

  const addStepsMutation = useMutation({
    mutationFn: (data: any) => api("/api/steps", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["steps", today] });
      setStepsForm({ step_count: "", step_date: today, source: "manual" });
      setShowStepsModal(false);
    },
  });

  const addEnergyMutation = useMutation({
    mutationFn: (data: any) => api("/api/energy-checks", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["energy-checks"] });
      setEnergyForm({ energy_level: 3, mood: "", notes: "" });
      setShowEnergyModal(false);
    },
  });

  /* ---- Handle Submissions ---- */
  const handleWorkoutSubmit = () => {
    if (!workoutForm.name.trim()) return;
    addWorkoutMutation.mutate({
      name: workoutForm.name,
      description: workoutForm.description || null,
      duration_minutes: workoutForm.duration_minutes ? parseInt(workoutForm.duration_minutes) : null,
      intensity: workoutForm.intensity,
      logged_at: new Date().toISOString(),
    });
  };

  const handleStepsSubmit = () => {
    if (!stepsForm.step_count) return;
    addStepsMutation.mutate({
      step_count: parseInt(stepsForm.step_count),
      step_date: stepsForm.step_date,
      source: stepsForm.source,
    });
  };

  const handleEnergySubmit = () => {
    addEnergyMutation.mutate({
      energy_level: energyForm.energy_level,
      mood: energyForm.mood || null,
      notes: energyForm.notes || null,
      logged_at: new Date().toISOString(),
    });
  };

  /* ---- Derived Data ---- */
  const todaysWorkouts = workouts.filter(w => {
    if (!w.logged_at) return false;
    return new Date(w.logged_at).toISOString().split("T")[0] === today;
  });

  const latestEnergyCheck = energyChecks
    .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())[0];

  const weeklyStats = {
    totalWorkouts: workouts.filter(w => {
      const workoutDate = new Date(w.logged_at);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return workoutDate >= weekAgo;
    }).length,
    totalMinutes: workouts
      .filter(w => {
        const workoutDate = new Date(w.logged_at);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return workoutDate >= weekAgo;
      })
      .reduce((sum, w) => sum + (w.duration_minutes || 0), 0),
  };

  const stepGoalProgress = todaysSteps ? Math.min((todaysSteps.step_count / 10000) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Health Tracking</h1>
          <p className="text-gray-600 mt-1">Overzicht van je dagelijkse gezondheidsmetrics</p>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vandaag</p>
              <p className="text-2xl font-bold text-blue-600">{todaysWorkouts.length}</p>
              <p className="text-xs text-gray-500">workouts</p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stappen</p>
              <p className="text-2xl font-bold text-green-600">
                {todaysSteps?.step_count?.toLocaleString() || "0"}
              </p>
              <p className="text-xs text-gray-500">van 10.000</p>
            </div>
            <Footprints className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Energie</p>
              <div className="flex items-center gap-1">
                {renderStars(latestEnergyCheck?.energy_level || 0)}
              </div>
              <p className={`text-xs ${getEnergyText(latestEnergyCheck?.energy_level || 0).color}`}>
                {getEnergyText(latestEnergyCheck?.energy_level || 0).text}
              </p>
            </div>
            <Zap className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Deze week</p>
              <p className="text-2xl font-bold text-purple-600">{weeklyStats.totalWorkouts}</p>
              <p className="text-xs text-gray-500">{weeklyStats.totalMinutes} min</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workouts Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Workouts</h3>
            <button
              onClick={() => setShowWorkoutModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Workout
            </button>
          </div>

          {todaysWorkouts.length === 0 ? (
            <div className="text-center py-6">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-3">Geen workouts vandaag</p>
              <button
                onClick={() => setShowWorkoutModal(true)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Log je eerste workout
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {todaysWorkouts.map(workout => (
                <div key={workout.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{workout.name}</h4>
                      <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                        {workout.duration_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {workout.duration_minutes} min
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs ${getIntensityColor(workout.intensity)}`}>
                          {workout.intensity}
                        </span>
                      </div>
                      {workout.description && (
                        <p className="text-sm text-gray-600 mt-1">{workout.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent workouts preview */}
          {workouts.length > todaysWorkouts.length && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Recent</h4>
              <div className="space-y-2">
                {workouts
                  .filter(w => new Date(w.logged_at).toISOString().split("T")[0] !== today)
                  .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
                  .slice(0, 3)
                  .map(workout => (
                    <div key={workout.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{workout.name}</span>
                      <span className="text-gray-500">{formatDateShort(workout.logged_at)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Steps Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Stappen</h3>
            <button
              onClick={() => setShowStepsModal(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Stappen
            </button>
          </div>

          <div className="text-center py-4">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {todaysSteps?.step_count?.toLocaleString() || "0"}
            </div>
            <p className="text-gray-600 mb-4">stappen vandaag</p>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Dagelijks doel</span>
                <span>{Math.round(stepGoalProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${stepGoalProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>10.000</span>
              </div>
            </div>

            {todaysSteps && (
              <p className="text-xs text-gray-500">
                Bron: {todaysSteps.source.replace("_", " ")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Energy Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Energie Level</h3>
          <button
            onClick={() => setShowEnergyModal(true)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Energie
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current energy */}
          <div className="text-center">
            <h4 className="font-medium text-gray-700 mb-3">Huidige Level</h4>
            {latestEnergyCheck ? (
              <div>
                <div className="flex justify-center mb-2">
                  {renderStars(latestEnergyCheck.energy_level)}
                </div>
                <div className={`text-xl font-bold ${getEnergyText(latestEnergyCheck.energy_level).color}`}>
                  {getEnergyText(latestEnergyCheck.energy_level).text}
                </div>
                {latestEnergyCheck.mood && (
                  <p className="text-sm text-gray-600 mt-1">
                    Mood: {latestEnergyCheck.mood}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {formatDate(latestEnergyCheck.logged_at)}
                </p>
              </div>
            ) : (
              <div>
                <Zap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Nog geen energie data</p>
              </div>
            )}
          </div>

          {/* Recent energy checks */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Recente Checks</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {energyChecks
                .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
                .slice(0, 5)
                .map(check => (
                  <div key={check.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {renderStars(check.energy_level)}
                      </div>
                      <span className={getEnergyText(check.energy_level).color}>
                        {getEnergyText(check.energy_level).text}
                      </span>
                    </div>
                    <span className="text-gray-500">{formatDateShort(check.logged_at)}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Workout Modal */}
      {showWorkoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Workout Toevoegen</h3>
              <button onClick={() => setShowWorkoutModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Workout Naam</label>
                <input
                  type="text"
                  placeholder="bijv. Hardlopen, Push-ups..."
                  value={workoutForm.name}
                  onChange={(e) => setWorkoutForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Beschrijving (optioneel)</label>
                <input
                  type="text"
                  placeholder="Workout details..."
                  value={workoutForm.description}
                  onChange={(e) => setWorkoutForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Duur (min)</label>
                  <input
                    type="number"
                    placeholder="30"
                    value={workoutForm.duration_minutes}
                    onChange={(e) => setWorkoutForm(f => ({ ...f, duration_minutes: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Intensiteit</label>
                  <select
                    value={workoutForm.intensity}
                    onChange={(e) => setWorkoutForm(f => ({ ...f, intensity: e.target.value as any }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="low">Laag</option>
                    <option value="medium">Gemiddeld</option>
                    <option value="high">Hoog</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowWorkoutModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Annuleren
              </button>
              <button
                onClick={handleWorkoutSubmit}
                disabled={!workoutForm.name.trim() || addWorkoutMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
              >
                {addWorkoutMutation.isPending ? "Opslaan..." : "Opslaan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Steps Modal */}
      {showStepsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Stappen Toevoegen</h3>
              <button onClick={() => setShowStepsModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Aantal Stappen</label>
                <input
                  type="number"
                  placeholder="10000"
                  value={stepsForm.step_count}
                  onChange={(e) => setStepsForm(f => ({ ...f, step_count: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Datum</label>
                  <input
                    type="date"
                    value={stepsForm.step_date}
                    onChange={(e) => setStepsForm(f => ({ ...f, step_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Bron</label>
                  <select
                    value={stepsForm.source}
                    onChange={(e) => setStepsForm(f => ({ ...f, source: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="manual">Handmatig</option>
                    <option value="fitness_tracker">Fitness Tracker</option>
                    <option value="smartphone">Smartphone</option>
                    <option value="smartwatch">Smartwatch</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowStepsModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Annuleren
              </button>
              <button
                onClick={handleStepsSubmit}
                disabled={!stepsForm.step_count || addStepsMutation.isPending}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
              >
                {addStepsMutation.isPending ? "Opslaan..." : "Opslaan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Energy Modal */}
      {showEnergyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Energie Level Toevoegen</h3>
              <button onClick={() => setShowEnergyModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Energie Level (1-5)</label>
                <div className="flex justify-center gap-1 mb-2">
                  {renderStars(energyForm.energy_level, true, (level) =>
                    setEnergyForm(f => ({ ...f, energy_level: level }))
                  )}
                </div>
                <p className="text-center text-sm text-gray-600">
                  {getEnergyText(energyForm.energy_level).text}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Mood (optioneel)</label>
                <input
                  type="text"
                  placeholder="bijv. Blij, Moe, Gemotiveerd..."
                  value={energyForm.mood}
                  onChange={(e) => setEnergyForm(f => ({ ...f, mood: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notities (optioneel)</label>
                <input
                  type="text"
                  placeholder="Aanvullende notities..."
                  value={energyForm.notes}
                  onChange={(e) => setEnergyForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowEnergyModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Annuleren
              </button>
              <button
                onClick={handleEnergySubmit}
                disabled={addEnergyMutation.isPending}
                className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-300"
              >
                {addEnergyMutation.isPending ? "Opslaan..." : "Opslaan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}