import { 
  type Project, 
  type InsertProject,
  type Task,
  type InsertTask,
  type TimeEntry,
  type InsertTimeEntry,
  type Workout,
  type InsertWorkout,
  type Steps,
  type InsertSteps,
  type EnergyCheck,
  type InsertEnergyCheck,
  type Invoice,
  type InsertInvoice,
  type Phase,
  type WorkoutActivity
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Projects
  getProject(id: string): Promise<Project | undefined>;
  getProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;
  
  // Tasks
  getTask(id: string): Promise<Task | undefined>;
  getTasks(): Promise<Task[]>;
  getTasksByProject(projectPhaseId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  
  // Time Entries
  getTimeEntry(id: string): Promise<TimeEntry | undefined>;
  getTimeEntries(): Promise<TimeEntry[]>;
  getActiveTimeEntry(): Promise<TimeEntry | undefined>;
  createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: string, updates: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined>;
  deleteTimeEntry(id: string): Promise<boolean>;
  
  // Health & Wellness
  getWorkouts(): Promise<Workout[]>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  
  getStepsForDate(date: string): Promise<Steps | undefined>;
  createOrUpdateSteps(steps: InsertSteps): Promise<Steps>;
  
  getRecentEnergyChecks(): Promise<EnergyCheck[]>;
  createEnergyCheck(energyCheck: InsertEnergyCheck): Promise<EnergyCheck>;
  
  // Billing
  getInvoices(): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  
  // Lookup data
  getPhases(): Promise<Phase[]>;
  getWorkoutActivities(): Promise<WorkoutActivity[]>;
}

export class MemStorage implements IStorage {
  private projects: Map<string, Project>;
  private tasks: Map<string, Task>;
  private timeEntries: Map<string, TimeEntry>;
  private workouts: Map<string, Workout>;
  private steps: Map<string, Steps>;
  private energyChecks: Map<string, EnergyCheck>;
  private invoices: Map<string, Invoice>;

  // Lookup data
  private phases: Phase[] = [
    { id: 1, name_nl: 'Ontwerp', name_en: 'Design', created_at: new Date() },
    { id: 2, name_nl: 'Ontwikkeling', name_en: 'Development', created_at: new Date() },
    { id: 3, name_nl: 'Testing', name_en: 'Testing', created_at: new Date() },
    { id: 4, name_nl: 'Lancering', name_en: 'Launch', created_at: new Date() },
    { id: 5, name_nl: 'Onderhoud', name_en: 'Maintenance', created_at: new Date() },
  ];

  private workoutActivities: WorkoutActivity[] = [
    { id: 1, name: 'Walking', category: 'Cardio', is_basic: true, created_at: new Date() },
    { id: 2, name: 'Running', category: 'Cardio', is_basic: true, created_at: new Date() },
    { id: 3, name: 'Cycling', category: 'Cardio', is_basic: true, created_at: new Date() },
    { id: 4, name: 'Swimming', category: 'Cardio', is_basic: true, created_at: new Date() },
    { id: 5, name: 'Push-ups', category: 'Strength', is_basic: true, created_at: new Date() },
    { id: 6, name: 'Yoga', category: 'Flexibility', is_basic: true, created_at: new Date() },
    { id: 7, name: 'Weight Training', category: 'Strength', is_basic: false, created_at: new Date() },
  ];

  constructor() {
    this.projects = new Map();
    this.tasks = new Map();
    this.timeEntries = new Map();
    this.workouts = new Map();
    this.steps = new Map();
    this.energyChecks = new Map();
    this.invoices = new Map();
  }

  // Projects
  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const project: Project = {
      ...insertProject,
      id,
      user_id: 'mock-user-id', // In real app this would come from auth
      description: insertProject.description ?? null,
      default_rate_cents: insertProject.default_rate_cents ?? null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject: Project = {
      ...project,
      ...updates,
      updated_at: new Date(),
    };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Tasks
  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTasksByProject(projectPhaseId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      task => task.project_phase_id === projectPhaseId
    );
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const task: Task = {
      ...insertTask,
      id,
      user_id: 'mock-user-id',
      description: insertTask.description ?? null,
      project_phase_id: insertTask.project_phase_id ?? null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask: Task = {
      ...task,
      ...updates,
      updated_at: new Date(),
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // Time Entries
  async getTimeEntry(id: string): Promise<TimeEntry | undefined> {
    return this.timeEntries.get(id);
  }

  async getTimeEntries(): Promise<TimeEntry[]> {
    return Array.from(this.timeEntries.values());
  }

  async getActiveTimeEntry(): Promise<TimeEntry | undefined> {
    return Array.from(this.timeEntries.values()).find(entry => !entry.end_time);
  }

  async createTimeEntry(insertTimeEntry: InsertTimeEntry): Promise<TimeEntry> {
    const id = randomUUID();
    const timeEntry: TimeEntry = {
      ...insertTimeEntry,
      id,
      user_id: 'mock-user-id',
      description: insertTimeEntry.description ?? null,
      task_id: insertTimeEntry.task_id ?? null,
      project_phase_id: insertTimeEntry.project_phase_id ?? null,
      end_time: insertTimeEntry.end_time ?? null,
      minutes: null, // Calculated by database trigger
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.timeEntries.set(id, timeEntry);
    return timeEntry;
  }

  async updateTimeEntry(id: string, updates: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined> {
    const timeEntry = this.timeEntries.get(id);
    if (!timeEntry) return undefined;
    
    const updatedTimeEntry: TimeEntry = {
      ...timeEntry,
      ...updates,
      updated_at: new Date(),
    };
    this.timeEntries.set(id, updatedTimeEntry);
    return updatedTimeEntry;
  }

  async deleteTimeEntry(id: string): Promise<boolean> {
    return this.timeEntries.delete(id);
  }

  // Health & Wellness
  async getWorkouts(): Promise<Workout[]> {
    return Array.from(this.workouts.values());
  }

  async createWorkout(insertWorkout: InsertWorkout): Promise<Workout> {
    const id = randomUUID();
    const workout: Workout = {
      ...insertWorkout,
      id,
      user_id: 'mock-user-id',
      description: insertWorkout.description ?? null,
      duration_minutes: insertWorkout.duration_minutes ?? null,
      intensity: insertWorkout.intensity ?? null,
      logged_at: insertWorkout.logged_at ?? null,
      created_at: new Date(),
    };
    this.workouts.set(id, workout);
    return workout;
  }

  async getStepsForDate(date: string): Promise<Steps | undefined> {
    return Array.from(this.steps.values()).find(
      steps => steps.step_date instanceof Date 
        ? steps.step_date.toISOString().split('T')[0] === date 
        : steps.step_date === date
    );
  }

  async createOrUpdateSteps(insertSteps: InsertSteps): Promise<Steps> {
    const dateString = insertSteps.step_date instanceof Date 
      ? insertSteps.step_date.toISOString().split('T')[0]
      : insertSteps.step_date;
    const existing = await this.getStepsForDate(dateString);
    
    if (existing) {
      const updated: Steps = {
        ...existing,
        step_count: insertSteps.step_count,
        updated_at: new Date(),
      };
      this.steps.set(existing.id, updated);
      return updated;
    } else {
      const id = randomUUID();
      const steps: Steps = {
        ...insertSteps,
        id,
        user_id: 'mock-user-id',
        created_at: new Date(),
        updated_at: new Date(),
      };
      this.steps.set(id, steps);
      return steps;
    }
  }

  async getRecentEnergyChecks(): Promise<EnergyCheck[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return Array.from(this.energyChecks.values())
      .filter(check => check.logged_at && check.logged_at >= sevenDaysAgo)
      .sort((a, b) => (b.logged_at?.getTime() ?? 0) - (a.logged_at?.getTime() ?? 0));
  }

  async createEnergyCheck(insertEnergyCheck: InsertEnergyCheck): Promise<EnergyCheck> {
    const id = randomUUID();
    const energyCheck: EnergyCheck = {
      ...insertEnergyCheck,
      id,
      user_id: 'mock-user-id',
      logged_at: insertEnergyCheck.logged_at ?? null,
      mood: insertEnergyCheck.mood ?? null,
      notes: insertEnergyCheck.notes ?? null,
      created_at: new Date(),
    };
    this.energyChecks.set(id, energyCheck);
    return energyCheck;
  }

  // Billing
  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = randomUUID();
    const invoice: Invoice = {
      ...insertInvoice,
      id,
      user_id: 'mock-user-id',
      due_date: insertInvoice.due_date ?? null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.invoices.set(id, invoice);
    return invoice;
  }

  // Lookup data
  async getPhases(): Promise<Phase[]> {
    return this.phases;
  }

  async getWorkoutActivities(): Promise<WorkoutActivity[]> {
    return this.workoutActivities;
  }
}

export const storage = new MemStorage();
