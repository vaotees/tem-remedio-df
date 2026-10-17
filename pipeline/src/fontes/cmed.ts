import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { parse } from "csv-parse/sync";
import { normalizar } from "@tem-remedio/shared";
import { CMED_URL } from "../config";

export interface RegistroCmed {
  substancia: string;
  produto: string;
  apresentacao: string;
}

/** Lê a tabela CMED (separador ";", com BOM). Acha as colunas pelo nome do cabeçalho. */
export function lerCmed(csv: string): RegistroCmed[] {
  const linhas: string[][] = parse(csv, {
    delimiter: ";",
    bom: true,
    relax_quotes: true,
    relax_column_count: true,
    skip_empty_lines: true,
  });
  const cabecalho = (linhas[0] ?? []).map((c) => normalizar(c));
  const iSubst = cabecalho.indexOf("SUBSTANCIA");
  const iProduto = cabecalho.indexOf("PRODUTO");
  const iApres = cabecalho.indexOf("APRESENTACAO");
  if (iSubst < 0 || iProduto < 0 || iApres < 0) {
    throw new Error(`Cabeçalho da CMED mudou: ${linhas[0]?.slice(0, 12).join(";")}`);
  }
  return linhas.slice(1).flatMap((l) => {
    const substancia = l[iSubst]?.trim();
    const produto = l[iProduto]?.trim();
    if (!substancia || !produto) return [];
    return [{ substancia, produto, apresentacao: l[iApres]?.trim() ?? "" }];
  });
}

/** Baixa a CMED; se a Anvisa falhar, usa a última cópia baixada. */
export async function obterCmed(
  caminhoCache: string,
  fetchFn: typeof fetch = fetch,
): Promise<{ csv: string; doCache: boolean }> {
  try {
    const resp = await fetchFn(CMED_URL);
    if (!resp.ok) throw new Error(`Anvisa respondeu ${resp.status}`);
    const csv = await resp.text();
    await mkdir(dirname(caminhoCache), { recursive: true });
    await writeFile(caminhoCache, csv);
    return { csv, doCache: false };
  } catch (erro) {
    try {
      return { csv: await readFile(caminhoCache, "utf8"), doCache: true };
    } catch {
      throw new Error(`CMED indisponível e sem cópia local: ${String(erro)}`);
    }
  }
}
