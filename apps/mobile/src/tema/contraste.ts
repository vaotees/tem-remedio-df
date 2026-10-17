/** Razão de contraste WCAG 2.1 entre duas cores hexadecimais (#RRGGBB). */
export function contraste(cor1: string, cor2: string): number {
  const [maior, menor] = [luminancia(cor1), luminancia(cor2)].sort((a, b) => b - a) as [number, number];
  return (maior + 0.05) / (menor + 0.05);
}

function luminancia(hex: string): number {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) throw new Error(`Cor inválida: ${hex}`);
  const [r, g, b] = [m[1]!, m[2]!, m[3]!].map((c) => {
    const v = parseInt(c, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
