import type { Painel } from "./powerbi/cliente";

export const POWERBI_API = "https://wabi-brazil-south-api.analysis.windows.net/public/reports";

/** Painel InfoSaúde "Estoque de Medicamentos nas UBS - SES/DF". */
export const PAINEL_ESTOQUE: Painel & { entidade: string } = {
  resourceKey: "5ccba871-5230-4333-86f6-7fc3a29b5d5b",
  modelId: 10723062,
  datasetId: "ceb0186a-2546-4bfd-814e-5dad49b318cc",
  reportId: "5cec075d-5810-42a0-8581-821cc46dfd6b",
  entidade: "st_stage_trak tab_sismateriais_epi",
};

/** Painel InfoSaúde "Como garantir seu medicamento": regras de retirada e cadastro das UBSs. */
export const PAINEL_GARANTIR: Painel = {
  resourceKey: "d77b9ba0-317a-4041-88a0-3241c35384ac",
  modelId: 10722913,
  datasetId: "c021e607-7580-407e-bbab-4312c5c14cd9",
  reportId: "1db587dc-7cc6-47fb-9ed6-b8c7920cca53",
};

export const CNES_API = "https://apidadosabertos.saude.gov.br/cnes/estabelecimentos";

/** Tabela de preços CMED (Anvisa): marca → substância → apresentação. */
export const CMED_URL = "https://dados.anvisa.gov.br/dados/TA_PRECO_MEDICAMENTO.csv";

/** Só o elenco da atenção básica é entregue ao paciente nas UBSs. */
export const GRUPOS_DISPENSADOS = ["UBS"];

/** Limites de sanidade: abaixo disso, algo quebrou na fonte e o snapshot não é publicado. */
export const VALIDACAO = {
  minUbs: 120,
  minProdutos: 150,
  minItensEstoque: 10_000,
  /** Queda máxima em relação ao snapshot anterior (fração). */
  quedaMaxima: 0.25,
};
