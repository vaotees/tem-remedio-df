import { useEffect, useId, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, StyleSheet, useColorScheme, View } from "react-native";
import Svg, { Defs, Mask, Path, Rect } from "react-native-svg";
import { coresClaras, coresEscuras } from "@/tema/cores";
import { FundoDegrade } from "./Faixa";
import { CAPSULA_BAIXO, CAPSULA_CIMA, CORTE, HASTE_CURTA } from "./Marca";
import { Texto } from "./Texto";

/** Do tamanho e no lugar do símbolo da abertura do sistema (`imageWidth` do expo-splash-screen no app.json). */
const TAMANHO = 160;
/** O símbolo depois de subir, com o nome embaixo: o conjunto fica no meio da tela. */
const TAMANHO_FINAL = 112;
/** Entre o símbolo e o nome. */
const ESPACO = 20;
/** Os fundos da abertura do sistema (app.json): a troca para esta tela não aparece. */
const FUNDO = { claro: "#FFFFFF", escuro: "#0F1115" } as const;
/** Direção da haste longa (a cápsula), de baixo para cima, no desenho de 1024. */
const DIRECAO = { x: 0.643, y: -0.766 };
/** Quanto as metades da cápsula se afastam antes do encaixe. */
const AFASTA = TAMANHO * 0.09;
/** Quanto tempo o nome fica parado na tela, inteiro, antes de a abertura sumir. */
const TEMPO_PARA_LER = 1100;
/** Na web, o Animated roda em JavaScript (não há driver nativo). */
const nativo = Platform.OS !== "web";

type Modo = "animar" | "parado" | "leitor";

/**
 * Com leitor de tela, a abertura é só espera: some logo. Com "Reduzir movimento", aparece já montada,
 * sem nada se mexer, e some depois de dar tempo de ler. Na web não dá para saber do leitor de tela (o
 * react-native-web sempre responde que sim): vale só o "reduzir movimento".
 */
async function modoDaAbertura(): Promise<Modo> {
  try {
    const [reduzir, leitor] = await Promise.all([
      AccessibilityInfo.isReduceMotionEnabled(),
      nativo ? AccessibilityInfo.isScreenReaderEnabled() : false,
    ]);
    return leitor ? "leitor" : reduzir ? "parado" : "animar";
  } catch {
    return "parado";
  }
}

interface CoresSimbolo {
  haste: string;
  capsula: string;
}

/** O símbolo em três camadas (haste, metade de baixo, metade de cima), com as metades que se afastam. */
function CamadasSimbolo({ cores, separar }: { cores: CoresSimbolo; separar: Animated.Value }) {
  const id = `abertura-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const deslocar = (sentido: 1 | -1) => [
    { translateX: separar.interpolate({ inputRange: [0, 1], outputRange: [0, sentido * DIRECAO.x * AFASTA] }) },
    { translateY: separar.interpolate({ inputRange: [0, 1], outputRange: [0, sentido * DIRECAO.y * AFASTA] }) },
  ];
  return (
    <>
      <Svg width={TAMANHO} height={TAMANHO} viewBox="0 0 1024 1024" style={StyleSheet.absoluteFill}>
        <Defs>
          <Mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">
            <Rect width="1024" height="1024" fill="#FFFFFF" />
            <Path d={CORTE} fill="#000000" stroke="#000000" strokeWidth={60} />
          </Mask>
        </Defs>
        <Path d={HASTE_CURTA} fill={cores.haste} mask={`url(#${id})`} />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: deslocar(-1) }]}>
        <Svg width={TAMANHO} height={TAMANHO} viewBox="0 0 1024 1024">
          <Path d={CAPSULA_BAIXO} fill={cores.haste} />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: deslocar(1) }]}>
        <Svg width={TAMANHO} height={TAMANHO} viewBox="0 0 1024 1024">
          <Path d={CAPSULA_CIMA} fill={cores.capsula} />
        </Svg>
      </Animated.View>
    </>
  );
}

/**
 * Abertura animada, por cima do app, logo depois da abertura do sistema. Começa igual a ela (o símbolo
 * parado no meio, no fundo branco); as metades da cápsula se soltam e se encaixam com um "clique"; o fundo
 * vira o degradê da marca, o símbolo fica branco e sobe, e o nome e a frase aparecem embaixo, com o
 * conjunto no meio da tela. O nome fica parado para dar tempo de ler e a abertura some, mostrando o
 * Início, que começa com a mesma faixa azul. Dura cerca de 3 s; um toque pula. Sem som.
 */
