// packages/shared/schema.ts
import { pgTable, uuid, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { z } from "zod";

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }),
  color: text("color"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const CreateProjectDto = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  hourly_rate: z.union([z.number(), z.string()]).optional(),
  color: z.string().optional(),
});

export const UpdateProjectDto = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(["active", "on_hold", "done", "archived"]).optional(),
  hourly_rate: z.union([z.number(), z.string()]).optional(),
  color: z.string().optional(),
});

export type Project = typeof projects.$inferSelect;
export type CreateProjectInput = z.infer<typeof CreateProjectDto>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectDto>;
