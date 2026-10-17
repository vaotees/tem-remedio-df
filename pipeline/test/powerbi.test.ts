import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { consultar, maiorQue } from "../src/powerbi/cliente";
import { decodificarDsr } from "../src/powerbi/dsr";

const fixture = (nome: string) => JSON.parse(readFileSync(new URL(`fixtures/${nome}`, import.meta.url), "utf8"));
const dsDe = (resp: any) => resp.results[0].result.data.dsr.DS[0];

// Colunas usadas ao capturar powerbi-pagina-*.json (respostas reais do painel de estoque).
const COLUNAS = [
  "cnes", "i_desc_sigla_estab_cnes", "i_cod_local_estoque", "i_desc_local_estoque", "i_desc_regiao_saude",
  "i_desc_radf", "i_grupo", "i_cod_produto", "i_desc_produto", "psicotropico", "i_abastecimento",
  "i_qtd_rede", "i_cmml",
];

describe("decodificarDsr", () => {
  it("lê resposta de uma coluna só (formato G0)", () => {
    const linhas = decodificarDsr(dsDe(fixture("powerbi-uma-coluna.json")), 1);
    expect(linhas).toHaveLength(1);
    expect(typeof linhas[0]![0]).toBe("number");
  });

  it("expande dicionários e colunas repetidas", () => {
    const linhas = decodificarDsr(dsDe(fixture("powerbi-pagina-1.json")), COLUNAS.length);
    expect(linhas).toHaveLength(4);
    expect(linhas[0]).toEqual([
      "0010626", "UBS 5 - Taguatinga", "500705", "FARMÁCIA - UBS 5 TAGUATINGA (CST05)", "Região Sudoeste",
      "Taguatinga", "Compenente Especializado", "90106", "AZITROMICINA COMPRIMIDO 500 MG", "Outros", "SES-DF",
      1100, "192",
    ]);
    // As linhas seguintes repetem a UBS (bitmask R) e trocam só o produto.
    expect(linhas[3]![0]).toBe("0010626");
    expect(linhas[3]![8]).toBe("LUVA NITRÍLICA PARA PROCEDIMENTO NÃO CIRÚRGICO, TAMANHO P");
  });
});

describe("consultar (paginação)", () => {
  it("segue os RestartTokens e descarta a linha repetida no início da página seguinte", async () => {
    const vazia = { results: [{ result: { data: { dsr: { DS: [{ PH: [{ DM0: [] }] }] } } } }] };
    const respostas = [fixture("powerbi-pagina-1.json"), fixture("powerbi-pagina-2.json"), vazia];
    const corpos: any[] = [];
    const fetchFn = vi.fn(async (_url: unknown, init?: RequestInit) => {
      corpos.push(JSON.parse(String(init?.body)));
      return new Response(JSON.stringify(respostas.shift()), { status: 200 });
    });

    const linhas = await consultar(
      { resourceKey: "k", modelId: 1, datasetId: "d", reportId: "r" },
      "tabela",
      COLUNAS,
      { tamanhoPagina: 4, filtros: [maiorQue("i_qtd_rede", 0)], fetchFn: fetchFn as typeof fetch },
    );

    expect(fetchFn).toHaveBeenCalledTimes(3);
    const janela = (c: any) => c.queries[0].Query.Commands[0].SemanticQueryDataShapeCommand.Binding.DataReduction.Primary.Window;
    expect(janela(corpos[0]).RestartTokens).toBeUndefined();
    expect(janela(corpos[1]).RestartTokens).toEqual(dsDe(fixture("powerbi-pagina-1.json")).RT);
    // 4 + (4 - 1 repetida) = 7, sem duplicar a luva tamanho P.
    expect(linhas).toHaveLength(7);
    const produtos = linhas.map((l) => l.i_cod_produto);
    expect(new Set(produtos).size).toBe(7);
    expect(corpos[0].queries[0].Query.Commands[0].SemanticQueryDataShapeCommand.Query.Where).toHaveLength(1);
  });

  it("tenta de novo quando o Power BI falha", async () => {
    const ok = fixture("powerbi-uma-coluna.json");
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(new Response("erro", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(ok), { status: 200 }));
    vi.useFakeTimers();
    const promessa = consultar({ resourceKey: "k", modelId: 1, datasetId: "d", reportId: "r" }, "t", ["data_extracao"], {
      fetchFn: fetchFn as unknown as typeof fetch,
    });
    await vi.runAllTimersAsync();
    const linhas = await promessa;
    vi.useRealTimers();
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(linhas).toHaveLength(1);
  });
});
