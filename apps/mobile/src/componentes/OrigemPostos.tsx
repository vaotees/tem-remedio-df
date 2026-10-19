import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps, ReactNode } from "react";
import { ActivityIndicator, Linking, Platform, StyleSheet, View } from "react-native";
import type { useOrigem } from "@/postos/origem";
import { espaco, useTema } from "@/tema";
import { Aviso } from "./Aviso";
import { Botao } from "./Botao";
import { Cartao } from "./Cartao";
import { Texto } from "./Texto";

type Origem = ReturnType<typeof useOrigem>;

/** Esperando o GPS responder pela primeira vez. */
export function ProcurandoLocalizacao() {
  return (
    <View style={estilos.procurando} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" />
      <Texto secundario>Procurando sua localização para mostrar os postos mais perto…</Texto>
    </View>
  );
}

interface PropsPerguntar {
  procurando: boolean;
  usarLocalizacao: () => void;
  escolherRegiao: () => void;
}

/** Primeira vez: antes do pedido do celular, explica e deixa escolher a região em vez da localização. */
export function PerguntarOrigem({ procurando, usarLocalizacao, escolherRegiao }: PropsPerguntar) {
  return (
    <Cartao>
      <Texto variante="subtitulo">Como achar os postos perto de você?</Texto>
      <Texto>O app pode usar a localização do celular, ou você escolhe a sua região.</Texto>
      <Texto secundario>A localização e a região ficam só neste celular.</Texto>
      <Botao titulo="Usar minha localização" icone="navigate" carregando={procurando} onPress={usarLocalizacao} />
      <Botao titulo="Escolher minha região" icone="list" variante="secundario" onPress={escolherRegiao} />
    </Cartao>
  );
}

interface PropsSituacao {
  origem: Origem;
  escolherRegiao: () => void;
  /**
   * Meus remédios mostra só o primeiro posto de cada remédio: uma linha diz de onde conta "perto",
   * sem os botões de trocar (eles ficam na tela de postos e na Ajuda). Os avisos continuam iguais.
   */
  resumida?: boolean;
}

/** Explica de onde o app conta "perto" e oferece a outra forma de achar os postos perto. */
export function SituacaoOrigem({ origem, escolherRegiao, resumida }: PropsSituacao) {
  const { cores } = useTema();
  const { ordem, localizacao, foraDoDf, ra, usarRegiao, procurando, usarLocalizacao } = origem;

  if (ordem.por === "distancia") {
    return (
      <Linha icone="navigate">
        {resumida ? "O posto mais perto de você, em linha reta." : "Do mais perto para o mais longe de você, em linha reta."}
      </Linha>
    );
  }

  const textoRegiao = ra
    ? `Sua região: ${ra}. Primeiro os postos dela, depois os das regiões mais perto.`
    : resumida
      ? "Escolha a sua região para ver o posto mais perto de cada remédio."
      : "Os postos aparecem por Região Administrativa. Escolha a sua para ver primeiro os postos perto de você.";
  const botaoRegiao = (
    <Botao
      titulo={ra ? "Trocar minha região" : "Escolher minha região"}
      icone="list"
      variante={ra ? "secundario" : "primario"}
      onPress={escolherRegiao}
    />
  );
  const botaoLocalizacao = (titulo = "Usar minha localização") => (
    <Botao titulo={titulo} icone="navigate" variante="secundario" carregando={procurando} onPress={usarLocalizacao} />
  );

  // A pessoa escolheu a região: não é aviso, é a escolha dela.
  if (usarRegiao) {
    if (resumida) return <Linha icone="location">Pela sua região: {ra}.</Linha>;
    return (
      <Cartao>
        <View style={estilos.linha}>
          <Ionicons name="location" size={24} color={cores.primaria} />
          <Texto variante="destaque" style={estilos.flex}>
            Sua região: {ra}
          </Texto>
        </View>
        <Texto secundario>Primeiro os postos dela, depois os das regiões mais perto.</Texto>
        {botaoRegiao}
        {botaoLocalizacao()}
      </Cartao>
    );
  }

  if (foraDoDf) {
    return (
      <Aviso tipo="info" titulo="Você parece estar fora do DF" texto={textoRegiao}>
        {botaoRegiao}
      </Aviso>
    );
  }
  if (localizacao?.situacao === "sem_permissao") {
    const nosAjustes = !localizacao.podePedir && Platform.OS !== "web";
    return (
      <Aviso tipo="info" titulo="Sem a sua localização" texto={textoRegiao}>
        {botaoRegiao}
        {localizacao.podePedir ? (
          botaoLocalizacao()
        ) : nosAjustes ? (
          <Botao
            titulo="Permitir nos ajustes"
            icone="settings-outline"
            variante="secundario"
            dica="Abre os ajustes do celular para este app"
            onPress={() => Linking.openSettings()}
          />
        ) : null}
      </Aviso>
    );
  }
  return (
    <Aviso tipo="info" titulo="Não consegui achar sua localização" texto={textoRegiao}>
      {botaoRegiao}
      {botaoLocalizacao("Tentar de novo")}
    </Aviso>
  );
}

function Linha({ icone, children }: { icone: ComponentProps<typeof Ionicons>["name"]; children: ReactNode }) {
  const { cores } = useTema();
  return (
    <View style={estilos.linha}>
      <Ionicons name={icone} size={20} color={cores.textoSecundario} />
      <Texto secundario style={estilos.flex}>
        {children}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  procurando: { alignItems: "center", gap: espaco.md, paddingVertical: espaco.xl },
  linha: { flexDirection: "row", alignItems: "center", gap: espaco.sm },
  flex: { flex: 1 },
});
