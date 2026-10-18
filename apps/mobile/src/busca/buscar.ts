import { normalizar, type Marca, type Snapshot } from "@tem-remedio/shared";
import Fuse from "fuse.js";
import { chaveSubstancia, gruposPorSubstancia, nomeSubstancia } from "./remedios";

/** Um resultado da busca: uma substância, com todas as formas e doses que a rede distribui. */
export interface GrupoResultado {
  chave: string;
  /** "Losartana potassica" */
  nome: string;
  /** Índices em `snapshot.produtos`, na ordem da tela "Qual destes?". */
  produtos: number[];
  /** Preenchida quando a pessoa buscou pelo nome comercial (ex.: Glifage XR → metformina). */
  marca: Marca | null;
}

interface ItemBusca {
  texto: string;
  /** Chaves de substância a que o item leva (marca pode levar a mais de uma). */
  chaves: string[];
  marca: Marca | null;
}

interface Indice {
  fuse: Fuse<ItemBusca>;
  grupos: Map<string, { nome: string; produtos: number[] }>;
}

/** Menor busca que vale a pena: com 1 letra, tudo casa. */
export const MINIMO_LETRAS = 2;

const indices = new WeakMap<Snapshot, Indice>();

function criarIndice(snapshot: Snapshot): Indice {
  const grupos = new Map<string, { nome: string; produtos: number[] }>();
  for (const [chave, produtos] of gruposPorSubstancia(snapshot)) {
    grupos.set(chave, { nome: nomeSubstancia(produtos.map((i) => snapshot.produtos[i]!)), produtos });
  }

  // Produtos antes das marcas: no empate, o nome do remédio ganha do nome comercial.
  const itens: ItemBusca[] = [
    ...snapshot.produtos.map((p) => ({ texto: p.busca, chaves: [chaveSubstancia(p.substancia)], marca: null })),
    ...snapshot.marcas.map((m) => ({
      texto: normalizar(m.nome),
      chaves: [...new Set(m.produtos.map((i) => chaveSubstancia(snapshot.produtos[i]!.substancia)))],
      marca: m,
    })),
  ];

  const fuse = new Fuse(itens, {
    keys: ["texto"],
    includeScore: true,
    // Cada palavra da busca precisa aparecer (com erro de digitação tolerado) em qualquer lugar do nome.
    useExtendedSearch: true,
    ignoreLocation: true,
    // Sem isso, nomes curtos de marca ganham de nomes completos de remédio que casam igual.
    ignoreFieldNorm: true,
    threshold: 0.3,
  });
  return { fuse, grupos };
}

/** Monta o índice antes da primeira tecla (leva uns 100 ms no celular). */
export function prepararBusca(snapshot: Snapshot): Indice {
  let indice = indices.get(snapshot);
  if (!indice) indices.set(snapshot, (indice = criarIndice(snapshot)));
  return indice;
}

/**
 * Marca que é só o nome genérico ("DIPIRONA SODICA", "FURP PARACETAMOL") não é um nome comercial
 * de verdade: o resultado aparece como busca pelo nome do remédio.
 */
function ehNomeGenerico(marca: Marca, chave: string): boolean {
  const palavras = new Set(normalizar(marca.nome).split(" "));
  return chave.split(" ").some((p) => p.length >= 5 && p !== "ACIDO" && palavras.has(p));
}

/**
 * Busca por nome do remédio ou nome comercial, tolerante a acento e erro de digitação.
 * Devolve os resultados agrupados por substância, do mais parecido para o menos.
 */
export function buscar(snapshot: Snapshot, termo: string, limite = 10): GrupoResultado[] {
  const consulta = normalizar(termo);
  if (consulta.replace(/\s/g, "").length < MINIMO_LETRAS) return [];

  const indice = prepararBusca(snapshot);
  const acertos = indice.fuse.search(consulta, { limit: 80 });
  // Descarta os parecidos demais com outra coisa: "puran" acha Puran T4 (marca), não alopurinol.
  const melhor = acertos[0]?.score ?? 0;
  const corte = Math.max(melhor * 2, melhor + 0.1);

  const resultado = new Map<string, GrupoResultado>();
  for (const { item, score = 0 } of acertos) {
    if (score > corte) break;
    for (const chave of item.chaves) {
      if (resultado.has(chave)) continue;
      const grupo = indice.grupos.get(chave);
      if (!grupo) continue;
      const marca = item.marca && !ehNomeGenerico(item.marca, chave) ? item.marca : null;
      resultado.set(chave, { chave, ...grupo, marca });
    }
    if (resultado.size >= limite) break;
  }
  return [...resultado.values()].slice(0, limite);
}
