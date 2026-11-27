import { Pressable, StyleSheet, View } from "react-native";
import { mudarPreferencias, usePreferencias } from "@/preferencias/preferencias";
import { ALVO_MINIMO, espaco, RAIO_CARTAO, useTema } from "@/tema";
import { Icone } from "./Icone";
import { Texto } from "./Texto";

interface Props {
  /** Nome curto e fixo da dica (ex.: "mapa-gestos"): é o que fica guardado depois do "Entendi". */
  id: string;
  children: string;
}

/**
 * Dica de uso que aparece até a pessoa tocar em "Entendi" (ex.: como mexer no mapa). Depois, some de vez:
 * instrução fixa na tela vira ruído para quem já aprendeu. Fica guardado só neste celular, com o Perfil.
 */
export function Dica({ id, children }: Props) {
  const { cores } = useTema();
  const { dicas } = usePreferencias();
  if (dicas.includes(id)) return null;

  return (
    <View style={[estilos.dica, { backgroundColor: cores.info.fundo }]}>
      <View style={estilos.linha}>
        <Icone name="bulb-outline" size={22} color={cores.info.texto} />
        <Texto cor={cores.info.texto} style={estilos.texto}>
          {children}
        </Texto>
      </View>
      <Pressable
        onPress={() => mudarPreferencias({ dicas: [...dicas, id] })}
        accessibilityRole="button"
        accessibilityLabel="Entendi"
        accessibilityHint="Esta dica não aparece mais"
        style={({ pressed }) => [estilos.entendi, pressed && { opacity: 0.6 }]}
      >
        <Texto variante="destaque" cor={cores.primaria}>
          Entendi
        </Texto>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  dica: { borderRadius: RAIO_CARTAO, paddingTop: espaco.md, paddingHorizontal: espaco.md, gap: espaco.xs },
  linha: { flexDirection: "row", alignItems: "flex-start", gap: espaco.sm },
  texto: { flexShrink: 1 },
  entendi: { alignSelf: "flex-end", minHeight: ALVO_MINIMO, justifyContent: "center", paddingHorizontal: espaco.sm },
});
