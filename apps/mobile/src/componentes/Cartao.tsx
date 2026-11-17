import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { espaco, RAIO_CARTAO, sombraCartao, useTema } from "@/tema";

/** Cartão branco sobre o fundo azulado, com sombra suave (no tema escuro, borda). */
export function Cartao({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { cores } = useTema();
  return <View style={[estilos.cartao, { backgroundColor: cores.superficie }, sombraCartao(cores), style]}>{children}</View>;
}

const estilos = StyleSheet.create({
  cartao: { borderRadius: RAIO_CARTAO, padding: espaco.md, gap: espaco.sm },
});
