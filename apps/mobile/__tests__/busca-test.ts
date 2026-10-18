import { snapshotSchema, type Snapshot } from "@tem-remedio/shared";
import { buscar } from "@/busca/buscar";
import {
  capitalizarNome,
  chaveSubstancia,
  formatarDose,
  nomeSubstancia,
  precisaAvisoLiberacao,
  produtosDaSubstancia,
  rotuloProduto,
} from "@/busca/remedios";
import { snapshotTeste } from "../fixtures/snapshot-teste";

// O snapshot de verdade, que vai dentro do app (gerado pelo coletor).
const real = require("../assets/dados/snapshot-inicial.json") as Snapshot;

const nomes = (s: Snapshot, termo: string) => buscar(s, termo).map((g) => g.nome);
const descricoes = (s: Snapshot, produtos: number[]) => produtos.map((i) => s.produtos[i]!.descricao);

describe("snapshot de teste", () => {
  it("segue o formato do snapshot", () => {
    expect(snapshotSchema.safeParse(snapshotTeste).success).toBe(true);
  });
});

describe("buscar", () => {
  it("acha pelo nome, sem acento e em minúsculas", () => {
    expect(nomes(snapshotTeste, "losartana")[0]).toBe("Losartana potassica");
    expect(nomes(snapshotTeste, "LOSARTANA POTÁSSICA")[0]).toBe("Losartana potassica");
  });

  it("tolera erro de digitação", () => {
    expect(nomes(snapshotTeste, "lozartana")[0]).toBe("Losartana potassica");
    expect(nomes(snapshotTeste, "clonazepan")[0]).toBe("Clonazepam");
    expect(nomes(snapshotTeste, "metiformina")[0]).toBe("Metformina (cloridrato)");
  });

  it("acha enquanto a pessoa ainda está digitando", () => {
    expect(nomes(snapshotTeste, "losa")[0]).toBe("Losartana potassica");
  });

  it("cada palavra da busca precisa casar (nome + dose)", () => {
    const [grupo] = buscar(snapshotTeste, "prednisona 20");
    expect(grupo?.nome).toBe("Prednisona");
  });

  it("agrupa por substância: todas as formas e doses no mesmo resultado", () => {
    const grupos = buscar(snapshotTeste, "prednisona");
    expect(grupos).toHaveLength(1);
    expect(descricoes(snapshotTeste, grupos[0]!.produtos)).toEqual([
      "PREDNISONA COMPRIMIDO 5 MG",
      "PREDNISONA COMPRIMIDO 5 MG - HANSENIASE",
      "PREDNISONA COMPRIMIDO 20 MG",
    ]);

    const clonazepam = buscar(snapshotTeste, "clonazepam");
    expect(clonazepam).toHaveLength(1);
    expect(clonazepam[0]!.produtos).toHaveLength(2);
  });

  it("marca leva à substância e aos produtos dela", () => {
    const [grupo] = buscar(snapshotTeste, "rivotril");
    expect(grupo?.nome).toBe("Clonazepam");
    expect(grupo?.marca?.nome).toBe("RIVOTRIL");
    expect(descricoes(snapshotTeste, grupo!.produtos)).toEqual([
      "CLONAZEPAM COMPRIMIDO 2 MG",
      "CLONAZEPAM SOLUÇÃO ORAL 2,5 MG/ML FRASCO 20 ML",
    ]);
  });

  it("marca de liberação prolongada vem marcada (para o aviso)", () => {
    const [grupo] = buscar(snapshotTeste, "glifage xr");
    expect(grupo?.nome).toBe("Metformina (cloridrato)");
    expect(grupo?.marca).toEqual({ nome: "GLIFAGE XR", produtos: [1], liberacaoProlongada: true });
  });

  it("buscando pelo nome do remédio, não mostra marca (mesmo a CMED tendo marca com o nome genérico)", () => {
    const [grupo] = buscar(snapshotTeste, "losartana potassica");
    expect(grupo?.marca).toBeNull();
  });

  it("não busca com menos de 2 letras e não inventa resultado", () => {
    expect(buscar(snapshotTeste, "")).toEqual([]);
    expect(buscar(snapshotTeste, " l ")).toEqual([]);
    expect(buscar(snapshotTeste, "xyzwq")).toEqual([]);
  });

  describe("no snapshot de verdade", () => {
    it.each([
      ["glifage", "Metformina (cloridrato)"],
      ["puran t4", "Levotiroxina sodica"],
      ["paracetamou", "Paracetamol"],
      ["ácido fólico", "Acido fólico"],
    ])("%p → %p", (termo, esperado) => {
      expect(nomes(real, termo)[0]).toBe(esperado);
    });

    it("junta grafias diferentes da mesma substância (ACIDO FOLICO e ACIDO FÓLICO)", () => {
      const [grupo] = buscar(real, "acido folico");
      const substancias = new Set(grupo!.produtos.map((i) => real.produtos[i]!.substancia));
      expect(substancias.size).toBeGreaterThan(1);
    });

    it("parecido demais com outra coisa não entra (puran não traz alopurinol)", () => {
      expect(nomes(real, "puran")).toEqual(["Levotiroxina sodica"]);
    });
  });
});

