import { z } from "zod";
export const idSchema = z.coerce.number().int().positive().max(2147483647);
export const usuarioSchema = z
  .object({
    nome: z.string().trim().min(2).max(100),
    email: z
      .email()
      .max(191)
      .transform((v) => v.toLowerCase()),
    senha: z
      .string()
      .min(8)
      .refine(
        (v) => Buffer.byteLength(v, "utf8") <= 72,
        "Senha deve ter até 72 bytes.",
      ),
  })
  .strict();
export const loginSchema = usuarioSchema.pick({ email: true, senha: true });
export const veiculoSchema = z
  .object({
    marca: z.string().trim().min(1).max(60),
    modelo: z.string().trim().min(1).max(80),
    placa: z
      .string()
      .trim()
      .transform((v) => v.toUpperCase().replace("-", ""))
      .pipe(
        z.string().regex(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/, "Placa inválida."),
      ),
    ano: z
      .number()
      .int()
      .min(1900)
      .max(new Date().getUTCFullYear() + 1),
    valorDiaria: z
      .union([z.string(), z.number()])
      .transform(String)
      .pipe(
        z
          .string()
          .regex(
            /^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/,
            "Informe valor positivo com até duas casas decimais.",
          ),
      )
      .refine((v) => Number(v) > 0),
  })
  .strict();
export const locacaoSchema = z
  .object({
    veiculoId: z.number().int().positive().max(2147483647),
    dataInicio: z.iso.datetime({ offset: true }),
    dataPrevistaDevolucao: z.iso.datetime({ offset: true }),
  })
  .strict();
