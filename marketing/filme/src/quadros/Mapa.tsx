import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill } from "remotion";
import { Camera, Reflexos } from "../Estudio";
import { MapaDF, RESUMO } from "../MapaDF";
import { COR, H, LETRA, W } from "../marca";
import { Pilula, Rotulo, Semaforo, Titulo } from "../pecas";

const hora = RESUMO.atualizadoEm.slice(11, 16).replace(":", "h");

/** Prova com dados reais: o DF em relevo e as 154 farmácias de UBS, com a losartana de hoje. */
export function QuadroMapa() {
  const { contagem } = RESUMO;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 60%, ${COR.noite2} 0%, ${COR.noite} 70%)` }}>
      <ThreeCanvas width={W} height={H} shadows camera={{ fov: 30, near: 1, far: 600 }} gl={{ antialias: true }}>
        <Camera posicao={[-58, 92, 70]} alvo={[-2, 0, -3]} fov={30} />
        <fog attach="fog" args={[COR.noite, 190, 320]} />
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
          destaque="UBS 06 TAGUATINGA"
          rotulos={[
            { ra: "Ceilândia", dx: -3.5, dz: -2.5 },
            { ra: "Taguatinga", dx: 2.5, dz: 2.2 },
            { ra: "Plano Piloto", dz: -1.5 },
            { ra: "Gama", dz: 1.5 },
            { ra: "Sobradinho" },
            { ra: "Planaltina" },
          ]}
        />
      </ThreeCanvas>

      {/* Faixa escura no alto para o título. */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 620, background: `linear-gradient(${COR.noite} 0%, ${COR.noite}e0 55%, ${COR.noite}00 100%)` }} />
      <div style={{ position: "absolute", left: 90, top: 190 }}>
        <Rotulo>LOSARTANA 50 MG · HOJE, {hora}</Rotulo>
        <Titulo
          style={{ marginTop: 28 }}
          tamanho={104}
          linhas={[["*" + RESUMO.comEstoque, "de", String(RESUMO.total)], ["postos", "têm", "hoje."]]}
        />
      </div>

      {/* Legenda: cor sempre com ícone e texto, como no app. */}
      <div style={{ position: "absolute", left: 90, right: 90, bottom: 170, display: "flex", flexWrap: "wrap", gap: 18 }}>
        <Pilula fundo="rgba(11,26,43,0.82)" cor={COR.papel}>
          <Semaforo nivel="alto" /> {contagem.alto} com bastante
        </Pilula>
        <Pilula fundo="rgba(11,26,43,0.82)" cor={COR.papel}>
          <Semaforo nivel="baixo" /> {contagem.baixo} com pouco
        </Pilula>
        <Pilula fundo="rgba(11,26,43,0.82)" cor={COR.papel}>
          <Semaforo nivel="critico" /> {contagem.critico} quase acabando
        </Pilula>
      </div>
      <div style={{ position: "absolute", left: 90, bottom: 96, fontFamily: LETRA, fontSize: 30, color: COR.nevoa }}>
        Altura = dias de estoque · Dados públicos da SES-DF
      </div>
    </AbsoluteFill>
  );
}
