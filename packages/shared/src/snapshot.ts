import { z } from "zod";
import { RETIRADAS } from "./retirada";

export const VERSAO_SCHEMA = 1;

/** Limites aproximados do DF, para descartar coordenadas erradas. */
export const LIMITES_DF = { latMin: -16.1, latMax: -15.4, lngMin: -48.4, lngMax: -47.2 } as const;

export const ubsSchema = z.object({
  cnes: z.string().regex(/^\d{7}$/),
  nome: z.string().min(1),
  /** Nome do local de estoque na SES-DF (algumas UBSs têm duas farmácias). */
  farmacia: z.string().min(1),
  regiaoSaude: z.string(),
  ra: z.string(),
  endereco: z.string(),
  cep: z.string().nullable(),
  telefone: z.string().nullable(),
  horario: z.string().nullable(),
  entregaControlados: z.boolean(),
  lat: z.number().gte(LIMITES_DF.latMin).lte(LIMITES_DF.latMax),
  lng: z.number().gte(LIMITES_DF.lngMin).lte(LIMITES_DF.lngMax),
});

export const produtoSchema = z.object({
  codigo: z.string().min(1),
  /** Texto original da SES-DF. */
  descricao: z.string().min(1),
  substancia: z.string().min(1),
  forma: z.string().nullable(),
  dose: z.string().nullable(),
  liberacaoProlongada: z.boolean(),
  controlado: z.boolean(),
  retirada: z.enum(RETIRADAS),
  /** Link oficial com a lista de unidades, quando a retirada é restrita. */
  linkInfo: z.string().url().nullable(),
  /** Texto normalizado para a busca. */
  busca: z.string().min(1),
});

export const marcaSchema = z.object({
  /** Nome comercial normalizado (ex.: "GLIFAGE XR"). */
  nome: z.string().min(1),
  /** Índices em `produtos` com a mesma substância. */
  produtos: z.array(z.number().int().nonnegative()).min(1),
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
  fonte: z.string(),
});

export const snapshotSchema = z
  .object({
    meta: metaSchema,
    ubs: z.array(ubsSchema).min(1),
    produtos: z.array(produtoSchema).min(1),
    marcas: z.array(marcaSchema),
    estoque: z.array(itemEstoqueSchema),
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
