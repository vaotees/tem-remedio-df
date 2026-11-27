import { ehUnidadePrisional } from "@/postos/postos";
import { emCadaDez, resumirRede } from "@/postos/rede";
import { snapshotTeste } from "../fixtures/snapshot-teste";

describe("resumo da rede (painel do Início)", () => {
  const semPrisional = snapshotTeste.ubs.filter((u) => !ehUnidadePrisional(u));

  it("conta os postos e o estoque sem as unidades prisionais", () => {
    const rede = resumirRede(snapshotTeste, new Date(2026, 9, 16, 10, 0));
    expect(rede.postos).toBe(semPrisional.length);
    expect(rede.remedios).toBe(snapshotTeste.produtos.length);
    const prisionais = new Set(snapshotTeste.ubs.flatMap((u, i) => (ehUnidadePrisional(u) ? [i] : [])));
    const itens = snapshotTeste.estoque.filter(([u]) => !prisionais.has(u)).length;
    expect(rede.niveis.alto + rede.niveis.baixo + rede.niveis.critico + rede.niveis.sem_consumo).toBe(itens);
    expect(rede.regioes.reduce((s, r) => s + r.postos, 0)).toBe(rede.postos);
    expect(rede.regioes.map((r) => r.nome).every((n) => !/^Regi/.test(n))).toBe(true);
  });

  it("numa sexta às 10h há postos abertos, e as regiões somam os abertos", () => {
    const rede = resumirRede(snapshotTeste, new Date(2026, 9, 16, 10, 0));
    expect(rede.abertosAgora).toBeGreaterThan(0);
    expect(rede.abertosAgora + rede.semHorario).toBeLessThanOrEqual(rede.postos);
    expect(rede.regioes.reduce((s, r) => s + r.abertos, 0)).toBe(rede.abertosAgora);
  });

  it("de madrugada, todos fechados: diz quando a maioria abre", () => {
    const rede = resumirRede(snapshotTeste, new Date(2026, 9, 16, 3, 0));
    expect(rede.abertosAgora).toBe(0);
    expect(rede.proximaAbertura).toEqual({ quando: expect.stringMatching(/^hoje às \d{2}h/), postos: expect.any(Number) });
    expect(rede.proximaAbertura!.postos).toBeGreaterThan(0);
  });

  it("7 em cada 10, arredondado", () => {
    expect(emCadaDez(77, 100)).toBe(8);
    expect(emCadaDez(0, 0)).toBe(0);
    expect(emCadaDez(3, 4)).toBe(8);
  });
});
