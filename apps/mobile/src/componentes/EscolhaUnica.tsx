import { Pressable, StyleSheet, View } from "react-native";
import { ALVO_MINIMO, espaco, useTema } from "@/tema";
import { Icone } from "./Icone";
import { Texto } from "./Texto";

interface Opcao<T extends string> {
  valor: T;
  titulo: string;
  /** Letra do título, antes das escalas (ex.: a prévia de cada tamanho de letra). */
  tamanhoTitulo?: number;
  /** Linha de explicação embaixo do título. */
  detalhe?: string;
}

interface Props<T extends string> {
  opcoes: Opcao<T>[];
  valor: T;
  aoMudar: (valor: T) => void;
  /** O que se escolhe, para o leitor de tela (ex.: "Tamanho da letra"). */
  rotulo: string;
}

/**
 * Escolha de uma opção numa lista, uma por linha, com bolinha de marcar. Para quem tem a mão trêmula
 * ou usa letra grande: nada muda de lugar ao tocar e nenhum rótulo precisa se espremer na largura.
 */
export function EscolhaUnica<T extends string>({ opcoes, valor, aoMudar, rotulo }: Props<T>) {
  const { cores } = useTema();
  return (
    <View style={[estilos.grupo, { borderColor: cores.divisoria }]} accessibilityRole="radiogroup" accessibilityLabel={rotulo}>
      {opcoes.map((o, n) => {
        const escolhida = o.valor === valor;
        return (
          <Pressable
            key={o.valor}
            onPress={() => aoMudar(o.valor)}
            accessibilityRole="radio"
            accessibilityLabel={o.detalhe ? `${o.titulo}. ${o.detalhe}` : o.titulo}
            accessibilityState={{ checked: escolhida }}
            style={({ pressed }) => [
              estilos.opcao,
              n > 0 && { borderTopWidth: 1, borderTopColor: cores.divisoria },
              escolhida && { backgroundColor: cores.primariaTinta },
              pressed && { opacity: 0.75 },
            ]}
          >
            <Icone
              name={escolhida ? "radio-button-on" : "radio-button-off"}
              size={28}
              color={escolhida ? cores.textoTonal : cores.textoSecundario}
            />
            <View style={estilos.textos}>
              <Texto
                variante="destaque"
                peso={escolhida ? "negrito" : "medio"}
                tamanho={o.tamanhoTitulo}
                cor={escolhida ? cores.textoTonal : cores.texto}
              >
                {o.titulo}
              </Texto>
              {o.detalhe ? (
                <Texto variante="legenda" secundario>
                  {o.detalhe}
                </Texto>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { borderWidth: 1, borderRadius: 18, overflow: "hidden" },
  opcao: {
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.md,
    minHeight: ALVO_MINIMO + 8,
    paddingHorizontal: espaco.md,
    paddingVertical: espaco.sm,
  },
  textos: { flex: 1, gap: 2 },
});
