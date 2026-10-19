import { nivelEstoque, TEXTO_NIVEL, type NivelEstoque } from "@tem-remedio/shared";
import { StyleSheet, View } from "react-native";
import { espaco, useTema } from "@/tema";
import { Icone, type NomeIcone } from "./Icone";
import { Texto } from "./Texto";

/** Ícone de cada nível do semáforo (no selo e nos pinos do mapa). */
export const ICONE_NIVEL: Record<NivelEstoque, NomeIcone> = {
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
      <Icone name={ICONE_NIVEL[nivel]} size={22} color={texto} />
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
    maxWidth: "100%",
  },
  texto: { fontWeight: "600", flexShrink: 1 },
});
