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

/**
 * Até quanto o rótulo das abas cresce com a letra do celular. Mais que isso, "Meus remédios" não cabe em
 * 2 linhas. No iPhone, segurar a aba mostra o rótulo em letra grande, como nas abas do próprio sistema.
 */
export const ESCALA_MAXIMA_ABAS = 1.4;

/** Letra e linha do rótulo das abas, antes da escala do celular. */
export const ROTULO_ABA = { fonte: fonte.legenda, linha: 20 } as const;

/** Margem de cima e de baixo da barra de abas (fora a área do gesto de início). */
export const MARGEM_ABAS = 8;

/**
 * Altura da barra de abas: margens da barra e da aba (5), ícone (28) e 2 linhas de rótulo, que crescem
 * com a letra do celular, mais a área do gesto de início. Assim o rótulo quebra linha e nunca fica cortado.
 */
export function alturaBarraAbas(escalaLetra: number, margemBaixo: number): number {
  const escala = Math.min(Math.max(escalaLetra, 1), ESCALA_MAXIMA_ABAS);
  return Math.ceil(2 * MARGEM_ABAS + 2 * 5 + 28 + 2 * ROTULO_ABA.linha * escala) + margemBaixo;
}

export interface Tema {
  escuro: boolean;
  cores: Cores;
}

export function useTema(): Tema {
  const escuro = useColorScheme() === "dark";
  return { escuro, cores: escuro ? coresEscuras : coresClaras };
}
