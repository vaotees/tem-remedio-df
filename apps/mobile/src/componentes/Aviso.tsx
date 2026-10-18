import Ionicons from "@expo/vector-icons/Ionicons";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { espaco, raio, useTema } from "@/tema";
import { Texto } from "./Texto";

interface Props {
  /** "aviso": atenção antes de ir (amarelo). "info": orientação neutra (azul). */
  tipo?: "aviso" | "info";
  titulo: string;
  texto?: string;
  /** Botões ou textos extras, abaixo do texto. */
  children?: ReactNode;
}

/** Caixa de aviso: ícone + título + texto. A cor nunca vem sozinha. */
export function Aviso({ tipo = "aviso", titulo, texto, children }: Props) {
  const { cores } = useTema();
  const par = tipo === "aviso" ? cores.aviso : cores.info;
  return (
    <View style={[estilos.caixa, { backgroundColor: par.fundo, borderColor: par.texto }]}>
      <View style={estilos.cabecalho}>
        <Ionicons name={tipo === "aviso" ? "warning" : "information-circle"} size={26} color={par.texto} />
        <Texto variante="destaque" cor={par.texto} style={estilos.titulo} accessibilityRole="header">
          {titulo}
        </Texto>
      </View>
      {texto ? <Texto cor={par.texto}>{texto}</Texto> : null}
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: { borderRadius: raio, borderWidth: 1, padding: espaco.md, gap: espaco.sm },
  cabecalho: { flexDirection: "row", alignItems: "flex-start", gap: espaco.sm },
  titulo: { flex: 1 },
});
