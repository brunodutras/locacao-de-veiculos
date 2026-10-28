import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { config } from "../lib/config.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { idSchema } from "../lib/validation.js";

declare module "express-serve-static-core" {
  interface Locals {
    usuarioId: number;
  }
}

export const autenticar: RequestHandler = async (req, res, next) => {
  const match = /^Bearer ([^ ]+)$/.exec(req.headers.authorization ?? "");
  if (!match?.[1]) throw new AppError(401, "Informe um token Bearer válido.");
  let usuarioId: number;
  try {
    const payload = jwt.verify(match[1], config.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "locacao-api",
      audience: "locacao-web",
    });
    if (typeof payload === "string" || !payload.sub || !payload.exp)
      throw new Error();
    usuarioId = idSchema.parse(payload.sub);
  } catch {
    throw new AppError(401, "Sessão inválida ou expirada. Entre novamente.");
  }
  if (
    !(await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true },
    }))
  )
    throw new AppError(401, "Usuário não encontrado.");
  res.locals.usuarioId = usuarioId;
  next();
};
