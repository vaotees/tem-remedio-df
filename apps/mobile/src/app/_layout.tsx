import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ligarFocoDoApp, queryClient } from "@/dados/consultas";
import { useTema } from "@/tema";

export default function LayoutRaiz() {
  const { escuro, cores } = useTema();
  useEffect(ligarFocoDoApp, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={escuro ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }}>
        <Stack.Screen name="(abas)" />
      </Stack>
    </QueryClientProvider>
  );
}
