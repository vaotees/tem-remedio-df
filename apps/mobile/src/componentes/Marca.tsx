import { useId } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, Mask, Path, Rect } from "react-native-svg";
import { espaco, useTema } from "@/tema";
import { Texto } from "./Texto";

/** Desenho do símbolo (o mesmo de `assets/marca/`, gerado por `scripts/gerar-marca.mjs`). */
const CORTE = "M512 765.5 L833.4 382.5 A84 84 0 0 0 704.7 274.5 L383.3 657.5 A84 84 0 0 0 512 765.5 Z";
const HASTE_CURTA = "M212.9 624.2 L393.7 775.9 A84 84 0 0 0 501.7 647.2 L320.9 495.5 A84 84 0 0 0 212.9 624.2 Z";
const CAPSULA_BAIXO = "M537 474.4 L383.3 657.5 A84 84 0 0 0 512 765.5 L665.7 582.4 Z";
const CAPSULA_CIMA = "M679.8 565.6 L833.4 382.5 A84 84 0 0 0 704.7 274.5 L551.1 457.6 Z";

interface PropsSimbolo {
  tamanho: number;
  /** Cor da haste e da metade de baixo da cápsula. */
  cor: string;
  /** Cor da metade de cima da cápsula. */
  corCapsula: string;
}

/** O símbolo: um visto feito de cápsula. É marca, não indicador: nunca ao lado do semáforo. */
export function Simbolo({ tamanho, cor, corCapsula }: PropsSimbolo) {
  const id = `corte-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    // Escondido do leitor de tela numa View: na web o Svg passaria essas props para o DOM.
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={tamanho} height={tamanho} viewBox="0 0 1024 1024">
        <Defs>
          <Mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">
            <Rect width="1024" height="1024" fill="#FFFFFF" />
            <Path d={CORTE} fill="#000000" stroke="#000000" strokeWidth={60} />
          </Mask>
        </Defs>
        <Path d={HASTE_CURTA} fill={cor} mask={`url(#${id})`} />
        <Path d={CAPSULA_BAIXO} fill={cor} />
        <Path d={CAPSULA_CIMA} fill={corCapsula} />
      </Svg>
    </View>
  );
}

/**
 * Assinatura: símbolo + "Tem Remédio DF". Na faixa azul do Início, em branco e menta; no fundo da tela,
 * nas cores da marca. O leitor de tela lê o nome do app uma vez só.
 */
export function Assinatura({ sobreFaixa }: { sobreFaixa?: boolean }) {
  const { cores, escuro } = useTema();
  const cor = sobreFaixa ? (escuro ? cores.marca.azul : cores.textoFaixa) : cores.marca.azul;
  const corCapsula = sobreFaixa ? cores.marca.menta : cores.marca.verde;
  const corTexto = sobreFaixa ? cores.textoFaixa : cores.texto;
  return (
    <View style={estilos.assinatura} accessible accessibilityRole="header" accessibilityLabel="Tem Remédio DF">
      <Simbolo tamanho={40} cor={cor} corCapsula={corCapsula} />
      <Texto variante="destaque" peso="extra" cor={corTexto} style={estilos.nome}>
        Tem Remédio <Texto variante="destaque" peso="extra" cor={sobreFaixa ? cores.marca.menta : cores.primaria}>DF</Texto>
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  assinatura: { flexDirection: "row", alignItems: "center", gap: espaco.xs, flexShrink: 1 },
  nome: { flexShrink: 1, letterSpacing: -0.2 },
});
