import express from "express";
import serverless from "serverless-http";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/projects", (_req, res) => {
  res.json([{ id: 1, name: "Demo project", status: "on_hold" }]);
});

export default serverless(app);
