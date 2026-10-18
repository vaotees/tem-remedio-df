import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import type { Coordenadas } from "./distancia";

export type Localizacao =
  | ({ situacao: "ok" } & Coordenadas)
  | { situacao: "sem_permissao"; podePedir: boolean }
  | { situacao: "indisponivel" };

/** Sem resposta do GPS nesse tempo, a lista segue por região (o idoso não fica olhando o "carregando"). */
const PRAZO_MS = 10_000;

function comPrazo<T>(promessa: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("tempo esgotado")), ms);
    promessa.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e: unknown) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

/**
 * Onde a pessoa está, só para ordenar os postos por distância.
 * A localização fica no aparelho: não vai para servidor nenhum.
 */
export async function obterLocalizacao(): Promise<Localizacao> {
  try {
    let permissao = await Location.getForegroundPermissionsAsync();
    if (!permissao.granted && permissao.canAskAgain) permissao = await Location.requestForegroundPermissionsAsync();
    if (!permissao.granted) return { situacao: "sem_permissao", podePedir: permissao.canAskAgain };

    const posicao =
      (await Location.getLastKnownPositionAsync({ maxAge: 10 * 60_000, requiredAccuracy: 2000 })) ??
      (await comPrazo(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }), PRAZO_MS));
    return { situacao: "ok", lat: posicao.coords.latitude, lng: posicao.coords.longitude };
  } catch {
    // GPS desligado, sem sinal ou navegador sem suporte.
    return { situacao: "indisponivel" };
  }
}

/** Pede a localização uma vez por uso do app; "Usar minha localização" pede de novo. */
export function useLocalizacao() {
  const consulta = useQuery({
    queryKey: ["localizacao"],
    queryFn: obterLocalizacao,
    staleTime: 5 * 60_000,
    retry: false,
  });
  return {
    localizacao: consulta.data,
    procurando: consulta.isFetching,
    tentarDeNovo: () => consulta.refetch(),
  };
}
