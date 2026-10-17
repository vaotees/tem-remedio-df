import { readFile, writeFile } from "node:fs/promises";
import { CNES_API } from "../config";

export interface EstabelecimentoCnes {
  cnes: string;
  nome: string;
  endereco: string;
  cep: string | null;
  telefone: string | null;
  lat: number | null;
  lng: number | null;
}

export type CacheCnes = Record<string, EstabelecimentoCnes>;

export async function lerCache(caminho: string): Promise<CacheCnes> {
  try {
    return JSON.parse(await readFile(caminho, "utf8")) as CacheCnes;
  } catch {
    return {};
  }
}

export async function salvarCache(caminho: string, cache: CacheCnes) {
  const ordenado = Object.fromEntries(Object.entries(cache).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(caminho, JSON.stringify(ordenado, null, 1) + "\n");
}

/**
 * Busca endereço, telefone e coordenadas no CNES. Endereço de UBS quase nunca muda,
 * então quem falhar na API usa o cache versionado no repositório.
 */
export async function buscarCnes(
  codigos: string[],
  cache: CacheCnes,
  { fetchFn = fetch, concorrencia = 6 }: { fetchFn?: typeof fetch; concorrencia?: number } = {},
): Promise<{ dados: CacheCnes; doCache: string[]; ausentes: string[] }> {
  const dados: CacheCnes = {};
  const doCache: string[] = [];
  const ausentes: string[] = [];
  const fila = [...new Set(codigos)];

  async function trabalhador() {
    for (let cod = fila.shift(); cod; cod = fila.shift()) {
      try {
        const resp = await fetchFn(`${CNES_API}/${Number(cod)}`);
        if (!resp.ok) throw new Error(String(resp.status));
        dados[cod] = converter(cod, (await resp.json()) as Record<string, unknown>);
      } catch {
        const doArquivo = cache[cod];
        if (doArquivo) {
          dados[cod] = doArquivo;
          doCache.push(cod);
        } else {
          ausentes.push(cod);
        }
      }
    }
  }
  await Promise.all(Array.from({ length: concorrencia }, trabalhador));
  return { dados, doCache: doCache.sort(), ausentes: ausentes.sort() };
}

function converter(cod: string, d: Record<string, unknown>): EstabelecimentoCnes {
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  const endereco = [str(d.endereco_estabelecimento), str(d.bairro_estabelecimento)].filter(Boolean).join(", ");
  return {
    cnes: cod,
    nome: str(d.nome_fantasia) ?? cod,
    endereco,
    cep: str(d.codigo_cep_estabelecimento),
    telefone: str(d.numero_telefone_estabelecimento),
    lat: num(d.latitude_estabelecimento_decimo_grau),
    lng: num(d.longitude_estabelecimento_decimo_grau),
  };
}
