const pad = (n: number) => String(n).padStart(2, "0");
const dataLocal = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * "2026-10-17T00:16:33" → "hoje às 00h16", "ontem às 13h30" ou "15/10 às 00h16".
 * A data vem da SES-DF no horário de Brasília, sem fuso; comparamos com a data do aparelho.
 */
export function formatarAtualizacao(atualizadoEm: string, agora: Date = new Date()): string {
  const [data = "", hora = ""] = atualizadoEm.split("T");
  const [, mes = "", dia = ""] = data.split("-");
  const [h = "00", min = "00"] = hora.split(":");
  const ontem = new Date(agora);
  ontem.setDate(agora.getDate() - 1);
  const quando = data === dataLocal(agora) ? "hoje" : data === dataLocal(ontem) ? "ontem" : `${dia}/${mes}`;
  return `${quando} às ${h}h${min}`;
}

/** Dias inteiros entre a data dos dados e hoje (0 = hoje). */
export function diasDesde(atualizadoEm: string, agora: Date = new Date()): number {
  const [data = ""] = atualizadoEm.split("T");
  const [a, m, d] = data.split("-").map(Number) as [number, number, number];
  const inicio = new Date(a, m - 1, d);
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  return Math.round((hoje.getTime() - inicio.getTime()) / 86_400_000);
}
