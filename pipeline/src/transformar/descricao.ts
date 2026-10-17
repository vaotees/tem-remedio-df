import { componentes } from "./substancia";

export interface DescricaoSeparada {
  /** Nome da substância como a SES-DF escreve, sem forma e dose (ex.: "METFORMINA (CLORIDRATO)"). */
  substancia: string;
  componentes: string[];
  forma: string | null;
  dose: string | null;
  liberacaoProlongada: boolean;
}

/** Formas farmacêuticas, da mais específica para a mais genérica. */
const FORMAS: [RegExp, string][] = [
  [/COMPRIMIDO/, "Comprimido"],
  [/DRAGEA/, "Drágea"],
  [/CAPSULA/, "Cápsula"],
  [/SOLUCAO OFTALMICA|SUSPENSAO OFTALMICA|COLIRIO/, "Colírio"],
  [/POMADA OFTALMICA/, "Pomada oftálmica"],
  [/SOLUCAO NASAL|AEROSSOL NASAL|SPRAY NASAL/, "Spray nasal"],
  [/AEROSS?OL|SPRAY|INALACAO|INALANTE|INALATORIO/, "Inalador"],
  [/INJETAVEL/, "Injetável"],
  [/GOTAS/, "Gotas"],
  [/SOLUCAO ORAL|LIQUIDO ORAL|ELIXIR/, "Solução oral"],
  [/SUSPENSAO ORAL|PO PARA SUSPENSAO|P\/ ?SUSP/, "Suspensão oral"],
  [/XAROPE/, "Xarope"],
  [/CREME/, "Creme"],
  [/POMADA/, "Pomada"],
  [/GELEIA|\bGEL\b/, "Gel"],
  [/LOCAO/, "Loção"],
  [/XAMPU|SHAMPOO/, "Xampu"],
  [/ADESIVO/, "Adesivo"],
  [/GOMA/, "Goma de mascar"],
  [/PASTILHA/, "Pastilha"],
  [/OVULO/, "Óvulo"],
  [/TINTURA/, "Tintura"],
  [/\bCHA\b/, "Chá"],
  [/\bPO\b/, "Pó"],
  [/SOLUCAO/, "Solução"],
];

const UNIDADE = String.raw`(?:MCG|MG|G|UI|U|ML|%)(?:\s*\/\s*(?:ML|DOSE|G|\d+\s*ML))?`;
const DOSE = new RegExp(String.raw`\d[\d.,]*\s*${UNIDADE}(?:\s*\+\s*\d[\d.,]*\s*${UNIDADE})*`);

/** Palavra onde termina o nome da substância. */
const FIM_SUBSTANCIA =
  /\s(?:COMPRIMIDO|CAPSULA|SOLUCAO|SUSPENSAO|XAROPE|CREME|POMADA|GEL|GELEIA|AEROSS?OL|PO|INJETAVEL|ADESIVO|GOMA|PASTILHA|DRAGEA|ELIXIR|EMULSAO|LOCAO|XAMPU|SHAMPOO|OVULO|TINTURA|SPRAY|GOTAS|LIQUIDO|CHA|COLIRIO)\b|\s\d/;

const LIB_PROLONGADA = /LIBERACAO (?:PROLONGADA|CONTROLADA|MODIFICADA|RETARDADA)/;

export function separarDescricao(descricao: string): DescricaoSeparada {
  // O nome exibido mantém acentos e parênteses do original ("METFORMINA (CLORIDRATO)").
  // Forma, dose e o corte são procurados numa cópia sem acentos: tem o mesmo comprimento
  // e mantém a pontuação ("MG/ML").
  const original = descricao.toUpperCase().replace(/\s+/g, " ").trim();
  const texto = original.normalize("NFKD").replace(/\p{M}/gu, "");
  // Números entre parênteses não cortam o nome: "CARBONATO DE CALCIO (EQUIVALENTE A 500 MG...) + COLECALCIFEROL".
  const semParenteses = texto.replace(/\([^)]*\)/g, (m) => `(${"_".repeat(m.length - 2)})`);
  const corte = texto.length === original.length ? semParenteses.search(FIM_SUBSTANCIA) : -1;

  const substancia = (corte > 0 ? original.slice(0, corte) : original).replace(/[\s-]+$/, "").trim();

  return {
    substancia,
    componentes: componentes(substancia),
    forma: FORMAS.find(([re]) => re.test(texto))?.[1] ?? null,
    dose: texto.match(DOSE)?.[0].replace(/\s+/g, " ").trim() ?? null,
    liberacaoProlongada: LIB_PROLONGADA.test(texto),
  };
}
