import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { lerCmed } from "../src/fontes/cmed";
import { separarDescricao } from "../src/transformar/descricao";
import { construirMarcas } from "../src/transformar/marcas";

const ler = (nome: string) => readFileSync(new URL(`fixtures/${nome}`, import.meta.url), "utf8");

// Trechos reais: CMED (Anvisa) e produtos do estoque da SES-DF.
const cmed = lerCmed(ler("cmed-trecho.csv"));
const produtosSes: { codigo: string; descricao: string }[] = [
  ...JSON.parse(ler("produtos-ses.json")),
  { codigo: "11096", descricao: "BROMETO DE N BUTIL-ESCOPOLAMINA COMPRIMIDO OU DRAGEA 10MG" },
];
const separados = produtosSes.map((p) => ({ ...p, ...separarDescricao(p.descricao) }));
const marcas = construirMarcas(cmed, separados);
const descricoesDa = (nome: string) =>
  (marcas.find((m) => m.nome === nome)?.produtos ?? []).map((i) => separados[i]!.descricao);

describe("lerCmed", () => {
  it("lê o CSV com BOM e substâncias separadas por ';' dentro de aspas", () => {
    const alenia = cmed.find((r) => r.produto === "ALENIA");
    expect(alenia?.substancia).toBe("BUDESONIDA;FUMARATO DE FORMOTEROL DI-HIDRATADO");
    expect(cmed.every((r) => r.substancia && r.produto)).toBe(true);
  });

  it("falha alto se o cabeçalho mudar", () => {
    expect(() => lerCmed("A;B;C\n1;2;3")).toThrow(/Cabeçalho da CMED mudou/);
  });
});

describe("tradutor de marcas", () => {
  it("leva a marca ao remédio do SUS-DF com a mesma substância", () => {
    expect(descricoesDa("GLIFAGE")).toEqual(["METFORMINA (CLORIDRATO) COMPRIMIDO 850 MG"]);
    expect(descricoesDa("AAS")).toEqual(["ACIDO ACETILSALICILICO COMPRIMIDO 100 MG"]);
    expect(descricoesDa("COZAAR")).toEqual(["LOSARTANA POTASSICA COMPRIMIDO REVESTIDO 50 MG"]);
    expect(descricoesDa("RIVOTRIL")).toHaveLength(2);
  });

  it("resolve os casos que falharam no teste de extração", () => {
    // sal "tri-hidratada" e combinação com clavulanato não se misturam
    expect(descricoesDa("AMOXIL").every((d) => d.startsWith("AMOXICILINA ") && !d.includes("CLAVULANATO"))).toBe(true);
    // combinações em outra ordem e com sais diferentes
    expect(descricoesDa("ALENIA")).toHaveLength(2);
    expect(descricoesDa("ALENIA").every((d) => d.includes("BUDESONIDA"))).toBe(true);
    expect(descricoesDa("SERETIDE").every((d) => d.startsWith("SALMETEROL"))).toBe(true);
    // insulina humana (CMED) → NPH e regular (SES-DF): o app pergunta "qual destes?"
    expect(descricoesDa("HUMULIN N").some((d) => d.includes("NPH"))).toBe(true);
    // "butilbrometo de escopolamina" × "brometo de N butil-escopolamina"
    expect(descricoesDa("BUSCOPAN")).toEqual(["BROMETO DE N BUTIL-ESCOPOLAMINA COMPRIMIDO OU DRAGEA 10MG"]);
  });

  it("marca de liberação prolongada fica sinalizada (Glifage XR × metformina comum)", () => {
    const xr = marcas.find((m) => m.nome === "GLIFAGE XR");
    expect(xr?.liberacaoProlongada).toBe(true);
    expect(marcas.find((m) => m.nome === "GLIFAGE")?.liberacaoProlongada).toBe(false);
    expect(separados[xr!.produtos[0]!]!.liberacaoProlongada).toBe(false);
    expect(marcas.find((m) => m.nome === "SELOZOK")?.liberacaoProlongada).toBe(true);
  });

  it("marca sem equivalente no SUS-DF não entra", () => {
    expect(marcas.find((m) => m.nome === "HIGROTON")).toBeUndefined();
  });
});

describe("regressões achadas no primeiro run real", () => {
  const ses = [
    "CLORETO DE SODIO 0,9 % SOLUÇÃO INJETÁVEL BOLSA 500 ML",
    "VALPROATO DE SODIO COMPRIMIDO (EQUIVALENTE 500 MG ACIDO VALPROICO)",
    "AMOXICILINA CAPSULA OU COMPRIMIDO 500 MG",
    "AMOXICILINA + CLAVULANATO DE POTÁSSIO COMPRIMIDO REVESTIDO 500MG +125MG",
    "CARBONATO DE CALCIO (EQUIVALENTE A 500 OU 600 MG DE CALCIO) + COLECALCIFEROL 400 UI COMPRIMIDO",
  ].map((descricao) => ({ descricao, ...separarDescricao(descricao) }));
  const reg = (produto: string, substancia: string) => ({ produto, substancia, apresentacao: "" });
  const nomes = (m: { produtos: number[] } | undefined) => (m?.produtos ?? []).map((i) => ses[i]!.descricao);

  it("tirar o sal não pode deixar só o elemento: acetato/citrato de sódio ≠ cloreto/valproato de sódio", () => {
    const m = construirMarcas(
      [reg("ACETATO DE SODIO", "ACETATO DE SÓDIO"), reg("CIFOBAN", "CITRATO DE SÓDIO DI-HIDRATADO")],
      ses,
    );
    expect(m).toEqual([]);
  });

  it("vale a substância da maioria das linhas da marca (CLAVULIN)", () => {
    const m = construirMarcas(
      [
        reg("CLAVULIN", "AMOXICILINA TRI-HIDRATADA"),
        ...Array.from({ length: 6 }, () => reg("CLAVULIN", "CLAVULANATO DE POTÁSSIO;AMOXICILINA TRI-HIDRATADA")),
      ],
      ses,
    );
    expect(nomes(m[0])).toEqual(["AMOXICILINA + CLAVULANATO DE POTÁSSIO COMPRIMIDO REVESTIDO 500MG +125MG"]);
  });

  it("número entre parênteses não corta o nome da combinação (cálcio + vitamina D)", () => {
    const m = construirMarcas([reg("OS-CAL D", "CARBONATO DE CÁLCIO;COLECALCIFEROL")], ses);
    expect(nomes(m[0])).toEqual([ses[4]!.descricao]);
  });
});
