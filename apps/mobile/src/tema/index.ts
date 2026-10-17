import { useColorScheme } from "react-native";
import { coresClaras, coresEscuras, type Cores } from "./cores";

export type { Cores } from "./cores";

/**
 * Tamanhos de letra pensados para idosos (base 18). O app respeita o tamanho de letra
 * escolhido no celular: estes valores são multiplicados pela escala do sistema.
 */
export const fonte = {
  legenda: 16,
  corpo: 18,
  destaque: 20,
  subtitulo: 22,
  titulo: 28,
} as const;

export const espaco = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const raio = 12;

/** Altura mínima de qualquer coisa tocável (o recomendado é 48; idosos acertam melhor com mais). */
export const ALVO_MINIMO = 56;

export interface Tema {
  escuro: boolean;
  cores: Cores;
}

export function useTema(): Tema {
  const escuro = useColorScheme() === "dark";
  return { escuro, cores: escuro ? coresEscuras : coresClaras };
}
