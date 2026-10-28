import "dotenv/config";
import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import request from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";

const testUrl = process.env.TEST_DATABASE_URL;
if (
  !testUrl ||
  !/^mysql:\/\//.test(testUrl) ||
  !new URL(testUrl).pathname.endsWith("_test")
) {
  throw new Error(
    "Defina TEST_DATABASE_URL para um banco MySQL dedicado com nome terminado em _test.",
  );
}
process.env.DATABASE_URL = testUrl;
process.env.JWT_SECRET = "segredo-apenas-para-testes-integracao-123456";
execFileSync(
  process.execPath,
  ["../node_modules/prisma/build/index.js", "migrate", "deploy"],
  { env: process.env, stdio: "inherit" },
);
const { app } = await import("../src/app.js");
const { prisma } = await import("../src/lib/prisma.js");
const { registrarLocacao } = await import("../src/services/locacao.service.js");
const prefixo = `teste-${Date.now()}`;
const senha = "Estudo@12345";
const usuarios: number[] = [];
const veiculos: number[] = [];
let tokenA: string;
let tokenB: string;
let contador = 0;

async function criarUsuario(sufixo: string) {
  const email = `${prefixo}-${sufixo}@example.com`;
  const cadastro = await request(app)
    .post("/usuarios")
    .send({ nome: "Pessoa Teste", email, senha })
    .expect(201);
  usuarios.push(cadastro.body.id);
  const login = await request(app)
    .post("/login")
    .send({ email, senha })
    .expect(200);
  return { cadastro: cadastro.body, login: login.body, email };
}
async function criarVeiculo() {
  contador++;
  const placa = `TST${String(contador).padStart(4, "0")}`;
  const resposta = await request(app)
    .post("/veiculos")
    .auth(tokenA, { type: "bearer" })
    .send({
      marca: "Teste",
      modelo: "Modelo",
      placa,
      ano: 2025,
      valorDiaria: "100.10",
    })
    .expect(201);
  veiculos.push(resposta.body.id);
  return resposta.body;
}
function periodo(veiculoId: number) {
  return {
    veiculoId,
    dataInicio: "2026-10-28T10:00:00-03:00",
    dataPrevistaDevolucao: "2026-10-29T11:00:00-03:00",
  };
}

before(async () => {
  const a = await criarUsuario("a");
  const b = await criarUsuario("b");
  tokenA = a.login.token;
  tokenB = b.login.token;
});
after(async () => {
  try {
    await prisma.locacao.deleteMany({
      where: {
        OR: [{ usuarioId: { in: usuarios } }, { veiculoId: { in: veiculos } }],
      },
    });
    await prisma.veiculo.deleteMany({ where: { id: { in: veiculos } } });
    await prisma.usuario.deleteMany({ where: { id: { in: usuarios } } });
  } finally {
    await prisma.$disconnect();
  }
});

test("cadastro, login, bcrypt e JWT sem senha", async () => {
  const { cadastro, login, email } = await criarUsuario("cadastro");
  assert.equal(cadastro.senha, undefined);
  assert.equal(login.usuario.senha, undefined);
  const salvo = await prisma.usuario.findUniqueOrThrow({ where: { email } });
  assert.notEqual(salvo.senha, senha);
  assert.equal(await bcrypt.compare(senha, salvo.senha), true);
  const payload = jwt.decode(login.token) as jwt.JwtPayload;
  assert.equal(payload.sub, String(cadastro.id));
  assert.equal(payload.senha, undefined);
  assert.equal(payload.exp! - payload.iat!, 3600);
  await request(app)
    .post("/usuarios")
    .send({ nome: "Outra Pessoa", email, senha })
    .expect(409);
  await request(app)
    .post("/login")
    .send({ email, senha: "senha-errada" })
    .expect(401);
  await request(app)
    .post("/usuarios")
    .send({ nome: "", email: "invalido", senha: "123" })
    .expect(400);
});

test("todas as operações protegidas rejeitam token ausente, inválido e expirado", async () => {
  const expirado = jwt.sign({}, process.env.JWT_SECRET!, {
    subject: String(usuarios[0]),
    expiresIn: -1,
    issuer: "locacao-api",
    audience: "locacao-web",
  });
  const rotas = [
    ["get", "/veiculos"],
    ["post", "/veiculos"],
    ["get", "/locacoes"],
    ["post", "/locacoes"],
    ["patch", "/locacoes/1/devolucao"],
  ] as const;
  for (const [metodo, rota] of rotas) {
    for (const token of [null, "invalido", expirado]) {
      const chamada = request(app)[metodo](rota);
      if (token) chamada.auth(token, { type: "bearer" });
      await chamada.expect(401);
    }
  }
});

test("placa duplicada, valor positivo, filtro e campos proibidos", async () => {
  const v = await criarVeiculo();
  const base = {
    marca: "Teste",
    modelo: "Modelo",
    placa: v.placa,
    ano: 2025,
    valorDiaria: "100.10",
  };
  await request(app)
    .post("/veiculos")
    .auth(tokenA, { type: "bearer" })
    .send(base)
    .expect(409);
  for (const valorDiaria of ["0", "-1", "1.001"])
    await request(app)
      .post("/veiculos")
      .auth(tokenA, { type: "bearer" })
      .send({ ...base, valorDiaria })
      .expect(400);
  await request(app)
    .post("/veiculos")
    .auth(tokenA, { type: "bearer" })
    .send({ ...base, disponivel: false })
    .expect(400);
  await request(app)
    .get("/veiculos?disponivel=sim")
    .auth(tokenA, { type: "bearer" })
    .expect(400);
  const lista = await request(app)
    .get("/veiculos?disponivel=true")
    .auth(tokenA, { type: "bearer" })
    .expect(200);
  assert.ok(
    lista.body.every((item: { disponivel: boolean }) => item.disponivel),
  );
});

