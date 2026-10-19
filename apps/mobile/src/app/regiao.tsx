import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import { Voltar } from "@/componentes/Voltar";
import { useRegiaoEscolhida } from "@/postos/regiao-escolhida";
import { REGIOES_EM_ORDEM, type Regiao } from "@/postos/regioes";
import { ALVO_MINIMO, espaco, raio, useTema } from "@/tema";

/**
 * "Qual é a sua região?": as 35 Regiões Administrativas em ordem alfabética, uma por linha, grandes.
 * Abre pela lista de postos e pela aba Ajuda; ao escolher, volta para onde estava.
 */
export default function EscolherRegiao() {
  const router = useRouter();
  const { ra, escolherRegiao } = useRegiaoEscolhida();

  const escolher = (nome: string) => {
    void escolherRegiao(nome);
    if (router.canGoBack()) router.back();
    else router.navigate("/");
  };

  return (
    <Tela>
      <Voltar />
      <Texto variante="titulo">Qual é a sua região?</Texto>
      <Texto>Os postos da região que você escolher aparecem primeiro. A escolha fica só neste celular.</Texto>
      <Texto secundario>
        São as Regiões Administrativas do DF, em ordem alfabética. Não achou a sua? Escolha a mais perto de onde você
        mora.
      </Texto>
      <View style={estilos.lista}>
        {REGIOES_EM_ORDEM.map((r) => (
          <ItemRegiao key={r.nome} regiao={r} escolhida={r.nome === ra} onPress={() => escolher(r.nome)} />
        ))}
      </View>
    </Tela>
  );
}

function ItemRegiao({ regiao, escolhida, onPress }: { regiao: Regiao; escolhida: boolean; onPress: () => void }) {
  const { cores } = useTema();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[regiao.nome, regiao.inclui, escolhida ? "Sua região agora" : null].filter(Boolean).join(". ")}
      accessibilityState={{ selected: escolhida }}
      style={({ pressed }) => [
        estilos.item,
        { backgroundColor: cores.superficie, borderColor: escolhida ? cores.primaria : cores.borda },
        escolhida && estilos.itemEscolhido,
        pressed && { opacity: 0.75 },
      ]}
    >
      <View style={estilos.textos}>
        <Texto variante="destaque">{regiao.nome}</Texto>
        {regiao.inclui ? <Texto secundario>{regiao.inclui}</Texto> : null}
        {escolhida ? (
          <Texto variante="legenda" cor={cores.primaria}>
            Sua região agora
          </Texto>
        ) : null}
      </View>
      {escolhida ? <Ionicons name="checkmark-circle" size={28} color={cores.primaria} /> : null}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: espaco.sm },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.sm,
    minHeight: ALVO_MINIMO,
    borderWidth: 1,
    borderRadius: raio,
    paddingHorizontal: espaco.md,
    paddingVertical: espaco.sm,
  },
  itemEscolhido: { borderWidth: 3 },
  textos: { flex: 1, gap: espaco.xs },
});
