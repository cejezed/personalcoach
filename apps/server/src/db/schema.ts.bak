import { pgTable, text, timestamp, integer, uuid, date } from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  city: text("city"),
  client_name: text("client_name"),
  default_rate_cents: integer("default_rate_cents").default(0).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const timeEntries = pgTable("time_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  project_id: uuid("project_id").notNull().references(() => projects.id),
  phase_code: text("phase_code").notNull(),             // bv. 'voorlopig-ontwerp'
  occurred_on: date("occurred_on").notNull(),           // YYYY-MM-DD
  minutes: integer("minutes").notNull(),                // integer minutes
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
