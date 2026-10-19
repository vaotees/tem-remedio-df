import type { PropsMapaPostos } from "@/postos/mapa";

/**
 * Na web o react-native-maps não funciona: a tela de postos não oferece o mapa e mostra só a lista,
 * com um aviso discreto. Este arquivo existe para o Metro nunca carregar o react-native-maps na web.
 */
export const MAPA_DISPONIVEL = false;

export function MapaPostos(_: PropsMapaPostos) {
  return null;
}
