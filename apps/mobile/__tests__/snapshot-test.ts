import { LIMITES_SNAPSHOT, snapshotSchema, VERSAO_SCHEMA, type Snapshot } from "@tem-remedio/shared";
import type { Armazenamento } from "@/dados/armazenamento";
import { atualizarDaRede, carregarLocal, PRAZO_REDE_MS, type Dependencias } from "@/dados/snapshot";

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

/** Relógio dos testes: 16/11/2026, meio-dia em Brasília. O embutido é de 17/10/2026. */
const AGORA = Date.parse("2026-11-16T15:00:00Z");
const HOJE = "2026-11-16T00:16:09";
const NO_FUTURO = "2099-01-01T00:00:00";

const comData = (atualizadoEm: string): Snapshot => ({ ...embutido, meta: { ...embutido.meta, atualizadoEm } });

/** Respostas do GitHub Pages por fim de caminho. `cabecalhos` vale para todas. */
function respostas(mapa: Record<string, unknown>, cabecalhos: Record<string, string> = {}) {
  return jest.fn(async (url: string) => {
    const caminho = Object.keys(mapa).find((k) => url.split("?")[0]!.endsWith(k));
    if (!caminho) return new Response("não encontrado", { status: 404 });
    const corpo = mapa[caminho];
    return new Response(typeof corpo === "string" ? corpo : JSON.stringify(corpo), { status: 200, headers: cabecalhos });
  }) as unknown as jest.Mock & typeof fetch;
}

