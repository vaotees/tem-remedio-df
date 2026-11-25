import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { Camera, Reflexos } from "../Estudio";
import { COR, H, LETRA, MONO, W } from "../marca";
import { Titulo } from "../pecas";
import { Simbolo3D } from "../Simbolo3D";

/** Cartão final: o símbolo em 3D, a frase da campanha, o link da versão web com QR e a assinatura da EM. */
export function QuadroFinal({ encaixe = 1, giro = 0.28 }: { encaixe?: number; giro?: number }) {
  return (
    <AbsoluteFill style={{ background: `radial-gradient(90% 55% at 50% 30%, ${COR.noite2} 0%, ${COR.noite} 75%)` }}>
      <ThreeCanvas width={W} height={H} camera={{ fov: 26, near: 0.5, far: 100 }} gl={{ antialias: true }}>
        <Camera posicao={[0, 0.2, 21]} alvo={[0, -0.6, 0]} fov={26} />
        <Reflexos intensidade={0.45} />
        <ambientLight intensity={0.25} />
        <directionalLight position={[4, 6, 8]} intensity={1.5} />
        <directionalLight position={[-6, -2, 4]} intensity={0.6} color={COR.azulClaro} />
        <Simbolo3D encaixe={encaixe} position={[0, 1.75, 0]} rotation={[0.18, giro, 0]} scale={0.52} corHaste="#3f95e3" corBaixo="#3f95e3" corCima="#4fd19c" />
      </ThreeCanvas>

      <div style={{ position: "absolute", left: 0, right: 0, top: 880, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        <div style={{ fontFamily: LETRA, fontWeight: 800, fontSize: 64, color: COR.papel }}>
          Tem Remédio <span style={{ color: COR.menta }}>DF</span>
        </div>
        <Titulo alinhar="center" tamanho={96} linhas={[["Antes", "de", "sair", "de", "casa,"], ["*veja", "*se", "*tem."]]} style={{ marginTop: 26 }} />
      </div>

      <div style={{ position: "absolute", left: 90, right: 90, bottom: 210, display: "flex", alignItems: "center", gap: 40, padding: 34, borderRadius: 36, background: "rgba(242,246,250,0.06)", border: "2px solid rgba(169,184,200,0.18)" }}>
        <div style={{ background: "#fff", borderRadius: 22, padding: 14, flex: "none" }}>
          <Img src={staticFile("qr-web.svg")} style={{ width: 190, height: 190, display: "block" }} />
        </div>
        <div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: "0.08em", color: COR.menta }}>EXPERIMENTE NO NAVEGADOR</div>
          <div style={{ fontFamily: LETRA, fontWeight: 700, fontSize: 44, lineHeight: 1.2, color: COR.papel, marginTop: 10 }}>
            vaotees.github.io/
            <br />
            tem-remedio-df/app
          </div>
          <div style={{ fontFamily: LETRA, fontSize: 30, color: COR.nevoa, marginTop: 12 }}>Sem cadastro. Dados públicos da SES-DF.</div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 110, textAlign: "center", fontFamily: LETRA, fontWeight: 700, fontSize: 32, color: COR.azulClaro }}>
        Um projeto da EM Soluções Digitais
      </div>
    </AbsoluteFill>
  );
}
