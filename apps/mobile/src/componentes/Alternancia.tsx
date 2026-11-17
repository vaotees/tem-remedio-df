import { Pressable, StyleSheet, View } from "react-native";
import { ALVO_MINIMO, espaco, RAIO_CAPSULA, sombraCartao, useTema } from "@/tema";
import { Icone, type NomeIcone } from "./Icone";
import { Texto } from "./Texto";

interface Opcao<T extends string> {
  valor: T;
  titulo: string;
  icone?: NomeIcone;
}

interface Props<T extends string> {
  opcoes: Opcao<T>[];
  valor: T;
  aoMudar: (valor: T) => void;
  /** Para o leitor de tela, quando as opções sozinhas não dizem o que se escolhe (ex.: "Tamanho da letra"). */
  rotulo?: string;
}

/**
 * Seletor em cápsula, como "Lista | Mapa". A escolhida fica em branco, em negrito e com o ícone de
 * marcado: a diferença não depende só da cor. O rótulo quebra linha, nunca corta.
 */
export function Alternancia<T extends string>({ opcoes, valor, aoMudar, rotulo }: Props<T>) {
  const { cores } = useTema();
  return (
    <View style={[estilos.grupo, { backgroundColor: cores.trilho }]} accessibilityRole="tablist" accessibilityLabel={rotulo}>
      {opcoes.map((o) => {
        const escolhida = o.valor === valor;
        const cor = escolhida ? cores.primaria : cores.textoSecundario;
        const icone = escolhida ? "checkmark-circle" : o.icone;
        return (
          <Pressable
            key={o.valor}
            onPress={() => aoMudar(o.valor)}
            accessibilityRole="tab"
            accessibilityLabel={o.titulo}
            accessibilityState={{ selected: escolhida }}
            style={({ pressed }) => [
              estilos.opcao,
              escolhida ? [{ backgroundColor: cores.superficie }, sombraCartao(cores)] : null,
              pressed && { opacity: 0.75 },
            ]}
          >
            {icone ? <Icone name={icone} size={22} color={cor} /> : null}
            <Texto variante="destaque" peso={escolhida ? "negrito" : "medio"} cor={cor} style={estilos.titulo}>
              {o.titulo}
            </Texto>
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { flexDirection: "row", borderRadius: RAIO_CAPSULA, padding: 4, gap: 4 },
  opcao: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: espaco.xs,
    minHeight: ALVO_MINIMO,
    paddingHorizontal: espaco.sm,
    paddingVertical: espaco.xs,
    borderRadius: RAIO_CAPSULA,
  },
  titulo: { flexShrink: 1, textAlign: "center" },
});
