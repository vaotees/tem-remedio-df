import { continueRender, delayRender, staticFile } from "remotion";

/** Paleta do Tem Remédio DF: a mesma do app (apps/mobile/src/tema/cores.ts) e da marca. */
export const COR = {
  noite: "#0B1A2B",
  noite2: "#102A44",
  azul: "#0B5FA5",
  azulClaro: "#6CB4F5",
  menta: "#86E3BC",
  verde: "#1F8A5E",
  papel: "#F2F6FA",
  nevoa: "#A9B8C8",
  // Semáforo do tema escuro do app (barras e pinos sobre fundo escuro).
  alto: "#5CC46B",
  baixo: "#E0A030",
  critico: "#E25B5B",
  sem: "#7FA6D6",
};

export const NIVEL_COR = { alto: COR.alto, baixo: COR.baixo, critico: COR.critico, sem_consumo: COR.sem } as const;

export const W = 1080;
export const H = 1920;

// Atkinson Hyperlegible Next, a letra do app (feita para baixa visão), e a Mono nos números e rótulos.
const espera = delayRender("fontes da marca");
const fontes = [
  new FontFace("Atkinson", `url(${staticFile("fontes/AtkinsonHyperlegibleNext_800ExtraBold.ttf")})`, { weight: "800" }),
  new FontFace("Atkinson", `url(${staticFile("fontes/AtkinsonHyperlegibleNext_700Bold.ttf")})`, { weight: "700" }),
  new FontFace("Atkinson", `url(${staticFile("fontes/AtkinsonHyperlegibleNext_400Regular.ttf")})`, { weight: "400" }),
  new FontFace("Atkinson Mono", `url(${staticFile("fontes/AtkinsonHyperlegibleMono_700Bold.ttf")})`, { weight: "700" }),
];
Promise.all(fontes.map((f) => f.load()))
  .then((carregadas) => carregadas.forEach((f) => document.fonts.add(f)))
  .finally(() => continueRender(espera));

export const LETRA = "'Atkinson', sans-serif";
export const MONO = "'Atkinson Mono', monospace";
