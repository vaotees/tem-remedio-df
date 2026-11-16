import { z } from "zod";
import { linkOficialPermitido } from "./confianca";
import { RETIRADAS } from "./retirada";

export const VERSAO_SCHEMA = 1;

/**
 * Tetos de sanidade, uns 10 vezes acima dos dados reais (em 16/11/2026: 155 UBSs, 204 remédios,
 * 996 marcas, 18 mil itens de estoque, 479 KB, texto mais longo com 100 letras).
 * Passou disso, é erro na fonte ou arquivo adulterado: o coletor não publica e o app não baixa.
 */
export const LIMITES_SNAPSHOT = {
  bytes: 5_000_000,
  ubs: 2_000,
  produtos: 5_000,
  marcas: 20_000,
  estoque: 200_000,
  texto: 1_000,
} as const;

const texto = () => z.string().max(LIMITES_SNAPSHOT.texto);

/** Limites aproximados do DF, para descartar coordenadas erradas. */
export const LIMITES_DF = { latMin: -16.1, latMax: -15.4, lngMin: -48.4, lngMax: -47.2 } as const;

export const ubsSchema = z.object({
  cnes: z.string().regex(/^\d{7}$/),
  nome: texto().min(1),
  /** Nome do local de estoque na SES-DF (algumas UBSs têm duas farmácias). */
  farmacia: texto().min(1),
  regiaoSaude: texto(),
  ra: texto(),
  endereco: texto(),
  cep: texto().nullable(),
  telefone: texto().nullable(),
  horario: texto().nullable(),
  entregaControlados: z.boolean(),
  lat: z.number().gte(LIMITES_DF.latMin).lte(LIMITES_DF.latMax),
  lng: z.number().gte(LIMITES_DF.lngMin).lte(LIMITES_DF.lngMax),
});

export const produtoSchema = z.object({
  codigo: texto().min(1),
  /** Texto original da SES-DF. */
  descricao: texto().min(1),
  substancia: texto().min(1),
  forma: texto().nullable(),
  dose: texto().nullable(),
  liberacaoProlongada: z.boolean(),
  controlado: z.boolean(),
  retirada: z.enum(RETIRADAS),
  /** Link oficial com a lista de unidades, quando a retirada é restrita. */
  linkInfo: texto()
    .url()
    .refine(linkOficialPermitido, "link fora dos domínios oficiais (só https em saude.df.gov.br)")
    .nullable(),
  /** Texto normalizado para a busca. */
  busca: texto().min(1),
});

export const marcaSchema = z.object({
  /** Nome comercial normalizado (ex.: "GLIFAGE XR"). */
  nome: texto().min(1),
  /** Índices em `produtos` com a mesma substância. */
  produtos: z.array(z.number().int().nonnegative()).min(1).max(LIMITES_SNAPSHOT.produtos),
  /** A marca é de liberação prolongada (o app avisa se o produto do SUS não for). */
  liberacaoProlongada: z.boolean(),
});

/** [índice da UBS, índice do produto, quantidade, dias de estoque ou null] */
export const itemEstoqueSchema = z.tuple([
  z.number().int().nonnegative(),
  z.number().int().nonnegative(),
  z.number().positive(),
  z.number().int().nonnegative().nullable(),
]);

export const metaSchema = z.object({
  versaoSchema: z.literal(VERSAO_SCHEMA),
  /** Data da extração na SES-DF, horário de Brasília sem fuso (ex.: "2026-10-17T00:16:33"). */
  atualizadoEm: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/),
  /** Quando o coletor gerou o arquivo (ISO, UTC). */
  geradoEm: z.string().datetime(),
  fonte: texto(),
});

export const snapshotSchema = z
  .object({
    meta: metaSchema,
    ubs: z.array(ubsSchema).min(1).max(LIMITES_SNAPSHOT.ubs),
    produtos: z.array(produtoSchema).min(1).max(LIMITES_SNAPSHOT.produtos),
    marcas: z.array(marcaSchema).max(LIMITES_SNAPSHOT.marcas),
    estoque: z.array(itemEstoqueSchema).max(LIMITES_SNAPSHOT.estoque),
  })
  .superRefine((s, ctx) => {
    const nProdutos = s.produtos.length;
    s.estoque.forEach(([u, p], i) => {
      if (u >= s.ubs.length || p >= nProdutos) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["estoque", i], message: "índice fora do intervalo" });
      }
    });
    s.marcas.forEach((m, i) => {
      if (m.produtos.some((p) => p >= nProdutos)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["marcas", i], message: "produto inexistente" });
      }
    });
  });

export type Ubs = z.infer<typeof ubsSchema>;
export type Produto = z.infer<typeof produtoSchema>;
export type Marca = z.infer<typeof marcaSchema>;
export type ItemEstoque = z.infer<typeof itemEstoqueSchema>;
export type MetaSnapshot = z.infer<typeof metaSchema>;
export type Snapshot = z.infer<typeof snapshotSchema>;
