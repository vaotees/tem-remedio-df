import { useId, type ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";
import { ALVO_MINIMO, espaco, RAIO_CAPSULA, useTema } from "@/tema";
import { Icone, type NomeIcone } from "./Icone";
import { Simbolo } from "./Marca";
import { Texto } from "./Texto";

/** Raio dos cantos de baixo da faixa: a faixa "abraça" o conteúdo, como uma folha. */
export const RAIO_FAIXA = 32;

/**
 * O degradê da marca, com dois brilhos suaves (menta em cima, branco embaixo) e o símbolo grande e quase
 * transparente no canto. É enfeite: escondido do leitor de tela e sem receber toques.
 */
export function FundoDegrade({ simbolo = true }: { simbolo?: boolean }) {
  const { cores } = useTema();
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    // Camada que recorta o símbolo (ele passa da borda). Sem ela, na web, focar a busca faz o navegador
    // rolar a faixa para o lado.
    <View style={estilos.recorte} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={`fundo${id}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={cores.degrade[0]} />
            <Stop offset="0.55" stopColor={cores.degrade[1]} />
            <Stop offset="1" stopColor={cores.degrade[2]} />
          </LinearGradient>
          <RadialGradient id={`menta${id}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={cores.brilho} stopOpacity={0.38} />
            <Stop offset="1" stopColor={cores.brilho} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={`luz${id}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={cores.textoFaixa} stopOpacity={0.16} />
            <Stop offset="1" stopColor={cores.textoFaixa} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill={`url(#fundo${id})`} />
        <Circle cx="96" cy="8" r="42" fill={`url(#menta${id})`} />
        <Circle cx="0" cy="100" r="46" fill={`url(#luz${id})`} />
      </Svg>
      {simbolo ? (
        <View style={estilos.simbolo}>
          <Simbolo tamanho={260} cor={cores.textoFaixa} corCapsula={cores.textoFaixa} />
        </View>
      ) : null}
    </View>
  );
}

interface PropsFaixa {
  /** Linha de cima: Voltar, a marca, botões de vidro. */
  topo?: ReactNode;
  children?: ReactNode;
  /** Espaço a mais embaixo, para o primeiro cartão da tela subir por cima da faixa. */
  comCartaoPorCima?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * A faixa do alto de todas as telas: o degradê da marca atrás do relógio do celular, com os cantos de
 * baixo arredondados. Dá identidade ao app e separa o "onde estou" do conteúdo.
 */
export function Faixa({ topo, children, comCartaoPorCima, style }: PropsFaixa) {
  const { top } = useSafeAreaInsets();
  return (
    <View style={[estilos.faixa, { paddingTop: top + espaco.sm }, comCartaoPorCima && estilos.porCima, style]}>
      <FundoDegrade />
      {topo ? <View style={estilos.topo}>{topo}</View> : null}
      {children}
    </View>
  );
}

/** Título e linha de apoio em branco, sobre a faixa. */
export function TituloFaixa({ titulo, subtitulo }: { titulo: string; subtitulo?: string | null }) {
  const { cores } = useTema();
  return (
    <View style={estilos.titulo}>
      <Texto variante="titulo" cor={cores.textoFaixa}>
        {titulo}
      </Texto>
      {subtitulo ? (
        <Texto cor={cores.textoFaixaSecundario} peso="medio">
          {subtitulo}
        </Texto>
      ) : null}
    </View>
  );
}

interface PropsVidro {
  onPress: () => void;
  icone: NomeIcone;
  /** Sem título: botão redondo só com o ícone (o rótulo vai para o leitor de tela). */
  titulo?: string;
  rotulo: string;
  dica?: string;
  /** Escolhido (ex.: "Guardado"): fundo branco, ícone azul. */
  ligado?: boolean;
}

/** Botão de vidro sobre a faixa: fundo translúcido e contorno claro, do tamanho do dedo. */
export function BotaoVidro({ onPress, icone, titulo, rotulo, dica, ligado }: PropsVidro) {
  const { cores } = useTema();
  const cor = ligado ? cores.primaria : cores.textoFaixa;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityHint={dica}
      hitSlop={6}
      style={({ pressed }) => [
        estilos.vidro,
        titulo ? estilos.vidroComTitulo : estilos.vidroRedondo,
        { backgroundColor: ligado ? cores.textoFaixa : cores.vidroFaixa, borderColor: ligado ? cores.textoFaixa : cores.bordaVidro },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Icone name={icone} size={24} color={cor} />
      {titulo ? (
        <Texto variante="legenda" peso="negrito" cor={cor} style={estilos.textoVidro}>
          {titulo}
        </Texto>
      ) : null}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  faixa: {
    paddingHorizontal: espaco.md,
    paddingBottom: espaco.lg,
    gap: espaco.sm,
    overflow: "hidden",
    borderBottomLeftRadius: RAIO_FAIXA,
    borderBottomRightRadius: RAIO_FAIXA,
  },
  porCima: { paddingBottom: espaco.xl + espaco.lg },
  recorte: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, overflow: "hidden" },
  simbolo: { position: "absolute", right: -90, top: -30, opacity: 0.07 },
  topo: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: espaco.sm },
  titulo: { gap: 2 },
  vidro: { minHeight: ALVO_MINIMO, borderWidth: 1.5, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  vidroRedondo: { width: ALVO_MINIMO, borderRadius: RAIO_CAPSULA },
  vidroComTitulo: { borderRadius: RAIO_CAPSULA, paddingLeft: espaco.sm + 4, paddingRight: espaco.md, flexShrink: 1 },
  textoVidro: { flexShrink: 1 },
});
