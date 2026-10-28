import type { RequestHandler } from "express";
import * as service from "../services/auth.service.js";
export const cadastrar: RequestHandler = async (req, res) => {
  res.status(201).json(await service.cadastrarUsuario(req.body));
};
export const entrar: RequestHandler = async (req, res) => {
  res.json(await service.login(req.body));
};
