/**
 * Cliente para relatórios Power BI publicados na web ("publish to web").
 *
 * Usa o mesmo endpoint público que o painel chama no navegador. Não é uma API
 * oficial: pode mudar sem aviso. Por isso o coletor valida tudo antes de publicar.
 */
import { POWERBI_API } from "../config";
import { decodificarDsr, type DataSetDsr, type Valor } from "./dsr";

export interface Painel {
  resourceKey: string;
  modelId: number;
  datasetId: string;
  reportId: string;
}

export type Filtro = Record<string, unknown>;

export interface OpcoesConsulta {
  filtros?: Filtro[];
  tamanhoPagina?: number;
  fetchFn?: typeof fetch;
  tentativas?: number;
}

const coluna = (propriedade: string) => ({
  Column: { Expression: { SourceRef: { Source: "t" } }, Property: propriedade },
});

/** Filtro `coluna > valor` (inteiro). */
export function maiorQue(propriedade: string, valor: number): Filtro {
  return {
    Condition: {
      Comparison: { ComparisonKind: 1, Left: coluna(propriedade), Right: { Literal: { Value: `${valor}L` } } },
    },
  };
}

export function montarConsulta(
  painel: Painel,
  entidade: string,
  colunas: string[],
  tamanhoPagina: number,
  filtros: Filtro[] = [],
  restartTokens?: unknown[][],
) {
  const janela: Record<string, unknown> = { Count: tamanhoPagina };
  if (restartTokens) janela.RestartTokens = restartTokens;
  const query: Record<string, unknown> = {
    Version: 2,
    From: [{ Name: "t", Entity: entidade, Type: 0 }],
    Select: colunas.map((c) => ({ ...coluna(c), Name: `t.${c}` })),
  };
  if (filtros.length) query.Where = filtros;
  return {
    version: "1.0.0",
    queries: [
      {
        Query: {
          Commands: [
            {
              SemanticQueryDataShapeCommand: {
                Query: query,
                Binding: {
                  Primary: { Groupings: [{ Projections: colunas.map((_, i) => i) }] },
                  DataReduction: { DataVolume: 4, Primary: { Window: janela } },
                  Version: 1,
                },
              },
            },
          ],
        },
        QueryId: "",
        ApplicationContext: { DatasetId: painel.datasetId, Sources: [{ ReportId: painel.reportId }] },
      },
    ],
    cancelQueries: [],
    modelId: painel.modelId,
  };
}

async function postar(painel: Painel, caminho: string, corpo: unknown, fetchFn: typeof fetch, tentativas: number) {
  let ultimoErro: unknown;
  for (let t = 1; t <= tentativas; t++) {
    try {
      const resp = await fetchFn(`${POWERBI_API}/${caminho}`, {
        method: "POST",
        headers: { "X-PowerBI-ResourceKey": painel.resourceKey, "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      if (!resp.ok) throw new Error(`Power BI respondeu ${resp.status}`);
      return (await resp.json()) as any;
    } catch (erro) {
      ultimoErro = erro;
      if (t < tentativas) await new Promise((r) => setTimeout(r, 1000 * 2 ** t));
    }
  }
  throw ultimoErro;
}

/** Gera as linhas página a página, já decodificadas, na ordem de `colunas`. */
export async function* paginas(
  painel: Painel,
  entidade: string,
  colunas: string[],
  opcoes: OpcoesConsulta = {},
): AsyncGenerator<Valor[][]> {
  const { filtros = [], tamanhoPagina = 30000, fetchFn = fetch, tentativas = 3 } = opcoes;
  let tokens: unknown[][] | undefined;
  let ultimaLinha: Valor[] | undefined;

  for (;;) {
    const corpo = montarConsulta(painel, entidade, colunas, tamanhoPagina, filtros, tokens);
    const resp = await postar(painel, "querydata?synchronous=true", corpo, fetchFn, tentativas);
    const dados = resp?.results?.[0]?.result?.data;
    const ds: DataSetDsr | undefined = dados?.dsr?.DS?.[0];
    if (!ds) throw new Error(`Resposta inesperada do Power BI: ${JSON.stringify(resp).slice(0, 500)}`);

    let linhas = decodificarDsr(ds, colunas.length);
    // Ao continuar com RestartTokens, a página começa repetindo a última linha da anterior.
    if (ultimaLinha && linhas.length && mesmaLinha(linhas[0]!, ultimaLinha)) linhas = linhas.slice(1);
    if (linhas.length) {
      ultimaLinha = linhas[linhas.length - 1];
      yield linhas;
    }

    tokens = ds.RT;
    if (!tokens || linhas.length === 0) return;
  }
}

/** Busca tudo e devolve objetos `{coluna: valor}`. */
export async function consultar(
  painel: Painel,
  entidade: string,
  colunas: string[],
  opcoes: OpcoesConsulta = {},
): Promise<Record<string, Valor>[]> {
  const out: Record<string, Valor>[] = [];
  for await (const pagina of paginas(painel, entidade, colunas, opcoes)) {
    for (const linha of pagina) out.push(Object.fromEntries(colunas.map((c, i) => [c, linha[i] ?? null])));
  }
  return out;
}

function mesmaLinha(a: Valor[], b: Valor[]) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}
