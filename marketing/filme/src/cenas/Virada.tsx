import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill } from "remotion";
import mapa from "../dados/mapa.json";
import { Camera, Reflexos } from "../Estudio";
import { COR, H, MONO, W } from "../marca";
import { entre, salto, Titulo, useSegundos } from "../pecas";
import { Simbolo3D } from "../Simbolo3D";
import { CENA, CLIQUE, falaNaCena, VOZES } from "../tempo";

/** Linhas de uma tabela miúda, como a do painel de estoque: UBSs reais e os dias de estoque reais da losartana. */
const LINHAS = mapa.postos.slice(0, 26).map((p) => ({
  nome: p.nome,
  ra: p.ra,
  numeros: [p.tem ? String(p.dias ?? "—") : "0"],
}));

/**
 * A virada: o painel público, cheio de números miúdos, se desfaz; as duas metades da cápsula chegam e se
 * encaixam com um "clique" no pico da música. "O estoque é público. Agora, fácil de ler."
 */
export function CenaVirada() {
  const t = useSegundos();
  const clique = CLIQUE - CENA.virada.de;
  const fala = falaNaCena(1, "virada");
  // O painel aparece e se desfaz (desfoque, zoom e some).
  const somePainel = entre(t, clique - 0.85, clique - 0.2);
  const painelOpacidade = Math.min(entre(t, 0.05, 0.4), 1 - somePainel);
  // As metades entram separadas e encaixam no clique; depois, um pequeno pulso.
  const chega = entre(t, clique - 0.9, clique - 0.25);
  const encaixe = entre(t, clique - 0.35, clique, 0, 1);
  const pulso = 1 + 0.08 * Math.max(0, 1 - Math.abs(t - clique - 0.06) / 0.18);
  const brilho = Math.max(0, 1 - Math.abs(t - clique - 0.05) / 0.5);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(85% 55% at 50% 40%, ${COR.noite2} 0%, ${COR.noite} 75%)` }}>
      {/* O painel, em perspectiva. */}
      {painelOpacidade > 0.01 ? (
        <div style={{ position: "absolute", left: 120, top: 330, perspective: 2200, opacity: painelOpacidade, filter: `blur(${(somePainel * 22).toFixed(1)}px)` }}>
          <div
            style={{
              width: 840,
              padding: 26,
              borderRadius: 18,
              background: "#f4f6f8",
              transform: `rotateX(16deg) rotateY(-14deg) scale(${1 + somePainel * 0.18})`,
              boxShadow: "0 50px 90px rgba(2,8,16,0.55)",
              fontFamily: MONO,
              color: "#5b6673",
            }}
          >
            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              {["Unidade", "Região", "Dias de estoque"].map((c) => (
                <div key={c} style={{ flex: c === "Unidade" ? 3 : c === "Região" ? 1.6 : 1.4, fontSize: 17, fontWeight: 700, color: "#38424e", textAlign: c === "Dias de estoque" ? "right" : "left" }}>
                  {c}
                </div>
              ))}
            </div>
            {LINHAS.map((l, i) => (
              <div key={i} style={{ display: "flex", gap: 12, fontSize: 15, lineHeight: "26px", borderTop: "1px solid #dde3e9", background: i % 2 ? "#eef1f4" : undefined }}>
                <div style={{ flex: 3, whiteSpace: "nowrap", overflow: "hidden" }}>{l.nome}</div>
                <div style={{ flex: 1.6, whiteSpace: "nowrap", overflow: "hidden" }}>{l.ra}</div>
                {l.numeros.map((n, j) => (
                  <div key={j} style={{ flex: 1.4, textAlign: "right" }}>
                    {n}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Brilho do clique. */}
      <div style={{ position: "absolute", left: 140, top: 260, width: 800, height: 800, borderRadius: "50%", background: `radial-gradient(circle, ${COR.menta}55, ${COR.menta}00 62%)`, opacity: brilho }} />

      {chega > 0.001 ? (
        <ThreeCanvas width={W} height={H} camera={{ fov: 26, near: 0.5, far: 100 }} gl={{ antialias: true }}>
          <Camera posicao={[0, 0.2, 21]} alvo={[0, -0.6, 0]} fov={26} />
          <Reflexos intensidade={0.45} />
          <ambientLight intensity={0.25} />
          <directionalLight position={[4, 6, 8]} intensity={1.5} />
          <directionalLight position={[-6, -2, 4]} intensity={0.6} color={COR.azulClaro} />
          <Simbolo3D
            encaixe={encaixe}
            position={[0, 2.1 - (1 - chega) * 1.2, 0]}
            rotation={[0.18, 0.95 - entre(t, clique - 0.9, clique + 1.4, 0, 0.7), 0]}
            scale={0.55 * chega * pulso}
            corHaste="#3f95e3"
            corBaixo="#3f95e3"
            corCima="#4fd19c"
          />
        </ThreeCanvas>
      ) : null}

      <div style={{ position: "absolute", left: 0, right: 0, top: 1240, opacity: salto(t, fala - 0.2) }}>
        <Titulo
          alinhar="center"
          tamanho={88}
          inicio={fala}
          duracao={VOZES[1].segundos}
          linhas={[["O", "estoque", "é", "público."], ["Agora,", "*fácil", "*de", "*ler."]]}
        />
      </div>
    </AbsoluteFill>
  );
}
