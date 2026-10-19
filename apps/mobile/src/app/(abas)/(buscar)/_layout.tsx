import { Stack } from "expo-router";
import { useTema } from "@/tema";

// A busca é sempre a primeira tela da pilha, mesmo quando se chega por outra aba ou link.
export const unstable_settings = { anchor: "index" };

/**
 * Pilha da aba Buscar: busca → "Qual destes?" → postos → detalhe do posto.
 * Fica dentro da aba para a barra de abas continuar sempre visível. Postos e detalhe ficam na pasta
 * `(buscar,meus)`, compartilhados com a aba Meus remédios.
 * Sem cabeçalho nativo: cada tela tem o seu "Voltar" grande.
 */
export default function LayoutBuscar() {
  const { cores } = useTema();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }} />;
}
