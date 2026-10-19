import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import type { Coordenadas } from "./distancia";

export type Localizacao =
  | ({ situacao: "ok" } & Coordenadas)
  | {
      situacao: "sem_permissao";
      /** O celular ainda mostra o pedido de permissão (senão, só nos ajustes). */
      podePedir: boolean;
      /** A pessoa nunca respondeu ao pedido: o app pergunta antes se ela prefere escolher a região. */
      nuncaPerguntado: boolean;
    }
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
 * Só mostra o pedido de permissão do celular com `pedir` (quando a pessoa toca em "Usar minha localização").
 */
export async function obterLocalizacao({ pedir }: { pedir: boolean }): Promise<Localizacao> {
  try {
    let permissao = await Location.getForegroundPermissionsAsync();
    if (!permissao.granted && pedir && permissao.canAskAgain) permissao = await Location.requestForegroundPermissionsAsync();
    if (!permissao.granted) {
      return {
        situacao: "sem_permissao",
        podePedir: permissao.canAskAgain,
        nuncaPerguntado: permissao.status === Location.PermissionStatus.UNDETERMINED,
      };
    }

    const posicao =
      (await Location.getLastKnownPositionAsync({ maxAge: 10 * 60_000, requiredAccuracy: 2000 })) ??
      (await comPrazo(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }), PRAZO_MS));
    return { situacao: "ok", lat: posicao.coords.latitude, lng: posicao.coords.longitude };
  } catch {
    // GPS desligado, sem sinal ou navegador sem suporte.
    return { situacao: "indisponivel" };
  }
}

const CHAVE = ["localizacao"];

/**
 * Localização do aparelho, guardada por 5 minutos. Sozinho, nunca mostra o pedido de permissão:
 * só `pedirLocalizacao` (botões "Usar minha localização" e "Tentar de novo").
 * `ativa: false` quando a pessoa preferiu a região: aí o GPS nem liga.
 */
export function useLocalizacao({ ativa = true }: { ativa?: boolean } = {}) {
  const queryClient = useQueryClient();
  const consulta = useQuery({
    queryKey: CHAVE,
    queryFn: () => obterLocalizacao({ pedir: false }),
    enabled: ativa,
    staleTime: 5 * 60_000,
    retry: false,
  });
  const pedido = useMutation({
    mutationFn: async () => {
      await queryClient.cancelQueries({ queryKey: CHAVE });
      return obterLocalizacao({ pedir: true });
    },
    onSuccess: (localizacao) => queryClient.setQueryData(CHAVE, localizacao),
  });
  return {
    localizacao: ativa ? consulta.data : undefined,
    procurando: (ativa && consulta.isFetching) || pedido.isPending,
    pedirLocalizacao: () => pedido.mutate(),
  };
}
