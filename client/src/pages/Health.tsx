import { useState } from "react";
import { Switch, Route, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Activity, Footprints, Calendar, Clock, Zap, Trash2, Edit, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Workout, InsertWorkout, Steps, InsertSteps, EnergyCheck, InsertEnergyCheck } from "@shared/schema";

function WorkoutsTab() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [workoutFormData, setWorkoutFormData] = useState({
    name: "",
    description: "",
    duration_minutes: "",
    intensity: "medium" as "low" | "medium" | "high"
  });

  // Fetch workouts
  const { data: workouts = [], refetch: refetchWorkouts } = useQuery<Workout[]>({
    queryKey: ['/api/workouts'],
  });

  // Create workout mutation
  const createWorkoutMutation = useMutation({
    mutationFn: async (data: InsertWorkout) => {
      const response = await apiRequest('POST', '/api/workouts', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Workout Created",
        description: "Your workout has been logged successfully.",
      });
      setIsCreateDialogOpen(false);
      setWorkoutFormData({ name: "", description: "", duration_minutes: "", intensity: "medium" });
      queryClient.invalidateQueries({ queryKey: ['/api/workouts'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create workout. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleCreateWorkout = () => {
    const data: InsertWorkout = {
      name: workoutFormData.name,
      description: workoutFormData.description || null,
      duration_minutes: workoutFormData.duration_minutes ? parseInt(workoutFormData.duration_minutes) : null,
      intensity: workoutFormData.intensity,
      logged_at: new Date().toISOString()
    };
    createWorkoutMutation.mutate(data);
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'N/A';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-orange-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  // Get today's workouts (using stable YYYY-MM-DD format)
  const todayYMD = new Date().toISOString().split('T')[0];
  const todaysWorkouts = workouts.filter(workout => {
    if (!workout.logged_at) return false;
    const workoutDateYMD = new Date(workout.logged_at).toISOString().split('T')[0];
    return workoutDateYMD === todayYMD;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-foreground">Workout Tracking</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-workout">
              <Plus className="h-4 w-4 mr-2" />
              Log Workout
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log New Workout</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workout-name">Workout Name</Label>
                <Input
                  id="workout-name"
                  placeholder="e.g. Morning Run, Push-ups..."
                  value={workoutFormData.name}
                  onChange={(e) => setWorkoutFormData(prev => ({ ...prev, name: e.target.value }))}
                  data-testid="input-workout-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workout-description">Description (Optional)</Label>
                <Input
                  id="workout-description"
                  placeholder="Add workout details..."
                  value={workoutFormData.description}
                  onChange={(e) => setWorkoutFormData(prev => ({ ...prev, description: e.target.value }))}
                  data-testid="input-workout-description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workout-duration">Duration (minutes)</Label>
                <Input
                  id="workout-duration"
                  type="number"
                  min="1"
                  placeholder="30"
                  value={workoutFormData.duration_minutes}
                  onChange={(e) => setWorkoutFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                  data-testid="input-workout-duration"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workout-intensity">Intensity</Label>
                <select
                  id="workout-intensity"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={workoutFormData.intensity}
                  onChange={(e) => setWorkoutFormData(prev => ({ ...prev, intensity: e.target.value as "low" | "medium" | "high" }))}
                  data-testid="select-workout-intensity"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateWorkout}
                  disabled={!workoutFormData.name.trim() || createWorkoutMutation.isPending}
                  data-testid="button-save-workout"
                >
                  {createWorkoutMutation.isPending ? "Logging..." : "Log Workout"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-md font-medium text-foreground mb-4">Today's Workouts</h3>
        {todaysWorkouts.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No workouts logged for today</p>
            <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline" data-testid="button-log-first-workout">
              <Plus className="h-4 w-4 mr-2" />
              Log Your First Workout
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todaysWorkouts.map((workout) => (
              <div key={workout.id} className="p-4 border border-border rounded-lg" data-testid={`card-workout-${workout.id}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground mb-2" data-testid={`text-workout-name-${workout.id}`}>
                      {workout.name}
                    </h4>
                    <div className="space-y-1">
                      {workout.duration_minutes && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span data-testid={`text-workout-duration-${workout.id}`}>
                            {workout.duration_minutes} minutes
                          </span>
                        </div>
                      )}
                      {workout.intensity && (
                        <div className="flex items-center gap-2 text-sm">
                          <Zap className="h-3 w-3" />
                          <span className={`capitalize ${getIntensityColor(workout.intensity)}`} data-testid={`text-workout-intensity-${workout.id}`}>
                            {workout.intensity} intensity
                          </span>
                        </div>
                      )}
                    </div>
                    {workout.description && (
                      <p className="text-sm text-muted-foreground mt-2" data-testid={`text-workout-description-${workout.id}`}>
                        {workout.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2" data-testid={`text-workout-time-${workout.id}`}>
                      {formatDate(workout.logged_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-md font-medium text-foreground mb-4">Recent Workouts</h3>
        {workouts.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No workouts logged yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workouts
              .sort((a, b) => {
                const aTime = a.logged_at ? new Date(a.logged_at).getTime() : 0;
                const bTime = b.logged_at ? new Date(b.logged_at).getTime() : 0;
                return bTime - aTime;
              })
              .slice(0, 10)
              .map((workout) => (
                <div key={workout.id} className="flex items-center justify-between p-3 border border-border rounded-lg" data-testid={`row-workout-${workout.id}`}>
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-primary" />
                    <div>
                      <h4 className="font-medium text-foreground text-sm" data-testid={`text-workout-list-name-${workout.id}`}>
                        {workout.name}
                      </h4>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span data-testid={`text-workout-list-time-${workout.id}`}>
                          {formatDate(workout.logged_at)}
                        </span>
                        {workout.duration_minutes && (
                          <span>{workout.duration_minutes}min</span>
                        )}
                        {workout.intensity && (
                          <span className={`capitalize ${getIntensityColor(workout.intensity)}`}>
                            {workout.intensity}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StepsTab() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [stepFormData, setStepFormData] = useState({
    step_count: "",
    step_date: new Date().toISOString().split('T')[0],
    source: "manual"
  });

  // Create/update steps mutation
  const createStepsMutation = useMutation({
    mutationFn: async (data: InsertSteps) => {
      const response = await apiRequest('POST', '/api/steps', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Steps Logged",
        description: "Your step count has been saved successfully.",
      });
      setIsCreateDialogOpen(false);
      setStepFormData({ step_count: "", step_date: new Date().toISOString().split('T')[0], source: "manual" });
      queryClient.invalidateQueries({ queryKey: ['/api/steps'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to log steps. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleCreateSteps = () => {
    const data: InsertSteps = {
      step_count: parseInt(stepFormData.step_count),
      step_date: stepFormData.step_date,
      source: stepFormData.source
    };
    createStepsMutation.mutate(data);
  };

  // Get today's steps (consistent YYYY-MM-DD format)
  const todayYMD = new Date().toISOString().split('T')[0];
  const { data: todaysSteps } = useQuery<Steps | null>({
    queryKey: ['/api/steps', todayYMD],
  });

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'N/A';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-foreground">Steps Tracking</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-log-steps">
              <Plus className="h-4 w-4 mr-2" />
              Log Steps
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Step Count</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="step-count">Step Count</Label>
                <Input
                  id="step-count"
                  type="number"
                  min="0"
                  placeholder="10000"
                  value={stepFormData.step_count}
                  onChange={(e) => setStepFormData(prev => ({ ...prev, step_count: e.target.value }))}
                  data-testid="input-step-count"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="step-date">Date</Label>
                <Input
                  id="step-date"
                  type="date"
                  value={stepFormData.step_date}
                  onChange={(e) => setStepFormData(prev => ({ ...prev, step_date: e.target.value }))}
                  data-testid="input-step-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="step-source">Source</Label>
                <select
                  id="step-source"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={stepFormData.source}
                  onChange={(e) => setStepFormData(prev => ({ ...prev, source: e.target.value }))}
                  data-testid="select-step-source"
                >
                  <option value="manual">Manual Entry</option>
                  <option value="fitness_tracker">Fitness Tracker</option>
                  <option value="smartphone">Smartphone</option>
                  <option value="smartwatch">Smartwatch</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateSteps}
                  disabled={!stepFormData.step_count.trim() || createStepsMutation.isPending}
                  data-testid="button-save-steps"
                >
                  {createStepsMutation.isPending ? "Logging..." : "Log Steps"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-md font-medium text-foreground mb-4">Today's Steps</h3>
        <div className="text-center py-6">
          <Footprints className="h-16 w-16 text-primary mx-auto mb-4" />
          <div className="text-3xl font-bold text-foreground mb-2" data-testid="text-steps-today-count">
            {todaysSteps?.step_count?.toLocaleString() || "0"}
          </div>
          <p className="text-muted-foreground" data-testid="text-steps-today-date">
            Steps for {formatDate(todayYMD)}
          </p>
          {todaysSteps?.source && (
            <p className="text-xs text-muted-foreground mt-2 capitalize">
              Source: {todaysSteps.source.replace('_', ' ')}
            </p>
          )}
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-md font-medium text-foreground mb-4">Step Goals</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Daily Goal (10,000 steps)</span>
            <span className="text-sm font-medium">
              {todaysSteps ? Math.round((todaysSteps.step_count / 10000) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${Math.min(todaysSteps ? (todaysSteps.step_count / 10000) * 100 : 0, 100)}%` }}
              data-testid="progress-daily-steps"
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EnergyTab() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [energyFormData, setEnergyFormData] = useState({
    energy_level: 3,
    mood: "",
    notes: ""
  });

  // Fetch recent energy checks
  const { data: energyChecks = [], refetch: refetchEnergyChecks } = useQuery<EnergyCheck[]>({
    queryKey: ['/api/energy-checks'],
  });

  // Create energy check mutation
  const createEnergyMutation = useMutation({
    mutationFn: async (data: InsertEnergyCheck) => {
      const response = await apiRequest('POST', '/api/energy-checks', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Energy Level Logged",
        description: "Your energy check has been saved successfully.",
      });
      setIsCreateDialogOpen(false);
      setEnergyFormData({ energy_level: 3, mood: "", notes: "" });
      // Invalidate cache to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['/api/energy-checks'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to log energy level. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleCreateEnergy = () => {
    const data: InsertEnergyCheck = {
      energy_level: energyFormData.energy_level,
      mood: energyFormData.mood || null,
      notes: energyFormData.notes || null,
      logged_at: new Date().toISOString()
    };
    createEnergyMutation.mutate(data);
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'N/A';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (level: number, interactive: boolean = false, onClick?: (rating: number) => void) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 cursor-pointer transition-colors ${
          i < level 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-gray-300 hover:text-yellow-400'
        }`}
        onClick={() => interactive && onClick && onClick(i + 1)}
        data-testid={`star-${i + 1}`}
      />
    ));
  };

  const getEnergyText = (level: number) => {
    switch (level) {
      case 1: return { text: 'Very Low', color: 'text-red-600' };
      case 2: return { text: 'Low', color: 'text-orange-500' };
      case 3: return { text: 'Moderate', color: 'text-yellow-500' };
      case 4: return { text: 'High', color: 'text-green-500' };
      case 5: return { text: 'Very High', color: 'text-green-600' };
      default: return { text: 'Unknown', color: 'text-gray-500' };
    }
  };

  // Get today's latest energy check (using stable YYYY-MM-DD format)
  const todayYMD = new Date().toISOString().split('T')[0];
  const todaysEnergyChecks = energyChecks.filter(check => {
    if (!check.logged_at) return false;
    const checkDateYMD = new Date(check.logged_at).toISOString().split('T')[0];
    return checkDateYMD === todayYMD;
  });
  const latestEnergyToday = todaysEnergyChecks.sort((a, b) => {
    const aTime = a.logged_at ? new Date(a.logged_at).getTime() : 0;
    const bTime = b.logged_at ? new Date(b.logged_at).getTime() : 0;
    return bTime - aTime;
  })[0];


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-foreground">Energy Tracking</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-log-energy">
              <Plus className="h-4 w-4 mr-2" />
              Log Energy Level
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Energy Level</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Energy Level (1-5)</Label>
                <div className="flex items-center gap-1">
                  {renderStars(energyFormData.energy_level, true, (level) => 
                    setEnergyFormData(prev => ({ ...prev, energy_level: level }))
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {getEnergyText(energyFormData.energy_level).text}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="energy-mood">Mood (Optional)</Label>
                <Input
                  id="energy-mood"
                  placeholder="e.g. Happy, Tired, Motivated..."
                  value={energyFormData.mood}
                  onChange={(e) => setEnergyFormData(prev => ({ ...prev, mood: e.target.value }))}
                  data-testid="input-energy-mood"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="energy-notes">Notes (Optional)</Label>
                <Input
                  id="energy-notes"
                  placeholder="Any additional notes..."
                  value={energyFormData.notes}
                  onChange={(e) => setEnergyFormData(prev => ({ ...prev, notes: e.target.value }))}
                  data-testid="input-energy-notes"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateEnergy}
                  disabled={createEnergyMutation.isPending}
                  data-testid="button-save-energy"
                >
                  {createEnergyMutation.isPending ? "Logging..." : "Log Energy"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-md font-medium text-foreground mb-4">Current Energy Level</h3>
        <div className="text-center py-6">
          <Zap className="h-16 w-16 text-primary mx-auto mb-4" />
          <div className="space-y-3">
            <div className="flex justify-center" data-testid="energy-level-display">
              {renderStars(latestEnergyToday?.energy_level || 0)}
            </div>
            <div>
              <div className={`text-xl font-bold ${getEnergyText(latestEnergyToday?.energy_level || 0).color}`}>
                {getEnergyText(latestEnergyToday?.energy_level || 0).text}
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                {latestEnergyToday ? `Last updated: ${formatDate(latestEnergyToday.logged_at)}` : 'No energy data for today'}
              </p>
            </div>
            {latestEnergyToday?.mood && (
              <p className="text-sm text-muted-foreground">
                Mood: <span className="font-medium">{latestEnergyToday.mood}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-md font-medium text-foreground mb-4">Recent Energy Checks</h3>
        {energyChecks.length === 0 ? (
          <div className="text-center py-8">
            <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No energy checks logged yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {energyChecks
              .sort((a, b) => {
                const aTime = a.logged_at ? new Date(a.logged_at).getTime() : 0;
                const bTime = b.logged_at ? new Date(b.logged_at).getTime() : 0;
                return bTime - aTime;
              })
              .slice(0, 10)
              .map((check) => (
                <div key={check.id} className="flex items-center justify-between p-3 border border-border rounded-lg" data-testid={`row-energy-${check.id}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {renderStars(check.energy_level)}
                    </div>
                    <div>
                      <div className={`font-medium text-sm ${getEnergyText(check.energy_level).color}`}>
                        {getEnergyText(check.energy_level).text}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{formatDate(check.logged_at)}</span>
                        {check.mood && <span>Mood: {check.mood}</span>}
                      </div>
                      {check.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{check.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Health() {
  const [location] = useLocation();
  const currentTab = location === '/health/steps' ? 'steps' : location === '/health/energy' ? 'energy' : 'workouts';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Health Tracking</h1>
        <p className="text-muted-foreground mt-2">Monitor your workouts, steps, and wellness metrics</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          <Link
            href="/health"
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentTab === 'workouts'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
            data-testid="tab-workouts"
          >
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Workouts
            </div>
          </Link>
          <Link
            href="/health/steps"
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentTab === 'steps'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
            data-testid="tab-steps"
          >
            <div className="flex items-center gap-2">
              <Footprints className="h-4 w-4" />
              Steps
            </div>
          </Link>
          <Link
            href="/health/energy"
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentTab === 'energy'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
            data-testid="tab-energy"
          >
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Energy
            </div>
          </Link>
        </nav>
      </div>

      {/* Tab Content */}
      <Switch>
        <Route path="/health/steps" component={StepsTab} />
        <Route path="/health/energy" component={EnergyTab} />
        <Route path="/health/*?" component={WorkoutsTab} />
      </Switch>
    </div>
  );
}
