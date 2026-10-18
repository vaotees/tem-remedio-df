import { TEXTO_RETIRADA, type Produto, type Snapshot, type Ubs } from "@tem-remedio/shared";
import { distanciaKm, type Coordenadas } from "./distancia";

export interface PostoComEstoque {
  ubs: Ubs;
  quantidade: number;
  dias: number | null;
  /** null quando não há localização: aí a lista vai por Região Administrativa. */
  distanciaKm: number | null;
}

/**
 * UBSs do sistema prisional (horário "OUTRO/PRISIONAL" no cadastro da SES-DF) atendem só a população
 * presa: não podem aparecer como "posto mais perto" para o público.
 */
export function ehUnidadePrisional(ubs: Ubs): boolean {
  return /PRISIONAL/i.test(`${ubs.horario ?? ""} ${ubs.farmacia}`);
}

/**
 * Postos que têm o produto hoje, do mais perto para o mais longe.
 * Sem localização, por Região Administrativa e nome (a escolha manual da região vem no M4).
 * Remédio controlado só aparece nas UBSs que entregam controlados; unidades prisionais nunca aparecem.
 */
export function postosComEstoque(snapshot: Snapshot, iProduto: number, origem: Coordenadas | null): PostoComEstoque[] {
  const produto = snapshot.produtos[iProduto];
  if (!produto) return [];

  const postos: PostoComEstoque[] = [];
  for (const [iUbs, iProd, quantidade, dias] of snapshot.estoque) {
    if (iProd !== iProduto) continue;
    const ubs = snapshot.ubs[iUbs];
    if (!ubs || ehUnidadePrisional(ubs)) continue;
    if (produto.retirada === "controlado" && !ubs.entregaControlados) continue;
    postos.push({ ubs, quantidade, dias, distanciaKm: origem ? distanciaKm(origem, ubs) : null });
  }

  return postos.sort((a, b) =>
    a.distanciaKm !== null && b.distanciaKm !== null
      ? a.distanciaKm - b.distanciaKm
      : a.ubs.ra.localeCompare(b.ubs.ra, "pt-BR") || a.ubs.nome.localeCompare(b.ubs.nome, "pt-BR"),
  );
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
