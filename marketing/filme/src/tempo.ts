import vozes from "./dados/voz.json";

/**
 * Linha do tempo do filme, em segundos, guiada pela narração: cada cena entra um pouco antes da fala e só sai
 * depois que ela termina. O "clique" do símbolo (cena da virada) cai no pico da música (17 s da faixa).
 */
export const FPS = 30;

type Voz = { texto: string; arquivo: string; segundos: number };
export const VOZES = vozes as Voz[];

// Início de cada fala.
export const FALA = [1.15, 5.55, 9.95, 16.75, 21.15, 27.15];

export const CENA = {
  capa: { de: 0, ate: 1.3 },
  problema: { de: 0.9, ate: 5.55 },
  virada: { de: 5.15, ate: 9.55 },
  prova: { de: 9.15, ate: 16.55 },
  produto: { de: 16.15, ate: 20.85 },
  cuidado: { de: 20.45, ate: 26.95 },
  final: { de: 26.55, ate: 34.3 },
};

export const DURACAO = CENA.final.ate;

/** Momento do encaixe das metades da cápsula, no tempo do filme. */
export const CLIQUE = 7.0;

export const MUSICA = { arquivo: "musica.mp3", inicio: 17.0 - CLIQUE, volume: 0.55, sobVoz: 0.2 };

/** Efeitos sonoros: quando e qual (arquivos em public/sfx). */
export const EFEITOS: Array<{ em: number; tipo: string; volume?: number }> = [
  ...[0.92, 5.17, 9.17, 16.17, 20.47, 26.57].map((em) => ({ em, tipo: "whoosh", volume: 0.45 })),
  ...[2.15, 2.45, 2.75, 3.05, 3.35, 3.65].map((em) => ({ em, tipo: "pop", volume: 0.3 })),
  { em: CLIQUE, tipo: "ding", volume: 0.8 },
  ...[13.65, 13.95, 14.25].map((em) => ({ em, tipo: "pop", volume: 0.45 })),
  ...[19.5, 19.8].map((em) => ({ em, tipo: "pop", volume: 0.45 })),
  { em: 22.35, tipo: "bip", volume: 0.5 },
  { em: 23.85, tipo: "pop", volume: 0.45 },
  { em: 30.3, tipo: "plim", volume: 0.7 },
];

export const f = (segundos: number) => Math.round(segundos * FPS);

/** Início da fala `i` relativo ao começo da cena. */
export const falaNaCena = (i: number, cena: keyof typeof CENA) => FALA[i] - CENA[cena].de;
export const duracaoCena = (cena: keyof typeof CENA) => CENA[cena].ate - CENA[cena].de;
