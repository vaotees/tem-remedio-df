import { ARQUIVO_MEUS_REMEDIOS, lerMeusRemedios, type RemedioGuardado } from "@/meus-remedios/guardados";
import { situacaoHoje, textoQuantos, tituloPrimeiro } from "@/meus-remedios/situacao";
import type { Ordem } from "@/postos/postos";
import { NO_PLANO_PILOTO, snapshotTeste } from "../fixtures/snapshot-teste";

// Arquivos do aparelho em memória.
const mockArquivos = new Map<string, string>();
jest.mock("@/dados/armazenamento", () => ({
  armazenamento: {
    ler: async (nome: string) => mockArquivos.get(nome) ?? null,
    gravar: async (nome: string, conteudo: string) => void mockArquivos.set(nome, conteudo),
  },
}));

const LOSARTANA: RemedioGuardado = {
  codigo: "8944",
  nome: "Losartana potassica",
  apresentacao: "Comprimido 50 mg",
  marca: "COZAAR",
  guardadoEm: "2026-10-18T12:00:00.000Z",
};
const gravar = (conteudo: unknown) => mockArquivos.set(ARQUIVO_MEUS_REMEDIOS, JSON.stringify(conteudo));

describe("lista guardada no aparelho", () => {
  beforeEach(() => mockArquivos.clear());

  it("lê os remédios guardados", async () => {
    gravar({ remedios: [LOSARTANA, { ...LOSARTANA, codigo: "90226", nome: "Metformina", marca: null }] });
    expect((await lerMeusRemedios()).map((r) => r.codigo)).toEqual(["8944", "90226"]);
  });

  it("sem arquivo, ou com o arquivo estragado, a lista começa vazia", async () => {
    expect(await lerMeusRemedios()).toEqual([]);
    mockArquivos.set(ARQUIVO_MEUS_REMEDIOS, "{não é json");
    expect(await lerMeusRemedios()).toEqual([]);
    gravar({ remedios: "8944" });
    expect(await lerMeusRemedios()).toEqual([]);
    gravar([LOSARTANA]);
    expect(await lerMeusRemedios()).toEqual([]);
  });

  it("um item estragado fica de fora sem levar os outros; código repetido entra uma vez só", async () => {
    gravar({ remedios: [{ codigo: 42 }, LOSARTANA, { ...LOSARTANA, nome: "Outro nome" }, null] });
    expect(await lerMeusRemedios()).toEqual([LOSARTANA]);
  });
});

describe("situação de hoje", () => {
  const perto: Ordem = { por: "distancia", origem: NO_PLANO_PILOTO };

  it("quantos postos têm e o mais perto, sem unidade prisional", () => {
    const hoje = situacaoHoje(snapshotTeste, "8944", perto);
    expect(hoje.tipo).toBe("tem");
    if (hoje.tipo !== "tem") return;
    // A UBS DCCP (prisional) tem losartana, mas não conta.
    expect(hoje.postos).toBe(4);
    expect(hoje.primeiro.ubs.nome).toBe("UBS 1 ASA NORTE");
    expect(hoje.primeiro.dias).toBe(3);
  });

  it("controlado conta só as UBSs que entregam controlados", () => {
    const hoje = situacaoHoje(snapshotTeste, "90007", { por: "regiao", ra: "Samambaia" });
    expect(hoje.tipo === "tem" && [hoje.postos, hoje.primeiro.ubs.nome]).toEqual([2, "UBS 05 TAGUATINGA"]);
  });

  it("nenhum posto tem hoje, e código que não aparece nos dados", () => {
    expect(situacaoHoje(snapshotTeste, "MSE24551", perto)).toEqual({
      tipo: "nenhum_posto",
      produto: snapshotTeste.produtos[9],
    });
    expect(situacaoHoje(snapshotTeste, "000000", perto)).toEqual({ tipo: "fora_dos_dados" });
  });

  it("textos", () => {
    expect([0, 1, 4].map(textoQuantos)).toEqual(["Nenhum posto tem hoje", "Em 1 posto hoje", "Em 4 postos hoje"]);
  });

  it("o primeiro posto: mais perto de você, da sua região, ou nenhum sem origem", () => {
    const taguatinga = situacaoHoje(snapshotTeste, "8944", { por: "regiao", ra: "Taguatinga" });
    const paranoa = situacaoHoje(snapshotTeste, "8944", { por: "regiao", ra: "Paranoá" });
    if (taguatinga.tipo !== "tem" || paranoa.tipo !== "tem") throw new Error("losartana tem estoque");

    expect(tituloPrimeiro(perto, taguatinga.primeiro)).toBe("Mais perto de você");
    expect(tituloPrimeiro({ por: "regiao", ra: "Taguatinga" }, taguatinga.primeiro)).toBe("Na sua região");
    expect(tituloPrimeiro({ por: "regiao", ra: "Paranoá" }, paranoa.primeiro)).toBe("Mais perto da sua região");
    expect(tituloPrimeiro({ por: "nome" }, taguatinga.primeiro)).toBeNull();
  });
});
