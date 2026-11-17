import type { NivelEstoque, Ubs } from "@tem-remedio/shared";
import { StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { RAIO_CARTAO, useTema } from "@/tema";
import { Icone } from "./Icone";
import { ICONE_NIVEL } from "./SeloEstoque";

/**
 * Mapa pequeno e parado no alto do detalhe: a pessoa reconhece o lugar antes de ler o endereço.
 * Não mexe com o dedo (a rolagem da tela continua funcionando); para ir até lá, "Como chegar".
 * O pino tem a cor do estoque do remédio procurado, ou a cor do app quando não há remédio.
 */
export function MapaPosto({ ubs, nivel }: { ubs: Ubs; nivel: NivelEstoque | null }) {
  const { cores, escuro } = useTema();
  const miolo = nivel ? cores.pino.miolo[nivel] : "#0B5FA5";
  return (
    <View
      style={[estilos.moldura, { borderColor: cores.divisoria }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
    >
      <MapView
        testID="mapa-do-posto"
        style={StyleSheet.absoluteFill}
        initialRegion={{ latitude: ubs.lat, longitude: ubs.lng, latitudeDelta: 0.012, longitudeDelta: 0.012 }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        showsPointsOfInterests={false}
        toolbarEnabled={false}
        liteMode
        userInterfaceStyle={escuro ? "dark" : "light"}
      >
        <Marker coordinate={{ latitude: ubs.lat, longitude: ubs.lng }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <View style={[estilos.pino, { backgroundColor: miolo, borderColor: cores.pino.borda }]}>
            <Icone name={nivel ? ICONE_NIVEL[nivel] : "medkit"} size={24} color={cores.pino.icone} />
          </View>
        </Marker>
      </MapView>
    </View>
  );
}

const estilos = StyleSheet.create({
  moldura: { height: 170, borderRadius: RAIO_CARTAO, borderWidth: 1, overflow: "hidden" },
  pino: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, alignItems: "center", justifyContent: "center" },
});
