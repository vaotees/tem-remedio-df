import type { NivelEstoque } from "@tem-remedio/shared";

export interface CoresSemaforo {
  texto: string;
  fundo: string;
}

export interface Cores {
  /** Fundo das telas: um cinza-azulado claro, para os cartões brancos se destacarem sem borda. */
  fundo: string;
  /** Cartões e campos. */
  superficie: string;
  /** Painel dentro de um cartão (ex.: o posto mais perto em Meus remédios). */
  superficie2: string;
  texto: string;
  textoSecundario: string;
  primaria: string;
  textoSobrePrimaria: string;
  /** Fundo dos botões "tonais" (Ligar, WhatsApp) e da aba escolhida. */
  primariaTinta: string;
  /** Texto e ícone sobre `primariaTinta`. */
  textoTonal: string;
  /** Bordas de campos e botões secundários: contraste mínimo 3:1 com o fundo. */
  borda: string;
  divisoria: string;
  /** Trilho de medidores, anéis e do seletor Lista | Mapa. */
  trilho: string;
  /** Faixa da marca no alto das telas (cor de apoio; a faixa é desenhada com o `degrade`). */
  faixa: string;
  textoFaixa: string;
  textoFaixaSecundario: string;
  /**
   * Degradê da faixa do alto de todas as telas, em diagonal: do azul-noite ao azul da marca e a um azul
   * esverdeado. O texto da faixa passa de 4,5:1 em todas as paradas (o teste confere).
   */
  degrade: [string, string, string];
  /** Brilho suave por cima do degradê (enfeite): a menta da marca, quase transparente. */
  brilho: string;
  /** Trilho dos anéis desenhados sobre a faixa. */
  trilhoFaixa: string;
  /** Vidro: fundo translúcido de botões e selos sobre a faixa. */
  vidroFaixa: string;
  /** Contorno do vidro, para o botão aparecer sobre qualquer parte do degradê. */
  bordaVidro: string;
  /** Cores só da marca (o símbolo). Nunca ao lado do semáforo: o verde seria lido como "tem bastante". */
  marca: { azul: string; verde: string; menta: string };
  /** Letra sobre a menta (o avatar do Perfil): escura nos dois temas. */
  textoSobreMenta: string;
  /** Cartões com sombra no tema claro; no escuro, sombra não aparece e o cartão ganha borda. */
  sombra: boolean;
  bordaCartao: string;
  /** Véu escuro atrás de uma folha que sobe da parte de baixo da tela. */
  veu: string;
  aviso: CoresSemaforo;
  /** Caixas de informação neutra (ex.: "Retire na UBS do seu bairro"). */
  info: CoresSemaforo;
  /** Selo "Aberto agora" / "Fechado agora" (sempre com ícone e texto). */
  aberto: CoresSemaforo;
  fechado: CoresSemaforo;
  semaforo: Record<NivelEstoque, CoresSemaforo>;
  /** Cor cheia de cada nível, para barras e medidores (sempre com texto ao lado). */
  barraSemaforo: Record<NivelEstoque, string>;
  pino: CoresPino;
}

export interface CoresPino {
  /** Fundo do pino, pela situação do estoque (sempre com o ícone do semáforo por cima). */
  miolo: Record<NivelEstoque, string>;
  icone: string;
  borda: string;
}

/**
 * Pinos do mapa, iguais nos dois temas: no Android o mapa continua claro mesmo no tema escuro.
 * Miolo escuro, que aparece no mapa claro, e borda branca, que aparece no mapa escuro do iPhone.
 */
const pino: CoresPino = {
  miolo: { alto: "#1B5E20", baixo: "#9A5B00", critico: "#B71C1C", sem_consumo: "#1F4E8C" },
  icone: "#FFFFFF",
  borda: "#FFFFFF",
};

/**
 * Paleta pensada para baixa visão: todo texto passa de 4,5:1 (WCAG AA) e a maioria de 7:1.
 * Azul e menta vêm da marca (`assets/marca/README.md`). O teste `tema-test.ts` confere os contrastes.
 */
