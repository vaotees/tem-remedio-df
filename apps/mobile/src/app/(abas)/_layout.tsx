import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icone, type NomeIcone } from "@/componentes/Icone";
import {
  alturaBarraAbas,
  ESCALA_MAXIMA_ABAS,
  familia,
  MARGEM_ABAS,
  PILULA_ABA,
  RAIO_CAPSULA,
  ROTULO_ABA,
  useTema,
} from "@/tema";
import { DRIVER_NATIVO, useAnimar } from "@/util/movimento";

function IconeAba({ nome, nomeEscolhida, focused }: { nome: NomeIcone; nomeEscolhida: NomeIcone; focused: boolean }) {
  const { cores } = useTema();
  const animar = useAnimar();
  // A pílula cresce do meio quando a aba é escolhida, com uma mola; o ícone dá um pulinho.
  const [escolha] = useState(() => new Animated.Value(focused ? 1 : 0));
  useEffect(() => {
    if (!animar) {
      escolha.setValue(focused ? 1 : 0);
      return;
    }
    Animated.spring(escolha, { toValue: focused ? 1 : 0, speed: 18, bounciness: 9, useNativeDriver: DRIVER_NATIVO }).start();
  }, [animar, escolha, focused]);
  // A aba escolhida tem a pílula azul-clara atrás do ícone e o ícone cheio: não depende só da cor.
  return (
    <View style={estilos.aba}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          estilos.pilula,
          {
            backgroundColor: cores.primariaTinta,
            opacity: escolha,
            transform: [{ scaleX: escolha.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
          },
        ]}
      />
      <Animated.View
        style={{ transform: [{ scale: escolha.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 1.18, 1] }) }] }}
      >
        <Icone name={focused ? nomeEscolhida : nome} size={26} color={focused ? cores.textoTonal : cores.textoSecundario} />
      </Animated.View>
    </View>
  );
}

const estilos = StyleSheet.create({
  aba: { width: 64, height: PILULA_ABA, alignItems: "center", justifyContent: "center" },
  pilula: { borderRadius: RAIO_CAPSULA },
});

/** Quatro abas fixas, com rótulo sempre visível e grande. Nada escondido em menu. */
export default function LayoutAbas() {
  const { cores } = useTema();
  const { bottom } = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();

  return (
    <Tabs
      // "Voltar" da Ajuda volta para a aba de onde ela foi aberta (Início ou Perfil).
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: cores.textoTonal,
        tabBarInactiveTintColor: cores.textoSecundario,
        tabBarStyle: {
          backgroundColor: cores.superficie,
          borderTopColor: cores.divisoria,
          // Cresce com a letra do celular: o rótulo quebra em 2 linhas e nunca é cortado com "…".
          height: alturaBarraAbas(fontScale, bottom),
          paddingTop: MARGEM_ABAS,
          paddingBottom: MARGEM_ABAS + bottom,
        },
        tabBarLabel: ({ focused, children }) => (
          <Text
            maxFontSizeMultiplier={ESCALA_MAXIMA_ABAS}
            style={{
              fontSize: ROTULO_ABA.fonte,
              lineHeight: ROTULO_ABA.linha,
              fontFamily: focused ? familia.extra : familia.medio,
              textAlign: "center",
              color: focused ? cores.textoTonal : cores.textoSecundario,
            }}
          >
            {children}
          </Text>
        ),
      }}
    >
      <Tabs.Screen
        name="(buscar)"
        options={{
          title: "Início",
          tabBarIcon: ({ focused }) => <IconeAba nome="home-outline" nomeEscolhida="home" focused={focused} />,
          tabBarAccessibilityLabel: "Início, buscar remédio",
        }}
      />
      <Tabs.Screen
        name="(mapa)"
        options={{
          title: "Mapa",
          tabBarIcon: ({ focused }) => <IconeAba nome="map-outline" nomeEscolhida="map" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="(meus)"
        options={{
          title: "Meus remédios",
          tabBarIcon: ({ focused }) => <IconeAba nome="heart-outline" nomeEscolhida="heart" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused }) => <IconeAba nome="person-outline" nomeEscolhida="person" focused={focused} />,
        }}
      />
      {/* A Ajuda abre pelo "?" do Início e pelo Perfil; não ocupa uma aba. */}
      <Tabs.Screen name="ajuda" options={{ title: "Ajuda", tabBarButton: () => null, tabBarItemStyle: { display: "none" } }} />
    </Tabs>
  );
}
