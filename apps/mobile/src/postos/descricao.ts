import { nivelEstoque, TEXTO_NIVEL } from "@tem-remedio/shared";
import { capitalizarNome } from "@/busca/remedios";
import { formatarDistancia } from "./distancia";
import { interpretarHorario, situacaoHorario } from "./horario";
import type { PostoComEstoque } from "./postos";

export interface DescricaoPosto {
  nome: string;
  /** "Plano Piloto · 4,0 km", ou só a região sem localização. */
  onde: string;
  /** O que o leitor de tela fala do posto inteiro. */
  rotulo: string;
}

/** Os mesmos textos de um posto na lista e no cartão do mapa. */
export function descreverPosto({ ubs, dias, distanciaKm }: PostoComEstoque, agora: Date = new Date()): DescricaoPosto {
  const nome = capitalizarNome(ubs.nome);
  const distancia = distanciaKm !== null ? formatarDistancia(distanciaKm) : null;
  const faixas = interpretarHorario(ubs.horario);
  const horario = faixas ? situacaoHorario(faixas, agora).texto : null;
  const rotulo = [
    nome,
    distancia ? `${ubs.ra}, a ${distancia} em linha reta` : ubs.ra,
    `Estoque: ${TEXTO_NIVEL[nivelEstoque(dias)]}`,
    horario,
  ]
    .filter(Boolean)
    .join(". ");
  return { nome, onde: distancia ? `${ubs.ra} · ${distancia}` : ubs.ra, rotulo };
}
