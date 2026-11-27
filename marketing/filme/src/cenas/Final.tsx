import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { Camera, Reflexos } from "../Estudio";
import { COR, H, LETRA, MONO, W } from "../marca";
import { entre, salto, Titulo, useSegundos } from "../pecas";
import { Simbolo3D } from "../Simbolo3D";
import { falaNaCena, VOZES } from "../tempo";

/** O símbolo 3D girando devagar, com luz de estúdio. Também é a capa do filme (quadro zero). */
export function SimboloNoEstudio({ giro, escala = 0.52, y = 1.75 }: { giro: number; escala?: number; y?: number }) {
  return (
    <ThreeCanvas width={W} height={H} camera={{ fov: 26, near: 0.5, far: 100 }} gl={{ antialias: true }}>
      <Camera posicao={[0, 0.2, 21]} alvo={[0, -0.6, 0]} fov={26} />
      <Reflexos intensidade={0.45} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 6, 8]} intensity={1.5} />
      <directionalLight position={[-6, -2, 4]} intensity={0.6} color={COR.azulClaro} />
      <Simbolo3D position={[0, y, 0]} rotation={[0.18, giro, 0]} scale={escala} corHaste="#3f95e3" corBaixo="#3f95e3" corCima="#4fd19c" />
    </ThreeCanvas>
  );
}

/** Cartão final: a frase da campanha no ritmo da fala, o QR da versão web e a assinatura da EM. */
export function CenaFinal() {
  const t = useSegundos();
  const fala = falaNaCena(5, "final");
  const cartao = salto(t, 3.55);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(90% 55% at 50% 30%, ${COR.noite2} 0%, ${COR.noite} 75%)` }}>
      <SimboloNoEstudio giro={0.75 - entre(t, 0, 7.5, 0, 0.55)} escala={0.52 * (0.9 + 0.1 * entre(t, 0, 0.8))} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 880, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        <div style={{ fontFamily: LETRA, fontWeight: 800, fontSize: 64, color: COR.papel, opacity: entre(t, fala - 0.1, fala + 0.4) }}>
          Tem Remédio <span style={{ color: COR.menta }}>DF</span>
        </div>
        <Titulo
          alinhar="center"
          tamanho={96}
          inicio={fala + 1.75}
          duracao={VOZES[5].segundos - 1.75}
          linhas={[["Antes", "de", "sair", "de", "casa,"], ["*veja", "*se", "*tem."]]}
          style={{ marginTop: 26 }}
        />
      </div>
      {cartao > 0.001 ? (
        <div
          style={{
            position: "absolute",
            left: 90,
            right: 90,
            bottom: 210,
            display: "flex",
            alignItems: "center",
            gap: 40,
            padding: 34,
            borderRadius: 36,
            background: "rgba(242,246,250,0.06)",
            border: "2px solid rgba(169,184,200,0.18)",
            transform: `translateY(${(1 - cartao) * 60}px)`,
            opacity: Math.min(1, cartao * 1.4),
          }}
        >
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
      ) : null}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 110, textAlign: "center", fontFamily: LETRA, fontWeight: 700, fontSize: 32, color: COR.azulClaro, opacity: entre(t, 4.1, 4.6) }}>
        Um projeto da EM Soluções Digitais
      </div>
    </AbsoluteFill>
  );
}

/** Capa (quadro zero): já completa, para servir de miniatura no Reels. */
export function CenaCapa() {
  return (
    <AbsoluteFill style={{ background: `radial-gradient(90% 55% at 50% 38%, ${COR.noite2} 0%, ${COR.noite} 75%)` }}>
      <SimboloNoEstudio giro={0.42} escala={0.5} y={1.7} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1010, display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
        <div style={{ fontFamily: LETRA, fontWeight: 800, fontSize: 112, letterSpacing: "-0.02em", color: COR.papel }}>
          Tem Remédio <span style={{ color: COR.menta }}>DF</span>
        </div>
        <div style={{ fontFamily: LETRA, fontSize: 52, lineHeight: 1.25, color: COR.nevoa, textAlign: "center" }}>
          Em qual UBS do DF tem
          <br />o seu remédio hoje
        </div>
      </div>
    </AbsoluteFill>
  );
}
