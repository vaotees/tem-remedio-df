import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { EscolhaUnica } from "@/componentes/EscolhaUnica";
import { Cartao } from "@/componentes/Cartao";
import { Icone, type NomeIcone } from "@/componentes/Icone";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import { useRegiaoEscolhida } from "@/postos/regiao-escolhida";
import {
  ESCALAS_LETRA,
  mudarPreferencias,
  usePreferencias,
  type Letra,
  type PreferenciaTema,
} from "@/preferencias/preferencias";
import { ALVO_MINIMO, espaco, familia, fonte, RAIO_CAPSULA, raio, useTema } from "@/tema";

const TITULO_LETRA: Record<Letra, string> = { normal: "Normal", grande: "Grande", maior: "Maior" };

/**
 * Perfil sem cadastro: nada de senha nem conta. Nome (só para a saudação), letra, tema e região
 * ficam só neste celular. Ajuda fica aqui e no "?" do Início.
 */
export default function Perfil() {
  const router = useRouter();
  const { cores, escalaLetra } = useTema();
  const preferencias = usePreferencias();
  const { ra } = useRegiaoEscolhida();
  // As preferências já foram lidas na abertura do app: o campo começa com o nome guardado.
  const [nome, setNome] = useState(preferencias.nome ?? "");
  const salvarNome = () => void mudarPreferencias({ nome });
  const inicial = preferencias.nome?.charAt(0).toLocaleUpperCase("pt-BR");

  return (
    <Tela
      faixa={
        <View style={estilos.cabecalho}>
          <View style={[estilos.avatar, { backgroundColor: cores.marca.menta }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {inicial ? (
              <Texto peso="extra" tamanho={30} cor={cores.textoSobreMenta}>
                {inicial}
              </Texto>
            ) : (
              <Icone name="person" size={34} color={cores.textoSobreMenta} />
            )}
          </View>
          <View style={estilos.flex}>
            <Texto variante="titulo" cor={cores.textoFaixa}>
              {preferencias.nome ?? "Perfil"}
            </Texto>
            <Texto peso="medio" cor={cores.textoFaixaSecundario}>
              {ra ? `${ra} · perfil neste celular` : "Perfil neste celular"}
            </Texto>
          </View>
        </View>
      }
    >

      <View style={[estilos.garantia, { backgroundColor: cores.primariaTinta }]}>
        <Icone name="shield-checkmark" size={28} color={cores.textoTonal} />
        <Texto style={estilos.flex}>
          <Texto peso="negrito">Sem senha e sem cadastro.</Texto> O que você guarda fica só neste celular.
        </Texto>
      </View>

      <Cartao>
        <Texto variante="subtitulo">Seu nome</Texto>
        <Texto secundario>Opcional. Só para o app dizer “Bom dia” com o seu nome.</Texto>
        <TextInput
          value={nome}
          onChangeText={setNome}
          onBlur={salvarNome}
          onSubmitEditing={salvarNome}
          placeholder="Ex.: Lúcia"
          placeholderTextColor={cores.textoSecundario}
          accessibilityLabel="Seu nome"
          accessibilityHint="Opcional. Fica só neste celular"
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={30}
          returnKeyType="done"
          style={[
            estilos.campo,
            {
              borderColor: cores.borda,
              color: cores.texto,
              backgroundColor: cores.superficie,
              fontFamily: familia.regular,
              fontSize: Math.round(fonte.destaque * escalaLetra),
            },
          ]}
        />
      </Cartao>

      <Cartao>
        <Texto variante="subtitulo">Leitura</Texto>
        <View style={estilos.rotulo}>
          <Icone name="text" size={22} color={cores.primaria} />
          <Texto variante="destaque">Tamanho da letra</Texto>
        </View>
        {/* Cada opção já aparece no tamanho dela: a pessoa vê antes de escolher. */}
        <EscolhaUnica<Letra>
          rotulo="Tamanho da letra"
          valor={preferencias.letra}
          aoMudar={(letra) => void mudarPreferencias({ letra })}
          opcoes={(["normal", "grande", "maior"] as const).map((letra) => ({
            valor: letra,
            titulo: TITULO_LETRA[letra],
            tamanhoTitulo: Math.round((fonte.destaque * ESCALAS_LETRA[letra]) / escalaLetra),
          }))}
        />
        <Texto secundario>A letra também cresce com o ajuste de letra do celular.</Texto>

        <View style={[estilos.rotulo, estilos.espacoAcima]}>
          <Icone name="contrast" size={22} color={cores.primaria} />
          <Texto variante="destaque">Cores do app</Texto>
        </View>
        <EscolhaUnica<PreferenciaTema>
          rotulo="Cores do app"
          valor={preferencias.tema}
          aoMudar={(tema) => void mudarPreferencias({ tema })}
          opcoes={[
            { valor: "sistema", titulo: "Do celular", detalhe: "Claro de dia ou escuro, como o celular estiver" },
            { valor: "claro", titulo: "Claro", detalhe: "Fundo claro e letra escura" },
            { valor: "escuro", titulo: "Escuro", detalhe: "Fundo escuro e letra clara" },
          ]}
        />
      </Cartao>

      <Cartao style={estilos.lista}>
        <Linha icone="location" titulo="Minha região" valor={ra ?? "Escolher"} onPress={() => router.push("/regiao")} />
        <Linha icone="help-circle" titulo="Ajuda e como usar" onPress={() => router.navigate("/ajuda")} />
      </Cartao>
    </Tela>
  );
}

interface PropsLinha {
  icone: NomeIcone;
  titulo: string;
  valor?: string;
  onPress: () => void;
}

function Linha({ icone, titulo, valor, onPress }: PropsLinha) {
  const { cores } = useTema();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={valor ? `${titulo}: ${valor}` : titulo}
      style={({ pressed }) => [estilos.linha, pressed && { opacity: 0.6 }]}
    >
      <View style={[estilos.iconeLinha, { backgroundColor: cores.primariaTinta }]}>
        <Icone name={icone} size={22} color={cores.textoTonal} />
      </View>
      <Texto variante="destaque" style={estilos.flex}>
        {titulo}
      </Texto>
      {valor ? <Texto secundario>{valor}</Texto> : null}
      <Icone name="chevron-forward" size={24} color={cores.textoSecundario} />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  cabecalho: { flexDirection: "row", alignItems: "center", gap: espaco.md },
  avatar: { width: 64, height: 64, borderRadius: RAIO_CAPSULA, alignItems: "center", justifyContent: "center" },
  flex: { flex: 1, flexShrink: 1 },
  garantia: { flexDirection: "row", alignItems: "center", gap: espaco.sm, padding: espaco.md, borderRadius: 18 },
  campo: { minHeight: ALVO_MINIMO, borderWidth: 2, borderRadius: raio + 4, paddingHorizontal: espaco.md },
  rotulo: { flexDirection: "row", alignItems: "center", gap: espaco.sm },
  espacoAcima: { marginTop: espaco.sm },
  lista: { paddingVertical: espaco.xs, gap: 0 },
  linha: { flexDirection: "row", alignItems: "center", gap: espaco.md, minHeight: ALVO_MINIMO + 8 },
  iconeLinha: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
});
