import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { ALVO_MINIMO, espaco, raio, useTema } from "@/tema";
import { Texto } from "./Texto";

interface Props {
  titulo: string;
  onPress: () => void;
  icone?: ComponentProps<typeof Ionicons>["name"];
  variante?: "primario" | "secundario";
  carregando?: boolean;
  /** Texto extra para o leitor de tela, quando o título sozinho não basta. */
  dica?: string;
}

/** Botão grande (56 de altura mínima), com ícone opcional e estado de carregando. */
export function Botao({ titulo, onPress, icone, variante = "primario", carregando, dica }: Props) {
  const { cores } = useTema();
  const primario = variante === "primario";
  const corTexto = primario ? cores.textoSobrePrimaria : cores.primaria;

  return (
    <Pressable
      onPress={carregando ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityHint={dica}
      accessibilityState={{ busy: !!carregando }}
      style={({ pressed }) => [
        estilos.base,
        primario
          ? { backgroundColor: cores.primaria }
          : { backgroundColor: cores.fundo, borderColor: cores.primaria, borderWidth: 2 },
        pressed && { opacity: 0.75 },
      ]}
    >
      <View style={estilos.conteudo}>
        {carregando ? (
          <ActivityIndicator color={corTexto} />
        ) : (
          icone && <Ionicons name={icone} size={24} color={corTexto} accessibilityElementsHidden importantForAccessibility="no" />
        )}
        <Texto variante="destaque" cor={corTexto}>
          {titulo}
        </Texto>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: ALVO_MINIMO,
    borderRadius: raio,
    paddingHorizontal: espaco.lg,
    paddingVertical: espaco.sm,
    justifyContent: "center",
  },
  conteudo: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: espaco.sm },
});
