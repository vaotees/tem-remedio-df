import { snapshotSchema, VERSAO_SCHEMA, type Snapshot } from "@tem-remedio/shared";
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
}

const ARQUIVO_CACHE = "snapshot.json";

function validar(dados: unknown): Snapshot | null {
  const r = snapshotSchema.safeParse(dados);
  return r.success ? r.data : null;
}

/** Abre o app rápido e sem rede: usa o último snapshot baixado, se for válido e mais novo que o embutido. */
export async function carregarLocal(deps: Dependencias): Promise<SnapshotCarregado> {
  const embutido = validar(deps.embutido);
  if (!embutido) throw new Error("Snapshot embutido inválido. Rode `pnpm snapshot:app` e gere o app de novo.");

  try {
    const texto = await deps.armazenamento.ler(ARQUIVO_CACHE);
    const cache = texto ? validar(JSON.parse(texto)) : null;
    if (cache && cache.meta.atualizadoEm > embutido.meta.atualizadoEm) return { snapshot: cache, origem: "cache" };
  } catch {
    // Cache corrompido: ignora e segue com o embutido.
  }
  return { snapshot: embutido, origem: "embutido" };
}

/**
 * Procura dados novos. Primeiro baixa só o meta.json (pequeno); o snapshot inteiro
 * só vem se a SES-DF tiver atualizado. Devolve null quando não há nada mais novo.
 * Erros de rede sobem para o React Query tentar de novo depois.
 */
export async function atualizarDaRede(atual: Snapshot, deps: Dependencias): Promise<SnapshotCarregado | null> {
  if (!deps.urlBase) return null;
  const fetchFn = deps.fetchFn ?? fetch;
  const base = deps.urlBase.replace(/\/$/, "");

  // O GitHub Pages guarda em cache por 10 min: a hora na URL garante o meta.json atual.
  const meta = (await buscarJson(fetchFn, `${base}/meta.json?t=${Date.now()}`)) as {
    versaoSchema?: unknown;
    atualizadoEm?: unknown;
    sha256?: unknown;
  } | null;
  if (
    typeof meta !== "object" ||
    meta === null ||
    meta.versaoSchema !== VERSAO_SCHEMA ||
    typeof meta.atualizadoEm !== "string" ||
    meta.atualizadoEm <= atual.meta.atualizadoEm
  ) {
    return null;
  }

  // O hash do conteúdo na URL: só muda quando os dados mudam (pode usar o cache).
  const versao = typeof meta.sha256 === "string" ? meta.sha256 : meta.atualizadoEm;
  const novo = validar(await buscarJson(fetchFn, `${base}/snapshot.json?v=${encodeURIComponent(versao)}`));
  if (!novo || novo.meta.atualizadoEm <= atual.meta.atualizadoEm) return null;

  await deps.armazenamento.gravar(ARQUIVO_CACHE, JSON.stringify(novo));
  return { snapshot: novo, origem: "rede" };
}

/**
 * GET simples, sem cabeçalhos extras: qualquer cabeçalho como `Cache-Control` faz o
 * navegador pedir permissão antes (preflight CORS), que o GitHub Pages recusa, e a
 * versão web nunca receberia dados novos.
 */
async function buscarJson(fetchFn: typeof fetch, url: string): Promise<unknown> {
  const resp = await fetchFn(url);
  if (!resp.ok) throw new Error(`${url.split("?")[0]} respondeu ${resp.status}`);
  return resp.json();
}
