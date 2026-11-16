import { dataNoFuturo, LIMITES_SNAPSHOT, snapshotSchema, type Snapshot } from "@tem-remedio/shared";
import { VALIDACAO } from "./config";

/** O que o coletor sabe do último snapshot publicado (vem do meta.json). */
export interface ResumoPublicado {
  atualizadoEm: string;
  contagens: { ubs: number; produtos: number; estoque: number };
}

export type StatusValidacao = "publicar" | "sem_mudanca" | "rejeitar";

export interface ResultadoValidacao {
  status: StatusValidacao;
  erros: string[];
  avisos: string[];
}

export function validarSnapshot(
  s: Snapshot,
  publicado: ResumoPublicado | null,
  limites = VALIDACAO,
  agora: number = Date.now(),
): ResultadoValidacao {
  const erros: string[] = [];
  const avisos: string[] = [];

  // Publicado com data no futuro (ano errado na fonte ou Pages adulterado) travaria toda coleta
  // seguinte em "dados mais antigos". Ignora o publicado: os dados de agora o substituem.
  let anterior = publicado;
  if (anterior && dataNoFuturo({ atualizadoEm: anterior.atualizadoEm }, agora)) {
    avisos.push(`o publicado tem data no futuro (${anterior.atualizadoEm}): ignorado, os dados de agora substituem`);
    anterior = null;
  }

  const parse = snapshotSchema.safeParse(s);
  if (!parse.success) {
    erros.push(
      ...parse.error.issues.slice(0, 10).map((i) => `schema: ${i.path.join(".")}: ${i.message}`),
    );
  }

  if (dataNoFuturo(s.meta, agora)) {
    erros.push(`data no futuro (${s.meta.atualizadoEm}, gerado em ${s.meta.geradoEm}): erro na fonte?`);
  }
  const bytes = Buffer.byteLength(JSON.stringify(s));
  if (bytes > LIMITES_SNAPSHOT.bytes) erros.push(`${bytes} bytes (máximo ${LIMITES_SNAPSHOT.bytes}): o app não baixaria`);

  if (s.ubs.length < limites.minUbs) erros.push(`só ${s.ubs.length} UBSs (mínimo ${limites.minUbs})`);
  if (s.produtos.length < limites.minProdutos) erros.push(`só ${s.produtos.length} produtos (mínimo ${limites.minProdutos})`);
  if (s.estoque.length < limites.minItensEstoque) {
    erros.push(`só ${s.estoque.length} itens de estoque (mínimo ${limites.minItensEstoque})`);
  }

  if (anterior) {
    if (s.meta.atualizadoEm < anterior.atualizadoEm) {
      erros.push(`dados mais antigos que os publicados (${s.meta.atualizadoEm} < ${anterior.atualizadoEm})`);
    }
    const quedas: [string, number, number][] = [
      ["UBSs", s.ubs.length, anterior.contagens.ubs],
      ["produtos", s.produtos.length, anterior.contagens.produtos],
      ["itens de estoque", s.estoque.length, anterior.contagens.estoque],
    ];
    for (const [nome, novo, antigo] of quedas) {
      if (antigo > 0 && (antigo - novo) / antigo > limites.quedaMaxima) {
        erros.push(`${nome} caíram de ${antigo} para ${novo} (mais de ${limites.quedaMaxima * 100}%)`);
      }
    }
  }

  if (erros.length) return { status: "rejeitar", erros, avisos };
  if (anterior && s.meta.atualizadoEm === anterior.atualizadoEm) {
    avisos.push(`a SES-DF ainda não atualizou (dados de ${s.meta.atualizadoEm})`);
    return { status: "sem_mudanca", erros, avisos };
  }
  return { status: "publicar", erros, avisos };
}
