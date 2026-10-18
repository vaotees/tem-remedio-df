import { normalizar, type Marca, type Produto, type Snapshot } from "@tem-remedio/shared";

/**
 * Chave para agrupar produtos da mesma substância. A SES-DF escreve a mesma substância de
 * jeitos diferentes ("ACIDO FOLICO" e "ACIDO FÓLICO", "DEXAMETASONA" e "DEXAMETASONA (ACETATO)"):
 * tira o sal entre parênteses e os acentos.
 */
export function chaveSubstancia(substancia: string): string {
  return normalizar(substancia.replace(/\(.*?\)/g, " "));
}

/** "LOSARTANA POTASSICA" → "Losartana potassica": maiúsculas o tempo todo cansam a leitura. */
export function capitalizarFrase(texto: string): string {
  const minusculo = texto.toLocaleLowerCase("pt-BR");
  return minusculo.charAt(0).toLocaleUpperCase("pt-BR") + minusculo.slice(1);
}

const PALAVRAS_MINUSCULAS = new Set(["de", "da", "do", "das", "dos", "e"]);
const SIGLAS = new Set(["UBS", "SIA", "CPP", "DER", "AAS", "EMS", "ODT", "HFA"]);

/**
 * "UBS 05 TAGUATINGA" → "UBS 05 Taguatinga", "GLIFAGE XR" → "Glifage XR".
 * Siglas, algarismos romanos e códigos com número ficam como estão.
 */
export function capitalizarNome(nome: string): string {
  return nome
    .split(/\s+/)
    .map((palavra, i) => {
      const minuscula = palavra.toLocaleLowerCase("pt-BR");
      if (i > 0 && PALAVRAS_MINUSCULAS.has(minuscula)) return minuscula;
      if (SIGLAS.has(palavra) || /\d|^[IVX]+$|^[^AEIOU]+$/.test(palavra)) return palavra;
      return minuscula.charAt(0).toLocaleUpperCase("pt-BR") + minuscula.slice(1);
    })
    .join(" ");
}

/** "50 MG" → "50 mg", "100MG" → "100 mg", "10 MG/ML" → "10 mg/mL". */
export function formatarDose(dose: string): string {
  return dose
    .replace(/(\d)(MCG|MG|ML|G)\b/g, "$1 $2")
    .replace(/\bMCG\b/g, "mcg")
    .replace(/\bMG\b/g, "mg")
    .replace(/\bML\b/g, "mL")
    .replace(/\bG\b/g, "g");
}

/** Como o remédio aparece para a pessoa: "Comprimido 50 mg". Sem forma/dose, usa a descrição da SES-DF. */
export function rotuloProduto(produto: Produto): string {
  const partes = [produto.forma, produto.dose && formatarDose(produto.dose)].filter(Boolean);
  return partes.length ? partes.join(" ") : capitalizarFrase(produto.descricao);
}

/** Nome da substância para mostrar: prefere a grafia com mais acentos e a mais curta ("Acido fólico", "Dexametasona"). */
export function nomeSubstancia(produtos: Produto[]): string {
  const grafias = [...new Set(produtos.map((p) => p.substancia))];
  const acentos = (t: string) => t.normalize("NFD").match(/\p{M}/gu)?.length ?? 0;
  grafias.sort((a, b) => acentos(b) - acentos(a) || a.length - b.length);
  return capitalizarFrase(grafias[0] ?? "");
}

/** Valor numérico da dose, para ordenar ("3,125 MG" < "12,5 MG"). */
function valorDose(dose: string | null): number {
  const n = parseFloat((dose ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

const grupos = new WeakMap<Snapshot, Map<string, number[]>>();

/**
 * Produtos agrupados por substância (chave → índices em `snapshot.produtos`), cada grupo
 * por forma e dose. Calculado uma vez por snapshot.
 */
export function gruposPorSubstancia(snapshot: Snapshot): Map<string, number[]> {
  let mapa = grupos.get(snapshot);
  if (mapa) return mapa;

  mapa = new Map();
  snapshot.produtos.forEach((p, i) => {
    const chave = chaveSubstancia(p.substancia);
    const lista = mapa!.get(chave);
    if (lista) lista.push(i);
    else mapa!.set(chave, [i]);
  });
  const ordem = (a: Produto, b: Produto) =>
    (a.forma ?? "").localeCompare(b.forma ?? "", "pt-BR") ||
    valorDose(a.dose) - valorDose(b.dose) ||
    a.descricao.localeCompare(b.descricao, "pt-BR");
  for (const lista of mapa.values()) lista.sort((a, b) => ordem(snapshot.produtos[a]!, snapshot.produtos[b]!));

  grupos.set(snapshot, mapa);
  return mapa;
}

/** Índices de todos os produtos da mesma substância, por forma e dose: a lista da tela "Qual destes?". */
export function produtosDaSubstancia(snapshot: Snapshot, chave: string): number[] {
  return gruposPorSubstancia(snapshot).get(chave) ?? [];
}

export function indiceProduto(snapshot: Snapshot, codigo: string): number {
  return snapshot.produtos.findIndex((p) => p.codigo === codigo);
}

export function acharMarca(snapshot: Snapshot, nome: string | undefined): Marca | null {
  if (!nome) return null;
  return snapshot.marcas.find((m) => m.nome === nome) ?? null;
}

/**
 * Mesma substância ≠ mesmo remédio: a marca é de liberação prolongada (ex.: Glifage XR)
 * e o produto do SUS não é. O app avisa e manda confirmar com médico ou farmacêutico.
 */
export function precisaAvisoLiberacao(marca: Marca | null, produto: Produto): boolean {
  return !!marca?.liberacaoProlongada && !produto.liberacaoProlongada;
}
