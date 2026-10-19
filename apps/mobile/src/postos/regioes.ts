import type { Coordenadas } from "./distancia";

export interface Regiao extends Coordenadas {
  /** Como a SES-DF escreve no cadastro (`Ubs.ra`), para casar com os postos. */
  nome: string;
  /** Bairros conhecidos, para quem não sabe o nome da região. */
  inclui?: string;
}

/**
 * As 35 Regiões Administrativas do DF, com um ponto de referência no centro urbano de cada uma
 * (onde mora a maior parte das pessoas, não o centro geográfico, que em regiões rurais cai no mato).
 * Serve só para ordenar os postos quando a pessoa escolhe a região em vez de usar a localização.
 *
 * Cinco regiões não aparecem no cadastro da SES-DF (os postos delas estão na região vizinha ou de origem,
 * ex.: Sol Nascente em Ceilândia): quem escolhe uma delas vê primeiro os postos mais perto dela.
 */
export const REGIOES: readonly Regiao[] = [
  { nome: "Plano Piloto", lat: -15.7939, lng: -47.8828, inclui: "Asa Norte, Asa Sul, Noroeste, Vila Planalto" },
  { nome: "Gama", lat: -16.017, lng: -48.064 },
  { nome: "Taguatinga", lat: -15.83, lng: -48.064 },
  { nome: "Brazlândia", lat: -15.676, lng: -48.201 },
  { nome: "Sobradinho", lat: -15.652, lng: -47.79 },
  { nome: "Planaltina", lat: -15.619, lng: -47.651 },
  { nome: "Paranoá", lat: -15.77, lng: -47.781 },
  { nome: "Núcleo Bandeirante", lat: -15.871, lng: -47.968 },
  { nome: "Ceilândia", lat: -15.817, lng: -48.115 },
  { nome: "Guará", lat: -15.83, lng: -47.98 },
  { nome: "Cruzeiro", lat: -15.792, lng: -47.937 },
  { nome: "Samambaia", lat: -15.877, lng: -48.086 },
  { nome: "Santa Maria", lat: -16.018, lng: -48.009 },
  { nome: "São Sebastião", lat: -15.905, lng: -47.77 },
  { nome: "Recanto das Emas", lat: -15.915, lng: -48.08 },
  { nome: "Lago Sul", lat: -15.84, lng: -47.865 },
  { nome: "Riacho Fundo", lat: -15.882, lng: -48.017 },
  { nome: "Lago Norte", lat: -15.73, lng: -47.87 },
  { nome: "Candangolândia", lat: -15.85, lng: -47.95 },
  { nome: "Águas Claras", lat: -15.84, lng: -48.028 },
  { nome: "Riacho Fundo II", lat: -15.911, lng: -48.042 },
  { nome: "Sudoeste/Octogonal", lat: -15.796, lng: -47.923 },
  { nome: "Varjão", lat: -15.71, lng: -47.877 },
  { nome: "Park Way", lat: -15.905, lng: -47.95 },
  { nome: "SCIA/Estrutural", lat: -15.783, lng: -47.995 },
  { nome: "Sobradinho II", lat: -15.64, lng: -47.827 },
  { nome: "Jardim Botânico", lat: -15.875, lng: -47.8 },
  { nome: "Itapoã", lat: -15.748, lng: -47.768 },
  { nome: "SIA", lat: -15.803, lng: -47.956 },
  { nome: "Vicente Pires", lat: -15.808, lng: -48.028 },
  { nome: "Fercal", lat: -15.596, lng: -47.865 },
  { nome: "Sol Nascente/Pôr do Sol", lat: -15.83, lng: -48.145 },
  { nome: "Arniqueira", lat: -15.858, lng: -48.015 },
  { nome: "Arapoanga", lat: -15.605, lng: -47.66 },
  { nome: "Água Quente", lat: -15.94, lng: -48.23 },
];

/** Em ordem alfabética, para a lista de escolha. */
export const REGIOES_EM_ORDEM: readonly Regiao[] = [...REGIOES].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

export function acharRegiao(nome: string | null | undefined): Regiao | null {
  return REGIOES.find((r) => r.nome === nome) ?? null;
}
