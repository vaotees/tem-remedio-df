import { PAINEL_ESTOQUE } from "../config";
import { consultar, maiorQue, type OpcoesConsulta } from "../powerbi/cliente";
import type { Valor } from "../powerbi/dsr";

export interface LinhaEstoque {
  cnes: string;
  codLocal: string;
  local: string;
  regiaoSaude: string;
  ra: string;
  grupo: string | null;
  codProduto: string;
  descricao: string;
  controlado: boolean;
  abastecimento: string | null;
  quantidade: number;
  /** Consumo médio mensal da própria UBS (`i_cmml`). O `i_cmm` é o da rede inteira. */
  consumoMensal: number | null;
}

const COLUNAS = [
  "cnes",
  "i_cod_local_estoque",
  "i_desc_local_estoque",
  "i_desc_regiao_saude",
  "i_desc_radf",
  "i_grupo",
  "i_cod_produto",
  "i_desc_produto",
  "psicotropico",
  "i_abastecimento",
  "i_qtd_rede",
  "i_cmml",
];

/** Data da extração na SES-DF. O Power BI guarda sem fuso; o valor já é o horário de Brasília. */
export async function buscarDataExtracao(opcoes: OpcoesConsulta = {}): Promise<string> {
  const [linha] = await consultar(PAINEL_ESTOQUE, PAINEL_ESTOQUE.entidade, ["data_extracao"], opcoes);
  const ms = linha?.data_extracao;
  if (typeof ms !== "number") throw new Error("data_extracao ausente no painel de estoque");
  return new Date(ms).toISOString().slice(0, 19);
}

/** Só linhas com estoque > 0 (o painel cruza todos os locais × produtos, inclusive zerados). */
export async function buscarEstoque(opcoes: OpcoesConsulta = {}): Promise<LinhaEstoque[]> {
  const linhas = await consultar(PAINEL_ESTOQUE, PAINEL_ESTOQUE.entidade, COLUNAS, {
    ...opcoes,
    filtros: [maiorQue("i_qtd_rede", 0)],
  });
  return linhas.map(converterLinha);
}

export function converterLinha(l: Record<string, Valor>): LinhaEstoque {
  return {
    // O painel às vezes perde os zeros à esquerda ("10677" → "0010677").
    cnes: String(l.cnes ?? "").padStart(7, "0"),
    codLocal: String(l.i_cod_local_estoque ?? ""),
    local: String(l.i_desc_local_estoque ?? ""),
    regiaoSaude: String(l.i_desc_regiao_saude ?? ""),
    ra: String(l.i_desc_radf ?? ""),
    grupo: texto(l.i_grupo),
    codProduto: String(l.i_cod_produto ?? ""),
    descricao: String(l.i_desc_produto ?? ""),
    controlado: l.psicotropico === "Psicotrópicos",
    abastecimento: texto(l.i_abastecimento),
    quantidade: Number(l.i_qtd_rede ?? 0),
    consumoMensal: numero(l.i_cmml),
  };
}

function texto(v: Valor | undefined): string | null {
  return v === null || v === undefined || v === "" ? null : String(v);
}

/** O consumo vem como texto ("40904" ou "12,5"). */
function numero(v: Valor | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
