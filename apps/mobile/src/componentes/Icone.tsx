import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";

export type NomeIcone = ComponentProps<typeof Ionicons>["name"];

/**
 * Ícone do app. É sempre enfeite: o texto ao lado (ou o rótulo do botão) diz o que ele significa.
 * Por isso fica escondido do leitor de tela, que senão pararia nele e leria um caractere sem sentido
 * (o ícone é uma letra de uma fonte especial).
 */
export function Icone(props: ComponentProps<typeof Ionicons>) {
  return <Ionicons {...props} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />;
}
