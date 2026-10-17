import { normalizar } from "@tem-remedio/shared";

/** Um período de funcionamento: dias da semana (0 = domingo) e horário em minutos desde 00h00. */
export interface Faixa {
  dias: number[];
  inicio: number;
  fim: number;
}

const DIAS = ["DOMINGO", "SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO"] as const;
const NOME_DIA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"] as const;

const DIA = `\\b(${DIAS.join("|")})(?:\\s+FEIRA)?\\b`;
const RE_INTERVALO_DIAS = new RegExp(`${DIA}(?:\\s+(?:A|ATE)\\s+${DIA})?`, "g");
const RE_HORAS = /(\d{1,2})\s*H\s*(\d{2})?\s+(?:AS|A|ATE)\s+(\d{1,2})\s*H\s*(\d{2})?/;

/**
 * Interpreta o horário do cadastro da SES-DF, como
 * "das 07h às 19h de segunda a sexta, e sábado das 07h às 12h".
 * Se qualquer parte não for entendida, devolve null: melhor não dizer nada do que errar "Aberto agora".
 */
export function interpretarHorario(texto: string | null): Faixa[] | null {
  if (!texto) return null;
  const partes = texto.split(/[,;]/).map((p) => normalizar(p).replace(/^E\s+/, "")).filter(Boolean);
  if (partes.length === 0) return null;

  const faixas: Faixa[] = [];
  for (const parte of partes) {
    const horas = RE_HORAS.exec(parte);
    if (!horas) return null;
    const inicio = Number(horas[1]) * 60 + Number(horas[2] ?? 0);
    const fim = Number(horas[3]) * 60 + Number(horas[4] ?? 0);
    if (fim <= inicio || fim > 24 * 60) return null;

    const dias = new Set<number>();
    if (/\bTODOS OS DIAS\b|\bDIARIAMENTE\b/.test(parte)) DIAS.forEach((_, i) => dias.add(i));
    for (const m of parte.matchAll(RE_INTERVALO_DIAS)) {
      const de = DIAS.indexOf(m[1] as (typeof DIAS)[number]);
      const ate = m[2] ? DIAS.indexOf(m[2] as (typeof DIAS)[number]) : de;
      for (let d = de; ; d = (d + 1) % 7) {
        dias.add(d);
        if (d === ate) break;
      }
    }
    if (dias.size === 0) return null;
    faixas.push({ dias: [...dias].sort((a, b) => a - b), inicio, fim });
  }
  return faixas;
}

/** 420 → "07h", 450 → "07h30". */
export function formatarHora(minutos: number): string {
  const h = String(Math.floor(minutos / 60)).padStart(2, "0");
  const m = minutos % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

export interface SituacaoHorario {
  aberto: boolean;
  /** "Aberto agora, fecha às 17h" ou "Fechado agora, abre amanhã às 07h". */
  texto: string;
}

/**
 * Aberto ou fechado agora, pelo relógio do aparelho (o DF inteiro está no horário de Brasília).
 * Não sabe de feriados: a tela sempre manda ligar antes.
 */
export function situacaoHorario(faixas: Faixa[], agora: Date = new Date()): SituacaoHorario {
  const hoje = agora.getDay();
  const minuto = agora.getHours() * 60 + agora.getMinutes();

  const atual = faixas.find((f) => f.dias.includes(hoje) && f.inicio <= minuto && minuto < f.fim);
  if (atual) return { aberto: true, texto: `Aberto agora, fecha às ${formatarHora(atual.fim)}` };

  for (let daqui = 0; daqui < 7; daqui++) {
    const dia = (hoje + daqui) % 7;
    const inicios = faixas
      .filter((f) => f.dias.includes(dia) && (daqui > 0 || f.inicio > minuto))
      .map((f) => f.inicio);
    if (inicios.length === 0) continue;
    const quando = daqui === 0 ? "hoje" : daqui === 1 ? "amanhã" : NOME_DIA[dia];
    return { aberto: false, texto: `Fechado agora, abre ${quando} às ${formatarHora(Math.min(...inicios))}` };
  }
  return { aberto: false, texto: "Fechado agora" };
}
