/**
 * Regras para não confiar cegamente no que vem de fora (painel da SES-DF, GitHub Pages).
 * O coletor aplica antes de publicar e o app aplica de novo antes de usar.
 */

/**
 * Domínios do "Ver a lista oficial". O botão diz "Abre o site da Secretaria de Saúde do DF":
 * qualquer outro endereço (outro site, `http:`, `javascript:`, `sms:`, outro app) fica de fora.
 * Vale o domínio e os subdomínios dele.
 */
export const DOMINIOS_OFICIAIS = ["saude.df.gov.br"] as const;

// O shared roda no Node (coletor), no navegador e no app (o Expo instala a URL do padrão WHATWG),
// mas só tem os tipos do ES2023: declara aqui o pedaço da `URL` que usa.
declare const URL: new (url: string) => {
  protocol: string;
  username: string;
  password: string;
  port: string;
  hostname: string;
};

export function linkOficialPermitido(link: string): boolean {
  let url: InstanceType<typeof URL>;
  try {
    url = new URL(link);
  } catch {
    return false;
  }
  // Sem usuário, senha ou porta: "https://saude.df.gov.br@outro.site" e portas estranhas não passam.
  if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
  const host = url.hostname.toLowerCase();
  return DOMINIOS_OFICIAIS.some((d) => host === d || host.endsWith(`.${d}`));
}

/** Folga para relógio desacertado e fuso: um dia. */
export const FOLGA_FUTURO_MS = 24 * 60 * 60 * 1000;

/** `atualizadoEm` é horário de Brasília sem fuso ("2026-10-17T00:16:33"); o DF não tem horário de verão desde 2019. */
export function instanteAtualizacao(atualizadoEm: string): number {
  return Date.parse(`${atualizadoEm}-03:00`);
}

/**
 * Dados "do futuro" são erro na fonte (ano errado no painel) ou adulteração. Aceitá-los travaria tudo:
 * o app e o coletor só aceitam dados mais novos que os atuais. Data ilegível conta como futuro.
 */
export function dataNoFuturo(meta: { atualizadoEm: string; geradoEm?: string }, agora: number = Date.now()): boolean {
  const limite = agora + FOLGA_FUTURO_MS;
  const datas = [instanteAtualizacao(meta.atualizadoEm)];
  if (meta.geradoEm !== undefined) datas.push(Date.parse(meta.geradoEm));
  return datas.some((d) => !Number.isFinite(d) || d > limite);
}
