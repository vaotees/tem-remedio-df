import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { armazenamento } from "@/dados/armazenamento";

const escolhaSchema = z.object({
  /** Região Administrativa escolhida (nome de `REGIOES`), ou null se a pessoa nunca escolheu. */
  ra: z.string().min(1).nullable(),
  /** A pessoa escolheu a região por último: ela vale mesmo com a localização ligada (ex.: o filho procurando para a mãe). */
  usarRegiao: z.boolean(),
});

export type EscolhaRegiao = z.infer<typeof escolhaSchema>;

/** Fica só neste aparelho (LGPD): não vai para servidor nenhum. */
export const ARQUIVO_REGIAO = "regiao.json";
const CHAVE = ["regiao"];
const NENHUMA: EscolhaRegiao = { ra: null, usarRegiao: false };

export async function lerEscolhaRegiao(): Promise<EscolhaRegiao> {
  try {
    const texto = await armazenamento.ler(ARQUIVO_REGIAO);
    if (!texto) return NENHUMA;
    const lido = escolhaSchema.safeParse(JSON.parse(texto));
    return lido.success ? lido.data : NENHUMA;
  } catch {
    return NENHUMA;
  }
}

/** A região escolhida, lida do aparelho uma vez e mantida em memória. */
export function useRegiaoEscolhida() {
  const queryClient = useQueryClient();
  const consulta = useQuery({ queryKey: CHAVE, queryFn: lerEscolhaRegiao, staleTime: Infinity });
  const escolha = consulta.data ?? NENHUMA;

  const salvar = async (nova: EscolhaRegiao) => {
    queryClient.setQueryData(CHAVE, nova);
    try {
      await armazenamento.gravar(ARQUIVO_REGIAO, JSON.stringify(nova));
    } catch {
      // Sem espaço no aparelho: a escolha vale até fechar o app.
    }
  };

  return {
    carregando: consulta.isPending,
    ra: escolha.ra,
    usarRegiao: escolha.usarRegiao && escolha.ra !== null,
    escolherRegiao: (ra: string) => salvar({ ra, usarRegiao: true }),
    /** Volta a usar a localização, guardando a região para quando o GPS falhar. */
    preferirLocalizacao: () => salvar({ ra: escolha.ra, usarRegiao: false }),
  };
}
