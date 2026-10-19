import { AccessibilityInfo, StyleSheet, View } from "react-native";
import { useMeusRemedios, type NovoRemedio } from "@/meus-remedios/guardados";
import { espaco } from "@/tema";
import { Botao } from "./Botao";
import { Texto } from "./Texto";

interface Props {
  remedio: NovoRemedio;
  /** Na tela vazia, guardar é a ação principal: botão preenchido. */
  principal?: boolean;
}

/**
 * "Guardar em Meus remédios". Depois de guardado, o mesmo botão mostra o estado (coração cheio +
 * "Guardado em Meus remédios") e tira da lista com outro toque.
 */
export function BotaoGuardar({ remedio, principal }: Props) {
  const { carregando, estaGuardado, guardar, tirar } = useMeusRemedios();
  // Enquanto lê a lista do aparelho, não mostra um estado que pode estar errado.
  if (carregando) return null;

  const guardado = estaGuardado(remedio.codigo);
  const alternar = async () => {
    if (guardado) await tirar(remedio.codigo);
    else await guardar(remedio);
    AccessibilityInfo.announceForAccessibility(guardado ? "Tirado de Meus remédios" : "Guardado em Meus remédios");
  };

  return (
    <View style={estilos.grupo}>
      <Botao
        titulo={guardado ? "Guardado em Meus remédios" : "Guardar em Meus remédios"}
        icone={guardado ? "heart" : "heart-outline"}
        variante={principal && !guardado ? "primario" : "secundario"}
        dica={guardado ? "Toque para tirar da sua lista" : "Para ver depois na aba Meus remédios"}
        onPress={alternar}
      />
      {guardado ? (
        <Texto variante="legenda" secundario>
          Está na aba Meus remédios. Para tirar, toque no botão de novo.
        </Texto>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: espaco.xs },
});
