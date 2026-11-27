import { AbsoluteFill } from "remotion";
import { COR, LETRA } from "../marca";
import { Pilula, Rotulo, Semaforo, Titulo } from "../pecas";
import { Telefone } from "../Telefone";

/**
 * O app de verdade, num celular em perspectiva, com peças da tela saltando para fora (o selo do estoque,
 * a distância e o "Como chegar"). Fundo na faixa azul da marca.
 */
export function QuadroCelular() {
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${COR.azul} 0%, ${COR.noite2} 58%, ${COR.noite} 100%)`, overflow: "hidden" }}>
      {/* Brilho atrás do celular. */}
      <div style={{ position: "absolute", left: 140, top: 780, width: 900, height: 900, borderRadius: "50%", background: "radial-gradient(circle, rgba(108,180,245,0.35), rgba(108,180,245,0) 65%)" }} />

      <div style={{ position: "absolute", left: 90, top: 170 }}>
        <Rotulo>05 · ANTES DE SAIR DE CASA</Rotulo>
        <Titulo style={{ marginTop: 28 }} tamanho={92} linhas={[["Veja", "o", "posto", "mais"], ["perto", "e", "*ligue", "*antes."]]} />
      </div>

      <Telefone tela="app-posto-v3.webp" largura={560} style={{ left: 300, top: 590 }} transform="rotateY(-16deg) rotateX(9deg) rotateZ(2deg)" />

      {/* Peças que saltam da tela, em camadas na frente do celular. */}
      <Pilula style={{ position: "absolute", left: 70, top: 1068, fontSize: 38 }}>
        <Semaforo nivel="alto" tamanho={46} /> Tem bastante
      </Pilula>
      <Pilula style={{ position: "absolute", left: 600, top: 880 }} fundo={COR.menta} cor={COR.noite}>
        Aberto agora · fecha às 18h
      </Pilula>
    </AbsoluteFill>
  );
}
