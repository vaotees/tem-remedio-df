import { AbsoluteFill, Html5Audio, interpolate, Sequence, staticFile } from "remotion";
import { CenaCuidado } from "./cenas/Cuidado";
import { CenaCapa, CenaFinal } from "./cenas/Final";
import { CenaProblema } from "./cenas/Problema";
import { CenaProduto } from "./cenas/Produto";
import { CenaProva } from "./cenas/Prova";
import { CenaVirada } from "./cenas/Virada";
import { COR } from "./marca";
import { Cena } from "./pecas";
import { CENA, DURACAO, duracaoCena, EFEITOS, f, FALA, FPS, MUSICA, VOZES } from "./tempo";

/** Volume da música: entra suave, abaixa enquanto a voz fala e some no fim (mesma regra do filme da Plano Alto). */
function volumeMusica(quadro: number) {
  const t = quadro / FPS;
  let v = MUSICA.volume;
  for (const [i, inicio] of FALA.entries()) {
    const fim = inicio + VOZES[i].segundos;
    const sob = Math.min(
      interpolate(t, [inicio - 0.25, inicio - 0.05], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      interpolate(t, [fim, fim + 0.35], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    );
    v = Math.min(v, MUSICA.volume - (MUSICA.volume - MUSICA.sobVoz) * sob);
  }
  const entrada = interpolate(t, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
  const saida = interpolate(t, [DURACAO - 1.8, DURACAO], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return v * entrada * saida;
}

const cena = (nome: keyof typeof CENA) => ({ from: f(CENA[nome].de), durationInFrames: f(CENA[nome].ate - CENA[nome].de) });

/** O filme completo: capa no quadro zero, seis cenas no tempo da narração, música e efeitos. */
export function Filme() {
  return (
    <AbsoluteFill style={{ background: COR.noite }}>
      <Sequence {...cena("capa")}>
        <Cena duracao={duracaoCena("capa")} entrada={false}>
          <CenaCapa />
        </Cena>
      </Sequence>
      <Sequence {...cena("problema")}>
        <Cena duracao={duracaoCena("problema")}>
          <CenaProblema />
        </Cena>
      </Sequence>
      <Sequence {...cena("virada")}>
        <Cena duracao={duracaoCena("virada")}>
          <CenaVirada />
        </Cena>
      </Sequence>
      <Sequence {...cena("prova")}>
        <Cena duracao={duracaoCena("prova")}>
          <CenaProva />
        </Cena>
      </Sequence>
      <Sequence {...cena("produto")}>
        <Cena duracao={duracaoCena("produto")}>
          <CenaProduto />
        </Cena>
      </Sequence>
      <Sequence {...cena("cuidado")}>
        <Cena duracao={duracaoCena("cuidado")}>
          <CenaCuidado />
        </Cena>
      </Sequence>
      <Sequence {...cena("final")}>
        <Cena duracao={duracaoCena("final")} saida={false}>
          <CenaFinal />
        </Cena>
      </Sequence>

      <Html5Audio src={staticFile(MUSICA.arquivo)} trimBefore={f(MUSICA.inicio)} volume={volumeMusica} />
      {VOZES.map((voz, i) => (
        <Sequence key={voz.arquivo} from={f(FALA[i])} durationInFrames={f(voz.segundos + 0.3)}>
          <Html5Audio src={staticFile(voz.arquivo)} />
        </Sequence>
      ))}
      {EFEITOS.map((e, i) => (
        <Sequence key={i} from={f(e.em)} durationInFrames={f(1.2)}>
          <Html5Audio src={staticFile(`sfx/${e.tipo}.wav`)} volume={e.volume ?? 1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