describe("nomes para mostrar", () => {
  it("chave de substância sem sal entre parênteses e sem acento", () => {
    expect(chaveSubstancia("DEXAMETASONA (ACETATO)")).toBe("DEXAMETASONA");
    expect(chaveSubstancia("ACIDO FÓLICO")).toBe(chaveSubstancia("ACIDO FOLICO"));
  });

  it("nome da substância prefere a grafia com mais acentos e a mais curta", () => {
    const p = snapshotTeste.produtos[0]!;
    expect(nomeSubstancia([{ ...p, substancia: "ACIDO FOLICO" }, { ...p, substancia: "ACIDO FÓLICO" }])).toBe("Acido fólico");
    expect(nomeSubstancia([{ ...p, substancia: "DEXAMETASONA (ACETATO)" }, { ...p, substancia: "DEXAMETASONA" }])).toBe(
      "Dexametasona",
    );
  });

  it("dose e forma legíveis", () => {
    expect(formatarDose("100MG")).toBe("100 mg");
    expect(formatarDose("10 MG/ML")).toBe("10 mg/mL");
    expect(formatarDose("100 MCG")).toBe("100 mcg");
    expect(rotuloProduto(snapshotTeste.produtos[3]!)).toBe("Solução oral 2,5 mg/mL");
  });

  it("nome de UBS e de marca sem tudo em maiúsculas, mantendo siglas", () => {
    expect(capitalizarNome("UBS 05 TAGUATINGA")).toBe("UBS 05 Taguatinga");
    expect(capitalizarNome("UBS 5 NOVA BETANIA SAO SEBASTIAO")).toBe("UBS 5 Nova Betania Sao Sebastiao");
    expect(capitalizarNome("UBS 1 RIACHO FUNDO II")).toBe("UBS 1 Riacho Fundo II");
    expect(capitalizarNome("UBS 2 VILA DO BOA")).toBe("UBS 2 Vila do Boa");
    expect(capitalizarNome("GLIFAGE XR")).toBe("Glifage XR");
  });

  it("formas e doses em ordem (forma, depois dose numérica)", () => {
    const prednisona = produtosDaSubstancia(snapshotTeste, "PREDNISONA");
    expect(prednisona.map((i) => snapshotTeste.produtos[i]!.dose)).toEqual(["5 MG", "5 MG", "20 MG"]);
  });
});

describe("aviso de liberação prolongada", () => {
  const [glifage, glifageXr] = [snapshotTeste.marcas[1]!, snapshotTeste.marcas[2]!];
  const metformina = snapshotTeste.produtos[1]!;

  it("avisa quando a marca é de liberação prolongada e o produto do SUS não", () => {
    expect(precisaAvisoLiberacao(glifageXr, metformina)).toBe(true);
  });

  it("não avisa quando os dois são iguais ou não há marca", () => {
    expect(precisaAvisoLiberacao(glifage, metformina)).toBe(false);
    expect(precisaAvisoLiberacao(glifageXr, { ...metformina, liberacaoProlongada: true })).toBe(false);
    expect(precisaAvisoLiberacao(null, metformina)).toBe(false);
  });
});
