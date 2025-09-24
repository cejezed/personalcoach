export type Workout = {
  id: string | number;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  intensity: "low" | "medium" | "high";
  logged_at: string | Date | null;
};

export type InsertWorkout = {
  name: string;
  description: string | null;
  duration_minutes: number | null;
  intensity: "low" | "medium" | "high";
  logged_at: string; // ISO
};

export type Steps = {
  id: string | number;
  step_count: number;
  step_date: string; // YYYY-MM-DD
  source?: "manual" | "fitness_tracker" | "smartphone" | "smartwatch";
};

export type InsertSteps = {
  step_count: number;
  step_date: string; // YYYY-MM-DD
  source?: "manual" | "fitness_tracker" | "smartphone" | "smartwatch";
};

export type EnergyCheck = {
  id: string | number;
  user_id?: string;
  energy_level: 1 | 2 | 3 | 4 | 5;
  mood: string | null;
  notes: string | null;
  logged_at: string | Date | null;
  created_at?: string | Date | null;
};

export type InsertEnergyCheck = {
  energy_level: 1 | 2 | 3 | 4 | 5;
  mood: string | null;
  notes: string | null;
  logged_at: string; // ISO
};
