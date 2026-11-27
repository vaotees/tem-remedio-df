import { useState } from "react";
import { AccessibilityInfo, StyleSheet, View } from "react-native";
import { useMeusRemedios, type NovoRemedio } from "@/meus-remedios/guardados";
import { espaco } from "@/tema";
import { Botao } from "./Botao";
import { Texto } from "./Texto";

interface Props {
  remedio: NovoRemedio;
  /** Na tela vazia, guardar é a ação principal: botão preenchido. */
  principal?: boolean;
  /**
   * No alto da tela de postos, ao lado do Voltar: "Guardar" curto, para a lista começar logo abaixo.
   * A explicação de onde o remédio foi parar fica com a tela (`aoMudar`), embaixo da barra, para não
   * alargar o botão e empurrar ele para outra linha.
   */
  compacto?: boolean;
  aoMudar?: (guardado: boolean) => void;
}

/**
 * "Guardar em Meus remédios". Depois de guardado, o mesmo botão mostra o estado (coração cheio +
 * "Guardado") e tira da lista com outro toque. A explicação de onde o remédio foi parar aparece só logo
 * depois do toque, não toda vez que a tela abre.
 */
export function BotaoGuardar({ remedio, principal, compacto, aoMudar }: Props) {
  const { carregando, estaGuardado, guardar, tirar } = useMeusRemedios();
  const [acabouDeGuardar, setAcabouDeGuardar] = useState(false);
  // Enquanto lê a lista do aparelho, não mostra um estado que pode estar errado.
  if (carregando) return null;

  const guardado = estaGuardado(remedio.codigo);
  const alternar = async () => {
    if (guardado) await tirar(remedio.codigo);
    else await guardar(remedio);
    setAcabouDeGuardar(!guardado);
    aoMudar?.(!guardado);
    AccessibilityInfo.announceForAccessibility(guardado ? "Tirado de Meus remédios" : "Guardado em Meus remédios");
  };
  const rotulo = guardado ? "Guardado em Meus remédios" : "Guardar em Meus remédios";

  return (
    <View style={compacto ? estilos.compacto : estilos.grupo}>
      <Botao
        titulo={compacto ? (guardado ? "Guardado" : "Guardar") : rotulo}
        rotulo={rotulo}
        icone={guardado ? "heart" : "heart-outline"}
        variante={principal && !guardado ? "primario" : "secundario"}
        compacto={compacto}
        dica={guardado ? "Toque para tirar da sua lista" : "Para ver depois na aba Meus remédios"}
        onPress={alternar}
      />
      {guardado && acabouDeGuardar && !compacto ? (
        <Texto variante="legenda" secundario>
          Está na aba Meus remédios. Para tirar, toque no botão de novo.
        </Texto>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: espaco.xs },
  compacto: { flexShrink: 1 },
});
