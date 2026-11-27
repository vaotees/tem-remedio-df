import { View } from "react-native";
import { interpretarHorario, situacaoHorario } from "@/postos/horario";
import { useTema } from "@/tema";
import { Icone } from "./Icone";
import { estilosSelo } from "./SeloEstoque";
import { Texto } from "./Texto";

/**
 * "Aberto agora, fecha às 17h" / "Fechado agora, abre amanhã às 07h".
 * Selo neutro, com contorno, relógio e letra mais leve: não se confunde com o verde do estoque nem compete com ele.
 * Quando o horário do cadastro não dá para entender, não mostra nada (melhor que errar).
 */
export function SeloHorario({ horario, agora = new Date(), sobreFaixa }: { horario: string | null; agora?: Date; sobreFaixa?: boolean }) {
  const { cores } = useTema();
  const faixas = interpretarHorario(horario);
  if (!faixas) return null;

  const { aberto, texto } = situacaoHorario(faixas, agora);
  const cor = sobreFaixa ? cores.textoFaixa : cores.textoSecundario;
  return (
    <View
      style={[
        estilosSelo.selo,
        { borderWidth: 1.5, borderColor: sobreFaixa ? cores.bordaVidro : cores.divisoria },
        sobreFaixa && { backgroundColor: cores.vidroFaixa },
      ]}
      accessible
      accessibilityLabel={texto}
    >
      <Icone name={aberto ? "time-outline" : "moon-outline"} size={20} color={cor} />
      <Texto variante="legenda" peso="medio" cor={cor} style={estilosSelo.texto}>
        {texto}
      </Texto>
    </View>
  );
}
