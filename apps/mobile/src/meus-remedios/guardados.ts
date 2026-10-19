import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { z } from "zod";
import { armazenamento } from "@/dados/armazenamento";

const remedioSchema = z.object({
  /** Código SES-DF do produto: não muda quando os dados atualizam. */
  codigo: z.string().min(1),
  /** Nome e forma/dose de quando foi guardado: aparecem mesmo se o remédio sumir dos dados. */
  nome: z.string().min(1),
  apresentacao: z.string(),
  /** A marca que a pessoa buscou (ex.: "GLIFAGE XR"), ou null se buscou pelo nome do remédio. */
  marca: z.string().min(1).nullable(),
  /** Quando foi guardado (ISO 8601). */
  guardadoEm: z.string(),
});

export type RemedioGuardado = z.infer<typeof remedioSchema>;
export type NovoRemedio = Omit<RemedioGuardado, "guardadoEm">;

/** Os itens são conferidos um a um: um item estragado não leva a lista inteira junto. */
const arquivoSchema = z.object({ remedios: z.array(z.unknown()) });

/** Fica só neste aparelho (LGPD): a lista de remédios da pessoa não vai para servidor nenhum. */
export const ARQUIVO_MEUS_REMEDIOS = "meus-remedios.json";
const CHAVE = ["meus-remedios"];

/** Lê a lista do aparelho. Sem arquivo, ou com o arquivo estragado, a lista começa vazia. */
export async function lerMeusRemedios(): Promise<RemedioGuardado[]> {
  try {
    const texto = await armazenamento.ler(ARQUIVO_MEUS_REMEDIOS);
    if (!texto) return [];
    const arquivo = arquivoSchema.safeParse(JSON.parse(texto));
    if (!arquivo.success) return [];
    const lista: RemedioGuardado[] = [];
    for (const item of arquivo.data.remedios) {
      const lido = remedioSchema.safeParse(item);
      if (lido.success && !lista.some((r) => r.codigo === lido.data.codigo)) lista.push(lido.data);
    }
    return lista;
  } catch {
    return [];
  }
}

/** Em ordem alfabética: a pessoa acha o remédio pelo nome, sempre no mesmo lugar. */
const porNome = (a: RemedioGuardado, b: RemedioGuardado) =>
  a.nome.localeCompare(b.nome, "pt-BR") || a.apresentacao.localeCompare(b.apresentacao, "pt-BR");

/** A lista de Meus remédios, lida do aparelho uma vez e mantida em memória. */
export function useMeusRemedios() {
  const queryClient = useQueryClient();
  const consulta = useQuery({ queryKey: CHAVE, queryFn: lerMeusRemedios, staleTime: Infinity });
  const remedios = useMemo(() => [...(consulta.data ?? [])].sort(porNome), [consulta.data]);

  const mudar = async (mudanca: (lista: RemedioGuardado[]) => RemedioGuardado[]) => {
    // Lê o arquivo antes, se ainda não leu: gravar sobre uma lista não lida apagaria os outros remédios.
    await queryClient.ensureQueryData({ queryKey: CHAVE, queryFn: lerMeusRemedios });
    const nova = mudanca(queryClient.getQueryData<RemedioGuardado[]>(CHAVE) ?? []);
    queryClient.setQueryData(CHAVE, nova);
    try {
      await armazenamento.gravar(ARQUIVO_MEUS_REMEDIOS, JSON.stringify({ remedios: nova }));
    } catch {
      // Sem espaço no aparelho: a lista vale até fechar o app.
    }
  };

  return {
    carregando: consulta.isPending,
    remedios,
    estaGuardado: (codigo: string) => remedios.some((r) => r.codigo === codigo),
    guardar: (remedio: NovoRemedio, agora: Date = new Date()) =>
      mudar((lista) => [
        ...lista.filter((r) => r.codigo !== remedio.codigo),
        { ...remedio, guardadoEm: agora.toISOString() },
      ]),
    tirar: (codigo: string) => mudar((lista) => lista.filter((r) => r.codigo !== codigo)),
  };
}
