import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { DRIVER_NATIVO, useAnimar } from "@/util/movimento";
import { Texto } from "./Texto";

/** Quanto cada bloco espera o anterior para entrar (a tela "se monta" de cima para baixo). */
const PASSO_ENTRADA = 70;
/** Depois de tantos blocos, os seguintes entram juntos: uma lista longa não fica esperando. */
const MAXIMO_ESPERA = 8;

/**
 * Entra subindo e aparecendo, um pouco depois do bloco anterior (`ordem`). Sem animação (Reduzir
 * movimento), aparece pronto.
 */
export function Surgir({ ordem = 0, children, style }: { ordem?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const animar = useAnimar();
  const [valor] = useState(() => new Animated.Value(animar ? 0 : 1));
  useEffect(() => {
    if (!animar) return;
    const entrada = Animated.timing(valor, {
      toValue: 1,
      duration: 520,
      delay: Math.min(ordem, MAXIMO_ESPERA) * PASSO_ENTRADA,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: DRIVER_NATIVO,
    });
    entrada.start();
    return () => entrada.stop();
  }, [animar, ordem, valor]);

  if (!animar) return <View style={style}>{children}</View>;
  return (
    <Animated.View
      style={[
        style,
        { opacity: valor, transform: [{ translateY: valor.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/**
 * O cartão "afunda" um pouco quando o dedo encosta e volta com uma mola ao soltar: o toque é sentido
 * mesmo antes de a próxima tela abrir. Use `estilo` numa Animated.View por fora do Pressable.
 */
export function useToque(escala = 0.97) {
  const animar = useAnimar();
  const [valor] = useState(() => new Animated.Value(1));
  const ir = (para: number) => {
    if (!animar) return;
    Animated.spring(valor, { toValue: para, speed: 40, bounciness: para === 1 ? 8 : 0, useNativeDriver: DRIVER_NATIVO }).start();
  };
  return {
    estilo: { transform: [{ scale: valor }] },
    aoEncostar: () => ir(escala),
    aoSoltar: () => ir(1),
  };
}

type PropsNumero = { valor: number; formatar?: (n: number) => string } & Omit<ComponentProps<typeof Texto>, "children">;

const formatoPadrao = (n: number) => n.toLocaleString("pt-BR");

/**
 * Número que conta de 0 até o valor quando aparece. O leitor de tela lê o valor final (o rótulo do bloco
 * em volta diz o que o número é); sem animação, mostra o valor direto.
 */
export function NumeroAnimado({ valor, formatar = formatoPadrao, ...props }: PropsNumero) {
  const animar = useAnimar();
  const [mostrado, setMostrado] = useState(0);
  useEffect(() => {
    if (!animar) return;
    const contador = new Animated.Value(0);
    const id = contador.addListener(({ value }) => setMostrado(Math.round(value)));
    const conta = Animated.timing(contador, {
      toValue: valor,
      duration: 1100,
      delay: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    conta.start();
    return () => {
      conta.stop();
      contador.removeListener(id);
    };
  }, [animar, valor]);
  return (
    <Texto accessibilityLabel={formatar(valor)} {...props}>
      {formatar(animar ? mostrado : valor)}
    </Texto>
  );
}

/**
 * Ponto "ao vivo": um círculo com uma onda que cresce e some, sem parar. Mostra que o dado é recente.
 * Sem animação, só o ponto.
 */
export function PontoVivo({ cor, tamanho = 12 }: { cor: string; tamanho?: number }) {
  const animar = useAnimar();
  const [onda] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!animar) return;
    const pulsar = Animated.loop(
      Animated.timing(onda, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: DRIVER_NATIVO }),
    );
    pulsar.start();
    return () => pulsar.stop();
  }, [animar, onda]);
  const bola = { width: tamanho, height: tamanho, borderRadius: tamanho / 2, backgroundColor: cor };
  return (
    <View style={{ width: tamanho, height: tamanho }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {animar ? (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            bola,
            {
              opacity: onda.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
              transform: [{ scale: onda.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] }) }],
            },
          ]}
        />
      ) : null}
      <View style={bola} />
    </View>
  );
}
