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
import { useCallback, useEffect, useState } from "react";
import { Abertura } from "@/componentes/Abertura";
import { MolduraWeb } from "@/componentes/MolduraWeb";
import { ligarFocoDoApp, queryClient } from "@/dados/consultas";
import { carregarPreferencias } from "@/preferencias/preferencias";
import { useTema } from "@/tema";
import { carregarMovimento } from "@/util/movimento";

// A tela de abertura (o símbolo) fica até a fonte e as preferências estarem prontas: sem "pulo" de letra.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function LayoutRaiz() {
  const { cores } = useTema();
  const [fontes, erroFontes] = useFonts({
    AtkinsonHyperlegibleNext_400Regular,
    AtkinsonHyperlegibleNext_500Medium,
    AtkinsonHyperlegibleNext_700Bold,
    AtkinsonHyperlegibleNext_800ExtraBold,
  });
  const [preferencias, setPreferencias] = useState(false);
  // A abertura animada fica por cima do app até terminar (uma vez, quando o app abre).
  const [abertura, setAbertura] = useState(true);
  const fimDaAbertura = useCallback(() => setAbertura(false), []);
  useEffect(ligarFocoDoApp, []);
  useEffect(() => {
    // O "Reduzir movimento" do sistema também: as telas já nascem sabendo se animam.
    Promise.all([carregarPreferencias(), carregarMovimento()]).finally(() => setPreferencias(true));
  }, []);

  // Se a fonte falhar, segue com a do sistema: o app nunca fica preso na abertura.
  const pronto = (fontes || !!erroFontes) && preferencias;
  useEffect(() => {
    if (pronto) SplashScreen.hideAsync().catch(() => {});
  }, [pronto]);
  if (!pronto) return null;

  return (
    <QueryClientProvider client={queryClient}>
      {/* Toda tela começa pela faixa azul da marca, atrás do relógio: letras claras sempre. */}
      <StatusBar style="light" />
      <MolduraWeb>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }}>
          <Stack.Screen name="(abas)" />
        </Stack>
      </MolduraWeb>
      {abertura ? <Abertura aoTerminar={fimDaAbertura} /> : null}
    </QueryClientProvider>
  );
}
