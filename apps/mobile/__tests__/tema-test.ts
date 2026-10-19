import { coresClaras, coresEscuras, type Cores } from "@/tema/cores";
import { contraste } from "@/tema/contraste";

describe("contraste", () => {
  it("bate com os valores de referência da WCAG", () => {
    expect(contraste("#000000", "#FFFFFF")).toBeCloseTo(21, 0);
    expect(contraste("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
    expect(contraste("#767676", "#FFFFFF")).toBeCloseTo(4.54, 1);
  });
});

/** Cores típicas do mapa (Apple Maps e Google Maps), onde o pino precisa aparecer (3:1). */
const CHAO_DO_MAPA_CLARO = { rua: "#F5F3EE", parque: "#CFE8C4", agua: "#AADAFF" };
const CHAO_DO_MAPA_ESCURO = "#2C2C2E";

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
      ["primária/superfície (região escolhida)", c.primaria, c.superficie],
      ["aviso", c.aviso.texto, c.aviso.fundo],
      ["informação", c.info.texto, c.info.fundo],
      ["aberto", c.aberto.texto, c.aberto.fundo],
      ["fechado", c.fechado.texto, c.fechado.fundo],
      ...Object.entries(c.semaforo).map(([nivel, s]) => [`semáforo ${nivel}`, s.texto, s.fundo] as [string, string, string]),
    ];
    for (const [nome, frente, fundo] of pares) {
      expect({ nome, razao: contraste(frente, fundo) >= 4.5 }).toEqual({ nome, razao: true });
    }
  });

  it("bordas de campo passam de 3:1 (componentes de interface)", () => {
    expect(contraste(c.borda, c.fundo)).toBeGreaterThanOrEqual(3);
  });

  it("ícones sobre a superfície dos cartões passam de 3:1 (ex.: aviso em Meus remédios)", () => {
    expect(contraste(c.aviso.texto, c.superficie)).toBeGreaterThanOrEqual(3);
    expect(contraste(c.textoSecundario, c.superficie)).toBeGreaterThanOrEqual(3);
  });

  it("pinos do mapa: ícone legível e pino visível no mapa claro e no escuro", () => {
    for (const [nivel, miolo] of Object.entries(c.pino.miolo)) {
      expect({ nivel, icone: contraste(c.pino.icone, miolo) >= 4.5 }).toEqual({ nivel, icone: true });
      for (const [chao, cor] of Object.entries(CHAO_DO_MAPA_CLARO)) {
        expect({ nivel, chao, visivel: contraste(miolo, cor) >= 3 }).toEqual({ nivel, chao, visivel: true });
      }
    }
    expect(contraste(c.pino.borda, CHAO_DO_MAPA_ESCURO)).toBeGreaterThanOrEqual(3);
  });
});
