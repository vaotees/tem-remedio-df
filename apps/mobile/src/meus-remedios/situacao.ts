import type { Produto, Snapshot } from "@tem-remedio/shared";
import { indiceProduto } from "@/busca/remedios";
import { postosComEstoque, type Ordem, type PostoComEstoque } from "@/postos/postos";

/**
 * Como está um remédio guardado nos dados de hoje:
 * - `fora_dos_dados`: o código não aparece no snapshot (o item continua guardado, a pessoa decide se tira);
 * - `nenhum_posto`: aparece, mas nenhum posto tem hoje;
 * - `tem`: quantos postos têm e o primeiro deles na ordem pedida (o mais perto, ou o primeiro da região).
 */
export type SituacaoHoje =
  | { tipo: "fora_dos_dados" }
  | { tipo: "nenhum_posto"; produto: Produto }
  | { tipo: "tem"; produto: Produto; postos: number; primeiro: PostoComEstoque };

/**
 * Usa a mesma lista da tela de postos: controlado só nas UBSs que entregam controlados,
 * e unidades prisionais nunca entram.
 */
export function situacaoHoje(snapshot: Snapshot, codigo: string, ordem: Ordem): SituacaoHoje {
  const iProduto = indiceProduto(snapshot, codigo);
  const produto = snapshot.produtos[iProduto];
  if (!produto) return { tipo: "fora_dos_dados" };
  const postos = postosComEstoque(snapshot, iProduto, ordem);
  const primeiro = postos[0];
  if (!primeiro) return { tipo: "nenhum_posto", produto };
  return { tipo: "tem", produto, postos: postos.length, primeiro };
}

/** "Em 1 posto hoje", "Em 4 postos hoje" ou "Nenhum posto tem hoje". */
export function textoQuantos(postos: number): string {
  if (postos === 0) return "Nenhum posto tem hoje";
  return postos === 1 ? "Em 1 posto hoje" : `Em ${postos} postos hoje`;
}

/**
 * Como chamar o primeiro posto da lista. Sem localização nem região não existe "mais perto":
 * a ordem é por Região Administrativa e nome, e o app não mostra um posto qualquer como se fosse o melhor.
 */
export function tituloPrimeiro(ordem: Ordem, posto: PostoComEstoque): string | null {
  switch (ordem.por) {
    case "distancia":
      return "Mais perto de você";
    case "regiao":
      return posto.ubs.ra === ordem.ra ? "Na sua região" : "Mais perto da sua região";
    case "nome":
      return null;
  }
}
