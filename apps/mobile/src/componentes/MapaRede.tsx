import type { Ubs } from "@tem-remedio/shared";
import { useMemo, useRef, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { capitalizarNome } from "@/busca/remedios";
import { distanciaKm, formatarDistancia, type Coordenadas } from "@/postos/distancia";
import { ALVO_MINIMO, espaco, RAIO_CARTAO, sombraCartao, useTema } from "@/tema";
import { Botao } from "./Botao";
import { Icone } from "./Icone";
import { SeloHorario } from "./SeloHorario";
import { Texto } from "./Texto";

/** No celular o mapa existe. Na web, não (ver `MapaRede.web.tsx`). */
export const MAPA_REDE_DISPONIVEL = true;

export interface PropsMapaRede {
  postos: Ubs[];
  /** Localização da pessoa, quando ela deixou usar: o mapa começa perto dela e o cartão diz a distância. */
  origem: Coordenadas | null;
  aoAbrir: (ubs: Ubs) => void;
}

/** Azul da marca nos dois temas: no Android o mapa continua claro no tema escuro. Ícone branco: 6,6:1. */
const PINO_REDE = "#0B5FA5";

/** O DF inteiro na primeira vista. */
const DF = { latitude: -15.8, longitude: -47.92, latitudeDelta: 0.55, longitudeDelta: 0.7 };

const chave = (u: Ubs) => `${u.cnes}-${u.farmacia}`;

/**
 * Todas as farmácias de UBS num mapa, sem remédio escolhido: para saber onde fica o posto mais perto
 * e se está aberto. Os pinos são da cor do app (não do semáforo: aqui não há estoque).
 */
export function MapaRede({ postos, origem, aoAbrir }: PropsMapaRede) {
  const { cores, escuro } = useTema();
  const { height } = useWindowDimensions();
  const mapa = useRef<MapView>(null);
  const ordenados = useMemo(
    () => (origem ? [...postos].sort((a, b) => distanciaKm(origem, a) - distanciaKm(origem, b)) : postos),
    [postos, origem],
  );
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const atual = ordenados.find((u) => chave(u) === escolhido) ?? (origem ? (ordenados[0] ?? null) : null);
  const inicial = origem ? { latitude: origem.lat, longitude: origem.lng, latitudeDelta: 0.08, longitudeDelta: 0.08 } : DF;

  const mostrar = (u: Ubs) => {
    setEscolhido(chave(u));
    mapa.current?.animateCamera({ center: { latitude: u.lat, longitude: u.lng } }, { duration: 400 });
  };

  return (
    <View style={estilos.conteudo}>
      <View style={[estilos.moldura, { height: Math.round(Math.min(520, Math.max(300, height * 0.55))), borderColor: cores.divisoria }]}>
        <MapView
          ref={mapa}
          testID="mapa-rede"
          accessibilityLabel={`Mapa com ${postos.length} farmácias de UBS do DF`}
          style={StyleSheet.absoluteFill}
          initialRegion={inicial}
          showsUserLocation={!!origem}
          showsPointsOfInterests={false}
          showsCompass={false}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
          userInterfaceStyle={escuro ? "dark" : "light"}
        >
          {postos.map((u) => {
            const eh = atual !== null && chave(u) === chave(atual);
            return (
              <Marker
                key={chave(u)}
                coordinate={{ latitude: u.lat, longitude: u.lng }}
                anchor={{ x: 0.5, y: 0.5 }}
                onPress={() => mostrar(u)}
                zIndex={eh ? 2 : 1}
                tracksViewChanges={false}
                accessibilityLabel={capitalizarNome(u.nome)}
                testID={`pino-rede-${u.cnes}`}
              >
                <View style={estilos.alvo}>
                  <View
                    style={[
                      estilos.pino,
                      {
                        width: eh ? 34 : 22,
                        height: eh ? 34 : 22,
                        borderRadius: 17,
                        backgroundColor: PINO_REDE,
                        borderColor: cores.pino.borda,
                      },
                    ]}
                  >
                    <Icone name="medkit" size={eh ? 16 : 11} color={cores.pino.icone} />
                  </View>
                </View>
              </Marker>
            );
          })}
        </MapView>
      </View>

      {atual ? (
        <View style={[estilos.cartao, { backgroundColor: cores.superficie }, sombraCartao(cores)]}>
          <Texto variante="legenda" secundario>
            {origem && chave(atual) === chave(ordenados[0]!) ? "O mais perto de você" : "Posto escolhido"}
          </Texto>
          <Texto variante="destaque">{capitalizarNome(atual.nome)}</Texto>
          <Texto secundario>
            {atual.ra}
            {origem ? ` · ${formatarDistancia(distanciaKm(origem, atual))}` : ""}
          </Texto>
          <SeloHorario horario={atual.horario} />
          <Botao titulo="Ver posto" icone="arrow-forward-circle" dica="Mostra endereço, telefone e como chegar" onPress={() => aoAbrir(atual)} />
        </View>
      ) : (
        <Texto secundario>Toque num pino para ver o posto. Para ver mais perto, aproxime o mapa com dois dedos.</Texto>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  conteudo: { gap: espaco.md },
  moldura: { borderRadius: RAIO_CARTAO, borderWidth: 1, overflow: "hidden" },
  alvo: { width: ALVO_MINIMO, height: ALVO_MINIMO, alignItems: "center", justifyContent: "center" },
  pino: { alignItems: "center", justifyContent: "center", borderWidth: 2 },
  cartao: { borderRadius: RAIO_CARTAO, padding: espaco.md, gap: espaco.sm },
});
