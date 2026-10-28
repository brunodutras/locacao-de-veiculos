import express from "express";
import cors from "cors";
import { config } from "./lib/config.js";
import { errorHandler } from "./lib/errors.js";
import { routes } from "./routes.js";

export const app = express();
app.disable("x-powered-by");
app.use(cors({ origin: config.CORS_ORIGIN }));
app.use(express.json({ limit: "32kb" }));
app.use(routes);
app.use((_req, res) => {
  res.status(404).json({ mensagem: "Rota não encontrada." });
});
app.use(errorHandler);
