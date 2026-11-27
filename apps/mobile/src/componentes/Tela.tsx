import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { espaco, useTema } from "@/tema";
import { Faixa } from "./Faixa";

interface Props {
  children: ReactNode;
  /** O que vai dentro da faixa do alto (título, resumo, busca). */
  faixa?: ReactNode;
  /** Linha de cima da faixa: Voltar, a marca, botões de vidro. */
  topo?: ReactNode;
  /** O primeiro bloco da tela sobe por cima da faixa (ex.: o resumo dos postos). */
  cartaoPorCima?: boolean;
}

/**
 * Toda tela: a faixa da marca no alto (atrás do relógio do celular) e o conteúdo embaixo, com fundo,
 * margens e rolagem padrão. A barra de abas cuida da margem de baixo.
 */
export function Tela({ children, faixa, topo, cartaoPorCima }: Props) {
  const { cores } = useTema();
  return (
    <View style={[estilos.area, { backgroundColor: cores.fundo }]}>
      <ScrollView contentContainerStyle={estilos.rolagem} keyboardShouldPersistTaps="handled">
        {/* Puxando a tela para baixo no iPhone, aparece o azul da faixa, não um vão cinza. */}
        <View style={[estilos.alemDoTopo, { backgroundColor: cores.degrade[0] }]} />
        <Faixa topo={topo} comCartaoPorCima={cartaoPorCima}>
          {faixa}
        </Faixa>
        <View style={[estilos.conteudo, cartaoPorCima && estilos.subir]}>{children}</View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1 },
  rolagem: { flexGrow: 1, paddingBottom: espaco.lg },
  alemDoTopo: { position: "absolute", top: -1000, left: 0, right: 0, height: 1000 },
  conteudo: { flexGrow: 1, padding: espaco.md, gap: espaco.md },
  subir: { marginTop: -(espaco.xl + espaco.sm) },
});