const deps = (extra: Partial<Dependencias> = {}): Dependencias => ({
  armazenamento: memoria(),
  embutido,
  urlBase: "https://exemplo.github.io/tem-remedio-df",
  agora: () => AGORA,
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
    const novo = comData(HOJE);
    const r = await carregarLocal(deps({ armazenamento: memoria({ "snapshot.json": JSON.stringify(novo) }) }));
    expect(r.origem).toBe("cache");
    expect(r.snapshot.meta.atualizadoEm).toBe(HOJE);
  });

  it("deixa de lado cache com data no futuro (senão nenhum dado novo passaria)", async () => {
    const futuro = comData(NO_FUTURO);
    const r = await carregarLocal(deps({ armazenamento: memoria({ "snapshot.json": JSON.stringify(futuro) }) }));
    expect(r.origem).toBe("embutido");
  });

  it("deixa de lado cache com link fora do site da SES-DF (arquivo adulterado)", async () => {
    const adulterado = comData(HOJE);
    adulterado.produtos = adulterado.produtos.map((p, i) => (i === 0 ? { ...p, linkInfo: "javascript:alert(1)" } : p));
    const r = await carregarLocal(deps({ armazenamento: memoria({ "snapshot.json": JSON.stringify(adulterado) }) }));
    expect(r.origem).toBe("embutido");
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
  const novo = comData(HOJE);

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
    expect(r?.snapshot.meta.atualizadoEm).toBe(HOJE);
    expect(JSON.parse(armazenamento.dados["snapshot.json"]!).meta.atualizadoEm).toBe(HOJE);
  });

  it("faz GET simples, sem cabeçalhos (na web, cabeçalho extra dispara preflight CORS e o GitHub Pages recusa)", async () => {
    const fetchFn = respostas({ "/meta.json": { ...novo.meta, sha256: "abc123" }, "/snapshot.json": novo });
    await atualizarDaRede(embutido, deps({ fetchFn }));
    expect(fetchFn).toHaveBeenCalledTimes(2);
    // Só o sinal de cancelar (prazo), que não é cabeçalho.
    for (const chamada of fetchFn.mock.calls) expect(Object.keys(chamada[1] ?? {})).toEqual(["signal"]);
    const [urlMeta, urlSnapshot] = fetchFn.mock.calls.map((c) => String(c[0]));
    expect(urlMeta).toMatch(/\/meta\.json\?t=\d+$/);
    expect(urlSnapshot).toMatch(/\/snapshot\.json\?v=abc123$/);
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

  describe("datas no futuro", () => {
    it("ignora meta.json com data no futuro, sem baixar o snapshot", async () => {
      const fetchFn = respostas({ "/meta.json": { ...novo.meta, atualizadoEm: NO_FUTURO } });
      expect(await atualizarDaRede(embutido, deps({ fetchFn }))).toBeNull();
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it("não guarda snapshot com data no futuro, mesmo que o meta.json diga outra coisa", async () => {
      const armazenamento = memoria();
      const fetchFn = respostas({ "/meta.json": novo.meta, "/snapshot.json": comData(NO_FUTURO) });
      expect(await atualizarDaRede(embutido, deps({ fetchFn, armazenamento }))).toBeNull();
      expect(armazenamento.dados["snapshot.json"]).toBeUndefined();
    });

    it("troca um snapshot do futuro (guardado antes desta proteção) pelos dados legítimos", async () => {
      const fetchFn = respostas({ "/meta.json": novo.meta, "/snapshot.json": novo });
      const r = await atualizarDaRede(comData(NO_FUTURO), deps({ fetchFn }));
      expect(r?.snapshot.meta.atualizadoEm).toBe(HOJE);
    });

    it("relógio do aparelho atrasado: vale a hora em que o GitHub publicou (Last-Modified)", async () => {
      const em2020 = () => Date.parse("2020-01-01T00:00:00Z");
      const publicadoHoje = { "Last-Modified": "Mon, 16 Nov 2026 12:37:05 GMT" };
      const fetchFn = respostas({ "/meta.json": novo.meta, "/snapshot.json": novo }, publicadoHoje);
      const r = await atualizarDaRede(embutido, deps({ fetchFn, agora: em2020 }));
      expect(r?.snapshot.meta.atualizadoEm).toBe(HOJE);
    });
  });

  describe("tamanho e prazo", () => {
    it("não baixa snapshot que o meta.json diz ser grande demais", async () => {
      const fetchFn = respostas({ "/meta.json": { ...novo.meta, bytes: LIMITES_SNAPSHOT.bytes + 1 }, "/snapshot.json": novo });
      expect(await atualizarDaRede(embutido, deps({ fetchFn }))).toBeNull();
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it("para quando o servidor avisa um arquivo grande demais (Content-Length)", async () => {
      const armazenamento = memoria();
      const fetchFn = respostas(
        { "/meta.json": novo.meta, "/snapshot.json": novo },
        { "Content-Length": String(LIMITES_SNAPSHOT.bytes + 1) },
      );
      expect(await atualizarDaRede(embutido, deps({ fetchFn, armazenamento }))).toBeNull();
      expect(armazenamento.dados["snapshot.json"]).toBeUndefined();
    });

    it("não lê um snapshot maior que o teto, mesmo sem Content-Length", async () => {
      const armazenamento = memoria();
      const gigante = " ".repeat(LIMITES_SNAPSHOT.bytes) + JSON.stringify(novo);
      const fetchFn = respostas({ "/meta.json": novo.meta, "/snapshot.json": gigante });
      expect(await atualizarDaRede(embutido, deps({ fetchFn, armazenamento }))).toBeNull();
      expect(armazenamento.dados["snapshot.json"]).toBeUndefined();
    });

    it("desiste quando o servidor não responde no prazo", async () => {
      jest.useFakeTimers();
      try {
        const fetchFn = jest.fn(
          (_url: string, init?: RequestInit) =>
            new Promise<Response>((_, rejeitar) => {
              init?.signal?.addEventListener("abort", () => rejeitar(new Error("cancelado pelo prazo")));
            }),
        ) as unknown as typeof fetch;
        const promessa = atualizarDaRede(embutido, deps({ fetchFn }));
        jest.advanceTimersByTime(PRAZO_REDE_MS);
        await expect(promessa).rejects.toThrow("cancelado pelo prazo");
      } finally {
        jest.useRealTimers();
      }
    });
  });

  it("erro de rede sobe (o React Query tenta de novo depois)", async () => {
    const fetchFn = jest.fn(async () => {
      throw new Error("sem internet");
    }) as unknown as typeof fetch;
    await expect(atualizarDaRede(embutido, deps({ fetchFn }))).rejects.toThrow("sem internet");
  });
});
