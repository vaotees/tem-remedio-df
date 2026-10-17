// Nos testes, os ícones não carregam a fonte (o Jest não tem o registro de assets do Metro).
// Troca por uma View com testID, escondida do leitor de tela como no app.
jest.mock("@expo/vector-icons/Ionicons", () => {
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  function Icone({ name }: { name: string }) {
    return <View testID={`icone-${name}`} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />;
  }
  return { __esModule: true, default: Icone };
});