test("datas inválidas, veículo inexistente e identidade não fornecida pelo cliente", async () => {
  const v = await criarVeiculo();
  const base = periodo(v.id);
  for (const fim of [
    base.dataInicio,
    "2026-10-27T10:00:00Z",
    "invalida",
    "2026-10-29T10:00:00",
  ]) {
    await request(app)
      .post("/locacoes")
      .auth(tokenA, { type: "bearer" })
      .send({ ...base, dataPrevistaDevolucao: fim })
      .expect(400);
  }
  await request(app)
    .post("/locacoes")
    .auth(tokenA, { type: "bearer" })
    .send({ ...base, usuarioId: usuarios[1] })
    .expect(400);
  await request(app)
    .post("/locacoes")
    .auth(tokenA, { type: "bearer" })
    .send(periodo(2147483647))
    .expect(404);
  assert.equal(await prisma.locacao.count({ where: { veiculoId: v.id } }), 0);
  assert.equal(
    (await prisma.veiculo.findUniqueOrThrow({ where: { id: v.id } }))
      .disponivel,
    true,
  );
});

test("fluxo real: valor, indisponibilidade, propriedade, devolução e histórico", async () => {
  const v = await criarVeiculo();
  const criada = await request(app)
    .post("/locacoes")
    .auth(tokenA, { type: "bearer" })
    .send(periodo(v.id))
    .expect(201);
  const l = criada.body;
  assert.equal(l.valorTotal, "200.2");
  assert.equal(l.usuarioId, usuarios[0]);
  assert.equal(l.veiculo.id, v.id);
  assert.equal(l.veiculo.disponivel, false);
  await request(app)
    .post("/locacoes")
    .auth(tokenB, { type: "bearer" })
    .send(periodo(v.id))
    .expect(409);
  const listaB = await request(app)
    .get("/locacoes")
    .auth(tokenB, { type: "bearer" })
    .expect(200);
  assert.equal(
    listaB.body.some((item: { id: number }) => item.id === l.id),
    false,
  );
  await request(app)
    .patch(`/locacoes/${l.id}/devolucao`)
    .auth(tokenB, { type: "bearer" })
    .expect(404);
  assert.equal(
    (await prisma.veiculo.findUniqueOrThrow({ where: { id: v.id } }))
      .disponivel,
    false,
  );
  const finalizada = await request(app)
    .patch(`/locacoes/${l.id}/devolucao`)
    .auth(tokenA, { type: "bearer" })
    .send({ dataDevolucao: "2000-01-01" })
    .expect(200);
  assert.equal(finalizada.body.status, "FINALIZADA");
  assert.ok(
    Math.abs(Date.now() - +new Date(finalizada.body.dataDevolucao)) < 10000,
  );
  assert.equal(finalizada.body.veiculo.disponivel, true);
  await request(app)
    .patch(`/locacoes/${l.id}/devolucao`)
    .auth(tokenA, { type: "bearer" })
    .expect(409);
  const listaA = await request(app)
    .get("/locacoes")
    .auth(tokenA, { type: "bearer" })
    .expect(200);
  assert.ok(
    listaA.body.some(
      (item: { id: number; status: string }) =>
        item.id === l.id && item.status === "FINALIZADA",
    ),
  );
  await request(app)
    .post("/locacoes")
    .auth(tokenA, { type: "bearer" })
    .send(periodo(v.id))
    .expect(201);
  assert.equal(await prisma.locacao.count({ where: { veiculoId: v.id } }), 2);
});

test("rollback real após atualizar disponibilidade e falhar chave estrangeira", async () => {
  const v = await criarVeiculo();
  await assert.rejects(registrarLocacao(2147483647, periodo(v.id)), (erro: unknown) => erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2003");
  assert.equal(
    (await prisma.veiculo.findUniqueOrThrow({ where: { id: v.id } }))
      .disponivel,
    true,
  );
  assert.equal(await prisma.locacao.count({ where: { veiculoId: v.id } }), 0);
});

test("duas requisições HTTP concorrentes criam exatamente uma locação ativa", async () => {
  const v = await criarVeiculo();
  const respostas = await Promise.all(
    [tokenA, tokenB].map((token) =>
      request(app)
        .post("/locacoes")
        .auth(token, { type: "bearer" })
        .send(periodo(v.id)),
    ),
  );
  assert.deepEqual(respostas.map((r) => r.status).sort(), [201, 409]);
  assert.equal(
    await prisma.locacao.count({ where: { veiculoId: v.id, status: "ATIVA" } }),
    1,
  );
  assert.equal(
    (await prisma.veiculo.findUniqueOrThrow({ where: { id: v.id } }))
      .disponivel,
    false,
  );
});

test("devoluções concorrentes só finalizam uma vez e liberam veículo", async () => {
  const v = await criarVeiculo();
  const criada = await request(app)
    .post("/locacoes")
    .auth(tokenA, { type: "bearer" })
    .send(periodo(v.id))
    .expect(201);
  const respostas = await Promise.all(
    [1, 2].map(() =>
      request(app)
        .patch(`/locacoes/${criada.body.id}/devolucao`)
        .auth(tokenA, { type: "bearer" }),
    ),
  );
  assert.deepEqual(respostas.map((r) => r.status).sort(), [200, 409]);
  assert.equal(
    (await prisma.veiculo.findUniqueOrThrow({ where: { id: v.id } }))
      .disponivel,
    true,
  );
});
