import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill } from "remotion";
import { Blister3D } from "../Blister3D";
import { Camera, Reflexos } from "../Estudio";
import { COR, H, W } from "../marca";
import { entre, Rotulo, Titulo, useSegundos } from "../pecas";
import { falaNaCena, VOZES } from "../tempo";

/** As cápsulas somem da cartela uma a uma (nesta ordem), enquanto a pergunta é feita. */
const ORDEM = [3, 7, 0, 9, 5, 2, 8, 1, 6, 4];

/** O problema: a cartela de remédio esvaziando, e a pergunta "Ir até a UBS e voltar sem o remédio?". */
export function CenaProblema() {
  const t = useSegundos();
  const fala = falaNaCena(0, "problema");
  const giro = entre(t, 0, 4.6, -0.95, -0.62);
  const cheia = (i: number) => {
    const vez = ORDEM.indexOf(i);
    const em = 1.25 + vez * 0.26;
    return 1 - entre(t, em, em + 0.22);
  };
  return (
    <AbsoluteFill style={{ background: `radial-gradient(90% 60% at 50% 62%, ${COR.noite2} 0%, ${COR.noite} 72%)` }}>
      <ThreeCanvas width={W} height={H} shadows camera={{ fov: 28, near: 0.5, far: 100 }} gl={{ antialias: true }}>
        <Camera posicao={[0, 11.5, 13.5]} alvo={[0, -1.6, 0]} fov={28} />
        <Reflexos intensidade={0.55} />
        <hemisphereLight args={["#cfe3f7", "#0b1a2b", 0.55]} />
        <directionalLight position={[3, 9, 5]} intensity={2.2} castShadow shadow-mapSize={[2048, 2048]} />
        <Blister3D cheia={cheia} position={[0, -2.2, 0.6]} rotation={[0.1, giro, -0.08]} scale={0.8} />
      </ThreeCanvas>
      <div style={{ position: "absolute", left: 90, top: 230 }}>
        <Rotulo cor={COR.baixo} style={{ opacity: entre(t, 0.1, 0.5) }}>
          NO POSTO DE SAÚDE
        </Rotulo>
        <Titulo
          style={{ marginTop: 26 }}
          tamanho={100}
          destaque={COR.baixo}
          inicio={fala}
          duracao={VOZES[0].segundos}
          linhas={[["Ir", "até", "a", "UBS", "e"], ["voltar", "*sem", "*o"], ["*remédio?"]]}
        />
      </div>
    </AbsoluteFill>
  );
}
