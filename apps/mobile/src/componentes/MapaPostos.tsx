import Ionicons from "@expo/vector-icons/Ionicons";
import { nivelEstoque, TEXTO_NIVEL, type NivelEstoque } from "@tem-remedio/shared";
import { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, StyleSheet, useWindowDimensions, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { descreverPosto } from "@/postos/descricao";
import { enquadrar, resumoDoMapa, type PropsMapaPostos } from "@/postos/mapa";
import type { PostoComEstoque } from "@/postos/postos";
import { ALVO_MINIMO, espaco, raio, useTema } from "@/tema";
import { Botao } from "./Botao";
import { ICONE_NIVEL, SeloEstoque } from "./SeloEstoque";
import { SeloHorario } from "./SeloHorario";
import { Texto } from "./Texto";

/** No celular o mapa existe. Na web, não (ver `MapaPostos.web.tsx`): a tela mostra só a lista. */
export const MAPA_DISPONIVEL = true;

const chaveDoPosto = (p: PostoComEstoque) => `${p.ubs.cnes}-${p.ubs.farmacia}`;

/** Ordem da legenda: do melhor para o pior, e por último o "Tem" sem consumo registrado. */
const NIVEIS: NivelEstoque[] = ["alto", "baixo", "critico", "sem_consumo"];

/**
 * Mapa com os mesmos postos da lista. Os pinos têm a cor e o ícone do semáforo; tocar num pino
 * mostra o posto no cartão embaixo do mapa (com o texto do estoque e "Ver posto").
 * O cartão começa no primeiro da lista (o mais perto) e "Ver o próximo" anda pela lista sem
 * precisar acertar o pino: mais fácil para quem treme a mão e para quem usa leitor de tela.
 */
export function MapaPostos({ postos, ordem, aoAbrir }: PropsMapaPostos) {
  const { cores, escuro } = useTema();
  const { height } = useWindowDimensions();
  const mapa = useRef<MapView>(null);
  const [chave, setChave] = useState<string | null>(null);

  const pertoDeVoce = ordem.por === "distancia";
  const regiaoInicial = useMemo(() => enquadrar(postos, ordem), [postos, ordem]);
  const resumo = resumoDoMapa(postos.length);
  const niveis = NIVEIS.filter((n) => postos.some((p) => nivelEstoque(p.dias) === n));
  // Se a lista mudar (dados novos), o posto escolhido some e o cartão volta ao primeiro.
  const atual = Math.max(0, postos.findIndex((p) => chaveDoPosto(p) === chave));
  const posto = postos[atual];

  // Assim que o mapa aparece, o leitor de tela avisa quantos postos há nele.
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      `${resumo} Embaixo do mapa, o ${pertoDeVoce ? "mais perto de você" : "primeiro da lista"}.`,
    );
  }, [resumo, pertoDeVoce]);

  if (!posto) return null;

  const mostrar = (n: number, anunciar: boolean) => {
    const p = postos[n];
    if (!p) return;
    setChave(chaveDoPosto(p));
    mapa.current?.animateCamera({ center: { latitude: p.ubs.lat, longitude: p.ubs.lng } }, { duration: 400 });
    if (anunciar) AccessibilityInfo.announceForAccessibility(descreverPosto(p).rotulo);
  };

  return (
    <View style={estilos.conteudo}>
      <Texto secundario>
        {postos.length === 1
          ? "Toque no pino para ver o posto."
          : "Toque num pino para ver o posto. Para ver mais postos, afaste o mapa com dois dedos."}
      </Texto>
      <View
        style={[
          estilos.moldura,
          { height: Math.round(Math.min(460, Math.max(280, height * 0.5))), borderColor: cores.borda },
        ]}
      >
        <MapView
          ref={mapa}
          testID="mapa"
          accessibilityLabel={resumo}
          style={StyleSheet.absoluteFill}
          initialRegion={regiaoInicial}
          showsUserLocation={pertoDeVoce}
          showsPointsOfInterests={false}
          showsCompass={false}
          rotateEnabled={false}
          pitchEnabled={false}
          // Android: sem a barrinha que abre o Google Maps (o "Como chegar" do posto já pergunta o app).
          toolbarEnabled={false}
          userInterfaceStyle={escuro ? "dark" : "light"}
        >
          {postos.map((p, n) => (
            <PinoNoMapa
              key={chaveDoPosto(p)}
              posto={p}
              escolhido={n === atual}
              // O escolhido por cima; depois, os mais perto por cima dos mais longe.
              zIndex={n === atual ? postos.length + 1 : postos.length - n}
              aoTocar={() => mostrar(n, false)}
            />
          ))}
        </MapView>
      </View>

      <View style={estilos.legenda}>
        {niveis.map((nivel) => (
          <View key={nivel} style={estilos.itemLegenda}>
            <Pino nivel={nivel} tamanho={28} />
            <Texto variante="legenda">{TEXTO_NIVEL[nivel]}</Texto>
          </View>
        ))}
      </View>

      <CartaoDoPosto
        posto={posto}
        posicao={atual}
        total={postos.length}
        pertoDeVoce={pertoDeVoce}
        aoAbrir={() => aoAbrir(posto)}
        aoVerProximo={() => mostrar((atual + 1) % postos.length, true)}
      />
    </View>
  );
}

