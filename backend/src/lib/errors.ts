import type { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public status: number,
    mensagem: string,
  ) {
    super(mensagem);
  }
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.status).json({ mensagem: error.message });
    return;
  }
  if (error instanceof ZodError) {
    res
      .status(400)
      .json({
        mensagem: "Dados inválidos.",
        erros: error.issues.map((i) => ({
          campo: i.path.join("."),
          mensagem: i.message,
        })),
      });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      res.status(409).json({ mensagem: "E-mail ou placa já cadastrado." });
      return;
    }
    if (["P2034", "P2028"].includes(error.code)) {
      res
        .status(409)
        .json({
          mensagem:
            "Conflito entre operações. Atualize os dados e tente novamente.",
        });
      return;
    }
    if (error.code === "P2003") {
      res.status(409).json({ mensagem: "Relacionamento inválido." });
      return;
    }
  }
  if (
    error &&
    typeof error === "object" &&
    "type" in error &&
    error.type === "entity.too.large"
  ) {
    res
      .status(413)
      .json({ mensagem: "Corpo da requisição excede o limite de 32 KB." });
    return;
  }
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ mensagem: "JSON inválido." });
    return;
  }
  console.error(
    "Falha interna:",
    error instanceof Error ? error.name : "Erro desconhecido",
  );
  res.status(500).json({ mensagem: "Não foi possível concluir a operação." });
};
