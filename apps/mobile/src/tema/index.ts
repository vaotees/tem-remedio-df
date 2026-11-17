import { useColorScheme, type ViewStyle } from "react-native";
import { ESCALAS_LETRA, usePreferencias } from "@/preferencias/preferencias";
import { coresClaras, coresEscuras, type Cores } from "./cores";

export type { Cores } from "./cores";

/**
 * Tamanhos de letra pensados para idosos (base 18). O app respeita o tamanho de letra
 * escolhido no celular (o sistema multiplica estes valores) e o do Perfil (`escalaLetra`).
 */
export const fonte = {
  legenda: 16,
  corpo: 18,
  destaque: 20,
  subtitulo: 22,
  titulo: 28,
} as const;

/**
 * Atkinson Hyperlegible Next, do Braille Institute, desenhada para baixa visão (I, l e 1 não se confundem,
 * nem 0 e O). Cada peso é uma família: no Android, `fontWeight` com fonte própria cai na fonte do sistema.
 * A Mono entra nos números que se comparam (distância, contagens).
 */
export const familia = {
  regular: "AtkinsonHyperlegibleNext_400Regular",
  medio: "AtkinsonHyperlegibleNext_500Medium",
  negrito: "AtkinsonHyperlegibleNext_700Bold",
  extra: "AtkinsonHyperlegibleNext_800ExtraBold",
  numero: "AtkinsonHyperlegibleMono_700Bold",
} as const;

export type Peso = keyof typeof familia;

export const espaco = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

/** Cantos: cartões arredondados e botões e selos em forma de cápsula, como o símbolo da marca. */
export const raio = 12;
export const RAIO_CARTAO = 20;
export const RAIO_CAPSULA = 999;

/** Altura mínima de qualquer coisa tocável (o recomendado é 48; idosos acertam melhor com mais). */
export const ALVO_MINIMO = 56;

/**
 * Até quanto o rótulo das abas cresce com a letra do celular. Mais que isso, "Meus remédios" não cabe em
 * 2 linhas. No iPhone, segurar a aba mostra o rótulo em letra grande, como nas abas do próprio sistema.
 */
export const ESCALA_MAXIMA_ABAS = 1.4;

/** Letra e linha do rótulo das abas, antes da escala do celular. */
export const ROTULO_ABA = { fonte: 14, linha: 18 } as const;

/** Margem de cima e de baixo da barra de abas (fora a área do gesto de início). */
export const MARGEM_ABAS = 8;

/** Altura da pílula atrás do ícone da aba escolhida. */
export const PILULA_ABA = 32;

/**
 * Altura da barra de abas: margens da barra e da aba (5), a pílula do ícone e 2 linhas de rótulo, que
 * crescem com a letra do celular, mais a área do gesto de início. Assim o rótulo quebra linha e nunca
 * fica cortado.
 */
export function alturaBarraAbas(escalaLetra: number, margemBaixo: number): number {
  const escala = Math.min(Math.max(escalaLetra, 1), ESCALA_MAXIMA_ABAS);
  return Math.ceil(2 * MARGEM_ABAS + 2 * 5 + PILULA_ABA + 2 * ROTULO_ABA.linha * escala) + margemBaixo;
}

/** Sombra suave dos cartões no tema claro. No escuro, borda (sombra não aparece em fundo escuro). */
export function sombraCartao(cores: Cores): ViewStyle {
  if (!cores.sombra) return { borderWidth: 1, borderColor: cores.bordaCartao };
  return {
    shadowColor: "#0E1B2B",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  };
}

export interface Tema {
  escuro: boolean;
  cores: Cores;
  /** Escala da letra escolhida no Perfil (1 = normal). */
  escalaLetra: number;
}

export function useTema(): Tema {
  const sistema = useColorScheme();
  const { tema, letra } = usePreferencias();
  const escuro = tema === "sistema" ? sistema === "dark" : tema === "escuro";
  return { escuro, cores: escuro ? coresEscuras : coresClaras, escalaLetra: ESCALAS_LETRA[letra] };
}
