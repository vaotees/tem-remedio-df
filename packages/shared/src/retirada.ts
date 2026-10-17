/**
 * Onde o paciente pode retirar cada remédio, segundo o painel
 * "Como garantir seu medicamento" (InfoSaúde / SES-DF).
 * Remédios aplicados no próprio posto ficam fora do snapshot.
 */
export const RETIRADAS = [
  "qualquer_ubs",
  "ubs_referencia",
  "controlado",
  "unidades_especificas",
  "grupo_acompanhamento",
  "sem_informacao",
] as const;

export type Retirada = (typeof RETIRADAS)[number];

export const TEXTO_RETIRADA: Record<Retirada, string> = {
  qualquer_ubs: "Pode retirar em qualquer UBS que tenha o remédio.",
  ubs_referencia: "Retire na UBS de referência do seu bairro.",
  controlado:
    "Remédio controlado: só em UBSs específicas, com receita de controle especial em 2 vias (não aceitam xerox).",
  unidades_especificas: "Entregue só em unidades específicas. Veja a lista oficial da SES-DF.",
  grupo_acompanhamento: "Entregue só a quem participa do grupo de acompanhamento na UBS.",
  sem_informacao: "Confirme com a UBS antes de ir.",
};

/** Documentos exigidos nas farmácias das UBSs (painel "Como garantir seu medicamento"). */
export const DOCUMENTOS_UBS = [
  "Receita",
  "Documento oficial com foto",
  "Cartão do SUS (físico ou digital) ou número SES-DF",
] as const;
