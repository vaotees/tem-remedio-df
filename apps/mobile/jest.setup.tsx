// Nos testes, os ícones não carregam a fonte (o Jest não tem o registro de assets do Metro).
// Troca por uma View com testID, escondida do leitor de tela como no app.
jest.mock("@expo/vector-icons/Ionicons", () => {
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  function Icone({ name }: { name: string }) {
    return <View testID={`icone-${name}`} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />;
  }
  return { __esModule: true, default: Icone };
});

// O mapa nativo não roda no Jest: o MapView vira uma View e cada pino (Marker) vira uma View tocável,
// com as mesmas props (rótulo, testID, onPress), para os testes acharem e tocarem os pinos.
type MockProps = import("react-native").ViewProps & Record<string, unknown>;
jest.mock("react-native-maps", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  const MapView = React.forwardRef(function MapView(props: MockProps, ref) {
    React.useImperativeHandle(ref, () => ({ animateCamera: () => {}, animateToRegion: () => {} }));
    return <View {...props} />;
  });
  function Marker(props: MockProps) {
    return <View {...props} />;
  }
  return { __esModule: true, default: MapView, Marker };
});
