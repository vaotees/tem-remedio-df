import { nivelEstoque, type NivelEstoque, type Snapshot } from "@tem-remedio/shared";
import { interpretarHorario, situacaoHorario } from "./horario";
import { ehUnidadePrisional } from "./postos";

export interface RegiaoRede {
  /** "Sudoeste", sem o "Região" da SES-DF. */
  nome: string;
  postos: number;
  abertos: number;
}

/** A rede inteira num relance, para o painel do Início. Tudo vem do snapshot do dia. */
export interface ResumoRede {
  /** Farmácias de UBS (sem as unidades prisionais). */
  postos: number;
  abertosAgora: number;
  /** Postos cujo horário o app não entende: não contam como abertos nem como fechados. */
  semHorario: number;
  remedios: number;
  /** Cada remédio em cada posto, pelo semáforo (o estoque das prateleiras da rede). */
  niveis: Record<NivelEstoque, number>;
  /** Da região com mais postos para a com menos. */
  regioes: RegiaoRede[];
  /**
   * Com os postos fechados: quando a maioria abre de novo ("hoje às 07h") e quantos abrem nessa hora.
   * Null se nenhum posto fechado tem horário que o app entenda.
   */
  proximaAbertura: { quando: string; postos: number } | null;
}

/**
 * Resume a rede: quantos postos estão abertos agora (pelo horário do cadastro), como está o estoque de
 * todos os remédios em todos os postos e os abertos por Região de Saúde.
 */
export function resumirRede(snapshot: Snapshot, agora: Date = new Date()): ResumoRede {
  const niveis: Record<NivelEstoque, number> = { alto: 0, baixo: 0, critico: 0, sem_consumo: 0 };
  const prisional = snapshot.ubs.map(ehUnidadePrisional);
  for (const [u, , , dias] of snapshot.estoque) {
    if (!prisional[u]) niveis[nivelEstoque(dias)]++;
  }

  const regioes = new Map<string, RegiaoRede>();
  let postos = 0;
  let abertosAgora = 0;
  let semHorario = 0;
  const aberturas = new Map<string, number>();
  snapshot.ubs.forEach((ubs, i) => {
    if (prisional[i]) return;
    postos++;
    const nome = ubs.regiaoSaude.replace(/^Regi[aã]o\s+(de\s+Sa[uú]de\s+)?/i, "").trim() || ubs.regiaoSaude;
    const regiao = regioes.get(nome) ?? { nome, postos: 0, abertos: 0 };
    regiao.postos++;
    const faixas = interpretarHorario(ubs.horario);
    if (!faixas) semHorario++;
    else {
      const situacao = situacaoHorario(faixas, agora);
      if (situacao.aberto) {
        abertosAgora++;
        regiao.abertos++;
      } else {
        // "Fechado agora, abre hoje às 07h" → "hoje às 07h".
        const quando = /abre (.+)$/.exec(situacao.texto)?.[1];
        if (quando) aberturas.set(quando, (aberturas.get(quando) ?? 0) + 1);
      }
    }
    regioes.set(nome, regiao);
  });

  let proximaAbertura: ResumoRede["proximaAbertura"] = null;
  for (const [quando, n] of aberturas) {
    if (!proximaAbertura || n > proximaAbertura.postos) proximaAbertura = { quando, postos: n };
  }

  return {
    postos,
    abertosAgora,
    semHorario,
    remedios: snapshot.produtos.length,
    niveis,
    regioes: [...regioes.values()].sort((a, b) => b.postos - a.postos || a.nome.localeCompare(b.nome, "pt-BR")),
    proximaAbertura,
  };
}

/** "7 em cada 10": a parte com bastante estoque, arredondada para quem lê de relance. */
export function emCadaDez(parte: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((parte / total) * 10);
}
