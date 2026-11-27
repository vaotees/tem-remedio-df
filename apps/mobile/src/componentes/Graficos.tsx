import { LIMITES_DIAS, nivelEstoque, type NivelEstoque } from "@tem-remedio/shared";
import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";
import { espaco, RAIO_CAPSULA, useTema } from "@/tema";
import { useAnimar } from "@/util/movimento";
import { Texto } from "./Texto";

const ORDEM: NivelEstoque[] = ["alto", "baixo", "critico", "sem_consumo"];
export const LEGENDA_NIVEL: Record<NivelEstoque, string> = {
  alto: "com bastante",
  baixo: "com pouco",
  critico: "quase acabando",
  sem_consumo: "sem estimativa",
};

/**
 * O Animated marca o componente com `collapsable`, que na web iria parar no `<circle>` da página (e o
 * React reclama). O círculo do gráfico não precisa dele.
 */
function CirculoSvg({ collapsable, ...props }: ComponentProps<typeof Circle> & { collapsable?: boolean }) {
  void collapsable;
  return <Circle {...props} />;
}
const CirculoAnimado = Animated.createAnimatedComponent(CirculoSvg);

/** Quanto tempo um gráfico leva para encher. */
const DURACAO_GRAFICO = 1100;

/**
 * Valor de 0 a 1 que enche quando o gráfico aparece (e de novo se o valor mudar). Sem animação, já nasce
 * cheio. Os traços de SVG não rodam no driver nativo: a animação é em JavaScript, curta.
 */
