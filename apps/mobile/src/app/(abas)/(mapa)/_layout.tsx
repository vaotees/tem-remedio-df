import { Stack } from "expo-router";
import { useTema } from "@/tema";

// O mapa é sempre a primeira tela da pilha desta aba.
export const unstable_settings = { anchor: "mapa" };

/**
 * Pilha da aba Mapa: mapa da rede → detalhe do posto. O detalhe é o mesmo das outras abas
 * (pasta `(buscar,meus,mapa)`): aberto daqui, fica nesta aba, e o "Voltar" volta para o mapa.
 */
export default function LayoutMapa() {
  const { cores } = useTema();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }} />;
}
