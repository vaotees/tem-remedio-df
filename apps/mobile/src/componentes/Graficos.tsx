import { LIMITES_DIAS, nivelEstoque, type NivelEstoque } from "@tem-remedio/shared";
import { StyleSheet, View } from "react-native";
import { espaco, RAIO_CAPSULA, useTema } from "@/tema";
import { Texto } from "./Texto";

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

/**
 * Barra da rede: como estão os postos que têm o remédio (bastante, pouco, quase acabando), com legenda escrita.
 * Compacta (nos cartões do Início e de Meus remédios): só a barra; o leitor de tela lê a contagem do mesmo jeito.
 */
export function BarraRede({ contagem, compacta }: { contagem: Record<NivelEstoque, number>; compacta?: boolean }) {
  const { cores } = useTema();
  const niveis = ORDEM.filter((n) => contagem[n] > 0);
  const rotulo = niveis.map((n) => `${contagem[n]} ${LEGENDA[n]}`).join(", ");
  return (
    <View style={estilos.barraRede} accessible accessibilityLabel={rotulo}>
      <View style={[estilos.pilha, compacta && estilos.pilhaCompacta, { backgroundColor: cores.trilho }]}>
        {niveis.map((n) => (
          <View key={n} style={{ flex: contagem[n], backgroundColor: cores.barraSemaforo[n] }} />
        ))}
      </View>
      {compacta ? null : (
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
      )}
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
  barraRede: { gap: espaco.sm },
  pilha: { flexDirection: "row", height: 14, borderRadius: RAIO_CAPSULA, overflow: "hidden", gap: 2 },
  pilhaCompacta: { height: 10 },
  legenda: { flexDirection: "row", flexWrap: "wrap", rowGap: 2, columnGap: espaco.md },
  itemLegenda: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  quadrado: { width: 12, height: 12, borderRadius: 4 },
  flex: { flexShrink: 1 },
  medidor: { gap: 6 },
  trilho: { height: 10, borderRadius: RAIO_CAPSULA, overflow: "hidden" },
  cheio: { position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: RAIO_CAPSULA },
  marca: { position: "absolute", top: 0, bottom: 0, width: 2 },
  linhaTexto: { flexDirection: "row", flexWrap: "wrap", gap: espaco.sm },
});
