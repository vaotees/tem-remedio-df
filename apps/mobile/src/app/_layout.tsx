import { AtkinsonHyperlegibleMono_700Bold } from "@expo-google-fonts/atkinson-hyperlegible-mono";
import {
  AtkinsonHyperlegibleNext_400Regular,
  AtkinsonHyperlegibleNext_500Medium,
  AtkinsonHyperlegibleNext_700Bold,
  AtkinsonHyperlegibleNext_800ExtraBold,
} from "@expo-google-fonts/atkinson-hyperlegible-next";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ligarFocoDoApp, queryClient } from "@/dados/consultas";
import { carregarPreferencias } from "@/preferencias/preferencias";
import { useTema } from "@/tema";

// A tela de abertura (o símbolo) fica até a fonte e as preferências estarem prontas: sem "pulo" de letra.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function LayoutRaiz() {
  const { escuro, cores } = useTema();
  const [fontes, erroFontes] = useFonts({
    AtkinsonHyperlegibleNext_400Regular,
    AtkinsonHyperlegibleNext_500Medium,
    AtkinsonHyperlegibleNext_700Bold,
    AtkinsonHyperlegibleNext_800ExtraBold,
    AtkinsonHyperlegibleMono_700Bold,
  });
  const [preferencias, setPreferencias] = useState(false);
  useEffect(ligarFocoDoApp, []);
  useEffect(() => {
    carregarPreferencias().finally(() => setPreferencias(true));
  }, []);

  // Se a fonte falhar, segue com a do sistema: o app nunca fica preso na abertura.
  const pronto = (fontes || !!erroFontes) && preferencias;
  useEffect(() => {
    if (pronto) SplashScreen.hideAsync().catch(() => {});
  }, [pronto]);
  if (!pronto) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={escuro ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }}>
        <Stack.Screen name="(abas)" />
      </Stack>
    </QueryClientProvider>
  );
}
