import { test } from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";
import { calcularValor } from "../src/lib/calculo.js";
const inicio = new Date("2026-01-01T00:00:00Z");
for (const [horas, total] of [
  [24, "129.9"],
  [25, "259.8"],
  [48, "259.8"],
]) {
  test(`${horas} horas: R$ ${total}`, () =>
    assert.equal(
      calcularValor(
        inicio,
        new Date(+inicio + Number(horas) * 3600000),
        new Prisma.Decimal("129.90"),
      ).toString(),
      total,
    ));
}
test("datas iguais, invertidas e inválidas", () => {
  for (const fim of [inicio, new Date(+inicio - 1), new Date("inválida")])
    assert.throws(() => calcularValor(inicio, fim, new Prisma.Decimal("1.00")));
});
test("decimal exato e teto monetário", () => {
  assert.equal(
    calcularValor(
      inicio,
      new Date(+inicio + 25 * 3600000),
      new Prisma.Decimal("0.10"),
    ).toString(),
    "0.2",
  );
  assert.throws(() =>
    calcularValor(
      inicio,
      new Date("9999-01-01T00:00:00Z"),
      new Prisma.Decimal("99999999.99"),
    ),
  );
});
