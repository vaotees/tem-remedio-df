import { LIMITES_DIAS, nivelEstoque, type NivelEstoque } from "@tem-remedio/shared";
import { StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { espaco, RAIO_CAPSULA, useTema } from "@/tema";
import { Texto } from "./Texto";

/**
 * Anel de cobertura: em quantos dos postos do DF o remédio está hoje. Usa o azul do app, não o verde:
 * mede onde tem, não a situação do estoque. O número fica no meio, em texto (cresce com a letra).
 */
export function Anel({ valor, total, tamanho = 64 }: { valor: number; total: number; tamanho?: number }) {
  const { cores } = useTema();
  const traco = Math.max(5, Math.round(tamanho / 10));
  const r = (tamanho - traco) / 2;
  const volta = 2 * Math.PI * r;
  const parte = total > 0 ? Math.min(1, valor / total) : 0;
  return (
    <View
      style={{ width: tamanho, height: tamanho }}
      accessible
      accessibilityLabel={`Em ${valor} de ${total} postos`}
    >
      <Svg width={tamanho} height={tamanho} style={StyleSheet.absoluteFill}>
        <Circle cx={tamanho / 2} cy={tamanho / 2} r={r} stroke={cores.trilho} strokeWidth={traco} fill="none" />
        {parte > 0 ? (
          <Circle
            cx={tamanho / 2}
            cy={tamanho / 2}
            r={r}
            stroke={cores.primaria}
            strokeWidth={traco}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${volta * parte} ${volta}`}
            transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`}
          />
        ) : null}
      </Svg>
      <View style={estilos.meio}>
        <Texto peso="numero" tamanho={Math.round(tamanho / 4)} style={estilos.centro} maxFontSizeMultiplier={1.2}>
          {valor}
        </Texto>
      </View>
    </View>
  );
}

const ORDEM: NivelEstoque[] = ["alto", "baixo", "critico", "sem_consumo"];
const LEGENDA: Record<NivelEstoque, string> = {
  alto: "com bastante",
  baixo: "com pouco",
  critico: "quase acabando",
  sem_consumo: "sem estimativa",
};

/** Quantos postos em cada nível do semáforo. */
export function contarNiveis(dias: (number | null)[]): Record<NivelEstoque, number> {
  const contagem: Record<NivelEstoque, number> = { alto: 0, baixo: 0, critico: 0, sem_consumo: 0 };
  for (const d of dias) contagem[nivelEstoque(d)]++;
  return contagem;
}

/** Barra da rede: como estão os postos que têm o remédio (bastante, pouco, quase acabando), com legenda escrita. */
export function BarraRede({ contagem }: { contagem: Record<NivelEstoque, number> }) {
  const { cores } = useTema();
  const niveis = ORDEM.filter((n) => contagem[n] > 0);
  const rotulo = niveis.map((n) => `${contagem[n]} ${LEGENDA[n]}`).join(", ");
  return (
    <View style={estilos.barraRede} accessible accessibilityLabel={rotulo}>
      <View style={[estilos.pilha, { backgroundColor: cores.trilho }]}>
        {niveis.map((n) => (
          <View key={n} style={{ flex: contagem[n], backgroundColor: cores.barraSemaforo[n] }} />
        ))}
      </View>
      <View style={estilos.legenda}>
        {niveis.map((n) => (
          <View key={n} style={estilos.itemLegenda}>
            <View style={[estilos.quadrado, { backgroundColor: cores.barraSemaforo[n] }]} />
            <Texto variante="legenda" secundario style={estilos.flex}>
              <Texto variante="legenda" peso="negrito">
                {contagem[n]}
              </Texto>{" "}
              {LEGENDA[n]}
            </Texto>
          </View>
        ))}
      </View>
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
  if (dias === null) return null;
  const nivel = nivelEstoque(dias);
  const parte = Math.max(0.03, Math.min(1, dias / DIAS_MEDIDOR_CHEIO));
  const texto = textoDias(dias);
  return (
    <View style={estilos.medidor} accessible accessibilityLabel={detalhe ? `${texto}, ${detalhe}` : texto}>
      <View style={[estilos.trilho, { backgroundColor: cores.trilho }]}>
        <View style={[estilos.cheio, { width: `${parte * 100}%`, backgroundColor: cores.barraSemaforo[nivel] }]} />
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

const estilos = StyleSheet.create({
  meio: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  centro: { textAlign: "center" },
  barraRede: { gap: espaco.sm },
  pilha: { flexDirection: "row", height: 14, borderRadius: RAIO_CAPSULA, overflow: "hidden", gap: 2 },
  legenda: { flexDirection: "row", flexWrap: "wrap", rowGap: 2, columnGap: espaco.md },
  itemLegenda: { flexDirection: "row", alignItems: "center", gap: 6, minWidth: "40%", flexShrink: 1 },
  quadrado: { width: 12, height: 12, borderRadius: 4 },
  flex: { flexShrink: 1 },
  medidor: { gap: 6 },
  trilho: { height: 10, borderRadius: RAIO_CAPSULA, overflow: "hidden" },
  cheio: { position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: RAIO_CAPSULA },
  marca: { position: "absolute", top: 0, bottom: 0, width: 2 },
  linhaTexto: { flexDirection: "row", flexWrap: "wrap", gap: espaco.sm },
});
