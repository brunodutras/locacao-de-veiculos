import { Prisma } from "@prisma/client";
import { AppError } from "./errors.js";

export function calcularValor(inicio: Date, fim: Date, diaria: Prisma.Decimal) {
  const duracao = fim.getTime() - inicio.getTime();
  if (!Number.isFinite(duracao) || duracao <= 0)
    throw new AppError(
      400,
      "A devolução prevista deve ser posterior ao início.",
    );
  const total = diaria.mul(Math.ceil(duracao / 86400000));
  if (total.gt("9999999999.99"))
    throw new AppError(400, "Valor total excede o limite permitido.");
  return total;
}