interface PropsPinoNoMapa {
  posto: PostoComEstoque;
  escolhido: boolean;
  zIndex: number;
  aoTocar: () => void;
}

function PinoNoMapa({ posto, escolhido, zIndex, aoTocar }: PropsPinoNoMapa) {
  // No Android o pino é uma "foto" da View: ela é refeita por meio segundo quando o pino muda
  // (para o ícone aparecer) e depois congelada, senão o mapa fica lento com muitos pinos.
  const [desenhado, setDesenhado] = useState<boolean | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setDesenhado(escolhido), 500);
    return () => clearTimeout(t);
  }, [escolhido]);

  const nivel = nivelEstoque(posto.dias);
  return (
    <Marker
      coordinate={{ latitude: posto.ubs.lat, longitude: posto.ubs.lng }}
      anchor={{ x: 0.5, y: 0.5 }}
      onPress={aoTocar}
      zIndex={zIndex}
      tracksViewChanges={desenhado !== escolhido}
      accessibilityLabel={`${descreverPosto(posto).nome}. Estoque: ${TEXTO_NIVEL[nivel]}`}
      testID={`pino-${posto.ubs.cnes}`}
    >
      {/* Área de toque de 56, maior que o desenho do pino. */}
      <View style={estilos.alvo}>
        <Pino nivel={nivel} tamanho={escolhido ? 52 : 38} />
      </View>
    </Marker>
  );
}

/** Bolinha com a cor e o ícone do semáforo (nunca só a cor). */
function Pino({ nivel, tamanho }: { nivel: NivelEstoque; tamanho: number }) {
  const { cores } = useTema();
  return (
    <View
      testID={`pino-${nivel}`}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[
        estilos.pino,
        {
          width: tamanho,
          height: tamanho,
          borderRadius: tamanho / 2,
          borderWidth: tamanho > 40 ? 4 : 3,
          backgroundColor: cores.pino.miolo[nivel],
          borderColor: cores.pino.borda,
        },
      ]}
    >
      <Ionicons name={ICONE_NIVEL[nivel]} size={Math.round(tamanho * 0.55)} color={cores.pino.icone} />
    </View>
  );
}

interface PropsCartao {
  posto: PostoComEstoque;
  posicao: number;
  total: number;
  pertoDeVoce: boolean;
  aoAbrir: () => void;
  aoVerProximo: () => void;
}

function CartaoDoPosto({ posto, posicao, total, pertoDeVoce, aoAbrir, aoVerProximo }: PropsCartao) {
  const { cores } = useTema();
  const { nome, onde } = descreverPosto(posto);
  const titulo = pertoDeVoce
    ? posicao === 0
      ? "O mais perto de você"
      : `${posicao + 1}º mais perto de você`
    : `Posto ${posicao + 1} de ${total}`;
  const proximo =
    posicao + 1 >= total ? "Voltar ao primeiro" : pertoDeVoce ? "Ver o próximo mais perto" : "Ver o próximo da lista";

  return (
    <View style={[estilos.cartao, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
      <Texto variante="legenda" secundario>
        {titulo}
      </Texto>
      <Texto variante="destaque">{nome}</Texto>
      <Texto secundario>{onde}</Texto>
      <SeloEstoque dias={posto.dias} />
      <SeloHorario horario={posto.ubs.horario} />
      <Botao titulo="Ver posto" icone="arrow-forward-circle" dica="Mostra endereço, telefone e como chegar" onPress={aoAbrir} />
      {total > 1 ? <Botao titulo={proximo} icone="play-forward" variante="secundario" onPress={aoVerProximo} /> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  conteudo: { gap: espaco.sm },
  moldura: { borderRadius: raio, borderWidth: 1, overflow: "hidden" },
  alvo: { width: ALVO_MINIMO, height: ALVO_MINIMO, alignItems: "center", justifyContent: "center" },
  pino: { alignItems: "center", justifyContent: "center" },
  legenda: { flexDirection: "row", flexWrap: "wrap", columnGap: espaco.md, rowGap: espaco.xs },
  itemLegenda: { flexDirection: "row", alignItems: "center", gap: espaco.xs },
  cartao: { borderRadius: raio, borderWidth: 1, padding: espaco.md, gap: espaco.sm },
});
