import type { Snapshot } from "@tem-remedio/shared";
import { useMemo } from "react";
import { useLocalizacao, type Localizacao } from "./localizacao";
import { estaForaDoDf, type Ordem } from "./postos";
import { useRegiaoEscolhida, type EscolhaRegiao } from "./regiao-escolhida";

/**
 * De onde contar "mais perto":
 * 1. a região, se a pessoa a escolheu por último;
 * 2. a localização do aparelho, se der (e a pessoa estiver no DF);
 * 3. a região escolhida antes, se o GPS falhar;
 * 4. senão, por Região Administrativa e nome.
 */
export function decidirOrdem(snapshot: Snapshot, localizacao: Localizacao | undefined, escolha: EscolhaRegiao): Ordem {
  if (escolha.usarRegiao && escolha.ra) return { por: "regiao", ra: escolha.ra };
  if (localizacao?.situacao === "ok" && !estaForaDoDf(snapshot, localizacao)) {
    return { por: "distancia", origem: { lat: localizacao.lat, lng: localizacao.lng } };
  }
  if (escolha.ra) return { por: "regiao", ra: escolha.ra };
  return { por: "nome" };
}

/** Junta a região escolhida e a localização para a lista e o mapa de postos. */
export function useOrigem(snapshot: Snapshot) {
  const regiao = useRegiaoEscolhida();
  const { ra, usarRegiao, carregando: lendoRegiao } = regiao;
  const ativa = !lendoRegiao && !usarRegiao;
  const { localizacao, procurando, pedirLocalizacao } = useLocalizacao({ ativa });

  const ordem = useMemo(
    () => decidirOrdem(snapshot, localizacao, { ra, usarRegiao }),
    [snapshot, localizacao, ra, usarRegiao],
  );

  return {
    ordem,
    /** Ainda lendo a região salva ou esperando o GPS responder pela primeira vez. */
    carregando: lendoRegiao || (ativa && localizacao === undefined),
    /** Primeira vez: o app pergunta se a pessoa quer usar a localização ou escolher a região. */
    perguntar:
      ra === null &&
      localizacao?.situacao === "sem_permissao" &&
      localizacao.nuncaPerguntado &&
      // Navegador sem localização nenhuma: não adianta oferecer.
      localizacao.podePedir,
    localizacao,
    foraDoDf: localizacao?.situacao === "ok" && ordem.por !== "distancia" && !usarRegiao,
    ra,
    usarRegiao,
    procurando,
    usarLocalizacao: () => {
      regiao.preferirLocalizacao();
      pedirLocalizacao();
    },
  };
}
