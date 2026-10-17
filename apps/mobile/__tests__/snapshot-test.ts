import { snapshotSchema, VERSAO_SCHEMA, type Snapshot } from "@tem-remedio/shared";
import type { Armazenamento } from "@/dados/armazenamento";
import { atualizarDaRede, carregarLocal, type Dependencias } from "@/dados/snapshot";

// O snapshot que vai dentro do app (gerado pelo coletor).
const embutido = require("../assets/dados/snapshot-inicial.json") as Snapshot;

function memoria(inicial: Record<string, string> = {}): Armazenamento & { dados: Record<string, string> } {
  const dados = { ...inicial };
  return {
    dados,
    ler: async (nome) => dados[nome] ?? null,
    gravar: async (nome, conteudo) => {
      dados[nome] = conteudo;
    },
  };
}

const comData = (atualizadoEm: string): Snapshot => ({ ...embutido, meta: { ...embutido.meta, atualizadoEm } });

function respostas(mapa: Record<string, unknown>) {
  return jest.fn(async (url: string) => {
    const caminho = Object.keys(mapa).find((k) => url.endsWith(k));
    if (!caminho) return new Response("não encontrado", { status: 404 });
    return new Response(JSON.stringify(mapa[caminho]), { status: 200 });
  }) as unknown as jest.Mock & typeof fetch;
}

const deps = (extra: Partial<Dependencias> = {}): Dependencias => ({
  armazenamento: memoria(),
  embutido,
  urlBase: "https://exemplo.github.io/tem-remedio-df",
  ...extra,
});

describe("snapshot embutido", () => {
  it("é válido para o formato atual (rode `pnpm snapshot:app` se falhar)", () => {
    const r = snapshotSchema.safeParse(embutido);
    expect(r.success).toBe(true);
    expect(embutido.meta.versaoSchema).toBe(VERSAO_SCHEMA);
    expect(embutido.ubs.length).toBeGreaterThan(100);
  });
});

describe("carregarLocal", () => {
  it("sem cache, usa o embutido", async () => {
    const r = await carregarLocal(deps());
    expect(r.origem).toBe("embutido");
  });

  it("usa o cache quando é válido e mais novo", async () => {
    const novo = comData("2099-01-01T00:15:00");
    const r = await carregarLocal(deps({ armazenamento: memoria({ "snapshot.json": JSON.stringify(novo) }) }));
    expect(r.origem).toBe("cache");
    expect(r.snapshot.meta.atualizadoEm).toBe("2099-01-01T00:15:00");
  });

  it("ignora cache mais velho que o embutido (app atualizado na loja)", async () => {
    const velho = comData("2020-01-01T00:15:00");
    const r = await carregarLocal(deps({ armazenamento: memoria({ "snapshot.json": JSON.stringify(velho) }) }));
    expect(r.origem).toBe("embutido");
  });

  it("ignora cache corrompido ou fora do formato", async () => {
    for (const lixo of ["{não é json", JSON.stringify({ meta: { atualizadoEm: "2099-01-01T00:00:00" } })]) {
      const r = await carregarLocal(deps({ armazenamento: memoria({ "snapshot.json": lixo }) }));
      expect(r.origem).toBe("embutido");
    }
  });

  it("falha alto se o embutido estiver quebrado", async () => {
    await expect(carregarLocal(deps({ embutido: { quebrado: true } }))).rejects.toThrow(/embutido inválido/);
  });
});

describe("atualizarDaRede", () => {
  const novo = comData("2099-01-01T13:30:00");

  it("sem endereço configurado, não faz nada", async () => {
    const fetchFn = respostas({});
    expect(await atualizarDaRede(embutido, deps({ urlBase: null, fetchFn }))).toBeNull();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("baixa só o meta.json quando a SES-DF não atualizou", async () => {
    const fetchFn = respostas({ "/meta.json": { ...embutido.meta } });
    expect(await atualizarDaRede(embutido, deps({ fetchFn }))).toBeNull();
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("baixa, valida e guarda quando há dados novos", async () => {
    const armazenamento = memoria();
    const fetchFn = respostas({ "/meta.json": novo.meta, "/snapshot.json": novo });
    const r = await atualizarDaRede(embutido, deps({ fetchFn, armazenamento }));
    expect(r?.origem).toBe("rede");
    expect(r?.snapshot.meta.atualizadoEm).toBe("2099-01-01T13:30:00");
    expect(JSON.parse(armazenamento.dados["snapshot.json"]!).meta.atualizadoEm).toBe("2099-01-01T13:30:00");
  });

  it("não guarda snapshot inválido", async () => {
    const armazenamento = memoria();
    const fetchFn = respostas({ "/meta.json": novo.meta, "/snapshot.json": { ...novo, ubs: "quebrado" } });
    expect(await atualizarDaRede(embutido, deps({ fetchFn, armazenamento }))).toBeNull();
    expect(armazenamento.dados["snapshot.json"]).toBeUndefined();
  });

  it("ignora snapshot de outra versão do formato (app desatualizado)", async () => {
    const fetchFn = respostas({ "/meta.json": { ...novo.meta, versaoSchema: VERSAO_SCHEMA + 1 } });
    expect(await atualizarDaRede(embutido, deps({ fetchFn }))).toBeNull();
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("erro de rede sobe (o React Query tenta de novo depois)", async () => {
    const fetchFn = jest.fn(async () => {
      throw new Error("sem internet");
    }) as unknown as typeof fetch;
    await expect(atualizarDaRede(embutido, deps({ fetchFn }))).rejects.toThrow("sem internet");
  });
});
