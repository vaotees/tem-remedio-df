import { Text, type TextProps } from "react-native";
import { familia, fonte, useTema, type Peso } from "@/tema";

type Variante = "titulo" | "subtitulo" | "corpo" | "destaque" | "legenda";

interface Props extends TextProps {
  variante?: Variante;
  secundario?: boolean;
  cor?: string;
  /** Troca o peso da variante (ex.: legenda em negrito nos selos). */
  peso?: Peso;
  /** Tamanho antes das escalas de letra, quando nenhuma variante serve (ex.: o número grande do resumo). */
  tamanho?: number;
}

const ESTILO: Record<Variante, { fontSize: number; peso: Peso }> = {
  titulo: { fontSize: fonte.titulo, peso: "extra" },
  subtitulo: { fontSize: fonte.subtitulo, peso: "extra" },
  destaque: { fontSize: fonte.destaque, peso: "negrito" },
  corpo: { fontSize: fonte.corpo, peso: "regular" },
  legenda: { fontSize: fonte.legenda, peso: "regular" },
};

/**
 * Texto do app, na fonte da marca. Títulos são anunciados como cabeçalho pelo leitor de tela.
 * O tamanho acompanha a letra do celular (o sistema multiplica) e a escolhida no Perfil.
 */
export function Texto({ variante = "corpo", secundario, cor, peso, tamanho, style, ...props }: Props) {
  const { cores, escalaLetra } = useTema();
  const base = ESTILO[variante];
  const fontSize = Math.round((tamanho ?? base.fontSize) * escalaLetra);
  const cabecalho = variante === "titulo" || variante === "subtitulo";
  return (
    <Text
      accessibilityRole={cabecalho ? "header" : undefined}
      style={[
        {
          fontSize,
          fontFamily: familia[peso ?? base.peso],
          lineHeight: Math.round(fontSize * (cabecalho ? 1.2 : 1.4)),
          color: cor ?? (secundario ? cores.textoSecundario : cores.texto),
        },
        style,
      ]}
      {...props}
    />
  );
}
