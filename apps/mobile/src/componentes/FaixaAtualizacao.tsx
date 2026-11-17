import { StyleSheet, View } from "react-native";
import { espaco, RAIO_CARTAO, useTema } from "@/tema";
import { diasDesde, formatarAtualizacao } from "@/util/datas";
import { Icone } from "./Icone";
import { Texto } from "./Texto";

interface Props {
  atualizadoEm: string;
  procurandoNovos?: boolean;
  agora?: Date;
  /** No meio da tela (Início, Meus remédios), como um carimbo. */
  centro?: boolean;
}

/**
 * "Dados de hoje às 00h16 · SES-DF", como um carimbo discreto: um ponto verde quando o dado é recente.
 * Com mais de 2 dias, vira aviso para ligar antes.
 */
export function FaixaAtualizacao({ atualizadoEm, procurandoNovos, agora = new Date(), centro }: Props) {
  const { cores } = useTema();
  const antigo = diasDesde(atualizadoEm, agora) > 2;
  const cor = antigo ? cores.aviso.texto : cores.textoSecundario;
  const texto = `Dados de ${formatarAtualizacao(atualizadoEm, agora)} · SES-DF`;

  return (
    <View
      style={[estilos.faixa, centro && !antigo && estilos.centro, antigo && { backgroundColor: cores.aviso.fundo, padding: espaco.sm }]}
      accessible
      accessibilityLabel={antigo ? `${texto}. Os dados podem estar desatualizados, ligue para a UBS antes de ir.` : texto}
    >
      {antigo ? (
        <Icone name="warning" size={20} color={cor} />
      ) : (
        <View style={[estilos.ponto, { backgroundColor: cores.barraSemaforo.alto, borderColor: cores.semaforo.alto.fundo }]} />
      )}
      <View style={centro && !antigo ? null : estilos.textos}>
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
  faixa: { flexDirection: "row", gap: espaco.sm, alignItems: "center", paddingVertical: espaco.xs, borderRadius: RAIO_CARTAO },
  centro: { justifyContent: "center" },
  ponto: { width: 16, height: 16, borderRadius: 8, borderWidth: 4 },
  textos: { flex: 1 },
});
