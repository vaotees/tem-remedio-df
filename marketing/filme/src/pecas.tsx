import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { COR, LETRA, MONO } from "./marca";

export const FPS = 30;
export const suave = Easing.bezier(0.22, 1, 0.36, 1);
export const entre = (t: number, a: number, b: number, de = 0, para = 1, easing = suave) =>
  interpolate(t, [a, b], [de, para], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

/** Tempo da cena em segundos. */
export const useSegundos = () => useCurrentFrame() / FPS;

/**
 * Título em linhas definidas à mão (nunca quebra sozinho). Palavras com * ficam na cor de destaque.
 * No filme, cada palavra entra no ritmo da fala (`inicio` e `duracao`); no quadro parado, aparece inteiro.
 */
export function Titulo({ linhas, tamanho = 92, cor = COR.papel, destaque = COR.menta, alinhar = "left", inicio, duracao, style }: {
  linhas: string[][];
  tamanho?: number;
  cor?: string;
  destaque?: string;
  alinhar?: "left" | "center";
  inicio?: number;
  duracao?: number;
  style?: CSSProperties;
}) {
  const t = useSegundos();
  const palavras = linhas.flat();
  const letras = palavras.reduce((n, p) => n + p.replace(/^\*/, "").length + 1, 0);
  let acumulado = 0;
  return (
    <div style={{ fontFamily: LETRA, fontWeight: 800, fontSize: tamanho, lineHeight: 1.08, letterSpacing: "-0.015em", color: cor, textAlign: alinhar, ...style }}>
      {linhas.map((linha, li) => (
        <div key={li} style={{ display: "flex", whiteSpace: "nowrap", gap: `0 ${tamanho * 0.26}px`, justifyContent: alinhar === "center" ? "center" : "flex-start" }}>
          {linha.map((bruta, pi) => {
            const forte = bruta.startsWith("*");
            const palavra = forte ? bruta.slice(1) : bruta;
            const em = inicio === undefined ? -1 : inicio + (acumulado / letras) * (duracao ?? 1) * 0.85;
            acumulado += palavra.length + 1;
            const p = inicio === undefined ? 1 : entre(t, em - 0.08, em + 0.32);
            return (
              <span key={pi} style={{ display: "inline-block", overflow: "hidden", paddingBottom: tamanho * 0.1 }}>
                <span style={{ display: "inline-block", transform: `translateY(${(1 - p) * 110}%)`, opacity: Math.min(1, p * 1.6), color: forte ? destaque : undefined }}>
                  {palavra}
                </span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** Rótulo pequeno em maiúsculas, na letra Mono (ex.: "LOSARTANA 50 MG · HOJE"). */
export function Rotulo({ children, cor = COR.menta, style }: { children: ReactNode; cor?: string; style?: CSSProperties }) {
  return <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 32, letterSpacing: "0.08em", color: cor, ...style }}>{children}</div>;
}

/** Pílula (selo) em cápsula, como os selos do app. */
export function Pilula({ children, fundo = COR.papel, cor = COR.noite, style }: { children: ReactNode; fundo?: string; cor?: string; style?: CSSProperties }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
        fontFamily: LETRA,
        fontWeight: 700,
        fontSize: 34,
        color: cor,
        background: fundo,
        padding: "16px 28px 16px 20px",
        borderRadius: 999,
        boxShadow: "0 18px 40px rgba(4,12,22,0.35)",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Bolinha com o ícone do semáforo (desenhado em SVG: visto, exclamação, alerta). */
export function Semaforo({ nivel, tamanho = 40 }: { nivel: "alto" | "baixo" | "critico" | "sem_consumo"; tamanho?: number }) {
  const cor = { alto: COR.alto, baixo: COR.baixo, critico: COR.critico, sem_consumo: COR.sem }[nivel];
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 40 40" style={{ flex: "none" }}>
      <circle cx="20" cy="20" r="19" fill={cor} />
      {nivel === "alto" || nivel === "sem_consumo" ? (
        <path d="M11.5 20.5 17.5 26.5 28.5 14.5" stroke="#0B1A2B" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <>
          <path d="M20 10.5V22" stroke="#0B1A2B" strokeWidth="4.2" strokeLinecap="round" />
          <circle cx="20" cy="28.8" r="2.6" fill="#0B1A2B" />
        </>
      )}
    </svg>
  );
}

/**
 * Entrada e saída de cena: sobe de baixo com desfoque e sai para cima, como um golpe de câmera
 * (o mesmo do filme da Plano Alto). `duracao` é a duração da cena em segundos.
 */
export function Cena({ duracao, children, entrada = true, saida = true, fundo }: { duracao: number; children: ReactNode; entrada?: boolean; saida?: boolean; fundo?: string }) {
  const t = useSegundos();
  const dentro = entrada ? entre(t, 0, 0.42, 0, 1, Easing.bezier(0.65, 0, 0.35, 1)) : 1;
  const fora = saida ? entre(t, duracao - 0.42, duracao, 0, 1, Easing.bezier(0.65, 0, 0.35, 1)) : 0;
  const y = (1 - dentro) * 100 - fora * 100;
  const golpe = Math.sin(Math.PI * (1 - dentro)) + Math.sin(Math.PI * fora);
  return (
    <AbsoluteFill style={{ transform: `translateY(${y}%)`, filter: golpe > 0.02 ? `blur(${(golpe * 14).toFixed(1)}px)` : undefined, background: fundo }}>
      {children}
    </AbsoluteFill>
  );
}

/** Quanto a peça já entrou (0..1), com um pequeno "salto" no fim: para selos que pulam da tela. */
export const salto = (t: number, em: number) => entre(t, em, em + 0.45, 0, 1, Easing.bezier(0.34, 1.56, 0.64, 1));
