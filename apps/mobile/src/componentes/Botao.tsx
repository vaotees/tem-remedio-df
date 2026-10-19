import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { ALVO_MINIMO, espaco, raio, useTema } from "@/tema";
import { Icone, type NomeIcone } from "./Icone";
import { Texto } from "./Texto";

interface Props {
  titulo: string;
  onPress: () => void;
  icone?: NomeIcone;
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
          icone && <Icone name={icone} size={24} color={corTexto} />
        )}
        <Texto variante="destaque" cor={corTexto} style={estilos.titulo}>
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
  // Com letra grande, o título quebra linha dentro do botão (sem isso, ele vaza para fora da tela).
  titulo: { flexShrink: 1, textAlign: "center" },
});
