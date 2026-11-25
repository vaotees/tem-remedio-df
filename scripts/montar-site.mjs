#!/usr/bin/env node
/**
 * Monta o site do GitHub Pages: os dados do coletor (snapshot.json, meta.json) na raiz e a versão web
 * do app em /app. O GitHub Pages publica o site inteiro de uma vez, por isso os dois saem juntos.
 *
 * Uso: node scripts/montar-site.mjs --dados pipeline/saida --web apps/mobile/dist --saida _site
 *
 * - `404.html` é o `index.html` do app: o GitHub Pages devolve esse arquivo para qualquer endereço que
 *   não existe (ex.: /tem-remedio-df/app/postos/8944), e o Expo Router abre a tela certa pelo endereço.
 *   Os arquivos do app são pedidos pelo caminho completo (baseUrl), então funcionam de qualquer endereço.
 * - `index.html` da raiz leva para o app.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    dados: { type: "string" },
    web: { type: "string" },
    saida: { type: "string" },
  },
});

function exigir(nome) {
  const valor = values[nome];
  if (!valor) {
    console.error(`Falta --${nome}. Uso: node scripts/montar-site.mjs --dados <pasta> --web <pasta> --saida <pasta>`);
    process.exit(1);
  }
  return resolve(valor);
}

const dados = exigir("dados");
const web = exigir("web");
const saida = exigir("saida");

for (const arquivo of ["snapshot.json", "meta.json"]) {
  if (!existsSync(join(dados, arquivo))) {
    console.error(`Não achei ${arquivo} em ${dados}: o site sairia sem os dados.`);
    process.exit(1);
  }
}
const indexDoApp = join(web, "index.html");
if (!existsSync(indexDoApp)) {
  console.error(`Não achei index.html em ${web}: rode antes "expo export --platform web".`);
  process.exit(1);
}

rmSync(saida, { recursive: true, force: true });
mkdirSync(saida, { recursive: true });

// Dados na raiz, nos mesmos endereços de sempre (o app e o coletor leem daqui).
for (const nome of readdirSync(dados)) cpSync(join(dados, nome), join(saida, nome), { recursive: true });

// App em /app.
cpSync(web, join(saida, "app"), { recursive: true });
writeFileSync(join(saida, "404.html"), readFileSync(indexDoApp));

// Sem o processamento do Jekyll (o Expo põe os arquivos em _expo/, e o Jekyll esconde pastas com "_").
writeFileSync(join(saida, ".nojekyll"), "");

writeFileSync(
  join(saida, "index.html"),
  `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Tem Remédio DF</title>
<meta http-equiv="refresh" content="0; url=./app/">
<link rel="canonical" href="./app/">
</head>
<body>
<p><a href="./app/">Abrir o Tem Remédio DF</a></p>
</body>
</html>
`,
);

console.log(`Site montado em ${saida}: dados na raiz, app em /app.`);
