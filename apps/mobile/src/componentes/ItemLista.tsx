import type { ReactNode, Ref } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ALVO_MINIMO, espaco, raio, useTema } from "@/tema";
import { Icone } from "./Icone";

interface Props {
  onPress: () => void;
  /** O que o leitor de tela fala: o item inteiro é um botão só. */
  rotulo: string;
  dica?: string;
  children: ReactNode;
  /** Para levar o foco do leitor de tela até o item (ex.: o primeiro posto novo em "Mostrar mais postos"). */
  ref?: Ref<View>;
}

/** Cartão tocável inteiro (não só o título), com borda visível e seta indicando que abre outra tela. */
export function ItemLista({ onPress, rotulo, dica, children, ref }: Props) {
  const { cores } = useTema();
  return (
    <Pressable
      ref={ref}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityHint={dica}
      style={({ pressed }) => [
        estilos.item,
        { backgroundColor: cores.superficie, borderColor: cores.borda },
        pressed && { opacity: 0.75 },
      ]}
    >
      <View style={estilos.conteudo}>{children}</View>
      <Icone name="chevron-forward" size={28} color={cores.primaria} />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.sm,
    minHeight: ALVO_MINIMO,
    borderWidth: 1,
    borderRadius: raio,
    padding: espaco.md,
  },
  conteudo: { flex: 1, gap: espaco.xs },
});
