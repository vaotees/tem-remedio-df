import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";
import { espaco, raio, useTema } from "@/tema";
import { diasDesde, formatarAtualizacao } from "@/util/datas";
import { Texto } from "./Texto";

interface Props {
  atualizadoEm: string;
  procurandoNovos?: boolean;
  agora?: Date;
}

/** "Dados de hoje às 00h16 · SES-DF". Com mais de 2 dias, vira aviso para ligar antes. */
export function FaixaAtualizacao({ atualizadoEm, procurandoNovos, agora = new Date() }: Props) {
  const { cores } = useTema();
  const antigo = diasDesde(atualizadoEm, agora) > 2;
  const cor = antigo ? cores.aviso.texto : cores.textoSecundario;
  const texto = `Dados de ${formatarAtualizacao(atualizadoEm, agora)} · SES-DF`;

  return (
    <View
      style={[estilos.faixa, antigo && { backgroundColor: cores.aviso.fundo }]}
      accessible
      accessibilityLabel={antigo ? `${texto}. Os dados podem estar desatualizados, ligue para a UBS antes de ir.` : texto}
    >
      <Ionicons name={antigo ? "warning" : "time-outline"} size={20} color={cor} />
      <View style={estilos.textos}>
        <Texto variante="legenda" cor={cor}>
          {texto}
        </Texto>
        {antigo && (
          <Texto variante="legenda" cor={cor}>
            Podem estar desatualizados. Ligue antes de ir.
          </Texto>
        )}
        {procurandoNovos && (
          <Texto variante="legenda" secundario>
            Procurando dados novos…
          </Texto>
        )}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  faixa: { flexDirection: "row", gap: espaco.sm, alignItems: "flex-start", padding: espaco.sm, borderRadius: raio },
  textos: { flex: 1 },
});
