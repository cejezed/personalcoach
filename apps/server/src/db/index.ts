import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL!;
export const pool = new Pool({ connectionString: connectionString, max: 5 });
export const db = drizzle(pool);
