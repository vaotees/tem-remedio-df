import type { CSSProperties, ReactNode } from "react";
import { Img, staticFile } from "remotion";

/**
 * Celular em perspectiva, feito em CSS (como o da Plano Alto), mostrando uma tela real do app
 * (public/telas, capturas do app nativo em 780 × 1688). `children` são peças que saltam da tela.
 */
export function Telefone({ tela, telas, transform, largura = 560, style, children }: {
  tela?: string;
  /** Telas em camadas, de baixo para cima, cada uma com a sua opacidade (para dissolver de uma para outra). */
  telas?: Array<{ tela: string; opacidade: number; escala?: number }>;
  transform?: string;
  largura?: number;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const altura = Math.round((largura * 1688) / 780);
  const borda = Math.round(largura * 0.03);
  return (
    <div style={{ position: "absolute", perspective: 2800, ...style }}>
      <div
        style={{
          position: "relative",
          width: largura + borda * 2,
          height: altura + borda * 2,
          borderRadius: largura * 0.15,
          background: "linear-gradient(145deg, #1c2633, #06090d)",
          padding: borda,
          transform,
          transformStyle: "preserve-3d",
          boxShadow: "-50px 80px 110px rgba(2,8,16,0.55), inset 0 0 0 3px #2c3846",
        }}
      >
        <div style={{ width: largura, height: altura, borderRadius: largura * 0.125, overflow: "hidden", position: "relative", background: "#F2F5F9" }}>
          {(telas ?? [{ tela: tela ?? "", opacidade: 1 }]).map((c) =>
            c.opacidade > 0.001 ? (
              <Img
                key={c.tela}
                src={staticFile(`telas/${c.tela}`)}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: c.opacidade, transform: c.escala ? `scale(${c.escala})` : undefined, transformOrigin: "50% 30%" }}
              />
            ) : null,
          )}
          <div style={{ position: "absolute", left: "50%", top: largura * 0.03, width: largura * 0.26, height: largura * 0.072, marginLeft: -largura * 0.13, borderRadius: 40, background: "#05080c" }} />
        </div>
        {children}
      </div>
    </div>
  );
}
