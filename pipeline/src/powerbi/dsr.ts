/**
 * Decodificador do formato DSR que o Power BI devolve em `querydata`.
 *
 * Cada linha traz só o que mudou em relação à anterior:
 * - `R`: bitmask das colunas repetidas da linha anterior
 * - `Ø`: bitmask das colunas nulas
 * - `C`: valores das colunas restantes, em ordem (com uma coluna só, vem `G0` no lugar de `C`)
 * Textos costumam vir como índice em `ValueDicts`.
 */

export type Valor = string | number | boolean | null;

interface ColunaDsr {
  N: string;
  T?: number;
  DN?: string;
}

interface LinhaDsr {
  S?: ColunaDsr[];
  C?: Valor[];
  R?: number;
  "Ø"?: number;
  [chave: string]: unknown;
}

export interface DataSetDsr {
  PH: { DM0?: LinhaDsr[] }[];
  ValueDicts?: Record<string, Valor[]>;
  RT?: unknown[][];
}

export function decodificarDsr(
  ds: DataSetDsr,
  nColunas: number,
  anterior: Valor[] = new Array(nColunas).fill(null),
): Valor[][] {
  const dicionarios = ds.ValueDicts ?? {};
  const linhas: Valor[][] = [];
  let schema: ColunaDsr[] | undefined;
  let prev = anterior;

  for (const linha of ds.PH[0]?.DM0 ?? []) {
    if (linha.S) schema = linha.S;
    if (!schema) throw new Error("DSR sem schema na primeira linha");

    let valores: Valor[];
    if (linha.C) {
      valores = linha.C;
    } else {
      const chaves = schema.map((s) => s.N).filter((n) => n in linha);
      if (chaves.length === 0) continue; // linha só com o schema
      valores = chaves.map((n) => linha[n] as Valor);
    }

    const repetidas = linha.R ?? 0;
    const nulas = linha["Ø"] ?? 0;
    let i = 0;
    const atual: Valor[] = [];
    for (let col = 0; col < nColunas; col++) {
      if ((repetidas >> col) & 1) {
        atual.push(prev[col] ?? null);
      } else if ((nulas >> col) & 1) {
        atual.push(null);
      } else {
        let v = valores[i++] ?? null;
        const dn = schema[col]?.DN;
        if (dn && typeof v === "number") v = dicionarios[dn]?.[v] ?? null;
        atual.push(v);
      }
    }
    linhas.push(atual);
    prev = atual;
  }
  return linhas;
}
