import { useQuery } from "@tanstack/react-query";
import { armazenamento } from "./armazenamento";
import { atualizarDaRede, carregarLocal, type Dependencias } from "./snapshot";

// `require` em vez de `import`: evita o TypeScript inferir o tipo de um JSON de meio mega.
const embutido: unknown = require("../../assets/dados/snapshot-inicial.json");

const deps: Dependencias = {
  armazenamento,
  embutido,
  urlBase: process.env.EXPO_PUBLIC_SNAPSHOT_URL || null,
};

/** Os dados do app: abre com o local (cache ou embutido) e procura dados novos em segundo plano. */
export function useSnapshot() {
  const local = useQuery({
    queryKey: ["snapshot", "local"],
    queryFn: () => carregarLocal(deps),
    staleTime: Infinity,
  });

  const atual = local.data?.snapshot;
  const rede = useQuery({
    queryKey: ["snapshot", "rede", atual?.meta.atualizadoEm],
    queryFn: () => atualizarDaRede(atual!, deps),
    enabled: !!atual && !!deps.urlBase,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  const fonte = rede.data ?? local.data;
  return {
    snapshot: fonte?.snapshot,
    origem: fonte?.origem,
    carregando: local.isPending,
    erro: local.error,
    procurandoNovos: rede.isFetching,
    erroRede: rede.error,
    temRede: !!deps.urlBase,
    procurarNovos: () => rede.refetch(),
  };
}
