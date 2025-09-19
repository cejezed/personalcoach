// apps/server/api/[...all].ts
import express from "express";
import serverless from "serverless-http";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Mount alles onder /api
const api = express.Router();

api.get("/health", (_req, res) => res.json({ ok: true }));

api.get("/projects", (_req, res) => {
  res.json([{ id: 1, name: "Demo project", status: "on_hold" }]);
});

// belangrijk: mounten
app.use("/api", api);

export default serverless(app);
