import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { espaco, raio, useTema } from "@/tema";

export function Cartao({ children }: { children: ReactNode }) {
  const { cores } = useTema();
  return (
    <View style={[estilos.cartao, { backgroundColor: cores.superficie, borderColor: cores.divisoria }]}>
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  cartao: { borderRadius: raio, borderWidth: 1, padding: espaco.md, gap: espaco.sm },
});
