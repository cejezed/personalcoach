import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Check, X, Edit, Trash2, Clock, Filter, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Task, Project, InsertTask } from "@shared/schema";

type TaskStatus = "open" | "in_progress" | "completed" | "cancelled";
type FilterType = "all" | "active" | "completed";

export default function Tasks() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [taskFormData, setTaskFormData] = useState({
    name: "",
    description: "",
    project_phase_id: ""
  });

  // Fetch all tasks
  const { data: tasks = [], refetch: refetchTasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  // Fetch projects for selection
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: InsertTask) => {
      const response = await apiRequest('POST', '/api/tasks', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Task Created",
        description: "Your new task has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      setTaskFormData({ name: "", description: "", project_phase_id: "" });
      refetchTasks();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertTask> }) => {
      const response = await apiRequest('PATCH', `/api/tasks/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Task Updated",
        description: "Task has been updated successfully.",
      });
      setEditingTask(null);
      refetchTasks();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/tasks/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Task Deleted",
        description: "Task has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleCreateTask = () => {
    const data: InsertTask = {
      name: taskFormData.name,
      description: taskFormData.description || null,
      project_phase_id: taskFormData.project_phase_id || null,
      status: "open"
    };
    createTaskMutation.mutate(data);
  };

  const handleUpdateTask = (task: Task, updates: Partial<InsertTask>) => {
    updateTaskMutation.mutate({ id: task.id, data: updates });
  };

  const handleToggleComplete = (task: Task) => {
    const newStatus: TaskStatus = task.status === "completed" ? "open" : "completed";
    handleUpdateTask(task, { status: newStatus });
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setTaskFormData({
      name: task.name,
      description: task.description || "",
      project_phase_id: task.project_phase_id || ""
    });
  };

  const handleUpdateEditingTask = () => {
    if (!editingTask) return;
    
    const updates: Partial<InsertTask> = {
      name: taskFormData.name,
      description: taskFormData.description || null,
      project_phase_id: taskFormData.project_phase_id || null
    };
    handleUpdateTask(editingTask, updates);
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filter === "active") return task.status !== "completed" && task.status !== "cancelled";
    if (filter === "completed") return task.status === "completed";
    return true; // "all"
  });

  // Calculate statistics
  const activeTasks = tasks.filter(task => 
    task.status !== "completed" && task.status !== "cancelled"
  ).length;
  const completedTasks = tasks.filter(task => task.status === "completed").length;
  const inProgressTasks = tasks.filter(task => task.status === "in_progress").length;

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "completed": return <Check className="h-4 w-4 text-green-500" />;
      case "in_progress": return <Clock className="h-4 w-4 text-blue-500" />;
      case "cancelled": return <X className="h-4 w-4 text-red-500" />;
      default: return <Square className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case "open": return "Open";
      case "in_progress": return "In Progress";
      case "completed": return "Completed";
      case "cancelled": return "Cancelled";
      default: return status;
    }
  };

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
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground mt-2">Manage your tasks and project activities</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-task">
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task-name">Task Name</Label>
                <Input
                  id="task-name"
                  placeholder="Enter task name..."
                  value={taskFormData.name}
                  onChange={(e) => setTaskFormData(prev => ({ ...prev, name: e.target.value }))}
                  data-testid="input-task-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-description">Description (Optional)</Label>
                <Input
                  id="task-description"
                  placeholder="Add task description..."
                  value={taskFormData.description}
                  onChange={(e) => setTaskFormData(prev => ({ ...prev, description: e.target.value }))}
                  data-testid="input-task-description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-project">Project (Optional)</Label>
                <select
                  id="task-project"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={taskFormData.project_phase_id}
                  onChange={(e) => setTaskFormData(prev => ({ ...prev, project_phase_id: e.target.value }))}
                  data-testid="select-task-project"
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
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateTask}
                  disabled={!taskFormData.name.trim() || createTaskMutation.isPending}
                  data-testid="button-save-task"
                >
                  {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Tasks</p>
                <p className="text-2xl font-bold" data-testid="text-active-tasks">
                  {activeTasks}
                </p>
              </div>
              <CheckSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold" data-testid="text-in-progress-tasks">
                  {inProgressTasks}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold" data-testid="text-completed-tasks">
                  {completedTasks}
                </p>
              </div>
              <Check className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Task List</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
                data-testid="filter-all"
              >
                All
              </Button>
              <Button
                variant={filter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("active")}
                data-testid="filter-active"
              >
                Active
              </Button>
              <Button
                variant={filter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("completed")}
                data-testid="filter-completed"
              >
                Completed
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No tasks found</h3>
              <p className="text-muted-foreground mb-4">
                {filter === "all" 
                  ? "Create your first task to get started"
                  : `No ${filter} tasks at the moment`
                }
              </p>
              {filter === "all" && (
                <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-task">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks
                .sort((a, b) => {
                  // Sort by status: in_progress, open, completed, cancelled
                  const statusOrder = { "in_progress": 0, "open": 1, "completed": 2, "cancelled": 3 };
                  return statusOrder[a.status as TaskStatus] - statusOrder[b.status as TaskStatus];
                })
                .map((task) => (
                  <div 
                    key={task.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    data-testid={`row-task-${task.id}`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleComplete(task)}
                        className="p-1 h-8 w-8"
                        data-testid={`button-toggle-${task.id}`}
                      >
                        {task.status === "completed" ? 
                          <CheckSquare className="h-5 w-5 text-green-500" /> :
                          <Square className="h-5 w-5 text-gray-400" />
                        }
                      </Button>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}
                              data-testid={`text-task-name-${task.id}`}>
                            {task.name}
                          </h4>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(task.status as TaskStatus)}
                            <span className="text-xs text-muted-foreground"
                                  data-testid={`text-task-status-${task.id}`}>
                              {getStatusText(task.status as TaskStatus)}
                            </span>
                          </div>
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1"
                             data-testid={`text-task-description-${task.id}`}>
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <span data-testid={`text-task-date-${task.id}`}>
                            Created {formatDate(task.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openEditDialog(task)}
                        data-testid={`button-edit-task-${task.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            data-testid={`button-delete-task-${task.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Task</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{task.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteTaskMutation.mutate(task.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              data-testid={`button-confirm-delete-task-${task.id}`}
                            >
                              Delete Task
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-task-name">Task Name</Label>
              <Input
                id="edit-task-name"
                placeholder="Enter task name..."
                value={taskFormData.name}
                onChange={(e) => setTaskFormData(prev => ({ ...prev, name: e.target.value }))}
                data-testid="input-edit-task-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-task-description">Description (Optional)</Label>
              <Input
                id="edit-task-description"
                placeholder="Add task description..."
                value={taskFormData.description}
                onChange={(e) => setTaskFormData(prev => ({ ...prev, description: e.target.value }))}
                data-testid="input-edit-task-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-task-project">Project (Optional)</Label>
              <select
                id="edit-task-project"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={taskFormData.project_phase_id}
                onChange={(e) => setTaskFormData(prev => ({ ...prev, project_phase_id: e.target.value }))}
                data-testid="select-edit-task-project"
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
              <Button variant="outline" onClick={() => setEditingTask(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateEditingTask}
                disabled={!taskFormData.name.trim() || updateTaskMutation.isPending}
                data-testid="button-update-task"
              >
                {updateTaskMutation.isPending ? "Updating..." : "Update Task"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
