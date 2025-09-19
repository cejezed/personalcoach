// apps/server/src/app.ts
import express from "express";
import cors from "cors";
import { projectsRouter } from "./routes/projects";

export const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? "*", credentials: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/projects", projectsRouter);
