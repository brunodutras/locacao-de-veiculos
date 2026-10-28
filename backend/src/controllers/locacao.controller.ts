import type { RequestHandler } from "express";
import * as service from "../services/locacao.service.js";
export const registrar: RequestHandler = async (req, res) => {
  res
    .status(201)
    .json(await service.registrarLocacao(res.locals.usuarioId, req.body));
};
export const listar: RequestHandler = async (_req, res) => {
  res.json(await service.listarLocacoes(res.locals.usuarioId));
};
export const finalizar: RequestHandler = async (req, res) => {
  res.json(await service.finalizarLocacao(res.locals.usuarioId, req.params.id));
};
