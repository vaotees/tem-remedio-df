// Narração do filme na mesma voz do filme da Plano Alto (Gemini, pt-br-advisor-1), uma frase por arquivo.
// Na pasta marketing/filme:  node voz.mjs
// Gera public/voz/frase-N-<marca>.wav e src/dados/voz.json com a duração de cada frase. Frase que já existe
// com o mesmo texto não é gerada de novo. A chave fica em .env.local (GEMINI_API_KEY=...), que não vai para o Git.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const mapa = JSON.parse(readFileSync(join(process.cwd(), "src", "dados", "mapa.json"), "utf8"));
const remedio = mapa.produto.substancia.split(" ")[0].toLowerCase(); // "losartana"

// O número falado é o do snapshot gravado em src/dados/mapa.json (o mesmo que aparece na tela).
export const FRASES = [
  "Ir até a UBS e voltar sem o remédio?",
  "O estoque é público. Agora, fácil de ler.",
  `Hoje, ${mapa.comEstoque} de ${mapa.total} postos têm ${remedio}.`,
  "Veja o posto mais perto e ligue antes de ir.",
  "Letra grande, sem cadastro, e a sua lista fica só no celular.",
  "Tem Remédio DF. Antes de sair de casa, veja se tem.",
];
const VOZ = "pt-br-advisor-1";
const MODELO = "gemini-3.8-flash-tts";
const ESTILO =
  "Warm, calm and reassuring, like a caring health professional talking to older adults and their caregivers in Brasília. Clear diction, unhurried natural pace, a gentle smile in the voice. Never sounding like a radio announcer or a salesperson.";

const env = existsSync(".env.local") ? readFileSync(".env.local", "utf8") : "";
const chave = process.env.GEMINI_API_KEY ?? env.match(/^GEMINI_API_KEY=(.+)$/m)?.[1]?.trim();
if (!chave) throw new Error("Falta GEMINI_API_KEY (no ambiente ou em .env.local nesta pasta).");

function lerWav(buf) {
  let taxa = 24000;
  let at = 12;
  while (at + 8 <= buf.length) {
    const id = buf.toString("ascii", at, at + 4);
    const tam = buf.readUInt32LE(at + 4);
    if (id === "fmt ") taxa = buf.readUInt32LE(at + 12);
    if (id === "data") return { taxa, dados: buf.subarray(at + 8, Math.min(buf.length, at + 8 + tam)) };
    at += 8 + tam + (tam % 2);
  }
  throw new Error("WAV inesperado");
}

const pasta = join(process.cwd(), "public", "voz");
mkdirSync(pasta, { recursive: true });
const saida = [];
for (const [i, texto] of FRASES.entries()) {
  const marca = createHash("sha1").update(`${MODELO}|${VOZ}|${ESTILO}|${texto}`).digest("hex").slice(0, 10);
  const arquivo = `frase-${i + 1}-${marca}.wav`;
  const caminho = join(pasta, arquivo);
  if (!existsSync(caminho)) {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: { "x-goog-api-key": chave, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODELO,
        input: [{ type: "user_input", content: [{ type: "text", text: texto, annotations: [{ type: "speech_metadata", style: ESTILO }] }] }],
        response_format: { type: "audio" },
        generation_config: { speech_config: [{ voice: VOZ }] },
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(`Frase ${i + 1}: ${res.status} ${JSON.stringify(json).slice(0, 200)}`);
    const audio = (json.steps ?? []).filter((s) => s.type === "model_output").flatMap((s) => s.content ?? []).filter((c) => c.type === "audio").pop();
    writeFileSync(caminho, Buffer.from(audio.data, "base64"));
  }
  const { taxa, dados } = lerWav(readFileSync(caminho));
  saida.push({ texto, arquivo: `voz/${arquivo}`, segundos: Math.round((dados.length / 2 / taxa) * 1000) / 1000 });
  console.log(`${i + 1}. ${saida.at(-1).segundos.toFixed(2)} s  ${texto}`);
}
writeFileSync(join(process.cwd(), "src", "dados", "voz.json"), JSON.stringify(saida, null, 2) + "\n");
