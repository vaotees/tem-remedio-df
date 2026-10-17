import { Text, type TextProps } from "react-native";
import { fonte, useTema } from "@/tema";

type Variante = "titulo" | "subtitulo" | "corpo" | "destaque" | "legenda";

interface Props extends TextProps {
  variante?: Variante;
  secundario?: boolean;
  cor?: string;
}

const ESTILO: Record<Variante, { fontSize: number; fontWeight: "400" | "600" | "700" }> = {
  titulo: { fontSize: fonte.titulo, fontWeight: "700" },
  subtitulo: { fontSize: fonte.subtitulo, fontWeight: "700" },
  destaque: { fontSize: fonte.destaque, fontWeight: "600" },
  corpo: { fontSize: fonte.corpo, fontWeight: "400" },
  legenda: { fontSize: fonte.legenda, fontWeight: "400" },
};

/** Texto do app. Títulos são anunciados como cabeçalho pelo leitor de tela. */
export function Texto({ variante = "corpo", secundario, cor, style, ...props }: Props) {
  const { cores } = useTema();
  const { fontSize, fontWeight } = ESTILO[variante];
  const cabecalho = variante === "titulo" || variante === "subtitulo";
  return (
    <Text
      accessibilityRole={cabecalho ? "header" : undefined}
      style={[
        {
          fontSize,
          fontWeight,
          lineHeight: Math.round(fontSize * 1.4),
          color: cor ?? (secundario ? cores.textoSecundario : cores.texto),
        },
        style,
      ]}
      {...props}
    />
  );
}
