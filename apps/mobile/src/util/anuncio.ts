import { useEffect } from "react";
import { AccessibilityInfo, Platform } from "react-native";

/** Espera a pessoa parar de digitar antes de anunciar, para o leitor de tela não falar a cada letra. */
export const ESPERA_ANUNCIO_MS = 800;

/**
 * Anuncia no VoiceOver um texto que mudou na tela sem a pessoa tocar nele, como "3 remédios encontrados".
 * No Android e na web, quem anuncia é o `accessibilityLiveRegion` do próprio texto; o iPhone não tem esse
 * recurso, por isso o anúncio só lá (nos dois, o leitor falaria duas vezes). `null` não anuncia nada.
 */
export function useAnuncio(mensagem: string | null, espera: number = ESPERA_ANUNCIO_MS) {
  useEffect(() => {
    if (Platform.OS !== "ios" || !mensagem) return;
    const t = setTimeout(() => AccessibilityInfo.announceForAccessibility(mensagem), espera);
    return () => clearTimeout(t);
  }, [mensagem, espera]);
}
