import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { veiculoSchema } from "../lib/validation.js";

export async function cadastrarVeiculo(input: unknown) {
  return prisma.veiculo.create({ data: veiculoSchema.parse(input) });
}

export async function listarVeiculos(filtro: unknown) {
  const disponivel = z.enum(["true", "false"]).optional().parse(filtro);
  return prisma.veiculo.findMany({
    where:
      disponivel === undefined ? {} : { disponivel: disponivel === "true" },
    orderBy: { id: "desc" },
  });
}
