import type { NivelEstoque, Ubs } from "@tem-remedio/shared";

/** Na web não há mapa (o react-native-maps não roda): o detalhe começa pelo nome do posto. */
export function MapaPosto(_: { ubs: Ubs; nivel: NivelEstoque | null }) {
  return null;
}
