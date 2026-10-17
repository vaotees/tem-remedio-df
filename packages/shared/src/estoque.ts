/** Faixas do semáforo, em dias de estoque na própria UBS. */
export const LIMITES_DIAS = { critico: 7, baixo: 30 } as const;

export type NivelEstoque = "alto" | "baixo" | "critico" | "sem_consumo";

/**
 * Dias de estoque = quantidade / (consumo médio mensal da UBS / 30).
 * Sem consumo registrado não dá para estimar: o app mostra só "Tem".
 */
export function calcularDias(quantidade: number, consumoMensal: number | null): number | null {
  if (!consumoMensal || consumoMensal <= 0) return null;
  return Math.round(quantidade / (consumoMensal / 30));
}

export function nivelEstoque(dias: number | null): NivelEstoque {
  if (dias === null) return "sem_consumo";
  if (dias < LIMITES_DIAS.critico) return "critico";
  if (dias < LIMITES_DIAS.baixo) return "baixo";
  return "alto";
}

/** Texto do semáforo. Nunca prometer "seguro ir": o dado é da madrugada. */
export const TEXTO_NIVEL: Record<NivelEstoque, string> = {
  alto: "Tem bastante",
  baixo: "Tem pouco, ligue antes",
  critico: "Quase acabando, ligue antes",
  sem_consumo: "Tem",
};