function useEnchimento(alvo: number, atraso = 150): Animated.Value {
  const animar = useAnimar();
  const [valor] = useState(() => new Animated.Value(animar ? 0 : alvo));
  useEffect(() => {
    if (!animar) {
      valor.setValue(alvo);
      return;
    }
    const encher = Animated.timing(valor, {
      toValue: alvo,
      duration: DURACAO_GRAFICO,
      delay: atraso,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    encher.start();
    return () => encher.stop();
  }, [animar, alvo, atraso, valor]);
  return valor;
}

/** Quantos postos em cada nível do semáforo. */
export function contarNiveis(dias: (number | null)[]): Record<NivelEstoque, number> {
  const contagem: Record<NivelEstoque, number> = { alto: 0, baixo: 0, critico: 0, sem_consumo: 0 };
  for (const d of dias) contagem[nivelEstoque(d)]++;
  return contagem;
}

/**
 * Barra da rede: como estão os postos que têm o remédio (bastante, pouco, quase acabando), com legenda escrita.
 * Compacta (nos cartões do Início e de Meus remédios): só a barra; o leitor de tela lê a contagem do mesmo jeito.
 * A barra cresce da esquerda quando aparece.
 */
export function BarraRede({ contagem, compacta }: { contagem: Record<NivelEstoque, number>; compacta?: boolean }) {
  const { cores } = useTema();
  const niveis = ORDEM.filter((n) => contagem[n] > 0);
  const rotulo = niveis.map((n) => `${contagem[n]} ${LEGENDA_NIVEL[n]}`).join(", ");
  const cheio = useEnchimento(1);
  return (
    <View style={estilos.barraRede} accessible accessibilityLabel={rotulo}>
      <View style={[estilos.pilha, compacta && estilos.pilhaCompacta, { backgroundColor: cores.trilho }]}>
        <Animated.View
          style={[estilos.pilhaCheia, { width: cheio.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]}
        >
          {niveis.map((n) => (
            <View key={n} style={{ flex: contagem[n], backgroundColor: cores.barraSemaforo[n] }} />
          ))}
        </Animated.View>
      </View>
      {compacta ? null : <LegendaNiveis contagem={contagem} />}
    </View>
  );
}

/** Legenda dos níveis: quadradinho na cor, número em negrito e o nome do nível (e a parte do total). */
export function LegendaNiveis({ contagem, porcentagem }: { contagem: Record<NivelEstoque, number>; porcentagem?: boolean }) {
  const { cores } = useTema();
  const niveis = ORDEM.filter((n) => contagem[n] > 0);
  const total = niveis.reduce((s, n) => s + contagem[n], 0);
  return (
    <View style={porcentagem ? estilos.legendaColuna : estilos.legenda}>
      {niveis.map((n) => (
        <View key={n} style={estilos.itemLegenda}>
          <View style={[estilos.quadrado, { backgroundColor: cores.barraSemaforo[n] }]} />
          <Texto variante="legenda" secundario style={estilos.flex}>
            <Texto variante="legenda" peso="negrito">
              {porcentagem ? `${Math.round((contagem[n] / total) * 100)}%` : contagem[n]}
            </Texto>{" "}
            {LEGENDA_NIVEL[n]}
          </Texto>
        </View>
      ))}
    </View>
  );
}

interface PropsAnel {
  /** De 0 a 1. */
  parte: number;
  tamanho?: number;
  espessura?: number;
  cor: string;
  trilho: string;
  /** No meio do anel (número, rótulo). */
  children?: ReactNode;
  atraso?: number;
}

/** Anel de progresso que enche no sentido do relógio, a partir do alto, com o conteúdo no meio. */
export function Anel({ parte, tamanho = 104, espessura = 10, cor, trilho, children, atraso }: PropsAnel) {
  const alvo = Math.max(0, Math.min(1, parte));
  const cheio = useEnchimento(alvo, atraso);
  const r = (tamanho - espessura) / 2;
  const volta = 2 * Math.PI * r;
  const meio = tamanho / 2;
  return (
    <View style={[estilos.anel, { width: tamanho, height: tamanho }]}>
      <Svg width={tamanho} height={tamanho} style={StyleSheet.absoluteFill}>
        <Circle cx={meio} cy={meio} r={r} stroke={trilho} strokeWidth={espessura} fill="none" />
        {alvo > 0 ? (
          <CirculoAnimado
            cx={meio}
            cy={meio}
            r={r}
            stroke={cor}
            strokeWidth={espessura}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${volta} ${volta}`}
            strokeDashoffset={cheio.interpolate({ inputRange: [0, 1], outputRange: [volta, 0] })}
            transform={`rotate(-90 ${meio} ${meio})`}
          />
        ) : null}
      </Svg>
      {children}
    </View>
  );
}

interface PropsRosca {
  contagem: Record<NivelEstoque, number>;
  tamanho?: number;
  espessura?: number;
  children?: ReactNode;
}

/**
 * Rosca do semáforo: cada nível uma fatia, na ordem bastante → pouco → quase acabando → sem estimativa,
 * desenhadas uma depois da outra. Enfeite do número do meio: a legenda escrita vem ao lado.
 */
export function Rosca({ contagem, tamanho = 120, espessura = 16, children }: PropsRosca) {
  const { cores } = useTema();
  const cheio = useEnchimento(1);
  const niveis = ORDEM.filter((n) => contagem[n] > 0);
  const total = niveis.reduce((s, n) => s + contagem[n], 0);
  const r = (tamanho - espessura) / 2;
  const volta = 2 * Math.PI * r;
  const meio = tamanho / 2;
  // Um respiro entre as fatias (só quando há mais de uma).
  const respiro = niveis.length > 1 ? Math.min(4, volta * 0.01) : 0;
  const tamanhos = niveis.map((n) => (contagem[n] / total) * volta);
  const fatias = niveis.map((n, i) => ({
    nivel: n,
    // Onde a fatia começa: a soma das anteriores.
    inicio: tamanhos.slice(0, i).reduce((s, t) => s + t, 0),
    comprimento: Math.max(0.5, tamanhos[i]! - respiro),
  }));
  return (
    <View
      style={[estilos.anel, { width: tamanho, height: tamanho }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={tamanho} height={tamanho} style={StyleSheet.absoluteFill}>
        <Circle cx={meio} cy={meio} r={r} stroke={cores.trilho} strokeWidth={espessura} fill="none" />
        {fatias.map((f) => (
          <CirculoAnimado
            key={f.nivel}
            cx={meio}
            cy={meio}
            r={r}
            stroke={cores.barraSemaforo[f.nivel]}
            strokeWidth={espessura}
            fill="none"
            strokeDasharray={`${f.comprimento} ${volta}`}
            strokeDashoffset={cheio.interpolate({
              inputRange: [f.inicio / volta, (f.inicio + f.comprimento) / volta],
              outputRange: [f.comprimento, 0],
              extrapolate: "clamp",
            })}
            transform={`rotate(${-90 + (f.inicio / volta) * 360} ${meio} ${meio})`}
          />
        ))}
      </Svg>
      {children}
    </View>
  );
}

/** Até onde o medidor vai: 60 dias ou mais enchem a barra. */
export const DIAS_MEDIDOR_CHEIO = 60;

/** "cerca de 28 dias", "mais de 2 meses". O número é estimativa (quantidade ÷ consumo médio do posto). */
export function textoDias(dias: number): string {
  if (dias >= DIAS_MEDIDOR_CHEIO) return "Estoque para mais de 2 meses";
  if (dias < 1) return "Estoque para menos de 1 dia";
  return `Estoque para cerca de ${dias} ${dias === 1 ? "dia" : "dias"}`;
}

/**
 * Medidor dos dias de estoque no posto, na cor do semáforo, com as marcas de 7 e 30 dias (as faixas
 * do semáforo). Sem consumo registrado, não há estimativa: não mostra nada (o selo diz "Tem").
 */
export function MedidorDias({ dias, detalhe }: { dias: number | null; detalhe?: string }) {
  const { cores } = useTema();
  const parte = dias === null ? 0 : Math.max(0.03, Math.min(1, dias / DIAS_MEDIDOR_CHEIO));
  const cheio = useEnchimento(parte);
  if (dias === null) return null;
  const nivel = nivelEstoque(dias);
  const texto = textoDias(dias);
  return (
    <View style={estilos.medidor} accessible accessibilityLabel={detalhe ? `${texto}, ${detalhe}` : texto}>
      <View style={[estilos.trilho, { backgroundColor: cores.trilho }]}>
        <Animated.View
          style={[
            estilos.cheio,
            {
              width: cheio.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
              backgroundColor: cores.barraSemaforo[nivel],
            },
          ]}
        />
        {[LIMITES_DIAS.critico, LIMITES_DIAS.baixo].map((d) => (
          <View
            key={d}
            style={[estilos.marca, { left: `${(d / DIAS_MEDIDOR_CHEIO) * 100}%`, backgroundColor: cores.superficie }]}
          />
        ))}
      </View>
      <View style={estilos.linhaTexto}>
        <Texto variante="legenda" secundario style={estilos.flex}>
          {texto}
        </Texto>
        {detalhe ? (
          <Texto variante="legenda" secundario>
            {detalhe}
          </Texto>
        ) : null}
      </View>
    </View>
  );
}

/**
 * Medidor em arco (meia-lua) dos dias de estoque, grande, para o detalhe do posto: o arco enche na cor do
 * semáforo, com as marcas de 7 e 30 dias, e o número de dias no meio.
 */
export function MedidorArco({ dias, largura = 220 }: { dias: number; largura?: number }) {
  const { cores } = useTema();
  const espessura = 18;
  const nivel = nivelEstoque(dias);
  const parte = Math.max(0.02, Math.min(1, dias / DIAS_MEDIDOR_CHEIO));
  const cheio = useEnchimento(parte, 250);
  const r = (largura - espessura) / 2;
  const meiaVolta = Math.PI * r;
  const volta = 2 * meiaVolta;
  const cx = largura / 2;
  const cy = largura / 2;
  const altura = largura / 2 + espessura;
  const marca = (d: number) => {
    // Ângulo de 180° (esquerda) a 360° (direita), passando pelo alto.
    const angulo = Math.PI + (d / DIAS_MEDIDOR_CHEIO) * Math.PI;
    const dentro = r - espessura / 2 - 2;
    const fora = r + espessura / 2 + 2;
    return {
      x1: cx + dentro * Math.cos(angulo),
      y1: cy + dentro * Math.sin(angulo),
      x2: cx + fora * Math.cos(angulo),
      y2: cy + fora * Math.sin(angulo),
    };
  };
  const numero = dias >= DIAS_MEDIDOR_CHEIO ? "60+" : String(Math.max(0, dias));
  return (
    <View
      style={[estilos.arco, { width: largura, height: altura }]}
      accessible
      accessibilityLabel={textoDias(dias)}
    >
      <Svg width={largura} height={altura} style={StyleSheet.absoluteFill}>
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={cores.trilho}
          strokeWidth={espessura}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${meiaVolta} ${volta}`}
          transform={`rotate(180 ${cx} ${cy})`}
        />
        <CirculoAnimado
          cx={cx}
          cy={cy}
          r={r}
          stroke={cores.barraSemaforo[nivel]}
          strokeWidth={espessura}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${meiaVolta} ${volta}`}
          strokeDashoffset={cheio.interpolate({ inputRange: [0, 1], outputRange: [meiaVolta, 0] })}
          transform={`rotate(180 ${cx} ${cy})`}
        />
        {[LIMITES_DIAS.critico, LIMITES_DIAS.baixo].map((d) => (
          <Line key={d} {...marca(d)} stroke={cores.superficie} strokeWidth={3} />
        ))}
      </Svg>
      <View style={estilos.meioArco} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Texto peso="numero" tamanho={44} cor={cores.texto} style={estilos.centro}>
          {numero}
        </Texto>
        <Texto variante="legenda" peso="negrito" secundario style={estilos.centro}>
          dias de estoque
        </Texto>
      </View>
    </View>
  );
}

export interface Barra {
  nome: string;
  /** A parte que enche (ex.: abertos agora). */
  valor: number;
  /** O tamanho da barra (ex.: postos da região). */
  total: number;
  /** O que aparece à direita (ex.: "12 de 20"). */
  rotulo: string;
}

/**
 * Barras deitadas, uma por linha, com o nome em cima (quebra linha com letra grande): o comprimento é o
 * total (comparado com o maior) e a parte cheia é o valor. Enchem uma depois da outra.
 */
export function BarrasDeitadas({ barras, cor }: { barras: Barra[]; cor: string }) {
  const maior = Math.max(1, ...barras.map((b) => b.total));
  return (
    <View style={estilos.barras}>
      {barras.map((b, i) => (
        <BarraDeitada key={b.nome} barra={b} maior={maior} cor={cor} ordem={i} />
      ))}
    </View>
  );
}

function BarraDeitada({ barra, maior, cor, ordem }: { barra: Barra; maior: number; cor: string; ordem: number }) {
  const { cores } = useTema();
  const cheio = useEnchimento(1, 200 + ordem * 90);
  const comprimento = barra.total / maior;
  const parte = barra.total > 0 ? barra.valor / barra.total : 0;
  return (
    <View style={estilos.linhaBarra} accessible accessibilityLabel={`${barra.nome}: ${barra.rotulo}`}>
      <View style={estilos.cabecalhoBarra}>
        <Texto variante="legenda" peso="medio" style={estilos.flex}>
          {barra.nome}
        </Texto>
        <Texto variante="legenda" peso="negrito">
          {barra.rotulo}
        </Texto>
      </View>
      <View style={[estilos.trilhoBarra, { width: `${comprimento * 100}%`, backgroundColor: cores.trilho }]}>
        <Animated.View
          style={[
            estilos.cheioBarra,
            { backgroundColor: cor, width: cheio.interpolate({ inputRange: [0, 1], outputRange: ["0%", `${parte * 100}%`] }) },
          ]}
        />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  barraRede: { gap: espaco.sm },
  pilha: { height: 14, borderRadius: RAIO_CAPSULA, overflow: "hidden" },
  pilhaCompacta: { height: 10 },
  pilhaCheia: { flexDirection: "row", height: "100%", gap: 2, borderRadius: RAIO_CAPSULA, overflow: "hidden" },
  legenda: { flexDirection: "row", flexWrap: "wrap", rowGap: 2, columnGap: espaco.md },
  legendaColuna: { gap: 6 },
  itemLegenda: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  quadrado: { width: 14, height: 14, borderRadius: 5 },
  flex: { flexShrink: 1 },
  anel: { alignItems: "center", justifyContent: "center" },
  medidor: { gap: 6 },
  trilho: { height: 10, borderRadius: RAIO_CAPSULA, overflow: "hidden" },
  cheio: { position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: RAIO_CAPSULA },
  marca: { position: "absolute", top: 0, bottom: 0, width: 2 },
  linhaTexto: { flexDirection: "row", flexWrap: "wrap", gap: espaco.sm },
  arco: { alignSelf: "center", alignItems: "center", justifyContent: "flex-end" },
  meioArco: { alignItems: "center", paddingBottom: 2 },
  centro: { textAlign: "center" },
  barras: { gap: espaco.sm + 4 },
  linhaBarra: { gap: 6 },
  cabecalhoBarra: { flexDirection: "row", alignItems: "flex-end", gap: espaco.sm },
  trilhoBarra: { height: 12, borderRadius: RAIO_CAPSULA, overflow: "hidden", minWidth: 24 },
  cheioBarra: { height: "100%", borderRadius: RAIO_CAPSULA },
});
