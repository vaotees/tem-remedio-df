import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { LinhaRegra } from "../src/fontes/garantir";
import { classificarRetirada } from "../src/transformar/retirada";

// Linhas reais do painel "Como garantir seu medicamento".
const regras: (LinhaRegra & { nome: string })[] = JSON.parse(
  readFileSync(new URL("fixtures/regras-ubs.json", import.meta.url), "utf8"),
);
const doRemedio = (inicioNome: string) => regras.filter((r) => r.nome.startsWith(inicioNome));

describe("classificarRetirada", () => {
  it.each([
    ["anlodipino", "qualquer_ubs"],
    ["oxibutinina", "ubs_referencia"],
    ["clonazepam", "controlado"],
    ["Mikania laevigata", "unidades_especificas"],
    ["oseltamivir", "unidades_especificas"],
    ["nicotina", "grupo_acompanhamento"],
    ["benzilpenicilina benzatina", "aplicado_no_posto"],
  ])("%s → %s", (nome, esperado) => {
    const linhas = doRemedio(nome);
    expect(linhas.length).toBeGreaterThan(0);
    expect(classificarRetirada(linhas).retirada).toBe(esperado);
  });

  it("remédio sem nenhuma linha no painel fica sem informação", () => {
    expect(classificarRetirada([]).retirada).toBe("sem_informacao");
  });

  it("observação nova, que o coletor não conhece, não vira 'qualquer UBS'", () => {
    const r = classificarRetirada([
      { codigo: "1", tipo: "Observações", texto: "Regra nova que ninguém previu.", link: null },
    ]);
    expect(r.retirada).toBe("sem_informacao");
    expect(r.naoReconhecida).toBe("Regra nova que ninguém previu.");
  });
});
