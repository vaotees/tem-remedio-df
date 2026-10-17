import { normalizar } from "@tem-remedio/shared";

/** Sais, hidratos e palavras de ligação: não mudam qual é a substância. */
const SAIS = new Set([
  "A", "ACETATO", "BASE", "BENZOATO", "BESILATO", "BROMETO", "BROMIDRATO", "BUTILBROMETO", "CALCICA",
  "CALCICO", "CARBONATO", "CITRATO", "CLORIDRATO", "DA", "DE", "DECANOATO", "DI", "DICLORIDRATO",
  "DIHIDRATADO", "DIIDRATADO", "DIPROPIONATO", "DO", "E", "EQUIVALENTE", "ESTOLATO", "FOSFATO",
  "FUMARATO", "GLUCONATO", "HEMIFUMARATO", "HIDRATADA", "HIDRATADO", "HIDROCLORIDRATO",
  "HIDROXINAFTOATO", "ISOTIONATO", "LACTATO", "MAGNESICO", "MALEATO", "MESILATO", "MONOIDRATADA",
  "MONOIDRATADO", "N", "NITRATO", "OXALATO", "POTASSICA", "POTASSICO", "PROPIONATO", "SODICA",
  "SODICO", "SUCCINATO", "SULFATO", "TARTARATO", "TRI", "TRIHIDRATADA", "TRIHIDRATADO",
  "TRIIDRATADA", "VALERATO", "XINAFOATO",
]);

const CONECTIVOS_E_HIDRATOS = new Set([
  "A", "DA", "DE", "DO", "E", "N", "DI", "TRI", "HIDRATADA", "HIDRATADO", "DIHIDRATADO", "DIIDRATADO",
  "MONOIDRATADA", "MONOIDRATADO", "TRIHIDRATADA", "TRIHIDRATADO", "TRIIDRATADA",
]);

/** Se tirar o sal deixar só um destes, o sal fica: "ACETATO DE SODIO" não é o mesmo que "CLORETO DE SODIO". */
const ELEMENTOS = new Set(["SODIO", "POTASSIO", "CALCIO", "MAGNESIO", "ZINCO", "FERRO", "LITIO", "ALUMINIO", "PRATA", "COBRE"]);

/**
 * Quebra uma substância (ou combinação) em componentes comparáveis.
 * "BUDESONIDA;FUMARATO DE FORMOTEROL DI-HIDRATADO" → ["BUDESONIDA", "FORMOTEROL"]
 * "BROMETO DE N BUTIL-ESCOPOLAMINA" → ["BUTIL ESCOPOLAMINA"]
 * "CARBONATO DE CALCIO" → ["CARBONATO CALCIO"]
 */
export function componentes(texto: string): string[] {
  const partes = texto
    .replace(/\(.*?\)/g, " ") // "(CLORIDRATO)"
    .split(/[+;,]|\s+E\s+(?=[A-Za-zÀ-ú])/);
  const out = new Set<string>();
  for (const parte of partes) {
    const todas = normalizar(parte)
      .split(" ")
      .filter((p) => p && !/^\d/.test(p));
    let palavras = todas.filter((p) => !SAIS.has(p));
    if (palavras.length && palavras.every((p) => ELEMENTOS.has(p))) {
      palavras = todas.filter((p) => !CONECTIVOS_E_HIDRATOS.has(p));
    }
    if (palavras.length) out.add(palavras.join(" "));
  }
  return [...out].sort();
}

/**
 * Duas listas de componentes são a mesma substância se têm o mesmo número de itens
 * e cada um casa com um do outro lado pelas palavras: um contém todas as palavras do outro.
 * Assim "INSULINA HUMANA" (CMED) casa com "INSULINA HUMANA NPH" (SES-DF),
 * e "ESCOPOLAMINA" casa com "BUTIL ESCOPOLAMINA".
 */
export function mesmaSubstancia(a: string[], b: string[]): boolean {
  if (a.length === 0 || a.length !== b.length) return false;
  const livres = [...b];
  for (const ca of a) {
    const i = livres.findIndex((cb) => contem(ca, cb) || contem(cb, ca));
    if (i < 0) return false;
    livres.splice(i, 1);
  }
  return true;
}

function contem(maior: string, menor: string): boolean {
  const palavras = new Set(maior.split(" "));
  return menor.split(" ").every((p) => palavras.has(p));
}
