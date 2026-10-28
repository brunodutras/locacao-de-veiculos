import "dotenv/config";
import { z } from "zod";

export const config = z
  .object({
    DATABASE_URL: z.string().startsWith("mysql://"),
    JWT_SECRET: z.string().min(32),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    CORS_ORIGIN: z.url().default("http://localhost:5173"),
  })
  .parse(process.env);
