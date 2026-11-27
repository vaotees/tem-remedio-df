import { Pressable, StyleSheet } from "react-native";
import { ALVO_MINIMO, espaco, RAIO_CAPSULA, useTema } from "@/tema";
import { Icone } from "./Icone";
import { Texto } from "./Texto";

interface Props {
  titulo: string;
  ligado: boolean;
  aoMudar: (ligado: boolean) => void;
}

/**
 * Filtro em cápsula ("Aberto agora", "Tem bastante"): um toque liga, outro desliga. Ligado, fica azul
 * com o visto; o leitor de tela diz se está escolhido. Do tamanho do texto, e quebra linha com letra grande.
 */
export function Filtro({ titulo, ligado, aoMudar }: Props) {
  const { cores } = useTema();
  const cor = ligado ? cores.textoSobrePrimaria : cores.primaria;
  return (
    <Pressable
      onPress={() => aoMudar(!ligado)}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ selected: ligado }}
      accessibilityHint={ligado ? "Toque para mostrar todos os postos" : "Toque para mostrar só estes postos"}
      style={({ pressed }) => [
        estilos.filtro,
        ligado
          ? { backgroundColor: cores.primaria, borderColor: cores.primaria }
          : { backgroundColor: cores.superficie, borderColor: cores.divisoria },
        pressed && { opacity: 0.75 },
      ]}
    >
      <Icone name={ligado ? "checkmark" : "add"} size={20} color={cor} />
      <Texto variante="legenda" peso="negrito" cor={cor} style={estilos.texto}>
        {titulo}
      </Texto>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  filtro: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: ALVO_MINIMO,
    paddingLeft: espaco.sm + 4,
    paddingRight: espaco.md,
    borderRadius: RAIO_CAPSULA,
    borderWidth: 1.5,
    flexShrink: 1,
  },
  texto: { flexShrink: 1 },
});
