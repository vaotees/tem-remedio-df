import { PAINEL_GARANTIR } from "../config";
import { consultar, type OpcoesConsulta } from "../powerbi/cliente";
import type { Valor } from "../powerbi/dsr";

/** Uma linha de documento/observação de um remédio dispensado nas UBSs. */
export interface LinhaRegra {
  codigo: string;
  tipo: string | null;
  texto: string | null;
  link: string | null;
}

export async function buscarRegras(opcoes: OpcoesConsulta = {}): Promise<LinhaRegra[]> {
  const linhas = await consultar(
    PAINEL_GARANTIR,
    "tb_diasf_farmacia_ubs",
    ["codigo_medicamento", "tipo", "documentos", "link"],
    opcoes,
  );
  return linhas
    .filter((l) => l.codigo_medicamento)
    .map((l) => ({
      codigo: String(l.codigo_medicamento),
      tipo: l.tipo ? String(l.tipo) : null,
      texto: l.documentos ? String(l.documentos) : null,
      link: typeof l.link === "string" && l.link.startsWith("http") ? l.link : null,
    }));
}

/** Cadastro das UBSs mantido pela SES-DF ("gabarito"): horário, telefone, controlados. */
export interface CadastroUbs {
  cnes: string;
  telefone: string | null;
  horario: string | null;
  entregaControlados: boolean;
  inativa: boolean;
}

export async function buscarCadastroUbs(opcoes: OpcoesConsulta = {}): Promise<CadastroUbs[]> {
  const linhas = await consultar(
    PAINEL_GARANTIR,
    "gabarito_localiz_ubs",
    ["i_estab_cnes", "i_telefone", "i_horario_funcionamento", "psicotropico", "inativo"],
    opcoes,
  );
  return linhas.filter((l) => l.i_estab_cnes !== null).map(converterCadastro);
}

export function converterCadastro(l: Record<string, Valor>): CadastroUbs {
  return {
    cnes: String(l.i_estab_cnes).padStart(7, "0"),
    telefone: l.i_telefone ? String(l.i_telefone) : null,
    horario: l.i_horario_funcionamento ? String(l.i_horario_funcionamento) : null,
    entregaControlados: String(l.psicotropico ?? "").trim().toUpperCase() === "SIM",
    inativa: l.inativo === "S",
  };
}
