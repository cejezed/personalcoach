import express from "express";
import cors from "cors";

export const app = express();

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

// ❌ geen app.listen hier, dit bestand exporteert alleen de app
