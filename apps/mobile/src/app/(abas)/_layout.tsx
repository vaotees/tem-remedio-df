import { Tabs } from "expo-router";
import { Text, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icone, type NomeIcone } from "@/componentes/Icone";
import { alturaBarraAbas, ESCALA_MAXIMA_ABAS, MARGEM_ABAS, ROTULO_ABA, useTema } from "@/tema";

function IconeAba({ nome, focused }: { nome: NomeIcone; focused: boolean }) {
  const { cores } = useTema();
  return <Icone name={nome} size={28} color={focused ? cores.primaria : cores.textoSecundario} />;
}

/** Três abas fixas, com rótulo sempre visível e grande. Nada escondido em menu. */
export default function LayoutAbas() {
  const { cores } = useTema();
  const { bottom } = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoSecundario,
        tabBarStyle: {
          backgroundColor: cores.fundo,
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
              fontWeight: "600",
              textAlign: "center",
              color: focused ? cores.primaria : cores.textoSecundario,
            }}
          >
            {children}
          </Text>
        ),
      }}
    >
      <Tabs.Screen
        name="(buscar)"
        options={{ title: "Buscar", tabBarIcon: ({ focused }) => <IconeAba nome="search" focused={focused} />, tabBarAccessibilityLabel: "Buscar remédio" }}
      />
      <Tabs.Screen
        name="(meus)"
        options={{ title: "Meus remédios", tabBarIcon: ({ focused }) => <IconeAba nome="heart-outline" focused={focused} /> }}
      />
      <Tabs.Screen
        name="ajuda"
        options={{ title: "Ajuda", tabBarIcon: ({ focused }) => <IconeAba nome="help-circle-outline" focused={focused} /> }}
      />
    </Tabs>
  );
}
