import { AbsoluteFill, Easing } from "remotion";
import { COR } from "../marca";
import { entre, Pilula, Rotulo, salto, Semaforo, Titulo, useSegundos } from "../pecas";
import { Telefone } from "../Telefone";
import { falaNaCena, VOZES } from "../tempo";

/** As telas reais do app, na ordem do uso: busca pela caixa → postos → mapa → detalhe do posto. */
const SEQUENCIA: Array<[string, number]> = [
  ["app-busca-v3.webp", 0],
  ["app-postos-v3.webp", 1.15],
  ["app-mapa-v4.webp", 2.2],
  ["app-posto-v3.webp", 3.1],
];

/** O produto: o celular entra em perspectiva e mostra o caminho real no app; os selos saltam da tela. */
export function CenaProduto() {
  const t = useSegundos();
  const fala = falaNaCena(3, "produto");
  const entra = entre(t, 0.05, 0.75, 0, 1, Easing.bezier(0.2, 0.9, 0.3, 1));
  const telas = SEQUENCIA.map(([tela, em], i) => {
    const proxima = SEQUENCIA[i + 1]?.[1];
    const aparece = i === 0 ? 1 : entre(t, em - 0.12, em + 0.12);
    const some = proxima === undefined ? 0 : entre(t, proxima + 0.1, proxima + 0.3);
    return { tela, opacidade: Math.max(0, aparece - some), escala: 1 + entre(t, em, em + 1.2, 0.025, 0) };
  });
  const selo1 = salto(t, 3.35);
  const selo2 = salto(t, 3.65);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${COR.azul} 0%, ${COR.noite2} 58%, ${COR.noite} 100%)`, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 140, top: 780, width: 900, height: 900, borderRadius: "50%", background: "radial-gradient(circle, rgba(108,180,245,0.35), rgba(108,180,245,0) 65%)" }} />
      <div style={{ position: "absolute", left: 90, top: 170 }}>
        <Rotulo style={{ opacity: entre(t, 0.1, 0.5) }}>ANTES DE SAIR DE CASA</Rotulo>
        <Titulo style={{ marginTop: 28 }} tamanho={92} inicio={fala} duracao={VOZES[3].segundos} linhas={[["Veja", "o", "posto", "mais"], ["perto", "e", "*ligue", "*antes."]]} />
      </div>
      <Telefone
        telas={telas}
        largura={560}
        style={{ left: 300, top: 590, opacity: Math.min(1, entra * 1.4) }}
        transform={`translateY(${(1 - entra) * 420}px) rotateY(${-16 - (1 - entra) * 22 + entre(t, 1, 4.7, 0, 4)}deg) rotateX(${9 + (1 - entra) * 10}deg) rotateZ(2deg)`}
      />
      {selo1 > 0.001 ? (
        <Pilula style={{ position: "absolute", left: 70, top: 1068, fontSize: 38, transform: `translateX(${(1 - selo1) * 140}px) scale(${0.8 + 0.2 * selo1})`, opacity: Math.min(1, selo1 * 1.5) }}>
          <Semaforo nivel="alto" tamanho={46} /> Tem bastante
        </Pilula>
      ) : null}
      {selo2 > 0.001 ? (
        <Pilula style={{ position: "absolute", left: 600, top: 880, transform: `translateX(${(1 - selo2) * -140}px) scale(${0.8 + 0.2 * selo2})`, opacity: Math.min(1, selo2 * 1.5) }} fundo={COR.menta} cor={COR.noite}>
          Aberto agora · fecha às 18h
        </Pilula>
      ) : null}
    </AbsoluteFill>
  );
}
