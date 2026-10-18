import type { Ubs } from "@tem-remedio/shared";
import { capitalizarNome } from "@/busca/remedios";

/** Rota até o posto no Google Maps (abre o app, se instalado, ou o site). */
export function linkGoogleMaps(ubs: Ubs): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${ubs.lat},${ubs.lng}`;
}

/** Rota até o posto no Mapas da Apple (vem em todo iPhone). */
export function linkAppleMaps(ubs: Ubs): string {
  return `https://maps.apple.com/?daddr=${ubs.lat},${ubs.lng}&q=${encodeURIComponent(capitalizarNome(ubs.nome))}`;
}

/** Rota até o posto no Waze (abre o app, se instalado, ou o site). */
export function linkWaze(ubs: Ubs): string {
  return `https://waze.com/ul?ll=${ubs.lat},${ubs.lng}&navigate=yes`;
}

/**
 * Street View do Google Maps no ponto do posto, para a pessoa reconhecer a fachada antes de sair.
 * Link grátis e sem chave de API (a foto embutida no app exigiria chave, cobrança e internet).
 */
export function linkStreetView(ubs: Ubs): string {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${ubs.lat},${ubs.lng}`;
}

export interface AppDeMapa {
  nome: string;
  url: string;
}

/**
 * Apps oferecidos em "Como chegar": a pessoa escolhe o que costuma usar.
 * São links https: se o app não estiver instalado, abre o site (o Expo Go não deixa perguntar
 * ao iPhone quais apps estão instalados).
 */
export function appsDeMapa(ubs: Ubs, plataforma: string): AppDeMapa[] {
  return [
    ...(plataforma === "ios" ? [{ nome: "Mapas", url: linkAppleMaps(ubs) }] : []),
    { nome: "Google Maps", url: linkGoogleMaps(ubs) },
    { nome: "Waze", url: linkWaze(ubs) },
  ];
}

/**
 * "(61) 3563-9176" → "tel:+556135639176". Com o +55 a ligação funciona de qualquer celular,
 * sem código de operadora. Número sem DDD ganha o 61 do DF.
 */
export function linkTelefone(telefone: string): string | null {
  let digitos = telefone.replace(/\D/g, "").replace(/^0+/, "");
  if (digitos.length === 8 || digitos.length === 9) digitos = `61${digitos}`;
  if (digitos.length < 10) return null;
  return `tel:+55${digitos}`;
}

/** "72155000" → "72155-000". */
export function formatarCep(cep: string): string {
  return cep.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}

/** Abre o WhatsApp do celular direto na escolha do contato, já com a mensagem. */
export function linkWhatsAppApp(texto: string): string {
  return `whatsapp://send?text=${encodeURIComponent(texto)}`;
}

/** Na web: abre o WhatsApp Web (ou o app, no computador que tiver). */
export function linkWhatsApp(texto: string): string {
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}

interface Compartilhar {
  ubs: Ubs;
  remedio: string | null;
  /** "hoje às 00h16" */
  atualizacao: string;
}

/** Mensagem para mandar no WhatsApp: o filho manda para a mãe, ou a pessoa guarda para si. */
export function textoCompartilhar({ ubs, remedio, atualizacao }: Compartilhar): string {
  return [
    remedio && `${remedio}`,
    capitalizarNome(ubs.nome),
    ubs.endereco,
    ubs.telefone && `Telefone: ${ubs.telefone}`,
    ubs.horario && `Horário: ${ubs.horario}`,
    `Como chegar: ${linkGoogleMaps(ubs)}`,
    remedio && `Estoque de ${atualizacao} (SES-DF). Ligue antes de ir.`,
  ]
    .filter(Boolean)
    .join("\n");
}
