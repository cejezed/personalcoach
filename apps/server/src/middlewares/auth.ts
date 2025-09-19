// apps/server/src/middlewares/auth.ts
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function requireUser(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Missing token" });
  const token = auth.slice(7);
  const payload = jwt.decode(token) as any | null;
  if (!payload?.sub) return res.status(401).json({ error: "Invalid token" });
  (req as any).userId = payload.sub as string;
  next();
}
