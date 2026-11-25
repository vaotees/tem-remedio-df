import type { ReactNode } from "react";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import { useTema } from "@/tema";

/** Largura do app no computador: a de um celular grande. */
export const LARGURA_WEB = 480;

/**
 * Na web, num computador, o app fica numa coluna centralizada da largura de um celular, em vez de
 * esticar na tela inteira (os cartões e botões foram pensados para o celular). No celular, e na web
 * numa tela estreita, não muda nada.
 */
export function MolduraWeb({ children }: { children: ReactNode }) {
  const { cores } = useTema();
  const { width } = useWindowDimensions();
  if (Platform.OS !== "web" || width <= LARGURA_WEB + 80) return <>{children}</>;
  return (
    <View style={[estilos.fora, { backgroundColor: cores.trilho }]}>
      <View style={[estilos.coluna, { backgroundColor: cores.fundo, borderColor: cores.divisoria }]}>{children}</View>
    </View>
  );
}

const estilos = StyleSheet.create({
  fora: { flex: 1, alignItems: "center" },
  coluna: {
    flex: 1,
    width: "100%",
    maxWidth: LARGURA_WEB,
    overflow: "hidden",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    shadowColor: "#0E1B2B",
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
});
