import { Router } from "express";
import * as auth from "./controllers/auth.controller.js";
import * as veiculo from "./controllers/veiculo.controller.js";
import * as locacao from "./controllers/locacao.controller.js";
import { autenticar } from "./middleware/auth.js";

export const routes = Router();
routes.post("/usuarios", auth.cadastrar);
routes.post("/login", auth.entrar);
routes.use(autenticar);
routes.post("/veiculos", veiculo.cadastrar);
routes.get("/veiculos", veiculo.listar);
routes.post("/locacoes", locacao.registrar);
routes.get("/locacoes", locacao.listar);
routes.patch("/locacoes/:id/devolucao", locacao.finalizar);
