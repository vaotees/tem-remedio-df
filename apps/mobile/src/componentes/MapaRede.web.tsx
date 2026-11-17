import type { PropsMapaRede } from "./MapaRede";

/**
 * Na web o react-native-maps não funciona: a aba Mapa explica isso e mostra os postos mais perto em lista.
 * Este arquivo existe para o Metro nunca carregar o react-native-maps na web.
 */
export const MAPA_REDE_DISPONIVEL = false;

export function MapaRede(_: PropsMapaRede) {
  return null;
}
