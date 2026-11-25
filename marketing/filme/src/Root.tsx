import { Composition, Still } from "remotion";
import { Filme } from "./Filme";
import { H, W } from "./marca";
import { QuadroCelular } from "./quadros/Celular";
import { QuadroFinal } from "./quadros/Final";
import { QuadroMapa } from "./quadros/Mapa";
import { DURACAO, f, FPS } from "./tempo";

/** O filme e os quadros de estilo aprovados (cada um vira um PNG com `remotion still`). */
export function Root() {
  return (
    <>
      <Composition id="Filme" component={Filme} durationInFrames={f(DURACAO)} fps={FPS} width={W} height={H} />
      <Still id="Mapa" component={QuadroMapa} width={W} height={H} />
      <Still id="Celular" component={QuadroCelular} width={W} height={H} />
      <Still id="Final" component={QuadroFinal} width={W} height={H} />
    </>
  );
}
