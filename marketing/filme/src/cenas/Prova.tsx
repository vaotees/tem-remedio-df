import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Easing } from "remotion";
import mapa from "../dados/mapa.json";
import { Camera, Reflexos } from "../Estudio";
import { MapaDF, projetar, RESUMO } from "../MapaDF";
import { COR, H, LETRA, W } from "../marca";
import { entre, Pilula, Rotulo, salto, Semaforo, useSegundos } from "../pecas";
import { falaNaCena } from "../tempo";

const hora = RESUMO.atualizadoEm.slice(11, 16).replace(":", "h");
const DESTAQUE = "UBS 06 TAGUATINGA";
const centro = (() => {
  const p = mapa.postos.find((x) => x.nome === DESTAQUE) ?? mapa.postos[0];
  return projetar(p.lat, p.lng);
})();
const LONGE = Math.max(...mapa.postos.map((p) => Math.hypot(projetar(p.lat, p.lng)[0] - centro[0], projetar(p.lat, p.lng)[1] - centro[1])));

const mistura = (a: number[], b: number[], p: number) => a.map((v, i) => v + (b[i] - v) * p) as [number, number, number];

/**
 * A prova com dados reais: a câmera chega sobre o DF e as cápsulas sobem em onda a partir de Taguatinga,
 * nas coordenadas reais das UBSs; o número conta junto com a narração ("Hoje, 125 de 154 postos...").
 */
export function CenaProva() {
  const t = useSegundos();
  const fala = falaNaCena(2, "prova");
  const voo = entre(t, 0, 3.4, 0, 1, Easing.bezier(0.45, 0, 0.2, 1));
  const posicao = mistura([-80, 150, 120], [-58, 92, 70], voo);
  const alvo = mistura([2, 0, -6], [-2, 0, -3], voo);
  // Onda: cada cápsula sobe quando a onda passa pela distância dela até o posto em destaque.
  const subida = (p: { lat: number; lng: number }) => {
    const [x, z] = projetar(p.lat, p.lng);
    const d = Math.hypot(x - centro[0], z - centro[1]) / LONGE;
    const em = 0.7 + d * 2.6;
    return entre(t, em, em + 0.55, 0, 1, Easing.bezier(0.34, 1.4, 0.64, 1));
  };
  const conta = Math.round(entre(t, 0.7, 3.4, 0, RESUMO.comEstoque, Easing.out(Easing.cubic)));
  const { contagem } = RESUMO;
  const legenda: Array<["alto" | "baixo" | "critico", string, number]> = [
    ["alto", `${contagem.alto} com bastante`, 4.3],
    ["baixo", `${contagem.baixo} com pouco`, 4.6],
    ["critico", `${contagem.critico} quase acabando`, 4.9],
  ];
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 60%, ${COR.noite2} 0%, ${COR.noite} 70%)` }}>
      <ThreeCanvas width={W} height={H} shadows camera={{ fov: 30, near: 1, far: 700 }} gl={{ antialias: true }}>
        <Camera posicao={posicao} alvo={alvo} fov={30} />
        <fog attach="fog" args={[COR.noite, 190, 360]} />
        <Reflexos intensidade={0.3} />
        <hemisphereLight args={["#bcd6f2", "#0b1a2b", 0.5]} />
        <directionalLight
          position={[-12, 70, 30]}
          intensity={2.2}
          castShadow
          shadow-mapSize={[4096, 4096]}
          shadow-camera-left={-70}
          shadow-camera-right={70}
          shadow-camera-top={70}
          shadow-camera-bottom={-70}
          shadow-bias={-0.0004}
          shadow-normalBias={0.03}
        />
        <MapaDF
          subida={subida}
          destaque={DESTAQUE}
          rotulos={[
            { ra: "Ceilândia", dx: -3.5, dz: -2.5 },
            { ra: "Taguatinga", dx: 2.5, dz: 2.2 },
            { ra: "Plano Piloto", dz: -1.5 },
            { ra: "Gama", dz: 1.5 },
            { ra: "Sobradinho" },
            { ra: "Planaltina" },
          ].filter((_, i) => t > 1.6 + i * 0.12)}
        />
      </ThreeCanvas>

      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 620, background: `linear-gradient(${COR.noite} 0%, ${COR.noite}e0 55%, ${COR.noite}00 100%)` }} />
      <div style={{ position: "absolute", left: 90, top: 190, opacity: entre(t, fala - 0.3, fala + 0.2) }}>
        <Rotulo>LOSARTANA 50 MG · HOJE, {hora}</Rotulo>
        <div style={{ marginTop: 28, fontFamily: LETRA, fontWeight: 800, fontSize: 104, lineHeight: 1.08, letterSpacing: "-0.015em", color: COR.papel, fontVariantNumeric: "tabular-nums" }}>
          <div>
            <span style={{ color: COR.menta }}>{conta}</span> de {RESUMO.total}
          </div>
          <div style={{ opacity: entre(t, 2.6, 3.2) }}>postos têm hoje.</div>
        </div>
      </div>

      <div style={{ position: "absolute", left: 90, right: 90, bottom: 170, display: "flex", flexWrap: "wrap", gap: 18 }}>
        {legenda.map(([nivel, texto, em]) => {
          const p = salto(t, em);
          return p > 0.001 ? (
            <Pilula key={nivel} fundo="rgba(11,26,43,0.82)" cor={COR.papel} style={{ transform: `translateY(${(1 - p) * 40}px) scale(${0.85 + 0.15 * p})`, opacity: Math.min(1, p * 1.5) }}>
              <Semaforo nivel={nivel} /> {texto}
            </Pilula>
          ) : null;
        })}
      </div>
      <div style={{ position: "absolute", left: 90, bottom: 96, fontFamily: LETRA, fontSize: 30, color: COR.nevoa, opacity: entre(t, 5.0, 5.5) }}>
        Altura = dias de estoque · Dados públicos da SES-DF
      </div>
    </AbsoluteFill>
  );
}
