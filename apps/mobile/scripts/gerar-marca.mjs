// Gera o símbolo do Tem Remédio DF (o visto feito de cápsula) em SVG e exporta os PNGs do app.
//
//   node apps/mobile/scripts/gerar-marca.mjs
//
// O desenho mora aqui, em coordenadas: os SVGs de `assets/marca/` e os PNGs de `assets/` saem
// deste arquivo. Para mudar o logo, mude as medidas abaixo e rode de novo.
// Os PNGs são feitos pelo Google Chrome sem janela (protocolo DevTools), sem dependências;
// em outro sistema, aponte a variável CHROME para o executável do Chrome ou do Chromium.
import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32, deflateSync, inflateSync } from "node:zlib";

const RAIZ_APP = join(dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = join(RAIZ_APP, "assets");
const MARCA = join(ASSETS, "marca");
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// ---------- Cores ----------
// Azuis e fundos vêm de src/tema/cores.ts; menta e verde são as cores novas da marca.
export const CORES = {
  azul: "#0B5FA5", // primária do tema claro
  azulClaro: "#6CB4F5", // primária do tema escuro
  branco: "#FFFFFF",
  menta: "#86E3BC", // destaque sobre o azul e sobre o fundo escuro
  verde: "#1F8A5E", // destaque sobre o branco
  fundoEscuro: "#0F1115", // fundo do tema escuro
};

const VARIANTES = {
  /** Sobre o azul do ícone do app. */
  icone: { perna: CORES.branco, baixo: CORES.branco, cima: CORES.menta },
  /** Sobre fundo claro (tela de abertura, README). */
  claro: { perna: CORES.azul, baixo: CORES.azul, cima: CORES.verde },
  /** Sobre fundo escuro. */
  escuro: { perna: CORES.azulClaro, baixo: CORES.azulClaro, cima: CORES.menta },
  /** Uma cor só: ícone temático do Android 13+ (o sistema usa só a transparência). */
  mono: { perna: "#000000", baixo: "#000000", cima: "#000000" },
};

// ---------- Geometria (quadro de 1024) ----------
const RAIO = 84; // metade da espessura do traço: 168 de 1024, quase 5 px num ícone de 29
const FRESTA_CORTE = 30; // fresta entre a cápsula e a perna curta do visto
const FRESTA_MEIO = 22; // fresta entre as duas metades da cápsula

const polar = (graus, r) => [Math.cos((graus * Math.PI) / 180) * r, -Math.sin((graus * Math.PI) / 180) * r];
const soma = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const esc = (a, k) => [a[0] * k, a[1] * k];
const unit = (a) => esc(a, 1 / Math.hypot(a[0], a[1]));
const f = (n) => Math.round(n * 10) / 10;
const pt = (p) => `${f(p[0])} ${f(p[1])}`;

// Vértice do visto, ponta da cápsula (perna longa, 50°) e ponta da perna curta (140°).
const V0 = [0, 0];
const T0 = polar(50, 500);
const S0 = polar(140, 236);
// Centraliza pela caixa dos centros, com um ajuste ótico (o visto pesa à esquerda e embaixo).
const cx = (Math.min(S0[0], V0[0], T0[0]) + Math.max(S0[0], V0[0], T0[0])) / 2;
const cy = (Math.min(S0[1], V0[1], T0[1]) + Math.max(S0[1], V0[1], T0[1])) / 2;
const desloc = [512 - cx + 6, 512 - cy + 8];
const V = soma(V0, desloc);
const T = soma(T0, desloc);
const S = soma(S0, desloc);

/** Cápsula inteira (estádio) entre os centros p1 e p2. */
function capsula(p1, p2, r) {
  const u = unit(sub(p2, p1));
  const n = [-u[1], u[0]];
  const a = soma(p1, esc(n, r));
  const b = soma(p2, esc(n, r));
  const c = sub(p2, esc(n, r));
  const d = sub(p1, esc(n, r));
  return `M${pt(a)} L${pt(b)} A${r} ${r} 0 0 0 ${pt(c)} L${pt(d)} A${r} ${r} 0 0 0 ${pt(a)} Z`;
}

/** Meia cápsula: ponta redonda em `redonda`, corte reto em `reta`. */
function meiaCapsula(redonda, reta, r) {
  const u = unit(sub(redonda, reta));
  const n = [-u[1], u[0]];
  const a = soma(reta, esc(n, r));
  const b = soma(redonda, esc(n, r));
  const c = sub(redonda, esc(n, r));
  const d = sub(reta, esc(n, r));
  return `M${pt(a)} L${pt(b)} A${r} ${r} 0 0 0 ${pt(c)} L${pt(d)} Z`;
}

const meio = esc(soma(V, T), 0.5);
const eixo = unit(sub(T, V));
const CAPSULA = capsula(V, T, RAIO);
const METADE_BAIXO = meiaCapsula(V, sub(meio, esc(eixo, FRESTA_MEIO / 2)), RAIO);
const METADE_CIMA = meiaCapsula(T, soma(meio, esc(eixo, FRESTA_MEIO / 2)), RAIO);
const PERNA = capsula(S, V, RAIO);

/** Maior distância do centro do quadro até a borda do símbolo, na escala 1. */
const ALCANCE = Math.max(...[S, V, T].map((p) => Math.hypot(p[0] - 512, p[1] - 512) + RAIO));

/** Desenho do símbolo, centrado em (512, 512) e escalado em torno do centro. */
function simbolo(variante, escala, id) {
  const k = VARIANTES[variante];
  const t = escala === 1 ? "" : ` transform="translate(512 512) scale(${escala}) translate(-512 -512)"`;
  return `<g${t}>
    <mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">
      <rect width="1024" height="1024" fill="#FFFFFF"/>
      <path d="${CAPSULA}" fill="#000000" stroke="#000000" stroke-width="${FRESTA_CORTE * 2}"/>
    </mask>
    <path d="${PERNA}" fill="${k.perna}" mask="url(#${id})"/>
    <path d="${METADE_BAIXO}" fill="${k.baixo}"/>
    <path d="${METADE_CIMA}" fill="${k.cima}"/>
  </g>`;
}

const svg = (corpo, { titulo, lado = 1024 } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 1024 1024">` +
  (titulo ? `\n  <title>${titulo}</title>` : "") +
  `\n  ${corpo}\n</svg>\n`;

// ---------- Escalas de cada uso ----------
// Área segura do ícone adaptável do Android: círculo de 66 dp num quadro de 108 dp.
const RAIO_SEGURO_ANDROID = (66 / 108) * 512;
const ESCALA = {
  ios: 0.92, // ~62% da largura do ícone
  android: 0.66, // ~65% do círculo visível; cabe na área segura com folga
  abertura: 470 / ALCANCE, // cabe no círculo inscrito da imagem (o Android 12+ corta em círculo)
  favicon: 1, // maior que no iOS: o favicon aparece com 16 px
};

if (ALCANCE * ESCALA.android > RAIO_SEGURO_ANDROID) {
  throw new Error(`O símbolo sai da área segura do Android (${ALCANCE * ESCALA.android} > ${RAIO_SEGURO_ANDROID})`);
}

// ---------- SVGs de origem ----------
const fundo = (cor, raio = 0) => `<rect width="1024" height="1024"${raio ? ` rx="${raio}"` : ""} fill="${cor}"/>`;

const ARQUIVOS_SVG = {
  "simbolo-claro.svg": svg(simbolo("claro", 1, "corte"), { titulo: "Tem Remédio DF: símbolo para fundo claro" }),
  "simbolo-escuro.svg": svg(simbolo("escuro", 1, "corte"), { titulo: "Tem Remédio DF: símbolo para fundo escuro" }),
  "simbolo-mono.svg": svg(simbolo("mono", 1, "corte"), { titulo: "Tem Remédio DF: símbolo em uma cor" }),
  "icone-ios.svg": svg(fundo(CORES.azul) + simbolo("icone", ESCALA.ios, "corte"), {
    titulo: "Tem Remédio DF: ícone do app (iOS e base)",
  }),
  "android-frente.svg": svg(simbolo("icone", ESCALA.android, "corte"), {
    titulo: "Tem Remédio DF: frente do ícone adaptável do Android (fundo #0B5FA5)",
  }),
  "android-mono.svg": svg(simbolo("mono", ESCALA.android, "corte"), {
    titulo: "Tem Remédio DF: ícone temático do Android 13+",
  }),
  "abertura-claro.svg": svg(simbolo("claro", ESCALA.abertura, "corte"), {
    titulo: "Tem Remédio DF: tela de abertura, tema claro (fundo #FFFFFF)",
  }),
  "abertura-escuro.svg": svg(simbolo("escuro", ESCALA.abertura, "corte"), {
    titulo: "Tem Remédio DF: tela de abertura, tema escuro (fundo #0F1115)",
  }),
  "favicon.svg": svg(fundo(CORES.azul, 230) + simbolo("icone", ESCALA.favicon, "corte"), {
    titulo: "Tem Remédio DF: favicon",
  }),
};

// ---------- PNGs do app ----------
const PNGS = [
  { svg: "icone-ios.svg", saida: "icon.png", lado: 1024, semAlfa: CORES.azul },
  { svg: "android-frente.svg", saida: "android-icon-foreground.png", lado: 1024 },
  { svg: "android-mono.svg", saida: "android-icon-monochrome.png", lado: 1024 },
  { svg: "abertura-claro.svg", saida: "splash-icon.png", lado: 1024 },
  { svg: "abertura-escuro.svg", saida: "splash-icon-dark.png", lado: 1024 },
  { svg: "favicon.svg", saida: "favicon.png", lado: 48 },
];

// ---------- Chrome sem janela ----------
async function abrirChrome() {
  const perfil = mkdtempSync(join(tmpdir(), "gerar-marca-"));
  const chrome = spawn(CHROME, [
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--remote-debugging-port=0",
    `--user-data-dir=${perfil}`,
    "about:blank",
  ]);
  const endereco = await new Promise((ok, falha) => {
    let saida = "";
    const prazo = setTimeout(() => falha(new Error(`O Chrome não abriu (${CHROME}).`)), 30000);
    chrome.on("error", (erro) => falha(erro));
    chrome.stderr.on("data", (d) => {
      saida += d;
      const achou = saida.match(/DevTools listening on (ws:\/\/\S+)/);
      if (achou) {
        clearTimeout(prazo);
        ok(achou[1]);
      }
    });
  });
  const ws = new WebSocket(endereco);
  await new Promise((ok) => ws.addEventListener("open", ok));
  let proximo = 0;
  const pendentes = new Map();
  const ouvintes = new Set();
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pendentes.has(msg.id)) {
      const { ok, falha } = pendentes.get(msg.id);
      pendentes.delete(msg.id);
      if (msg.error) falha(new Error(JSON.stringify(msg.error)));
      else ok(msg.result);
    } else if (msg.method) {
      for (const ouvinte of ouvintes) ouvinte(msg);
    }
  });
  const enviar = (method, params = {}, sessionId) =>
    new Promise((ok, falha) => {
      const id = ++proximo;
      pendentes.set(id, { ok, falha });
      ws.send(JSON.stringify({ id, method, params, sessionId }));
    });
  const { targetId } = await enviar("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await enviar("Target.attachToTarget", { targetId, flatten: true });
  await enviar("Page.enable", {}, sessionId);
  await enviar("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } }, sessionId);

  async function fotografar(conteudoSvg, lado) {
    await enviar("Emulation.setDeviceMetricsOverride", { width: lado, height: lado, deviceScaleFactor: 1, mobile: false }, sessionId);
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:transparent;overflow:hidden}svg{display:block;width:${lado}px;height:${lado}px}</style></head><body>${conteudoSvg}</body></html>`;
    const carregou = new Promise((ok) => {
      const ouvinte = (msg) => {
        if (msg.method === "Page.loadEventFired" && msg.sessionId === sessionId) {
          ouvintes.delete(ouvinte);
          ok();
        }
      };
      ouvintes.add(ouvinte);
    });
    await enviar("Page.navigate", { url: "data:text/html;base64," + Buffer.from(html).toString("base64") }, sessionId);
    await carregou;
    const { data } = await enviar(
      "Page.captureScreenshot",
      { format: "png", clip: { x: 0, y: 0, width: lado, height: lado, scale: 1 } },
      sessionId,
    );
    return Buffer.from(data, "base64");
  }

  async function fechar() {
    ws.close();
    const saiu = new Promise((ok) => chrome.once("exit", ok));
    chrome.kill();
    await saiu;
    rmSync(perfil, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
  return { fotografar, fechar };
}

// ---------- PNG sem canal alfa (a App Store recusa ícone com transparência) ----------
function pngSemAlfa(png, corFundo) {
  let pos = 8;
  let largura = 0;
  let altura = 0;
  const idat = [];
  while (pos < png.length) {
    const tamanho = png.readUInt32BE(pos);
    const tipo = png.toString("ascii", pos + 4, pos + 8);
    const dados = png.subarray(pos + 8, pos + 8 + tamanho);
    if (tipo === "IHDR") {
      largura = dados.readUInt32BE(0);
      altura = dados.readUInt32BE(4);
      // O Chrome já grava sem alfa quando a imagem é toda opaca.
      if (dados[8] === 8 && dados[9] === 2) return png;
      if (dados[8] !== 8 || dados[9] !== 6 || dados[12] !== 0) {
        throw new Error("Esperava PNG RGB ou RGBA de 8 bits, sem entrelaçamento.");
      }
    }
    if (tipo === "IDAT") idat.push(dados);
    pos += 12 + tamanho;
  }
  const bruto = inflateSync(Buffer.concat(idat));
  const passo = largura * 4;
  const rgba = Buffer.alloc(passo * altura);
  for (let y = 0; y < altura; y++) {
    const filtro = bruto[y * (passo + 1)];
    for (let x = 0; x < passo; x++) {
      const v = bruto[y * (passo + 1) + 1 + x];
      const a = x >= 4 ? rgba[y * passo + x - 4] : 0;
      const b = y > 0 ? rgba[(y - 1) * passo + x] : 0;
      const c = x >= 4 && y > 0 ? rgba[(y - 1) * passo + x - 4] : 0;
      let previsto = 0;
      if (filtro === 1) previsto = a;
      else if (filtro === 2) previsto = b;
      else if (filtro === 3) previsto = (a + b) >> 1;
      else if (filtro === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        previsto = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      rgba[y * passo + x] = (v + previsto) & 255;
    }
  }
  const fundoRgb = [1, 3, 5].map((i) => parseInt(corFundo.slice(i, i + 2), 16));
  const linhas = Buffer.alloc((largura * 3 + 1) * altura);
  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      const o = y * passo + x * 4;
      const alfa = rgba[o + 3] / 255;
      for (let canal = 0; canal < 3; canal++) {
        linhas[y * (largura * 3 + 1) + 1 + x * 3 + canal] = Math.round(rgba[o + canal] * alfa + fundoRgb[canal] * (1 - alfa));
      }
    }
  }
  const pedaco = (tipo, dados) => {
    const cab = Buffer.alloc(4);
    cab.writeUInt32BE(dados.length);
    const corpo = Buffer.concat([Buffer.from(tipo, "ascii"), dados]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(corpo));
    return Buffer.concat([cab, corpo, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largura, 0);
  ihdr.writeUInt32BE(altura, 4);
  ihdr[8] = 8; // bits por canal
  ihdr[9] = 2; // RGB, sem alfa
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pedaco("IHDR", ihdr),
    pedaco("IDAT", deflateSync(linhas, { level: 9 })),
    pedaco("IEND", Buffer.alloc(0)),
  ]);
}

// ---------- Execução ----------
mkdirSync(MARCA, { recursive: true });
for (const [nome, conteudo] of Object.entries(ARQUIVOS_SVG)) {
  writeFileSync(join(MARCA, nome), conteudo);
}
const chrome = await abrirChrome();
try {
  for (const { svg: origem, saida, lado, semAlfa } of PNGS) {
    let png = await chrome.fotografar(ARQUIVOS_SVG[origem], lado);
    if (semAlfa) png = pngSemAlfa(png, semAlfa);
    writeFileSync(join(ASSETS, saida), png);
  }
} finally {
  await chrome.fechar();
}
console.log(`${Object.keys(ARQUIVOS_SVG).length} SVGs em assets/marca e ${PNGS.length} PNGs em assets.`);
