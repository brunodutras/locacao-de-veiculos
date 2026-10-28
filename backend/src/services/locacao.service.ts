import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { calcularValor } from "../lib/calculo.js";
import { idSchema, locacaoSchema } from "../lib/validation.js";

export async function registrarLocacao(usuarioId: number, input: unknown) {
  const dados = locacaoSchema.parse(input);
  const inicio = new Date(dados.dataInicio);
  const fim = new Date(dados.dataPrevistaDevolucao);
  if (fim <= inicio)
    throw new AppError(
      400,
      "A devolução prevista deve ser posterior ao início.",
    );
  return prisma.$transaction(async (tx) => {
    const veiculo = await tx.veiculo.findUnique({
      where: { id: dados.veiculoId },
    });
    if (!veiculo) throw new AppError(404, "Veículo não encontrado.");
    const valorTotal = calcularValor(inicio, fim, veiculo.valorDiaria);
    const alterados = await tx.veiculo.updateMany({
      where: { id: veiculo.id, disponivel: true },
      data: { disponivel: false },
    });
    if (alterados.count !== 1) throw new AppError(409, "Veículo indisponível.");
    return tx.locacao.create({
      data: {
        usuarioId,
        veiculoId: veiculo.id,
        dataInicio: inicio,
        dataPrevistaDevolucao: fim,
        valorTotal,
      },
      include: { veiculo: true },
    });
  });
}

export async function listarLocacoes(usuarioId: number) {
  return prisma.locacao.findMany({
    where: { usuarioId },
    include: { veiculo: true },
    orderBy: { id: "desc" },
  });
}

export async function finalizarLocacao(usuarioId: number, inputId: unknown) {
  const id = idSchema.parse(inputId);
  return prisma.$transaction(async (tx) => {
    const locacao = await tx.locacao.findFirst({ where: { id, usuarioId } });
    if (!locacao) throw new AppError(404, "Locação não encontrada.");
    const alterados = await tx.locacao.updateMany({
      where: { id, usuarioId, status: "ATIVA", dataDevolucao: null },
      data: { status: "FINALIZADA", dataDevolucao: new Date() },
    });
    if (alterados.count !== 1)
      throw new AppError(409, "Locação já finalizada.");
    await tx.veiculo.update({
      where: { id: locacao.veiculoId },
      data: { disponivel: true },
    });
    return tx.locacao.findUniqueOrThrow({
      where: { id },
      include: { veiculo: true },
    });
  });
}
