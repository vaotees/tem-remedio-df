import type { ReactNode } from "react";
import { AbsoluteFill, Easing } from "remotion";
import { COR } from "../marca";
import { entre, Pilula, Rotulo, salto, Titulo, useSegundos } from "../pecas";
import { Telefone } from "../Telefone";
import { falaNaCena, VOZES } from "../tempo";

function Selo({ em, t, icone, children, style }: { em: number; t: number; icone: ReactNode; children: ReactNode; style: React.CSSProperties }) {
  const p = salto(t, em);
  if (p <= 0.001) return null;
  return (
    <Pilula style={{ position: "absolute", fontSize: 36, transform: `translateY(${(1 - p) * 50}px) scale(${0.82 + 0.18 * p})`, opacity: Math.min(1, p * 1.5), ...style }}>
      {icone}
      {children}
    </Pilula>
  );
}

const iconeLetra = (
  <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke={COR.azul} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 19 5-13 5 13M5 15h6M14 19l3.5-8 3.5 8M15.2 16.5h4.6" />
  </svg>
);
const iconeEscudo = (
  <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke={COR.verde} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3 20 6v6c0 5-3.4 8.3-8 9-4.6-.7-8-4-8-9V6z" />
    <path d="m8.5 12 2.5 2.5 4.5-5" />
  </svg>
);
const iconeCelular = (
  <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke={COR.azul} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="2.5" width="12" height="19" rx="3" />
    <path d="M10.5 18.5h3" />
  </svg>
);

/** O cuidado: a letra cresce de Normal para Maior, ao vivo; sem senha, sem cadastro, a lista só no celular. */
export function CenaCuidado() {
  const t = useSegundos();
  const fala = falaNaCena(4, "cuidado");
  const entra = entre(t, 0.05, 0.7, 0, 1, Easing.bezier(0.2, 0.9, 0.3, 1));
  const maior = entre(t, 1.75, 2.25);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(200deg, ${COR.noite2} 0%, ${COR.noite} 70%)`, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 90, top: 170 }}>
        <Rotulo style={{ opacity: entre(t, 0.1, 0.5) }}>FEITO PARA QUEM ENXERGA POUCO</Rotulo>
        <Titulo
          style={{ marginTop: 28 }}
          tamanho={84}
          inicio={fala}
          duracao={VOZES[4].segundos}
          linhas={[["*Letra", "*grande,", "sem"], ["cadastro,", "e", "a", "lista"], ["fica", "só", "no", "celular."]]}
        />
      </div>
      <Telefone
        telas={[
          { tela: "app-meus-v3.webp", opacidade: 1 - maior },
          { tela: "app-meus-maior-v3.webp", opacidade: maior, escala: 1 + 0.03 * (1 - maior) },
        ]}
        largura={520}
        style={{ left: 290, top: 700, opacity: Math.min(1, entra * 1.4) }}
        transform={`translateY(${(1 - entra) * 380}px) rotateY(${12 - entre(t, 0.5, 6, 0, 5)}deg) rotateX(7deg) rotateZ(-2deg)`}
      />
      <Selo em={1.85} t={t} icone={iconeLetra} style={{ left: 64, top: 930 }}>
        Letra maior
      </Selo>
      <Selo em={3.35} t={t} icone={iconeEscudo} style={{ left: 470, top: 1290 }}>
        Sem senha e sem cadastro
      </Selo>
      <Selo em={4.25} t={t} icone={iconeCelular} style={{ left: 64, top: 1560 }}>
        A lista fica só no celular
      </Selo>
    </AbsoluteFill>
  );
}
