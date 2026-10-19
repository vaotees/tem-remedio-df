import type { Coordenadas } from "./distancia";
import type { Ordem, PostoComEstoque } from "./postos";
import { acharRegiao } from "./regioes";

/** O que a tela de postos passa para o mapa (no celular) ou para o substituto da web. */
export interface PropsMapaPostos {
  /** Os mesmos postos da lista, na mesma ordem. */
  postos: PostoComEstoque[];
  ordem: Ordem;
  aoAbrir: (posto: PostoComEstoque) => void;
}

export interface RegiaoMapa {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

/** O mapa abre mostrando os primeiros postos da lista; os outros aparecem ao afastar o mapa. */
export const POSTOS_NA_PRIMEIRA_VISTA = 5;

/** Centro aproximado do DF, se não houver ponto nenhum. */
const CENTRO_DF: Coordenadas = { lat: -15.79, lng: -47.88 };

/** Ponto de partida do mapa: a pessoa (GPS) ou o centro da região escolhida. */
export function pontoDePartida(ordem: Ordem): Coordenadas | null {
  if (ordem.por === "distancia") return ordem.origem;
  if (ordem.por === "regiao") return acharRegiao(ordem.ra);
  return null;
}

/**
 * Enquadra o ponto de partida e os primeiros postos, com folga nas bordas para nenhum pino ficar cortado.
 * Nunca mais perto que ~2 km de lado: com um posto só, ainda dá para ver as ruas em volta.
 */
export function enquadrar(postos: PostoComEstoque[], ordem: Ordem): RegiaoMapa {
  const partida = pontoDePartida(ordem);
  const pontos = [...(partida ? [partida] : []), ...postos.slice(0, POSTOS_NA_PRIMEIRA_VISTA).map((p) => p.ubs)];
  if (pontos.length === 0) pontos.push(CENTRO_DF);

  const lats = pontos.map((p) => p.lat);
  const lngs = pontos.map((p) => p.lng);
  const [latMin, latMax, lngMin, lngMax] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  return {
    latitude: (latMin + latMax) / 2,
    longitude: (lngMin + lngMax) / 2,
    latitudeDelta: Math.max((latMax - latMin) * 1.5, 0.02),
    longitudeDelta: Math.max((lngMax - lngMin) * 1.5, 0.02),
  };
}

/** "Mapa com 12 postos que têm hoje." */
export function resumoDoMapa(quantos: number): string {
  return quantos === 1 ? "Mapa com 1 posto que tem hoje." : `Mapa com ${quantos} postos que têm hoje.`;
}
