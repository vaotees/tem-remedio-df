import type { Snapshot } from "@tem-remedio/shared";
import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useSnapshot } from "@/dados/useSnapshot";
import { espaco, useTema } from "@/tema";
import { Texto } from "./Texto";

type Estado = ReturnType<typeof useSnapshot>;

/** Mostra "carregando" ou o erro, e só renderiza o conteúdo quando os dados estão prontos. */
export function ComDados({ children }: { children: (snapshot: Snapshot, estado: Estado) => ReactNode }) {
  const estado = useSnapshot();
  const { cores } = useTema();

  if (estado.snapshot) return <>{children(estado.snapshot, estado)}</>;

  return (
    <View style={estilos.centro} accessibilityLiveRegion="polite">
      {estado.erro ? (
        <Texto>Não consegui abrir os dados do app. Feche e abra de novo.</Texto>
      ) : (
        <>
          <ActivityIndicator size="large" color={cores.primaria} />
          <Texto secundario>Carregando os dados…</Texto>
        </>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  centro: { flex: 1, alignItems: "center", justifyContent: "center", gap: espaco.md, padding: espaco.lg },
});
