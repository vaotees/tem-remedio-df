import { Stack } from "expo-router";
import { useTema } from "@/tema";

// Meus remédios é sempre a primeira tela da pilha desta aba.
export const unstable_settings = { anchor: "meus-remedios" };

/**
 * Pilha da aba Meus remédios: lista guardada → postos → detalhe do posto.
 * As telas de postos e do posto são as mesmas da aba Buscar (pasta `(buscar,meus)`): abertas daqui,
 * ficam nesta aba, e o "Voltar" volta para a lista guardada, não para a busca.
 */
export default function LayoutMeusRemedios() {
  const { cores } = useTema();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }} />;
}
