import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Botao } from "@/componentes/Botao";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import { espaco, useTema } from "@/tema";

/** M5: lista salva no aparelho. Por enquanto, o convite para começar. */
export default function MeusRemedios() {
  const { cores } = useTema();
  const router = useRouter();

  return (
    <Tela>
      <Texto variante="titulo">Meus remédios</Texto>
      <View style={estilos.vazio}>
        <Ionicons name="heart-outline" size={56} color={cores.primaria} />
        <Texto variante="subtitulo" style={estilos.centro}>
          Guarde os remédios que você usa
        </Texto>
        <Texto secundario style={estilos.centro}>
          Assim, com um toque, você vê em quais postos perto de você eles estão disponíveis.
        </Texto>
        <Texto variante="legenda" secundario style={estilos.centro}>
          Sua lista fica só neste celular.
        </Texto>
        <Botao titulo="Buscar um remédio" icone="search" onPress={() => router.navigate("/")} />
      </View>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  vazio: { flex: 1, alignItems: "center", justifyContent: "center", gap: espaco.md, paddingVertical: espaco.xl },
  centro: { textAlign: "center" },
});
