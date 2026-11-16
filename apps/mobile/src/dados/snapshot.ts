import { dataNoFuturo, LIMITES_SNAPSHOT, snapshotSchema, VERSAO_SCHEMA, type Snapshot } from "@tem-remedio/shared";
import type { Armazenamento } from "./armazenamento";

export type Origem = "rede" | "cache" | "embutido";

export interface SnapshotCarregado {
  snapshot: Snapshot;
  origem: Origem;
}

export interface Dependencias {
  armazenamento: Armazenamento;
  /** Snapshot que vai dentro do app: funciona na primeira abertura, mesmo sem internet. */
  embutido: unknown;
  /** Endereço onde o coletor publica `meta.json` e `snapshot.json` (ou null em desenvolvimento). */
  urlBase: string | null;
  fetchFn?: typeof fetch;
  /** Relógio do aparelho (nos testes, um horário fixo). */
  agora?: () => number;
}

const ARQUIVO_CACHE = "snapshot.json";

/** Sem resposta nesse tempo, desiste (o React Query tenta de novo depois). */
export const PRAZO_REDE_MS = 20_000;
/** O meta.json tem uns 400 bytes. */
const MAXIMO_META = 64 * 1024;

function validar(dados: unknown): Snapshot | null {
  const r = snapshotSchema.safeParse(dados);
  return r.success ? r.data : null;
}

/** Abre o app rápido e sem rede: usa o último snapshot baixado, se for válido e mais novo que o embutido. */
export async function carregarLocal(deps: Dependencias): Promise<SnapshotCarregado> {
  const embutido = validar(deps.embutido);
  if (!embutido) throw new Error("Snapshot embutido inválido. Rode `pnpm snapshot:app` e gere o app de novo.");
  const agora = (deps.agora ?? Date.now)();

  try {
    const texto = await deps.armazenamento.ler(ARQUIVO_CACHE);
    const cache = texto && texto.length <= LIMITES_SNAPSHOT.bytes ? validar(JSON.parse(texto)) : null;
    // Cache "do futuro" (ano errado na fonte ou arquivo adulterado) fica de lado: senão nenhum dado
    // novo passaria. Se o relógio do aparelho estiver atrasado, o pior caso é baixar de novo.
    if (cache && cache.meta.atualizadoEm > embutido.meta.atualizadoEm && !dataNoFuturo(cache.meta, agora)) {
      return { snapshot: cache, origem: "cache" };
    }
  } catch {
    // Cache corrompido: ignora e segue com o embutido.
  }
  return { snapshot: embutido, origem: "embutido" };
}

/**
 * Procura dados novos. Primeiro baixa só o meta.json (pequeno); o snapshot inteiro
 * só vem se a SES-DF tiver atualizado. Devolve null quando não há nada mais novo.
 * Erros de rede (e o prazo esgotado) sobem para o React Query tentar de novo depois.
 */
export async function atualizarDaRede(atual: Snapshot, deps: Dependencias): Promise<SnapshotCarregado | null> {
  if (!deps.urlBase) return null;
  const fetchFn = deps.fetchFn ?? fetch;
  const base = deps.urlBase.replace(/\/$/, "");

  // O GitHub Pages guarda em cache por 10 min: a hora na URL garante o meta.json atual.
  const respostaMeta = await buscarJson(fetchFn, `${base}/meta.json?t=${Date.now()}`, MAXIMO_META);
  if (!respostaMeta) return null;
  const meta = respostaMeta.dados as { versaoSchema?: unknown; atualizadoEm?: unknown; sha256?: unknown; bytes?: unknown } | null;
  if (
    typeof meta !== "object" ||
    meta === null ||
    meta.versaoSchema !== VERSAO_SCHEMA ||
    typeof meta.atualizadoEm !== "string" ||
    (typeof meta.bytes === "number" && meta.bytes > LIMITES_SNAPSHOT.bytes)
  ) {
    return null;
  }

  // "Agora" é o mais tarde entre o relógio do aparelho e a hora em que o GitHub publicou o meta.json
  // (cabeçalho Last-Modified, que quem altera o conteúdo não controla): um aparelho com o relógio
  // atrasado continua recebendo dados novos.
  const agora = Math.max((deps.agora ?? Date.now)(), respostaMeta.publicadoEm ?? 0);
  if (dataNoFuturo({ atualizadoEm: meta.atualizadoEm }, agora)) return null;
  // O atual "do futuro" (veio antes desta proteção) não pode impedir a troca por dados legítimos.
  const atualConfiavel = !dataNoFuturo(atual.meta, agora);
  if (atualConfiavel && meta.atualizadoEm <= atual.meta.atualizadoEm) return null;

  // O hash do conteúdo na URL: só muda quando os dados mudam (pode usar o cache).
  const versao = typeof meta.sha256 === "string" ? meta.sha256 : meta.atualizadoEm;
  const respostaSnapshot = await buscarJson(
    fetchFn,
    `${base}/snapshot.json?v=${encodeURIComponent(versao)}`,
    LIMITES_SNAPSHOT.bytes,
  );
  const novo = respostaSnapshot ? validar(respostaSnapshot.dados) : null;
  if (!novo || dataNoFuturo(novo.meta, agora)) return null;
  if (atualConfiavel && novo.meta.atualizadoEm <= atual.meta.atualizadoEm) return null;

  await deps.armazenamento.gravar(ARQUIVO_CACHE, JSON.stringify(novo));
  return { snapshot: novo, origem: "rede" };
}

interface RespostaJson {
  dados: unknown;
  /** Quando o servidor diz que publicou o arquivo (Last-Modified), em ms; null se não disse. */
  publicadoEm: number | null;
}

/**
 * GET simples, sem cabeçalhos extras: qualquer cabeçalho como `Cache-Control` faz o
 * navegador pedir permissão antes (preflight CORS), que o GitHub Pages recusa, e a
 * versão web nunca receberia dados novos. O `signal` não é cabeçalho e não dispara preflight.
 * Devolve null se o arquivo passar de `maximo` (Content-Length ou o texto recebido).
 */
async function buscarJson(fetchFn: typeof fetch, url: string, maximo: number): Promise<RespostaJson | null> {
  const controle = new AbortController();
  const prazo = setTimeout(() => controle.abort(), PRAZO_REDE_MS);
  try {
    const resp = await fetchFn(url, { signal: controle.signal });
    if (!resp.ok) throw new Error(`${url.split("?")[0]} respondeu ${resp.status}`);
    if (Number(resp.headers.get("content-length")) > maximo) return null;
    const texto = await resp.text();
    if (texto.length > maximo) return null;
    const publicadoEm = Date.parse(resp.headers.get("last-modified") ?? "");
    return { dados: JSON.parse(texto), publicadoEm: Number.isFinite(publicadoEm) ? publicadoEm : null };
  } finally {
    clearTimeout(prazo);
  }
}
