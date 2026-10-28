import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { config } from "../lib/config.js";
import { AppError } from "../lib/errors.js";
import { usuarioSchema, loginSchema } from "../lib/validation.js";

export const usuarioPublico = {
  id: true,
  nome: true,
  email: true,
  dataCadastro: true,
} as const;

export async function cadastrarUsuario(input: unknown) {
  const dados = usuarioSchema.parse(input);
  return prisma.usuario.create({
    data: { ...dados, senha: await bcrypt.hash(dados.senha, 12) },
    select: usuarioPublico,
  });
}

export async function login(input: unknown) {
  const dados = loginSchema.parse(input);
  const usuario = await prisma.usuario.findUnique({
    where: { email: dados.email },
  });
  if (!usuario || !(await bcrypt.compare(dados.senha, usuario.senha)))
    throw new AppError(401, "E-mail ou senha inválidos.");
  const token = jwt.sign({}, config.JWT_SECRET, {
    subject: String(usuario.id),
    expiresIn: "1h",
    algorithm: "HS256",
    issuer: "locacao-api",
    audience: "locacao-web",
  });
  const { id, nome, email, dataCadastro } = usuario;
  return { token, usuario: { id, nome, email, dataCadastro } };
}
