// Quadros parados do filme para revisão, em meia resolução, e uma folha com todos.
// Na pasta marketing/filme:  node revisar.mjs 0,1.6,5.5,...   (segundos; sem lista, usa os marcos do roteiro)
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const tempos = (process.argv[2] ?? "0,2.4,4.6,6.3,7.2,8.6,10.4,12.6,15.2,17.0,19.0,20.4,22.6,24.5,26.4,28.5,30.9,33.8").split(",").map(Number);
const pasta = join(process.cwd(), "saida", "revisao");
mkdirSync(pasta, { recursive: true });
const chromiumOptions = { gl: "angle" };
const serveUrl = await bundle({ entryPoint: resolve("src/index.ts"), enableCaching: false });
const composition = await selectComposition({ serveUrl, id: "Filme", chromiumOptions });
for (const t of tempos) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(t * composition.fps));
  await renderStill({ composition, serveUrl, frame, output: join(pasta, `t-${t.toFixed(2).padStart(5, "0")}.png`), chromiumOptions, scale: 0.5 });
  process.stdout.write(`${t} `);
}
console.log("\nrevisão pronta");
