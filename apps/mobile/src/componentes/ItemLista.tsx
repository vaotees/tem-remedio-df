import type { ReactNode, Ref } from "react";
import { Animated, Pressable, StyleSheet, View, type HostInstance } from "react-native";
import { ALVO_MINIMO, espaco, RAIO_CARTAO, sombraCartao, useTema } from "@/tema";
import { Icone } from "./Icone";
import { useToque } from "./Movimento";

interface Props {
  onPress: () => void;
  /** O que o leitor de tela fala: o item inteiro é um botão só. */
  rotulo: string;
  dica?: string;
  children: ReactNode;
  /** Para levar o foco do leitor de tela até o item (ex.: o primeiro posto novo em "Mostrar mais postos"). */
  ref?: Ref<HostInstance>;
  /** Sem a seta à direita, quando o cartão já tem um "Ver ..." escrito embaixo. */
  semSeta?: boolean;
  /** Filete colorido na borda esquerda (ex.: a cor do semáforo do posto). Nunca sozinho: o selo diz em texto. */
  filete?: string;
}

/**
 * Cartão tocável inteiro (não só o título), branco e com sombra, e seta indicando que abre outra tela.
 * Afunda um pouco ao toque e volta com uma mola.
 */
export function ItemLista({ onPress, rotulo, dica, children, ref, semSeta, filete }: Props) {
  const { cores } = useTema();
  const toque = useToque();
  return (
    <Animated.View
      style={[
        estilos.item,
        { backgroundColor: cores.superficie },
        sombraCartao(cores),
        filete ? { borderLeftWidth: 6, borderLeftColor: filete } : null,
        toque.estilo,
      ]}
    >
      <Pressable
        ref={ref}
        onPress={onPress}
        onPressIn={toque.aoEncostar}
        onPressOut={toque.aoSoltar}
        accessibilityRole="button"
        accessibilityLabel={rotulo}
        accessibilityHint={dica}
        style={({ pressed }) => [estilos.toque, pressed && { opacity: 0.85 }]}
      >
        <View style={estilos.conteudo}>{children}</View>
        {semSeta ? null : (
          <View style={[estilos.seta, { backgroundColor: cores.primariaTinta }]}>
            <Icone name="chevron-forward" size={22} color={cores.textoTonal} />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  item: { borderRadius: RAIO_CARTAO },
  toque: {
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.sm,
    minHeight: ALVO_MINIMO,
    padding: espaco.md,
  },
  conteudo: { flex: 1, gap: espaco.sm },
  seta: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
});
