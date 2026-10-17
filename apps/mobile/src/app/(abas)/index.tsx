import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { Cartao } from "@/componentes/Cartao";
import { ComDados } from "@/componentes/ComDados";
import { FaixaAtualizacao } from "@/componentes/FaixaAtualizacao";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import { ALVO_MINIMO, espaco, fonte, raio, useTema } from "@/tema";

export default function Buscar() {
  const { cores } = useTema();
  const [busca, setBusca] = useState("");

  return (
    <Tela>
      <Texto variante="titulo">Qual remédio você procura?</Texto>

      <View style={[estilos.campo, { borderColor: cores.borda, backgroundColor: cores.fundo }]}>
        <Ionicons name="search" size={26} color={cores.textoSecundario} />
        <TextInput
          value={busca}
          onChangeText={setBusca}
          placeholder="Ex.: losartana"
          placeholderTextColor={cores.textoSecundario}
          accessibilityLabel="Nome do remédio"
          autoCorrect={false}
          returnKeyType="search"
          style={[estilos.entrada, { color: cores.texto }]}
        />
      </View>

      <ComDados>
        {(snapshot, { procurandoNovos }) => (
          <>
            <Cartao>
              <Texto variante="destaque">Rede pública do DF</Texto>
              <Texto secundario>
                {snapshot.ubs.length} farmácias de UBS e {snapshot.produtos.length} remédios da atenção básica.
              </Texto>
              {/* M3: resultados da busca entram aqui. */}
            </Cartao>
            <View style={estilos.rodape}>
              <FaixaAtualizacao atualizadoEm={snapshot.meta.atualizadoEm} procurandoNovos={procurandoNovos} />
            </View>
          </>
        )}
      </ComDados>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  campo: {
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.sm,
    minHeight: ALVO_MINIMO + 8,
    borderWidth: 2,
    borderRadius: raio,
    paddingHorizontal: espaco.md,
  },
  entrada: { flex: 1, fontSize: fonte.destaque, paddingVertical: espaco.sm },
  rodape: { marginTop: "auto" },
});
