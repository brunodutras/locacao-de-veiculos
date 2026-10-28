import type { RequestHandler } from "express";
import * as service from "../services/veiculo.service.js";
export const cadastrar: RequestHandler = async (req, res) => {
  res.status(201).json(await service.cadastrarVeiculo(req.body));
};
export const listar: RequestHandler = async (req, res) => {
  res.json(await service.listarVeiculos(req.query.disponivel));
};
