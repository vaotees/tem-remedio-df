import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { MetaSnapshot, Snapshot } from "@tem-remedio/shared";
import type { ResumoPublicado } from "./validar";

/** meta.json: pequeno, para o app saber se precisa baixar o snapshot de novo. */
export interface MetaPublicada extends MetaSnapshot, ResumoPublicado {
  arquivo: string;
  sha256: string;
  bytes: number;
  contagens: ResumoPublicado["contagens"] & { marcas: number };
}

export async function escreverSaida(dir: string, s: Snapshot): Promise<MetaPublicada> {
  await mkdir(dir, { recursive: true });
  const corpo = JSON.stringify(s);
  const sha256 = createHash("sha256").update(corpo).digest("hex");
  const meta: MetaPublicada = {
    ...s.meta,
    arquivo: "snapshot.json",
    sha256,
    bytes: Buffer.byteLength(corpo),
    contagens: { ubs: s.ubs.length, produtos: s.produtos.length, estoque: s.estoque.length, marcas: s.marcas.length },
  };
  await writeFile(join(dir, "snapshot.json"), corpo);
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta, null, 2) + "\n");
  return meta;
}

/** Lê o meta.json publicado (URL do GitHub Pages ou caminho local). Sem anterior → null. */
export async function lerPublicado(origem: string | undefined, fetchFn: typeof fetch = fetch): Promise<ResumoPublicado | null> {
  if (!origem) return null;
  try {
    const texto = /^https?:\/\//.test(origem)
      ? await fetchFn(origem).then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      : await readFile(origem, "utf8");
    const m = JSON.parse(texto) as Partial<ResumoPublicado>;
    if (typeof m.atualizadoEm !== "string" || !m.contagens) return null;
    return { atualizadoEm: m.atualizadoEm, contagens: m.contagens };
  } catch {
    return null;
  }
}
