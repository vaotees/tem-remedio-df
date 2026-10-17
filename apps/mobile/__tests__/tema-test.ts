import { coresClaras, coresEscuras, type Cores } from "@/tema/cores";
import { contraste } from "@/tema/contraste";

describe("contraste", () => {
  it("bate com os valores de referência da WCAG", () => {
    expect(contraste("#000000", "#FFFFFF")).toBeCloseTo(21, 0);
    expect(contraste("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
    expect(contraste("#767676", "#FFFFFF")).toBeCloseTo(4.54, 1);
  });
});

describe.each([
  ["claro", coresClaras],
  ["escuro", coresEscuras],
] as [string, Cores][])("tema %s", (_, c) => {
  it("todo texto passa de 4,5:1 (WCAG AA)", () => {
    const pares: [string, string, string][] = [
      ["texto/fundo", c.texto, c.fundo],
      ["texto/superfície", c.texto, c.superficie],
      ["secundário/fundo", c.textoSecundario, c.fundo],
      ["secundário/superfície", c.textoSecundario, c.superficie],
      ["botão primário", c.textoSobrePrimaria, c.primaria],
      ["botão secundário", c.primaria, c.fundo],
      ["aviso", c.aviso.texto, c.aviso.fundo],
      ...Object.entries(c.semaforo).map(([nivel, s]) => [`semáforo ${nivel}`, s.texto, s.fundo] as [string, string, string]),
    ];
    for (const [nome, frente, fundo] of pares) {
      expect({ nome, razao: contraste(frente, fundo) >= 4.5 }).toEqual({ nome, razao: true });
    }
  });

  it("bordas de campo passam de 3:1 (componentes de interface)", () => {
    expect(contraste(c.borda, c.fundo)).toBeGreaterThanOrEqual(3);
  });
});
