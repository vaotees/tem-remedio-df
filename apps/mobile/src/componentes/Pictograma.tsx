import { normalizar } from "@tem-remedio/shared";
import { View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { useTema } from "@/tema";

export type Forma = "comprimido" | "liquido" | "injetavel" | "pomada" | "outro";

/** A forma do remédio, para o desenho ao lado do nome: ajuda a reconhecer de relance. */
export function tipoForma(forma: string | null): Forma {
  const f = normalizar(forma ?? "");
  if (/COMPRIM|CAPSULA|DRAGEA|GOMA/.test(f)) return "comprimido";
  if (/INJET/.test(f)) return "injetavel";
  if (/SOLUCAO|SUSPENSAO|XAROPE|GOTAS|COLIRIO|ELIXIR/.test(f)) return "liquido";
  if (/CREME|POMADA|GEL|LOCAO|XAMPU/.test(f)) return "pomada";
  return "outro";
}

/** Desenhos de 24×24, em traço, como os ícones do app. */
function Desenho({ forma, cor }: { forma: Forma; cor: string }) {
  const traco = { stroke: cor, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  switch (forma) {
    case "comprimido":
      return (
        <>
          <Rect x={3} y={8} width={18} height={8} rx={4} transform="rotate(-40 12 12)" {...traco} />
          <Path d="M9.4 8.9 14.6 15.1" {...traco} />
        </>
      );
    case "liquido":
      return <Path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z" {...traco} />;
    case "injetavel":
      return <Path d="M18 2l4 4M20 4l-4 4M15 5l4 4M17 7l-9 9-3-3 9-9M8 16l-5 5M10.5 10.5 12 12M8.5 12.5 10 14" {...traco} />;
    case "pomada":
      return <Path d="M8 3h8l-1 3H9zM9 6h6l1 15H8zM10 11h4" {...traco} />;
    default:
      return (
        <>
          <Rect x={4} y={7} width={16} height={13} rx={3} {...traco} />
          <Path d="M9 7V5h6v2M12 10.5v6M9 13.5h6" {...traco} />
        </>
      );
  }
}

/**
 * Quadradinho azul-claro com o desenho da forma. É enfeite: o texto ao lado diz a forma.
 * Na faixa do alto (`sobreFaixa`), de vidro e com o desenho em branco.
 */
export function Pictograma({ forma, tamanho = 48, sobreFaixa }: { forma: string | null; tamanho?: number; sobreFaixa?: boolean }) {
  const { cores } = useTema();
  const desenho = Math.round(tamanho * 0.55);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: tamanho,
        height: tamanho,
        borderRadius: Math.round(tamanho * 0.32),
        backgroundColor: sobreFaixa ? cores.vidroFaixa : cores.primariaTinta,
        borderWidth: sobreFaixa ? 1.5 : 0,
        borderColor: cores.bordaVidro,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={desenho} height={desenho} viewBox="0 0 24 24">
        <Desenho forma={tipoForma(forma)} cor={sobreFaixa ? cores.textoFaixa : cores.textoTonal} />
      </Svg>
    </View>
  );
}
