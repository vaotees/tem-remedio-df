import { normalizar, type Marca } from "@tem-remedio/shared";
import type { RegistroCmed } from "../fontes/cmed";
import { componentes, mesmaSubstancia } from "./substancia";

export interface ProdutoComparavel {
  componentes: string[];
}

const LIB_PROLONGADA = /\bLIB\.?\s*(?:PROL|CONT|MODIF|RETARD|ESTEND)/;

/**
 * "Tradutor": nome comercial (CMED) → produtos da SES-DF com a mesma substância.
 * Só entram marcas que levam a algum produto distribuído nas UBSs.
 */
export function construirMarcas(cmed: RegistroCmed[], produtos: ProdutoComparavel[]): Marca[] {
  const porMarca = new Map<
    string,
    { substancias: Map<string, { comp: string[]; linhas: number }>; apresentacoes: string[] }
  >();
  for (const r of cmed) {
    const nome = normalizar(r.produto);
    if (!nome) continue;
    let m = porMarca.get(nome);
    if (!m) porMarca.set(nome, (m = { substancias: new Map(), apresentacoes: [] }));
    const comp = componentes(r.substancia);
    const chave = comp.join("|");
    const s = m.substancias.get(chave);
    if (s) s.linhas++;
    else m.substancias.set(chave, { comp, linhas: 1 });
    m.apresentacoes.push(normalizar(r.apresentacao));
  }

  const marcas: Marca[] = [];
  for (const [nome, { substancias, apresentacoes }] of porMarca) {
    // A CMED tem linhas com a substância errada (ex.: 1 linha "CLAVULIN = só amoxicilina" contra 8 com
    // amoxicilina + clavulanato). Vale a substância da maioria das linhas da marca.
    const maximo = Math.max(...[...substancias.values()].map((s) => s.linhas));
    const indices = new Set<number>();
    for (const { comp, linhas } of substancias.values()) {
      if (linhas < maximo) continue;
      produtos.forEach((p, i) => {
        if (mesmaSubstancia(comp, p.componentes)) indices.add(i);
      });
    }
    if (indices.size === 0) continue;
    marcas.push({
      nome,
      produtos: [...indices].sort((a, b) => a - b),
      // Marca de liberação prolongada se todas as apresentações forem (ex.: GLIFAGE XR).
      liberacaoProlongada: apresentacoes.length > 0 && apresentacoes.every((a) => LIB_PROLONGADA.test(a)),
    });
  }
  return marcas.sort((a, b) => a.nome.localeCompare(b.nome));
}
