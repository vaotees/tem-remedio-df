import { TEXTO_RETIRADA, type Produto, type Snapshot, type Ubs } from "@tem-remedio/shared";
import { distanciaKm, type Coordenadas } from "./distancia";
import { acharRegiao } from "./regioes";

export interface PostoComEstoque {
  ubs: Ubs;
  quantidade: number;
  dias: number | null;
  /** Distância da pessoa, em linha reta. null sem localização (aí a lista vai por região). */
  distanciaKm: number | null;
}

/**
 * Como ordenar os postos:
 * - `distancia`: do mais perto para o mais longe da pessoa (GPS);
 * - `regiao`: primeiro os da Região Administrativa escolhida, depois os mais perto dela;
 * - `nome`: sem localização nem região, por Região Administrativa e nome.
 */
export type Ordem = { por: "distancia"; origem: Coordenadas } | { por: "regiao"; ra: string } | { por: "nome" };

/**
 * UBSs do sistema prisional (horário "OUTRO/PRISIONAL" no cadastro da SES-DF) atendem só a população
 * presa: não podem aparecer como "posto mais perto" para o público.
 */
export function ehUnidadePrisional(ubs: Ubs): boolean {
  return /PRISIONAL/i.test(`${ubs.horario ?? ""} ${ubs.farmacia}`);
}

/**
 * Postos que têm o produto hoje, na ordem pedida (ver `Ordem`).
 * Remédio controlado só aparece nas UBSs que entregam controlados; unidades prisionais nunca aparecem.
 */
export function postosComEstoque(snapshot: Snapshot, iProduto: number, ordem: Ordem): PostoComEstoque[] {
  const produto = snapshot.produtos[iProduto];
  if (!produto) return [];

  const postos: PostoComEstoque[] = [];
  for (const [iUbs, iProd, quantidade, dias] of snapshot.estoque) {
    if (iProd !== iProduto) continue;
    const ubs = snapshot.ubs[iUbs];
    if (!ubs || ehUnidadePrisional(ubs)) continue;
    if (produto.retirada === "controlado" && !ubs.entregaControlados) continue;
    postos.push({ ubs, quantidade, dias, distanciaKm: ordem.por === "distancia" ? distanciaKm(ordem.origem, ubs) : null });
  }

  const porNome = (a: PostoComEstoque, b: PostoComEstoque) =>
    a.ubs.ra.localeCompare(b.ubs.ra, "pt-BR") || a.ubs.nome.localeCompare(b.ubs.nome, "pt-BR");

  if (ordem.por === "distancia") return postos.sort((a, b) => a.distanciaKm! - b.distanciaKm!);
  if (ordem.por === "nome") return postos.sort(porNome);

  // Pela região: a distância do centro dela só ordena, não aparece (não é a distância da pessoa).
  const centro = acharRegiao(ordem.ra);
  const daRegiao = (p: PostoComEstoque) => (p.ubs.ra === ordem.ra ? 0 : 1);
  const doCentro = new Map(postos.map((p) => [p, centro ? distanciaKm(centro, p.ubs) : 0]));
  return postos.sort((a, b) => daRegiao(a) - daRegiao(b) || doCentro.get(a)! - doCentro.get(b)! || porNome(a, b));
}

/** Mais longe que isso do posto mais perto, a pessoa não está no DF: distância não ajuda. */
export const LIMITE_FORA_DO_DF_KM = 60;

export function estaForaDoDf(snapshot: Snapshot, origem: Coordenadas): boolean {
  return snapshot.ubs.every((u) => distanciaKm(origem, u) > LIMITE_FORA_DO_DF_KM);
}

/**
 * Identifica um posto entre atualizações do snapshot. O CNES não basta:
 * algumas UBSs têm duas farmácias (ex.: UBS 5 Ceilândia).
 */
export function acharUbs(snapshot: Snapshot, cnes: string, farmacia?: string): Ubs | null {
  const doCnes = snapshot.ubs.filter((u) => u.cnes === cnes);
  return doCnes.find((u) => u.farmacia === farmacia) ?? doCnes[0] ?? null;
}

export function temOutraFarmacia(snapshot: Snapshot, ubs: Ubs): boolean {
  return snapshot.ubs.some((u) => u.cnes === ubs.cnes && u.farmacia !== ubs.farmacia);
}

export function estoqueNoPosto(snapshot: Snapshot, ubs: Ubs, iProduto: number): { quantidade: number; dias: number | null } | null {
  const iUbs = snapshot.ubs.indexOf(ubs);
  const item = snapshot.estoque.find(([u, p]) => u === iUbs && p === iProduto);
  return item ? { quantidade: item[2], dias: item[3] } : null;
}

export interface AvisoRetirada {
  titulo: string;
  texto: string;
  /** Link oficial com a lista de unidades, quando houver. */
  link: string | null;
}

/** O que a pessoa precisa saber antes de escolher o posto, conforme a regra de retirada do remédio. */
export function avisoRetirada(produto: Produto): AvisoRetirada | null {
  const texto = TEXTO_RETIRADA[produto.retirada];
  switch (produto.retirada) {
    case "qualquer_ubs":
      return null;
    case "controlado":
      return { titulo: "Só nas UBSs que entregam controlados", texto, link: produto.linkInfo };
    case "ubs_referencia":
      return { titulo: "Retire na UBS do seu bairro", texto, link: produto.linkInfo };
    case "unidades_especificas":
      return { titulo: "Só em algumas unidades", texto, link: produto.linkInfo };
    case "grupo_acompanhamento":
      return { titulo: "Só para quem participa do grupo", texto, link: produto.linkInfo };
    case "sem_informacao":
      return { titulo: "Confirme antes de ir", texto, link: produto.linkInfo };
  }
}
