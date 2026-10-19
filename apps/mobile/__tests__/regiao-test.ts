import type { Snapshot } from "@tem-remedio/shared";
import { distanciaKm } from "@/postos/distancia";
import type { Localizacao } from "@/postos/localizacao";
import { enquadrar, POSTOS_NA_PRIMEIRA_VISTA, resumoDoMapa } from "@/postos/mapa";
import { decidirOrdem } from "@/postos/origem";
import { ehUnidadePrisional, postosComEstoque, type Ordem } from "@/postos/postos";
import { ARQUIVO_REGIAO, lerEscolhaRegiao } from "@/postos/regiao-escolhida";
import { acharRegiao, REGIOES, REGIOES_EM_ORDEM } from "@/postos/regioes";
import { EM_SAO_PAULO, NO_PLANO_PILOTO, snapshotTeste } from "../fixtures/snapshot-teste";

// Arquivos do aparelho em memória.
const mockArquivos = new Map<string, string>();
jest.mock("@/dados/armazenamento", () => ({
  armazenamento: {
    ler: async (nome: string) => mockArquivos.get(nome) ?? null,
    gravar: async (nome: string, conteudo: string) => void mockArquivos.set(nome, conteudo),
  },
}));

const real = require("../assets/dados/snapshot-inicial.json") as Snapshot;

const nomes = (ordem: Ordem, iProduto = 0) => postosComEstoque(snapshotTeste, iProduto, ordem).map((p) => p.ubs.nome);

describe("Regiões Administrativas", () => {
  it("são as 35 do DF, sem repetir, em ordem alfabética para escolher", () => {
    expect(REGIOES).toHaveLength(35);
    expect(new Set(REGIOES.map((r) => r.nome)).size).toBe(35);
    expect(REGIOES_EM_ORDEM.slice(0, 4).map((r) => r.nome)).toEqual(["Água Quente", "Águas Claras", "Arapoanga", "Arniqueira"]);
    expect(REGIOES_EM_ORDEM.at(-1)?.nome).toBe("Vicente Pires");
  });

  it("toda região do cadastro da SES-DF está na lista, com o ponto de referência perto dos postos dela", () => {
    const doCadastro = new Set(real.ubs.filter((u) => !ehUnidadePrisional(u)).map((u) => u.ra));
    for (const ra of doCadastro) {
      const regiao = acharRegiao(ra);
      expect({ ra, naLista: regiao !== null }).toEqual({ ra, naLista: true });
      const maisPerto = Math.min(...real.ubs.filter((u) => u.ra === ra).map((u) => distanciaKm(regiao!, u)));
      expect({ ra, perto: maisPerto < 5 }).toEqual({ ra, perto: true });
    }
  });

  it("regiões novas, ainda fora do cadastro, ficam perto dos postos da região de origem", () => {
    const maisPerto = (nome: string) =>
      [...real.ubs].sort((a, b) => distanciaKm(acharRegiao(nome)!, a) - distanciaKm(acharRegiao(nome)!, b))[0]!.ra;
    expect(maisPerto("Sol Nascente/Pôr do Sol")).toBe("Ceilândia");
    expect(maisPerto("Arapoanga")).toBe("Planaltina");
    expect(maisPerto("Água Quente")).toBe("Recanto das Emas");
  });
});

describe("postos pela região escolhida", () => {
  it("primeiro os da região, depois os mais perto dela", () => {
    expect(nomes({ por: "regiao", ra: "Taguatinga" })).toEqual([
      "UBS 05 TAGUATINGA",
      "UBS 3 CEILANDIA",
      "UBS 01 SAMAMBAIA",
      "UBS 1 ASA NORTE",
    ]);
    expect(nomes({ por: "regiao", ra: "Plano Piloto" })[0]).toBe("UBS 1 ASA NORTE");
  });

  it("não mostra distância: o centro da região não é onde a pessoa está", () => {
    expect(postosComEstoque(snapshotTeste, 0, { por: "regiao", ra: "Taguatinga" }).every((p) => p.distanciaKm === null)).toBe(true);
  });

  it("região sem posto com o remédio: começa pelos mais perto dela", () => {
    expect(nomes({ por: "regiao", ra: "Sol Nascente/Pôr do Sol" })[0]).toBe("UBS 3 CEILANDIA");
    expect(nomes({ por: "regiao", ra: "Paranoá" })[0]).toBe("UBS 1 ASA NORTE");
  });

  it("controlado continua só nas UBSs que entregam, e prisional nunca aparece", () => {
    expect(nomes({ por: "regiao", ra: "Samambaia" }, 2)).toEqual(["UBS 05 TAGUATINGA", "UBS 1 ASA NORTE"]);
    expect(nomes({ por: "regiao", ra: "Plano Piloto" })).not.toContain("UBS 01 DCCP");
  });

  it("região que não existe mais: volta para a ordem por nome", () => {
    expect(nomes({ por: "regiao", ra: "Região apagada" })).toEqual(nomes({ por: "nome" }));
  });
});

