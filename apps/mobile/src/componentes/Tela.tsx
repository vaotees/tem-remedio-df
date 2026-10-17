import type { ReactNode } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { espaco, useTema } from "@/tema";

/** Fundo, margens e rolagem padrão de uma tela. A barra de abas cuida da margem de baixo. */
export function Tela({ children }: { children: ReactNode }) {
  const { cores } = useTema();
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[estilos.area, { backgroundColor: cores.fundo }]}>
      <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1 },
  conteudo: { padding: espaco.md, gap: espaco.md, flexGrow: 1 },
});
