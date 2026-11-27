/** Telefone pronto para mostrar e para discar. */
export interface Telefone {
  /** "(61) 3563-9176", "(61) 99123-4567" ou "(61) 2017-2000, ramal 4590". */
  exibir: string;
  /** "+556135639176": com o +55, a ligação funciona de qualquer celular, sem código de operadora. */
  discar: string;
}

/** DDD do DF: número sem DDD no cadastro da SES-DF é daqui. */
const DDD_DF = "61";

const RE_RAMAL_PARENTESES = /\(\s*(\d{2,5})\s*\)\s*$/;
const RE_RAMAL_ESCRITO = /\bramal\b\D*(\d{2,5})/i;

/**
 * Lê o telefone do cadastro, venha como vier ("(61) 3563-9176", "6134497490", "3449-5849",
 * "61 2017-2000 (4590)"), e confere o formato brasileiro: DDD de dois dígitos, fixo com 8 dígitos
 * começando de 2 a 5, celular com 9 começando por 9. Fora disso (ex.: "61334494826", um dígito a mais,
 * ou só "RAMAL 2241"), devolve null: um número errado faz a pessoa ligar para outro lugar.
 */
export function normalizarTelefone(texto: string | null | undefined): Telefone | null {
  if (!texto) return null;
  let resto = texto.trim();
  let ramal: string | null = null;
  const entreParenteses = RE_RAMAL_PARENTESES.exec(resto);
  const escrito = RE_RAMAL_ESCRITO.exec(resto);
  if (entreParenteses) {
    ramal = entreParenteses[1]!;
    resto = resto.slice(0, entreParenteses.index);
  } else if (escrito) {
    ramal = escrito[1]!;
    resto = resto.slice(0, escrito.index);
  }

  let digitos = resto.replace(/\D/g, "").replace(/^0+/, "");
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55")) digitos = digitos.slice(2);
  if (digitos.length === 8 || digitos.length === 9) digitos = `${DDD_DF}${digitos}`;

  const ddd = digitos.slice(0, 2);
  const numero = digitos.slice(2);
  const fixo = numero.length === 8 && /^[2-5]/.test(numero);
  const celular = numero.length === 9 && numero.startsWith("9");
  if (!/^[1-9][1-9]$/.test(ddd) || !(fixo || celular)) return null;

  const corte = numero.length - 4;
  const exibir = `(${ddd}) ${numero.slice(0, corte)}-${numero.slice(corte)}${ramal ? `, ramal ${ramal}` : ""}`;
  return { exibir, discar: `+55${ddd}${numero}` };
}
