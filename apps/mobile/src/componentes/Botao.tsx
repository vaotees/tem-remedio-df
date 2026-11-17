import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { ALVO_MINIMO, espaco, RAIO_CAPSULA, raio, useTema } from "@/tema";
import { Icone, type NomeIcone } from "./Icone";
import { Texto } from "./Texto";

interface Props {
  titulo: string;
  onPress: () => void;
  icone?: NomeIcone;
  /**
   * primario: a ação principal da tela (uma só). secundario: contorno. tonal: fundo azul-claro, para
   * ações lado a lado (Ligar, WhatsApp), com uma linha de detalhe embaixo (ex.: o número).
   */
  variante?: "primario" | "secundario" | "tonal";
  /** Linha pequena embaixo do título (só no tonal): o número do telefone, por exemplo. */
  detalhe?: string;
  carregando?: boolean;
  /** Texto extra para o leitor de tela, quando o título sozinho não basta. */
  dica?: string;
  /** O leitor de tela fala isto no lugar do título (ex.: o número dígito por dígito). */
  rotulo?: string;
  /** Do tamanho do texto, não da largura da tela (ex.: dois botões lado a lado). */
  compacto?: boolean;
}

/** Botão grande (56 de altura mínima) em forma de cápsula, como o símbolo da marca. */
export function Botao({ titulo, onPress, icone, variante = "primario", detalhe, carregando, dica, rotulo, compacto }: Props) {
  const { cores } = useTema();
  const tonal = variante === "tonal";
  const corTexto =
    variante === "primario" ? cores.textoSobrePrimaria : tonal ? cores.textoTonal : cores.primaria;
  const fundo =
    variante === "primario"
      ? { backgroundColor: cores.primaria }
      : tonal
        ? { backgroundColor: cores.primariaTinta }
        : { backgroundColor: cores.superficie, borderColor: cores.primaria, borderWidth: 2 };

  return (
    <Pressable
      onPress={carregando ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo ?? titulo}
      accessibilityHint={dica}
      accessibilityState={{ busy: !!carregando }}
      style={({ pressed }) => [
        estilos.base,
        tonal ? estilos.tonal : null,
        compacto ? estilos.compacto : null,
        fundo,
        pressed && { opacity: 0.75 },
      ]}
    >
      <View style={tonal ? estilos.conteudoTonal : estilos.conteudo}>
        {carregando ? (
          <ActivityIndicator color={corTexto} />
        ) : (
          icone && <Icone name={icone} size={tonal ? 26 : 24} color={corTexto} />
        )}
        <Texto variante="destaque" cor={corTexto} style={estilos.titulo}>
          {titulo}
        </Texto>
        {tonal && detalhe ? (
          <Texto variante="legenda" secundario style={estilos.titulo}>
            {detalhe}
          </Texto>
        ) : null}
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: ALVO_MINIMO,
    borderRadius: RAIO_CAPSULA,
    paddingHorizontal: espaco.lg,
    paddingVertical: espaco.sm,
    justifyContent: "center",
  },
  compacto: { alignSelf: "flex-start", paddingHorizontal: espaco.md, flexShrink: 1 },
  tonal: { borderRadius: raio + 6, paddingHorizontal: espaco.sm, paddingVertical: espaco.md, flex: 1 },
  conteudo: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: espaco.sm },
  conteudoTonal: { alignItems: "center", justifyContent: "center", gap: 2 },
  // Com letra grande, o título quebra linha dentro do botão (sem isso, ele vaza para fora da tela).
  titulo: { flexShrink: 1, textAlign: "center" },
});
