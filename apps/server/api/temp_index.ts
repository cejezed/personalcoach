// apps/server/api/index.ts
import express from "express";
import serverless from "serverless-http";
import cors from "cors";

const app = express();

// Basis middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Demo projects endpoint
app.get("/projects", (_req, res) => {
  res.json([
    { id: 1, name: "Demo project", status: "on_hold" },
    { id: 2, name: "Tweede project", status: "active" },
  ]);
});

// Vercel verwacht hier de serverless export
export default serverless(app);
