import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import { ALVO_MINIMO, espaco, useTema } from "@/tema";
import { Icone } from "./Icone";
import { Texto } from "./Texto";

/** "Voltar" grande, escrito por extenso: a seta sozinha no canto é difícil de achar e de acertar. */
export function Voltar() {
  const { cores } = useTema();
  const router = useRouter();

  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.navigate("/"))}
      accessibilityRole="button"
      accessibilityLabel="Voltar"
      hitSlop={8}
      style={({ pressed }) => [estilos.botao, pressed && { opacity: 0.6 }]}
    >
      <Icone name="chevron-back" size={28} color={cores.primaria} />
      <Texto variante="destaque" cor={cores.primaria} style={estilos.texto}>
        Voltar
      </Texto>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  botao: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: espaco.xs,
    minHeight: ALVO_MINIMO,
    paddingRight: espaco.md,
    maxWidth: "100%",
  },
  texto: { flexShrink: 1 },
});
