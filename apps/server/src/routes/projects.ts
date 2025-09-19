// apps/server/src/routes/projects.ts
import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { projects, CreateProjectDto, UpdateProjectDto } from "@shared/schema";
import { requireUser } from "../middlewares/auth";

export const projectsRouter = Router();
projectsRouter.use(requireUser);

// GET /api/projects?status=active|on_hold|done|archived
projectsRouter.get("/", async (req, res) => {
  const userId = (req as any).userId as string;
  const { status } = req.query as { status?: "active" | "on_hold" | "done" | "archived" };

  // Standaard alleen 'active' tonen
  const base = db.select().from(projects).where(eq(projects.userId, userId));
  const rows = await (status
    ? base.where(eq(projects.status, status))
    : base.where(eq(projects.status, "active"))
  ).orderBy(projects.createdAt);

  res.json(rows);
});

// POST /api/projects
projectsRouter.post("/", async (req, res) => {
  const userId = (req as any).userId as string;
  const parse = CreateProjectDto.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

  const { name, description, hourly_rate, color } = parse.data;

  const [row] = await db
    .insert(projects)
    .values({
      userId,
      name,
      description,
      color,
      hourlyRate: hourly_rate ? String(hourly_rate) : null,
    })
    .returning();

  res.status(201).json(row);
});

// PATCH /api/projects/:id
projectsRouter.patch("/:id", async (req, res) => {
  const userId = (req as any).userId as string;
  const id = req.params.id;
  const parse = UpdateProjectDto.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

  const p = parse.data;
  const [row] = await db
    .update(projects)
    .set({
      name: p.name,
      description: p.description,
      status: p.status,
      hourlyRate: p.hourly_rate ? String(p.hourly_rate) : undefined,
      color: p.color,
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .returning();

  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});

// DELETE /api/projects/:id  -> soft delete (archive)
projectsRouter.delete("/:id", async (req, res) => {
  const userId = (req as any).userId as string;
  const id = req.params.id;

  const [row] = await db
    .update(projects)
    .set({ status: "archived", updatedAt: new Date() })
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .returning();

  if (!row) return res.status(404).json({ error: "Not found" });
  res.status(200).json({ ok: true, id, status: "archived" });
});

// PATCH /api/projects/:id/restore -> terug naar active
projectsRouter.patch("/:id/restore", async (req, res) => {
  const userId = (req as any).userId as string;
  const id = req.params.id;

  const [row] = await db
    .update(projects)
    .set({ status: "active", updatedAt: new Date() })
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .returning();

  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});
