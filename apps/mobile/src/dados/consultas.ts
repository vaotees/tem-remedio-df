import { focusManager, QueryClient } from "@tanstack/react-query";
import { AppState, Platform } from "react-native";

export const queryClient = new QueryClient();

/**
 * No celular não existe "foco da janela": avisamos o React Query quando o app volta
 * para a frente, para procurar dados novos (a SES-DF atualiza de madrugada e à tarde).
 */
export function ligarFocoDoApp() {
  if (Platform.OS === "web") return () => {};
  const assinatura = AppState.addEventListener("change", (estado) => {
    focusManager.setFocused(estado === "active");
  });
  return () => assinatura.remove();
}
