// Dados reais para o mapa do filme: as farmácias de UBS do snapshot publicado e o estoque de um remédio.
// Na pasta marketing/filme:  node dados.mjs [código do produto, padrão 8944 = losartana 50 mg]
// Grava src/dados/mapa.json. Não roda no render: o filme usa sempre o arquivo gravado (o quadro não muda
// sozinho quando a SES-DF atualiza).
import { writeFileSync } from "node:fs";

const URL_BASE = "https://vaotees.github.io/tem-remedio-df";
const codigo = process.argv[2] ?? "8944";

const [meta, snapshot] = await Promise.all([
  fetch(`${URL_BASE}/meta.json`).then((r) => r.json()),
  fetch(`${URL_BASE}/snapshot.json`).then((r) => r.json()),
]);

const iProduto = snapshot.produtos.findIndex((p) => p.codigo === codigo);
if (iProduto < 0) throw new Error(`Produto ${codigo} não está no snapshot`);
const produto = snapshot.produtos[iProduto];

// Mesmo critério do app (packages/shared/src/estoque.ts): crítico < 7 dias, baixo < 30, sem consumo = null.
const nivel = (dias) => (dias === null ? "sem_consumo" : dias < 7 ? "critico" : dias < 30 ? "baixo" : "alto");
const prisional = (u) => /PRISIONAL/i.test(u.horario ?? "") || /PRISIONAL/i.test(u.farmacia);

const estoque = new Map();
for (const [iUbs, iProd, , dias] of snapshot.estoque) if (iProd === iProduto) estoque.set(iUbs, dias);

const postos = snapshot.ubs
  .map((u, i) => ({ u, i }))
  .filter(({ u }) => !prisional(u))
  .map(({ u, i }) => ({
    nome: u.nome,
    ra: u.ra,
    lat: u.lat,
    lng: u.lng,
    tem: estoque.has(i),
    dias: estoque.has(i) ? estoque.get(i) : null,
    nivel: estoque.has(i) ? nivel(estoque.get(i)) : null,
  }));

const contagem = { alto: 0, baixo: 0, critico: 0, sem_consumo: 0 };
for (const p of postos) if (p.tem) contagem[p.nivel]++;

const saida = {
  atualizadoEm: meta.atualizadoEm,
  produto: { codigo, substancia: produto.substancia, forma: produto.forma, dose: produto.dose },
  total: postos.length,
  comEstoque: postos.filter((p) => p.tem).length,
  contagem,
  postos,
};
writeFileSync(new URL("./src/dados/mapa.json", import.meta.url), JSON.stringify(saida, null, 1));
console.log(`${produto.substancia} ${produto.dose}: ${saida.comEstoque} de ${saida.total} postos têm (dados de ${meta.atualizadoEm})`, contagem);
