import type { Ubs } from "@tem-remedio/shared";
import { Linking, Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { appsDeMapa } from "@/postos/links";
import { espaco, raio, useTema } from "@/tema";
import { Botao } from "./Botao";
import { Texto } from "./Texto";

interface Props {
  ubs: Ubs | null;
  aoFechar: () => void;
}

/**
 * "Como chegar": folha que sobe da parte de baixo para a pessoa escolher o app de mapa
 * que costuma usar (Mapas, Google Maps, Waze). Botões grandes, um embaixo do outro.
 */
export function EscolherMapa({ ubs, aoFechar }: Props) {
  const { cores } = useTema();
  const { bottom } = useSafeAreaInsets();
  const apps = ubs ? appsDeMapa(ubs, Platform.OS) : [];

  const abrir = (url: string) => {
    aoFechar();
    Linking.openURL(url);
  };

  return (
    <Modal visible={!!ubs} transparent animationType="slide" onRequestClose={aoFechar}>
      <View style={[estilos.veu, { backgroundColor: cores.veu }]}>
        {/* Tocar fora da folha fecha, como nas folhas do sistema. */}
        <Pressable style={estilos.fora} onPress={aoFechar} accessible={false} importantForAccessibility="no" />
        <View
          style={[estilos.folha, { backgroundColor: cores.fundo, paddingBottom: espaco.lg + bottom }]}
          accessibilityViewIsModal
        >
          <Texto variante="subtitulo">Abrir o caminho com qual app?</Texto>
          {apps.map((app) => (
            <Botao key={app.nome} titulo={app.nome} icone="navigate" onPress={() => abrir(app.url)} />
          ))}
          <Botao titulo="Cancelar" variante="secundario" onPress={aoFechar} />
          <Texto variante="legenda" secundario>
            Se o app não estiver instalado, o caminho abre no navegador.
          </Texto>
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  veu: { flex: 1, justifyContent: "flex-end" },
  fora: { flex: 1 },
  folha: {
    borderTopLeftRadius: raio * 2,
    borderTopRightRadius: raio * 2,
    padding: espaco.lg,
    gap: espaco.sm,
  },
});
