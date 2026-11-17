import type { ReactNode, Ref } from "react";
import { Pressable, StyleSheet, View, type HostInstance } from "react-native";
import { ALVO_MINIMO, espaco, RAIO_CARTAO, sombraCartao, useTema } from "@/tema";
import { Icone } from "./Icone";

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
}

/** Cartão tocável inteiro (não só o título), branco e com sombra, e seta indicando que abre outra tela. */
export function ItemLista({ onPress, rotulo, dica, children, ref, semSeta }: Props) {
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
        { backgroundColor: cores.superficie },
        sombraCartao(cores),
        pressed && { opacity: 0.75 },
      ]}
    >
      <View style={estilos.conteudo}>{children}</View>
      {semSeta ? null : <Icone name="chevron-forward" size={26} color={cores.primaria} />}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.sm,
    minHeight: ALVO_MINIMO,
    borderRadius: RAIO_CARTAO,
    padding: espaco.md,
  },
  conteudo: { flex: 1, gap: espaco.sm },
});
