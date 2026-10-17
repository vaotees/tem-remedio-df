import type { NivelEstoque } from "@tem-remedio/shared";

export interface CoresSemaforo {
  texto: string;
  fundo: string;
}

export interface Cores {
  fundo: string;
  superficie: string;
  texto: string;
  textoSecundario: string;
  primaria: string;
  textoSobrePrimaria: string;
  /** Bordas de campos e botões secundários: contraste mínimo 3:1 com o fundo. */
  borda: string;
  divisoria: string;
  aviso: CoresSemaforo;
  semaforo: Record<NivelEstoque, CoresSemaforo>;
}

/**
 * Paleta pensada para baixa visão: todo texto passa de 4,5:1 (WCAG AA) e a maioria de 7:1.
 * O teste `tema-test.ts` confere os contrastes dos dois temas.
 */
export const coresClaras: Cores = {
  fundo: "#FFFFFF",
  superficie: "#F3F5F8",
  texto: "#111827",
  textoSecundario: "#374151",
  primaria: "#0B5FA5",
  textoSobrePrimaria: "#FFFFFF",
  borda: "#6B7280",
  divisoria: "#D1D5DB",
  aviso: { texto: "#7A4A00", fundo: "#FFF3D6" },
  semaforo: {
    alto: { texto: "#1B5E20", fundo: "#E7F4E8" },
    baixo: { texto: "#7A4A00", fundo: "#FFF3D6" },
    critico: { texto: "#9B1C1C", fundo: "#FDECEC" },
    sem_consumo: { texto: "#1F3A5F", fundo: "#E8EEF6" },
  },
};

export const coresEscuras: Cores = {
  fundo: "#0F1115",
  superficie: "#1A1E25",
  texto: "#F3F4F6",
  textoSecundario: "#C9CED6",
  primaria: "#6CB4F5",
  textoSobrePrimaria: "#0F1115",
  borda: "#8A93A0",
  divisoria: "#2E3440",
  aviso: { texto: "#FFD27A", fundo: "#3A2C0B" },
  semaforo: {
    alto: { texto: "#A5D6A7", fundo: "#16301A" },
    baixo: { texto: "#FFD27A", fundo: "#3A2C0B" },
    critico: { texto: "#F4A6A6", fundo: "#3D1717" },
    sem_consumo: { texto: "#B9D3F0", fundo: "#1C2A3D" },
  },
};
