import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";
import { interpretarHorario, situacaoHorario } from "@/postos/horario";
import { espaco, useTema } from "@/tema";
import { Texto } from "./Texto";

/**
 * "Aberto agora, fecha às 17h" / "Fechado agora, abre amanhã às 07h".
 * Quando o horário do cadastro não dá para entender, não mostra nada (melhor que errar).
 */
export function SeloHorario({ horario, agora = new Date() }: { horario: string | null; agora?: Date }) {
  const { cores } = useTema();
  const faixas = interpretarHorario(horario);
  if (!faixas) return null;

  const { aberto, texto } = situacaoHorario(faixas, agora);
  const par = aberto ? cores.aberto : cores.fechado;
  return (
    <View style={[estilos.selo, { backgroundColor: par.fundo }]} accessible accessibilityLabel={texto}>
      <Ionicons name={aberto ? "time" : "moon-outline"} size={22} color={par.texto} />
      <Texto variante="legenda" cor={par.texto} style={estilos.texto}>
        {texto}
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
