/**
 * Deixa o texto comparável: sem acento, maiúsculo, só letras, números e "+".
 * Usado pelo coletor (para casar nomes) e pelo app (para a busca).
 */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z0-9+]+/g, " ")
    .trim();
}
