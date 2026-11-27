// Nos testes, os ícones não carregam a fonte (o Jest não tem o registro de assets do Metro).
// Troca por uma View com testID. Como o ícone de verdade (uma letra que o leitor de tela lê), ela só fica
// escondida do leitor se o app pedir: os testes conferem que nenhum ícone aparece para ele.
type MockIcone = { name: string } & Pick<
  import("react-native").ViewProps,
  "accessibilityElementsHidden" | "importantForAccessibility"
>;
jest.mock("@expo/vector-icons/Ionicons", () => {
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  function Icone({ name, accessibilityElementsHidden, importantForAccessibility }: MockIcone) {
    return (
      <View
        testID={`icone-${name}`}
        accessibilityElementsHidden={accessibilityElementsHidden}
        importantForAccessibility={importantForAccessibility}
      />
    );
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

// Fontes: no Jest não há arquivos de fonte para carregar; a abertura do app segue como se já tivessem chegado.
jest.mock("expo-font", () => ({
  ...jest.requireActual<object>("expo-font"),
  useFonts: () => [true, null],
}));
jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: () => Promise.resolve(true),
  hideAsync: () => Promise.resolve(true),
  setOptions: () => {},
}));

// A abertura animada fica por cima do app: nos testes de tela ela não aparece (tem teste próprio).
jest.mock("@/componentes/Abertura", () => ({ Abertura: () => null }));
