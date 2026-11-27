# Filme do Tem Remédio DF (Remotion + Three.js)

Filme de apresentação do app, feito por código, com a mesma receita do filme 3D da Plano Alto (projeto Drone, `marketing/filme-3d`). É um projeto separado: fica fora do workspace do pnpm e tem as próprias dependências (`npm install` nesta pasta).

O roteiro, a direção de arte e a ordem de trabalho estão em [`ROTEIRO.md`](ROTEIRO.md).

## Comandos (nesta pasta)

| Comando | O que faz |
|---|---|
| `npm install` | Instala Remotion, Three.js e React (versões iguais às do filme da Plano Alto). |
| `node dados.mjs` | Baixa o snapshot publicado e grava `src/dados/mapa.json`: as farmácias de UBS e o estoque da losartana (ou de outro código: `node dados.mjs 19062`). |
| `npx remotion studio src/index.ts` | Prévia ao vivo no navegador. |
| `npx remotion still src/index.ts Mapa saida/quadros/Mapa.png --gl=angle --bundle-cache=false` | Um quadro de estilo (`Mapa`, `Celular`, `Final`). |
| `node voz.mjs` | Gera a narração (Gemini) em `public/voz` e a duração de cada fala em `src/dados/voz.json`. A chave fica em `.env.local` (`GEMINI_API_KEY=...`), fora do Git. Só gera a fala que mudou. |
| `node revisar.mjs 0,2.6,7.2` | Quadros parados do filme, em meia resolução, em `saida/revisao`. |
| `npx remotion render src/index.ts Filme saida/filme-bruto.mp4 --gl=angle --bundle-cache=false --codec=h264 --crf=17` | O filme completo com som. Depois, normalizar o volume (abaixo). |

## Som

- **Voz:** `voz.mjs`. Os áudios (`public/voz`) não vão para o Git; as durações ficam em `src/dados/voz.json`. O número falado ("125 de 154") vem de `src/dados/mapa.json`: ao rodar `node dados.mjs` num outro dia, rode `node voz.mjs` de novo.
- **Música:** "Infinity", de Arulo (Mixkit, licença gratuita). A licença não deixa redistribuir o arquivo, então ele não vai para o Git: baixe com `curl -L https://assets.mixkit.co/music/440/440.mp3 -o public/musica.mp3`.
- **Efeitos:** os mesmos do filme da Plano Alto (sintetizados com o ffmpeg), em `public/sfx`.
- **Volume final:** o Remotion mistura sem normalizar. Depois do render:
  `ffmpeg -i saida/filme-bruto.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000 -c:a aac -b:a 192k -movflags +faststart saida/filme.mp4`

Sempre use `--gl=angle` (o 3D precisa da placa de vídeo dentro do Chrome sem tela) e `--bundle-cache=false` (o cache do empacotador cresce muito).

## Peças

- `src/marca.ts`: cores e letras (as do app).
- `src/Simbolo3D.tsx`: o símbolo em 3D, montado a partir das medidas do SVG da marca; `encaixe` vai de metades separadas (0) a encaixadas (1).
- `src/MapaDF.tsx`: o DF em relevo, o Lago Paranoá e uma cápsula por farmácia de UBS nas coordenadas reais (altura = dias de estoque, cor = semáforo).
- `src/Telefone.tsx`: celular em perspectiva em CSS, com uma tela real do app (`public/telas`).
- `src/pecas.tsx`: título que entra palavra por palavra, rótulos, pílulas e o ícone do semáforo.
- `src/Blister3D.tsx`: a cartela de remédio que esvazia na cena do problema.
- `src/cenas/`: as cenas do filme; `src/tempo.ts` é a linha do tempo, guiada pela narração; `src/Filme.tsx` monta cenas, voz, música e efeitos.
- `src/quadros/`: os quadros de estilo aprovados.