describe("decidirOrdem", () => {
  const ok: Localizacao = { situacao: "ok", ...NO_PLANO_PILOTO };
  const negada: Localizacao = { situacao: "sem_permissao", podePedir: false, nuncaPerguntado: false };
  const longe: Localizacao = { situacao: "ok", ...EM_SAO_PAULO };

  it("a região escolhida por último vale mesmo com o GPS ligado", () => {
    expect(decidirOrdem(snapshotTeste, ok, { ra: "Gama", usarRegiao: true })).toEqual({ por: "regiao", ra: "Gama" });
  });

  it("com GPS no DF, pela distância", () => {
    expect(decidirOrdem(snapshotTeste, ok, { ra: "Gama", usarRegiao: false })).toEqual({ por: "distancia", origem: NO_PLANO_PILOTO });
  });

  it("sem GPS (ou fora do DF), a região escolhida antes; sem região, por nome", () => {
    expect(decidirOrdem(snapshotTeste, negada, { ra: "Gama", usarRegiao: false })).toEqual({ por: "regiao", ra: "Gama" });
    expect(decidirOrdem(snapshotTeste, longe, { ra: "Gama", usarRegiao: false })).toEqual({ por: "regiao", ra: "Gama" });
    expect(decidirOrdem(snapshotTeste, negada, { ra: null, usarRegiao: false })).toEqual({ por: "nome" });
    expect(decidirOrdem(snapshotTeste, undefined, { ra: null, usarRegiao: false })).toEqual({ por: "nome" });
  });
});

describe("região salva no aparelho", () => {
  beforeEach(() => mockArquivos.clear());

  it("lê a escolha guardada", async () => {
    mockArquivos.set(ARQUIVO_REGIAO, JSON.stringify({ ra: "Gama", usarRegiao: true }));
    expect(await lerEscolhaRegiao()).toEqual({ ra: "Gama", usarRegiao: true });
  });

  it("sem arquivo, ou arquivo estragado, é como se nunca tivesse escolhido", async () => {
    expect(await lerEscolhaRegiao()).toEqual({ ra: null, usarRegiao: false });
    mockArquivos.set(ARQUIVO_REGIAO, "{não é json");
    expect(await lerEscolhaRegiao()).toEqual({ ra: null, usarRegiao: false });
    mockArquivos.set(ARQUIVO_REGIAO, JSON.stringify({ ra: 42 }));
    expect(await lerEscolhaRegiao()).toEqual({ ra: null, usarRegiao: false });
  });
});

describe("mapa", () => {
  const postos = (ordem: Ordem) => postosComEstoque(real, 0, ordem);

  it(`abre mostrando a pessoa e os ${POSTOS_NA_PRIMEIRA_VISTA} primeiros postos da lista`, () => {
    const ordem: Ordem = { por: "distancia", origem: NO_PLANO_PILOTO };
    const lista = postos(ordem);
    const r = enquadrar(lista, ordem);
    for (const p of [NO_PLANO_PILOTO, ...lista.slice(0, POSTOS_NA_PRIMEIRA_VISTA).map((x) => x.ubs)]) {
      expect(Math.abs(p.lat - r.latitude)).toBeLessThanOrEqual(r.latitudeDelta / 2);
      expect(Math.abs(p.lng - r.longitude)).toBeLessThanOrEqual(r.longitudeDelta / 2);
    }
  });

  it("pela região, parte do centro dela; nunca fica perto demais", () => {
    const ordem: Ordem = { por: "regiao", ra: "Varjão" };
    const r = enquadrar(postos(ordem).slice(0, 1), ordem);
    expect(r.latitudeDelta).toBeGreaterThanOrEqual(0.02);
    expect(r.longitudeDelta).toBeGreaterThanOrEqual(0.02);
  });

  it("resumo para o leitor de tela", () => {
    expect(resumoDoMapa(1)).toBe("Mapa com 1 posto que tem hoje.");
    expect(resumoDoMapa(12)).toBe("Mapa com 12 postos que têm hoje.");
  });
});
