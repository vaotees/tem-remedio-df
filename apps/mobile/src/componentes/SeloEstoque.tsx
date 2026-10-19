import Ionicons from "@expo/vector-icons/Ionicons";
import { nivelEstoque, TEXTO_NIVEL, type NivelEstoque } from "@tem-remedio/shared";
import type { ComponentProps } from "react";
import { StyleSheet, View } from "react-native";
import { espaco, useTema } from "@/tema";
import { Texto } from "./Texto";

/** Ícone de cada nível do semáforo (no selo e nos pinos do mapa). */
export const ICONE_NIVEL: Record<NivelEstoque, ComponentProps<typeof Ionicons>["name"]> = {
  alto: "checkmark-circle",
  baixo: "alert-circle",
  critico: "warning",
  sem_consumo: "checkmark-circle-outline",
};

/**
 * Semáforo do estoque. A cor nunca vem sozinha: sempre ícone + texto,
 * e o leitor de tela lê o texto.
 */
export function SeloEstoque({ dias }: { dias: number | null }) {
  const { cores } = useTema();
  const nivel = nivelEstoque(dias);
  const { texto, fundo } = cores.semaforo[nivel];
  return (
    <View
      style={[estilos.selo, { backgroundColor: fundo }]}
      accessible
      accessibilityLabel={`Estoque: ${TEXTO_NIVEL[nivel]}`}
      testID={`selo-${nivel}`}
    >
      <Ionicons name={ICONE_NIVEL[nivel]} size={22} color={texto} />
      <Texto variante="legenda" cor={texto} style={estilos.texto}>
        {TEXTO_NIVEL[nivel]}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  selo: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: espaco.xs,
    paddingHorizontal: espaco.sm,
    paddingVertical: espaco.xs,
    borderRadius: 8,
  },
  texto: { fontWeight: "600" },
});
