import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, useColorScheme } from "react-native";
import Svg, { Defs, Mask, Path, Rect } from "react-native-svg";
import { coresClaras, coresEscuras } from "@/tema/cores";
import { CAPSULA_BAIXO, CAPSULA_CIMA, CORTE, HASTE_CURTA } from "./Marca";
import { Texto } from "./Texto";

/** Do tamanho e no lugar do símbolo da abertura do sistema (`imageWidth` do expo-splash-screen no app.json). */
const TAMANHO = 160;
/** Os fundos da abertura do sistema (app.json): a troca para esta tela não aparece. */
const FUNDO = { claro: "#FFFFFF", escuro: "#0F1115" } as const;
/** Direção da haste longa (a cápsula), de baixo para cima, no desenho de 1024. */
const DIRECAO = { x: 0.643, y: -0.766 };
/** Quanto as metades da cápsula se afastam antes do encaixe. */
const AFASTA = TAMANHO * 0.09;
/** Na web, o Animated roda em JavaScript (não há driver nativo). */
const nativo = Platform.OS !== "web";

/**
 * Animação só para quem não pediu menos movimento e não usa leitor de tela (para ele, a abertura é só espera).
 * Na web não dá para saber do leitor de tela (o react-native-web sempre responde que sim): vale só o
 * "reduzir movimento" do sistema, e a abertura fica escondida do leitor do mesmo jeito.
 */
async function podeAnimar(): Promise<boolean> {
  try {
    const [reduzir, leitor] = await Promise.all([
      AccessibilityInfo.isReduceMotionEnabled(),
      nativo ? AccessibilityInfo.isScreenReaderEnabled() : false,
    ]);
    return !reduzir && !leitor;
  } catch {
    return false;
  }
}

/**
 * Abertura animada, por cima do app, logo depois da abertura do sistema: começa igual a ela (o símbolo
 * parado), as metades da cápsula se soltam e se encaixam com um "clique", o nome sobe e a tela some.
 * Dura 1,15 s e corre enquanto o app carrega os dados por baixo, então não aumenta a espera.
 * Com "Reduzir movimento" ou leitor de tela, só some (150 ms). Sem som.
 */
export function Abertura({ aoTerminar }: { aoTerminar: () => void }) {
  const escuro = useColorScheme() === "dark";
  const cores = escuro ? coresEscuras : coresClaras;
  // Os valores da animação nascem uma vez (estado que nunca muda; o Animated mexe neles por fora do React).
  const [separar] = useState(() => new Animated.Value(0));
  const [pulso] = useState(() => new Animated.Value(0));
  const [nome] = useState(() => new Animated.Value(0));
  const [tela] = useState(() => new Animated.Value(1));

  useEffect(() => {
    let viva = true;
    const passo = (valor: Animated.Value, toValue: number, duration: number, easing = Easing.out(Easing.quad), delay = 0) =>
      Animated.timing(valor, { toValue, duration, easing, delay, useNativeDriver: nativo });

    podeAnimar().then((animar) => {
      if (!viva) return;
      const animacao = animar
        ? Animated.parallel([
            // Soltam e se encaixam, passando um pouco do ponto, como um clique.
            Animated.sequence([passo(separar, 1, 180), passo(separar, 0, 260, Easing.out(Easing.back(2.2)))]),
            Animated.sequence([Animated.delay(380), passo(pulso, 1, 90), passo(pulso, 0, 140)]),
            passo(nome, 1, 340, Easing.out(Easing.cubic), 360),
            passo(tela, 0, 250, Easing.out(Easing.quad), 900),
          ])
        : passo(tela, 0, 150);
      animacao.start(() => {
        if (viva) aoTerminar();
      });
    });
    return () => {
      viva = false;
    };
    // `aoTerminar` vem estável do layout (useCallback): a animação roda uma vez só.
  }, [separar, pulso, nome, tela, aoTerminar]);

  const deslocar = (sentido: 1 | -1) => [
    { translateX: separar.interpolate({ inputRange: [0, 1], outputRange: [0, sentido * DIRECAO.x * AFASTA] }) },
    { translateY: separar.interpolate({ inputRange: [0, 1], outputRange: [0, sentido * DIRECAO.y * AFASTA] }) },
  ];

  return (
    <Animated.View
      style={[estilos.tela, { backgroundColor: escuro ? FUNDO.escuro : FUNDO.claro, opacity: tela }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID="abertura"
    >
      <Animated.View
        style={[estilos.simbolo, { transform: [{ scale: pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }] }]}
      >
        <Svg width={TAMANHO} height={TAMANHO} viewBox="0 0 1024 1024" style={StyleSheet.absoluteFill}>
          <Defs>
            <Mask id="abertura-corte" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">
              <Rect width="1024" height="1024" fill="#FFFFFF" />
              <Path d={CORTE} fill="#000000" stroke="#000000" strokeWidth={60} />
            </Mask>
          </Defs>
          <Path d={HASTE_CURTA} fill={cores.marca.azul} mask="url(#abertura-corte)" />
        </Svg>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: deslocar(-1) }]}>
          <Svg width={TAMANHO} height={TAMANHO} viewBox="0 0 1024 1024">
            <Path d={CAPSULA_BAIXO} fill={cores.marca.azul} />
          </Svg>
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: deslocar(1) }]}>
          <Svg width={TAMANHO} height={TAMANHO} viewBox="0 0 1024 1024">
            <Path d={CAPSULA_CIMA} fill={cores.marca.verde} />
          </Svg>
        </Animated.View>
      </Animated.View>

      <Animated.View
        style={[
          estilos.nome,
          { opacity: nome, transform: [{ translateY: nome.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] },
        ]}
      >
        {/* Não é "titulo": seria um cabeçalho (na web, um h1 dentro de outro) numa tela que o leitor nem lê. */}
        <Texto peso="extra" tamanho={30} cor={cores.texto} style={estilos.centro}>
          Tem Remédio{" "}
          <Texto peso="extra" tamanho={30} cor={cores.marca.verde}>
            DF
          </Texto>
        </Texto>
        <Texto secundario cor={cores.textoSecundario} style={estilos.centro}>
          Veja se tem antes de sair de casa
        </Texto>
      </Animated.View>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  tela: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 100, alignItems: "center", justifyContent: "center" },
  simbolo: { width: TAMANHO, height: TAMANHO },
  // Embaixo do símbolo, sem empurrar ele do centro (onde está o da abertura do sistema).
  nome: { position: "absolute", top: "50%", left: 24, right: 24, marginTop: TAMANHO / 2 + 16, alignItems: "center", gap: 4 },
  centro: { textAlign: "center" },
});