export function Abertura({ aoTerminar }: { aoTerminar: () => void }) {
  const escuro = useColorScheme() === "dark";
  const cores = escuro ? coresEscuras : coresClaras;
  // Os valores da animação nascem uma vez (estado que nunca muda; o Animated mexe neles por fora do React).
  const [separar] = useState(() => new Animated.Value(0));
  const [pulso] = useState(() => new Animated.Value(0));
  const [tema] = useState(() => new Animated.Value(0));
  const [subir] = useState(() => new Animated.Value(0));
  const [nome] = useState(() => new Animated.Value(0));
  const [frase] = useState(() => new Animated.Value(0));
  const [saida] = useState(() => new Animated.Value(1));
  // Quanto o símbolo sobe: metade da altura do nome e da frase (medida na tela, com a letra do celular).
  const [subida] = useState(() => new Animated.Value(-50));
  const [alturaTextos, setAlturaTextos] = useState(84);
  const [podePular, setPodePular] = useState(false);
  const rodando = useRef<Animated.CompositeAnimation | null>(null);
  const terminou = useRef(false);

  useEffect(() => {
    let viva = true;
    const passo = (valor: Animated.Value, toValue: number, duration: number, easing = Easing.out(Easing.quad), delay = 0) =>
      Animated.timing(valor, { toValue, duration, easing, delay, useNativeDriver: nativo });
    const fim = () => {
      if (viva && !terminou.current) {
        terminou.current = true;
        aoTerminar();
      }
    };

    modoDaAbertura().then((modo) => {
      if (!viva) return;
      if (modo === "leitor") {
        passo(saida, 0, 150).start(fim);
        return;
      }
      setPodePular(true);
      if (modo === "parado") {
        [tema, subir, nome, frase].forEach((v) => v.setValue(1));
        rodando.current = Animated.sequence([Animated.delay(TEMPO_PARA_LER), passo(saida, 0, 250)]);
        rodando.current.start(fim);
        return;
      }
      const suave = Easing.inOut(Easing.cubic);
      rodando.current = Animated.sequence([
        Animated.parallel([
          // 1. As metades se soltam e se encaixam, passando um pouco do ponto, como um clique.
          Animated.sequence([Animated.delay(150), passo(separar, 1, 180), passo(separar, 0, 260, Easing.out(Easing.back(2.2)))]),
          Animated.sequence([Animated.delay(530), passo(pulso, 1, 90), passo(pulso, 0, 160)]),
          // 2. O fundo vira o degradê da marca e o símbolo sobe, abrindo lugar para o nome.
          passo(tema, 1, 650, suave, 700),
          passo(subir, 1, 650, suave, 700),
          // 3. O nome e a frase sobem, um depois do outro.
          passo(nome, 1, 480, Easing.out(Easing.cubic), 1050),
          passo(frase, 1, 480, Easing.out(Easing.cubic), 1250),
        ]),
        // 4. Tempo para ler, e a abertura some, com o conjunto chegando um pouco mais perto.
        Animated.delay(TEMPO_PARA_LER),
        passo(saida, 0, 380, Easing.in(Easing.quad)),
      ]);
      rodando.current.start(fim);
    });
    return () => {
      viva = false;
      rodando.current?.stop();
    };
    // `aoTerminar` vem estável do layout (useCallback): a animação roda uma vez só.
  }, [separar, pulso, tema, subir, nome, frase, saida, aoTerminar]);

  const pular = () => {
    if (terminou.current) return;
    rodando.current?.stop();
    rodando.current = Animated.timing(saida, { toValue: 0, duration: 220, useNativeDriver: nativo });
    rodando.current.start(() => {
      if (!terminou.current) {
        terminou.current = true;
        aoTerminar();
      }
    });
  };

  const escalaFinal = TAMANHO_FINAL / TAMANHO;
  const branco: CoresSimbolo = { haste: cores.textoFaixa, capsula: cores.marca.menta };
  const colorido: CoresSimbolo = { haste: cores.marca.azul, capsula: cores.marca.verde };
  const sobe = (valor: Animated.Value) => ({
    opacity: valor,
    transform: [{ translateY: valor.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
  });

  return (
    <Animated.View
      style={[estilos.tela, { opacity: saida }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID="abertura"
    >
      <FundoDegrade simbolo={false} />
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: escuro ? FUNDO.escuro : FUNDO.claro, opacity: tema.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
        ]}
      />

      <Animated.View
        style={[
          estilos.conjunto,
          { transform: [{ scale: saida.interpolate({ inputRange: [0, 1], outputRange: [1.08, 1] }) }] },
        ]}
      >
        <Animated.View
          style={[
            estilos.simbolo,
            {
              transform: [
                { translateY: Animated.multiply(subir, subida) },
                { scale: subir.interpolate({ inputRange: [0, 1], outputRange: [1, escalaFinal] }) },
                { scale: pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) },
              ],
            },
          ]}
        >
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: tema.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
            <CamadasSimbolo cores={colorido} separar={separar} />
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: tema }]}>
            <CamadasSimbolo cores={branco} separar={separar} />
          </Animated.View>
        </Animated.View>

        {/* Embaixo do símbolo já no lugar final: o conjunto (símbolo + nome + frase) fica no meio da tela. */}
        <View
          style={[estilos.textos, { marginTop: (TAMANHO_FINAL + ESPACO - alturaTextos) / 2 }]}
          onLayout={(e) => {
            const altura = e.nativeEvent.layout.height;
            setAlturaTextos(altura);
            subida.setValue(-(altura + ESPACO) / 2);
          }}
        >
          <Animated.View style={sobe(nome)}>
            <Texto peso="extra" tamanho={30} cor={cores.textoFaixa} style={estilos.centro}>
              Tem Remédio{" "}
              <Texto peso="extra" tamanho={30} cor={cores.marca.menta}>
                DF
              </Texto>
            </Texto>
          </Animated.View>
          <Animated.View style={sobe(frase)}>
            <Texto peso="medio" cor={cores.textoFaixaSecundario} style={estilos.centro}>
              Veja se tem antes de sair de casa
            </Texto>
          </Animated.View>
        </View>
      </Animated.View>

      {podePular ? <Pressable style={StyleSheet.absoluteFill} onPress={pular} testID="pular-abertura" /> : null}
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  tela: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 100 },
  conjunto: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" },
  simbolo: { width: TAMANHO, height: TAMANHO },
  // Começa no meio da tela (top 50%) e desce o quanto falta para o conjunto ficar centrado.
  textos: { position: "absolute", top: "50%", left: 24, right: 24, alignItems: "center", gap: 6 },
  centro: { textAlign: "center" },
});
