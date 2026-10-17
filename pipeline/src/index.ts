/**
 * Coletor diário: extrai → limpa → valida → publica.
 *
 * Uso: pnpm coletar [--saida saida] [--anterior <url ou caminho do meta.json publicado>]
 * Sai com código 1 se o snapshot for rejeitado (o publicado continua valendo).
 */
import { appendFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { lerCmed, obterCmed } from "./fontes/cmed";
import { buscarCnes, lerCache, salvarCache } from "./fontes/cnes";
import { buscarDataExtracao, buscarEstoque } from "./fontes/estoque";
import { buscarCadastroUbs, buscarRegras } from "./fontes/garantir";
import { escreverSaida, lerPublicado } from "./publicar";
import { montarSnapshot } from "./transformar/montar";
import { validarSnapshot } from "./validar";

const { values: args } = parseArgs({
  options: {
    saida: { type: "string", default: "saida" },
    anterior: { type: "string", default: process.env.ANTERIOR_URL },
    "cache-cnes": { type: "string", default: "dados/cnes-cache.json" },
    "cache-cmed": { type: "string", default: ".cache/cmed.csv" },
  },
});

const log = (msg: string) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);

async function saidaGithub(chave: string, valor: string) {
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `${chave}=${valor}\n`);
}

async function main() {
  const inicio = Date.now();

  log("Lendo o snapshot publicado...");
  const anterior = await lerPublicado(args.anterior);
  log(anterior ? `Publicado: dados de ${anterior.atualizadoEm}` : "Nenhum snapshot publicado ainda");

  log("Extraindo da SES-DF (estoque, regras de retirada, cadastro das UBSs)...");
  const [atualizadoEm, estoque, regras, cadastroUbs] = await Promise.all([
    buscarDataExtracao(),
    buscarEstoque(),
    buscarRegras(),
    buscarCadastroUbs(),
  ]);
  log(`Dados de ${atualizadoEm}: ${estoque.length} linhas com estoque, ${regras.length} regras, ${cadastroUbs.length} UBSs no cadastro`);

  if (anterior && atualizadoEm === anterior.atualizadoEm) {
    log("A SES-DF ainda não atualizou. Nada a publicar.");
    await saidaGithub("publicar", "false");
    return;
  }

  log("Buscando endereços e coordenadas no CNES...");
  const cache = await lerCache(args["cache-cnes"]!);
  const { dados: cnes, doCache, ausentes } = await buscarCnes(
    estoque.map((l) => l.cnes),
    cache,
  );
  if (doCache.length) log(`CNES: ${doCache.length} vieram do cache (API falhou)`);
  if (ausentes.length) log(`CNES: sem dados para ${ausentes.join(", ")}`);
  await salvarCache(args["cache-cnes"]!, { ...cache, ...cnes });

  log("Baixando a tabela CMED (Anvisa)...");
  const { csv, doCache: cmedDoCache } = await obterCmed(args["cache-cmed"]!);
  const cmed = lerCmed(csv);
  log(`CMED: ${cmed.length} apresentações${cmedDoCache ? " (cópia local, Anvisa falhou)" : ""}`);

  const { snapshot, avisos, descartes } = montarSnapshot({ atualizadoEm, estoque, regras, cadastroUbs, cnes, cmed });
  log(
    `Snapshot: ${snapshot.ubs.length} UBSs, ${snapshot.produtos.length} remédios, ` +
      `${snapshot.marcas.length} marcas, ${snapshot.estoque.length} itens de estoque`,
  );
  log(`Descartados: ${Object.entries(descartes).map(([k, v]) => `${k}=${v}`).join(", ")}`);
  for (const a of avisos) log(`AVISO: ${a}`);

  const validacao = validarSnapshot(snapshot, anterior);
  for (const a of validacao.avisos) log(`AVISO: ${a}`);
  if (validacao.status === "rejeitar") {
    for (const e of validacao.erros) log(`ERRO: ${e}`);
    log("Snapshot rejeitado. O publicado continua valendo.");
    await saidaGithub("publicar", "false");
    process.exitCode = 1;
    return;
  }
  if (validacao.status === "sem_mudanca") {
    await saidaGithub("publicar", "false");
    return;
  }

  const meta = await escreverSaida(args.saida!, snapshot);
  log(`Gravado em ${args.saida}/ (${(meta.bytes / 1024).toFixed(0)} KB) em ${((Date.now() - inicio) / 1000).toFixed(0)} s`);
  await saidaGithub("publicar", "true");
}

main().catch(async (erro) => {
  console.error(erro);
  await saidaGithub("publicar", "false");
  process.exitCode = 1;
});
