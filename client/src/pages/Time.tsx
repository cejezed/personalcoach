import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Play, Pause, Square, Clock, Calendar, Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TimeEntry, Project } from "@shared/schema";

export default function Time() {
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timerDuration, setTimerDuration] = useState("00:00:00");
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [startFormData, setStartFormData] = useState({
    description: "",
    project_phase_id: ""
  });

  // Update current time only when active
  useEffect(() => {
    if (!activeEntry) return;
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [activeEntry]);

  // Fetch active time entry (only poll when active)
  const { data: activeEntry, refetch: refetchActiveEntry } = useQuery<TimeEntry | null>({
    queryKey: ['/api/time-entries/active'],
    refetchInterval: (data) => data ? 1000 : false, // Only poll when active
  });

  // Fetch all time entries
  const { data: timeEntries = [], refetch: refetchTimeEntries } = useQuery<TimeEntry[]>({
    queryKey: ['/api/time-entries'],
  });

  // Fetch projects for selection
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // Update timer duration when active entry changes
  useEffect(() => {
    if (activeEntry) {
      const startTime = new Date(activeEntry.start_time);
      const elapsed = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      const seconds = elapsed % 60;
      setTimerDuration(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    } else {
      setTimerDuration("00:00:00");
    }
  }, [activeEntry, currentTime]);

  // Start time tracking mutation
  const startTimerMutation = useMutation({
    mutationFn: async (data: { description: string; project_phase_id?: string }) => {
      const response = await apiRequest('POST', '/api/time-entries/start', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Timer Started",
        description: "Time tracking has begun for your task.",
      });
      setIsStartDialogOpen(false);
      setStartFormData({ description: "", project_phase_id: "" });
      refetchActiveEntry();
      refetchTimeEntries();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start timer. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Stop time tracking mutation
  const stopTimerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('PATCH', `/api/time-entries/${id}/stop`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Timer Stopped",
        description: "Time entry has been saved successfully.",
      });
      refetchActiveEntry();
      refetchTimeEntries();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to stop timer. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete time entry mutation
  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/time-entries/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Entry Deleted",
        description: "Time entry has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/time-entries'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete entry. Please try again.",
        variant: "destructive"
      });
    }
  });

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timeString: string) => {
    return new Date(timeString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const handleStartTimer = () => {
    const data: any = {
      description: startFormData.description || "Working on task"
    };
    if (startFormData.project_phase_id) {
      data.project_phase_id = startFormData.project_phase_id;
    }
    startTimerMutation.mutate(data);
  };

  // Calculate total time today
  const today = new Date().toDateString();
  const todayEntries = timeEntries.filter(entry => 
    new Date(entry.start_time).toDateString() === today && entry.end_time
  );
  const totalMinutesToday = todayEntries.reduce((sum, entry) => sum + (entry.minutes || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Time Tracking</h1>
        <p className="text-muted-foreground mt-2">Track time entries and manage your work hours</p>
      </div>

      {/* Current Timer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Current Time Entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeEntry ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium" data-testid="text-current-task">
                    {activeEntry.description || "Working on task"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Started at {formatTime(activeEntry.start_time)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-mono font-bold text-primary" data-testid="text-timer-duration">
                    {timerDuration}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Running
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => activeEntry && stopTimerMutation.mutate(activeEntry.id)}
                  variant="destructive" 
                  className="flex-1"
                  disabled={stopTimerMutation.isPending}
                  data-testid="button-stop-timer"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop Timer
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl font-mono font-bold text-muted-foreground mb-4" data-testid="text-timer-duration">
                {timerDuration}
              </div>
              <p className="text-muted-foreground mb-4">No active time entry</p>
              
              <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" data-testid="button-start-timer">
                    <Play className="h-4 w-4 mr-2" />
                    Start Timer
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Start Time Tracking</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        placeholder="What are you working on?"
                        value={startFormData.description}
                        onChange={(e) => setStartFormData(prev => ({ ...prev, description: e.target.value }))}
                        data-testid="input-task-description"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project">Project (Optional)</Label>
                      <p className="text-xs text-muted-foreground">Note: Project phases will be available in a future update</p>
                      <select
                        id="project"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={startFormData.project_phase_id}
                        onChange={(e) => setStartFormData(prev => ({ ...prev, project_phase_id: e.target.value }))}
                        data-testid="select-project"
                      >
                        <option value="">Select a project...</option>
                        {projects.map(project => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setIsStartDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleStartTimer}
                        disabled={startTimerMutation.isPending}
                        data-testid="button-start-tracking"
                      >
                        {startTimerMutation.isPending ? "Starting..." : "Start Tracking"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hours Today</p>
                <p className="text-2xl font-bold" data-testid="text-hours-today">
                  {formatDuration(totalMinutesToday)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Entries Today</p>
                <p className="text-2xl font-bold" data-testid="text-entries-today">
                  {todayEntries.length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Entries History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {timeEntries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No time entries yet</p>
              <p className="text-sm text-muted-foreground">Start tracking time to see your entries here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {timeEntries
                .filter(entry => entry.end_time) // Only show completed entries
                .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
                .slice(0, 10)
                .map((entry) => (
                  <div 
                    key={entry.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    data-testid={`row-time-entry-${entry.id}`}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium" data-testid={`text-entry-description-${entry.id}`}>
                        {entry.description || "Working on task"}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span data-testid={`text-entry-date-${entry.id}`}>
                          {formatDate(entry.start_time)}
                        </span>
                        <span data-testid={`text-entry-time-${entry.id}`}>
                          {formatTime(entry.start_time)} - {entry.end_time && formatTime(entry.end_time)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-medium" data-testid={`text-entry-duration-${entry.id}`}>
                          {formatDuration(entry.minutes)}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" data-testid={`button-edit-${entry.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" data-testid={`button-delete-${entry.id}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Time Entry</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this time entry? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteEntryMutation.mutate(entry.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                data-testid={`button-confirm-delete-${entry.id}`}
                              >
                                Delete Entry
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
