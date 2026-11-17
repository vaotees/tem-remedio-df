import { nivelEstoque, TEXTO_NIVEL, type NivelEstoque } from "@tem-remedio/shared";
import { StyleSheet, View } from "react-native";
import { espaco, RAIO_CAPSULA, useTema } from "@/tema";
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
 * Semáforo do estoque, em cápsula. A cor nunca vem sozinha: sempre ícone + texto,
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
      <Icone name={ICONE_NIVEL[nivel]} size={20} color={texto} />
      <Texto variante="legenda" peso="negrito" cor={texto} style={estilos.texto}>
        {TEXTO_NIVEL[nivel]}
      </Texto>
    </View>
  );
}

export const estilosSelo = StyleSheet.create({
  selo: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingLeft: espaco.sm,
    paddingRight: espaco.md - 4,
    paddingVertical: 5,
    borderRadius: RAIO_CAPSULA,
    maxWidth: "100%",
  },
  texto: { flexShrink: 1 },
});

const estilos = estilosSelo;
