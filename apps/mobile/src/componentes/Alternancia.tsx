import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ALVO_MINIMO, espaco, raio, useTema } from "@/tema";
import { Texto } from "./Texto";

interface Opcao<T extends string> {
  valor: T;
  titulo: string;
  icone: ComponentProps<typeof Ionicons>["name"];
}

interface Props<T extends string> {
  opcoes: Opcao<T>[];
  valor: T;
  aoMudar: (valor: T) => void;
}

/**
 * Duas (ou mais) abas lado a lado, como "Lista | Mapa". A escolhida fica preenchida e com o
 * ícone de marcado: a diferença não depende só da cor. O rótulo quebra linha, nunca corta.
 */
export function Alternancia<T extends string>({ opcoes, valor, aoMudar }: Props<T>) {
  const { cores } = useTema();
  return (
    <View style={[estilos.grupo, { borderColor: cores.primaria }]} accessibilityRole="tablist">
      {opcoes.map((o) => {
        const escolhida = o.valor === valor;
        const cor = escolhida ? cores.textoSobrePrimaria : cores.primaria;
        return (
          <Pressable
            key={o.valor}
            onPress={() => aoMudar(o.valor)}
            accessibilityRole="tab"
            accessibilityLabel={o.titulo}
            accessibilityState={{ selected: escolhida }}
            style={({ pressed }) => [
              estilos.opcao,
              { backgroundColor: escolhida ? cores.primaria : cores.fundo },
              pressed && { opacity: 0.75 },
            ]}
          >
            <Ionicons name={escolhida ? "checkmark-circle" : o.icone} size={24} color={cor} />
            <Texto variante="destaque" cor={cor} style={estilos.titulo}>
              {o.titulo}
            </Texto>
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { flexDirection: "row", borderWidth: 2, borderRadius: raio, overflow: "hidden" },
  opcao: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: espaco.sm,
    minHeight: ALVO_MINIMO,
    paddingHorizontal: espaco.sm,
    paddingVertical: espaco.xs,
  },
  titulo: { flexShrink: 1, textAlign: "center" },
});
