import { useSyncExternalStore } from "react";
import { AccessibilityInfo, Platform } from "react-native";

/** No celular, as animações de posição e opacidade rodam fora do JavaScript (driver nativo). Na web não há. */
export const DRIVER_NATIVO = Platform.OS !== "web";

let reduzir = false;
let ligado = false;
const ouvintes = new Set<() => void>();

/**
 * Lê o "Reduzir movimento" do sistema na abertura do app (junto com as preferências), e acompanha se a
 * pessoa muda com o app aberto. Assim cada tela já nasce sabendo se anima, sem um quadro "pulando".
 */
export async function carregarMovimento(): Promise<void> {
  if (ligado) return;
  ligado = true;
  try {
    reduzir = await AccessibilityInfo.isReduceMotionEnabled();
    AccessibilityInfo.addEventListener("reduceMotionChanged", (valor) => {
      reduzir = valor;
      ouvintes.forEach((avisar) => avisar());
    });
  } catch {
    reduzir = false;
  }
}

function assinar(avisar: () => void) {
  ouvintes.add(avisar);
  return () => {
    ouvintes.delete(avisar);
  };
}

const lerReduzir = () => reduzir;

/**
 * Se as telas animam (entrada dos cartões, números contando, gráficos enchendo). Com "Reduzir movimento"
 * ligado no celular, tudo aparece pronto, sem movimento.
 */
export function useAnimar(): boolean {
  return !useSyncExternalStore(assinar, lerReduzir, lerReduzir);
}