export const coresClaras: Cores = {
  fundo: "#F2F5F9",
  superficie: "#FFFFFF",
  superficie2: "#F2F5F9",
  texto: "#0E1B2B",
  textoSecundario: "#44536A",
  primaria: "#0B5FA5",
  textoSobrePrimaria: "#FFFFFF",
  primariaTinta: "#E3EEF9",
  textoTonal: "#0B5FA5",
  borda: "#6B7A8F",
  divisoria: "#DCE3EB",
  trilho: "#E1E8EF",
  faixa: "#0B5FA5",
  textoFaixa: "#FFFFFF",
  textoFaixaSecundario: "#D3E6F8",
  degrade: ["#0A2E57", "#0B5FA5", "#0A6382"],
  brilho: "#86E3BC",
  trilhoFaixa: "rgba(255, 255, 255, 0.22)",
  vidroFaixa: "rgba(255, 255, 255, 0.14)",
  bordaVidro: "rgba(255, 255, 255, 0.45)",
  marca: { azul: "#0B5FA5", verde: "#1F8A5E", menta: "#86E3BC" },
  textoSobreMenta: "#0E1B2B",
  sombra: true,
  bordaCartao: "transparent",
  veu: "rgba(0, 0, 0, 0.5)",
  aviso: { texto: "#7A4A00", fundo: "#FFF1D0" },
  info: { texto: "#1F3A5F", fundo: "#E6EEF8" },
  aberto: { texto: "#1B5E20", fundo: "#E3F3E5" },
  fechado: { texto: "#44536A", fundo: "#ECEFF3" },
  semaforo: {
    alto: { texto: "#1B5E20", fundo: "#E3F3E5" },
    baixo: { texto: "#7A4A00", fundo: "#FFF1D0" },
    critico: { texto: "#9B1C1C", fundo: "#FDE8E8" },
    sem_consumo: { texto: "#1F3A5F", fundo: "#E6EEF8" },
  },
  barraSemaforo: { alto: "#2E7D32", baixo: "#C77700", critico: "#C62828", sem_consumo: "#5B7FA8" },
  pino,
};

export const coresEscuras: Cores = {
  fundo: "#0F1115",
  superficie: "#171D26",
  superficie2: "#1F2732",
  texto: "#EEF3F8",
  textoSecundario: "#B3BFCC",
  primaria: "#6CB4F5",
  textoSobrePrimaria: "#0F1115",
  primariaTinta: "#16304A",
  textoTonal: "#8CC6F8",
  borda: "#7D8B9C",
  divisoria: "#2A3542",
  trilho: "#26313D",
  faixa: "#102A44",
  textoFaixa: "#EEF3F8",
  textoFaixaSecundario: "#A9CBEA",
  degrade: ["#08182B", "#0E2C4A", "#0B3A45"],
  brilho: "#86E3BC",
  trilhoFaixa: "rgba(255, 255, 255, 0.16)",
  vidroFaixa: "rgba(255, 255, 255, 0.10)",
  bordaVidro: "rgba(255, 255, 255, 0.35)",
  marca: { azul: "#6CB4F5", verde: "#86E3BC", menta: "#86E3BC" },
  textoSobreMenta: "#0E1B2B",
  sombra: false,
  bordaCartao: "#273240",
  veu: "rgba(0, 0, 0, 0.7)",
  aviso: { texto: "#FFD27A", fundo: "#3A2C0B" },
  info: { texto: "#B9D3F0", fundo: "#1C2A3D" },
  aberto: { texto: "#A5D6A7", fundo: "#16301A" },
  fechado: { texto: "#C9CED6", fundo: "#262B34" },
  semaforo: {
    alto: { texto: "#A5D6A7", fundo: "#16301A" },
    baixo: { texto: "#FFD27A", fundo: "#3A2C0B" },
    critico: { texto: "#F4A6A6", fundo: "#3D1717" },
    sem_consumo: { texto: "#B9D3F0", fundo: "#1C2A3D" },
  },
  barraSemaforo: { alto: "#5CC46B", baixo: "#E0A030", critico: "#E25B5B", sem_consumo: "#7FA6D6" },
  pino,
};
