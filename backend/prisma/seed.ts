import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
const prisma = new PrismaClient();
try {
  const senha = await bcrypt.hash("Estudo@12345", 12);
  for (const [nome, email] of [
    ["Ana Demonstração", "ana@example.com"],
    ["Bruno Demonstração", "bruno@example.com"],
  ]) {
    await prisma.usuario.upsert({
      where: { email },
      update: {},
      create: { nome: nome!, email: email!, senha },
    });
  }
  for (const dados of [
    {
      marca: "Fiat",
      modelo: "Argo",
      placa: "ABC1D23",
      ano: 2024,
      valorDiaria: "129.90",
    },
    {
      marca: "Chevrolet",
      modelo: "Onix",
      placa: "DEF4G56",
      ano: 2025,
      valorDiaria: "149.90",
    },
    {
      marca: "Toyota",
      modelo: "Corolla",
      placa: "HIJ7K89",
      ano: 2025,
      valorDiaria: "229.90",
    },
  ])
    await prisma.veiculo.upsert({
      where: { placa: dados.placa },
      update: {},
      create: dados,
    });
  console.log("Seed concluído. Usuários existentes e histórico preservados.");
} finally {
  await prisma.$disconnect();
}
