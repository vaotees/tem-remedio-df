import { normalizar, type Retirada } from "@tem-remedio/shared";
import type { LinhaRegra } from "../fontes/garantir";

export type ClassificacaoRetirada = Retirada | "aplicado_no_posto";

export interface ResultadoRetirada {
  retirada: ClassificacaoRetirada;
  link: string | null;
  /** Observação que o coletor não reconheceu: vira aviso no log para alguém revisar. */
  naoReconhecida?: string;
}

/** Ordem importa: a primeira regra que casar define a retirada. */
const REGRAS: [RegExp, ClassificacaoRetirada][] = [
  [/ADMINISTRADO NO PROPRIO LOCAL/, "aplicado_no_posto"],
  [/CONTROLE ESPECIAL/, "controlado"],
  [/VINCULO AO SERVICO DE SAUDE DO TERRITORIO|UBS DE REFERENCIA/, "ubs_referencia"],
  [/GRUPOS? DE ACOMPANHAMENTO/, "grupo_acompanhamento"],
  [/UNIDADES ESPECIFICAS|UBS ESPECIFICAS/, "unidades_especificas"],
];

/**
 * Classifica onde o remédio pode ser retirado a partir das observações do painel
 * "Como garantir seu medicamento". Sem observação = sem restrição de local.
 */
export function classificarRetirada(linhas: LinhaRegra[]): ResultadoRetirada {
  if (linhas.length === 0) return { retirada: "sem_informacao", link: null };

  const observacoes = linhas.filter((l) => l.texto && /^OBSERVA/.test(normalizar(l.tipo ?? "")));
  let melhor: ResultadoRetirada | undefined;
  let naoReconhecida: string | undefined;

  for (const obs of observacoes) {
    const texto = normalizar(obs.texto!);
    const indice = REGRAS.findIndex(([re]) => re.test(texto));
    if (indice < 0) {
      naoReconhecida = obs.texto!;
      continue;
    }
    const atual = REGRAS.findIndex(([, r]) => r === melhor?.retirada);
    if (!melhor || indice < atual) melhor = { retirada: REGRAS[indice]![1], link: obs.link };
  }

  if (melhor) return naoReconhecida ? { ...melhor, naoReconhecida } : melhor;
  if (naoReconhecida) return { retirada: "sem_informacao", link: null, naoReconhecida };
  return { retirada: "qualquer_ubs", link: null };
}
