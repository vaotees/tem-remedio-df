import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonte, useTema } from "@/tema";

type NomeIcone = ComponentProps<typeof Ionicons>["name"];

function IconeAba({ nome, focused }: { nome: NomeIcone; focused: boolean }) {
  const { cores } = useTema();
  return <Ionicons name={nome} size={28} color={focused ? cores.primaria : cores.textoSecundario} />;
}

/** Três abas fixas, com rótulo sempre visível e grande. Nada escondido em menu. */
export default function LayoutAbas() {
  const { cores } = useTema();
  const { bottom } = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoSecundario,
        tabBarStyle: {
          backgroundColor: cores.fundo,
          borderTopColor: cores.divisoria,
          height: 88 + bottom,
          paddingTop: 8,
          paddingBottom: 8 + bottom,
        },
        // Rótulo pode quebrar em 2 linhas: nunca cortar com "…" (inclusive com letra grande no celular).
        tabBarLabel: ({ focused, children }) => (
          <Text
            numberOfLines={2}
            style={{
              fontSize: fonte.legenda,
              lineHeight: 20,
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
        name="meus-remedios"
        options={{ title: "Meus remédios", tabBarIcon: ({ focused }) => <IconeAba nome="heart-outline" focused={focused} /> }}
      />
      <Tabs.Screen
        name="ajuda"
        options={{ title: "Ajuda", tabBarIcon: ({ focused }) => <IconeAba nome="help-circle-outline" focused={focused} /> }}
      />
    </Tabs>
  );
}
