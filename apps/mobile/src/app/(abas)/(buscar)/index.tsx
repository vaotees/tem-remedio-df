import type { Snapshot } from "@tem-remedio/shared";
import { useFocusEffect, useRouter } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View, type TextInputInstance } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Cartao } from "@/componentes/Cartao";
import { ComDados } from "@/componentes/ComDados";
import { FaixaAtualizacao } from "@/componentes/FaixaAtualizacao";
import { Anel } from "@/componentes/Graficos";
import { Icone, type NomeIcone } from "@/componentes/Icone";
import { ItemLista } from "@/componentes/ItemLista";
import { Assinatura, Simbolo } from "@/componentes/Marca";
import { Pictograma } from "@/componentes/Pictograma";
import { SeloEstoque } from "@/componentes/SeloEstoque";
import { Texto } from "@/componentes/Texto";
import { buscar, MINIMO_LETRAS, prepararBusca, type GrupoResultado } from "@/busca/buscar";
import { capitalizarNome, nomeSubstancia, rotuloProduto } from "@/busca/remedios";
import { useMeusRemedios } from "@/meus-remedios/guardados";
import { situacaoHoje, textoQuantos } from "@/meus-remedios/situacao";
import { descreverPosto } from "@/postos/descricao";
import { useOrigem } from "@/postos/origem";
import { usePreferencias } from "@/preferencias/preferencias";
import { ALVO_MINIMO, espaco, familia, fonte, RAIO_CAPSULA, RAIO_CARTAO, sombraCartao, useTema } from "@/tema";
import { useAnuncio } from "@/util/anuncio";
import { saudacao } from "@/util/datas";

/** Início: a marca, a busca e o painel do dia (seus remédios, atalhos e a rede). */
export default function Inicio() {
  const { cores, escuro, escalaLetra } = useTema();
  const { nome } = usePreferencias();
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const [busca, setBusca] = useState("");
  const campo = useRef<TextInputInstance>(null);
  // A lista acompanha a digitação sem travar o teclado.
  const termo = useDeferredValue(busca);

  // A faixa azul fica atrás do relógio do celular: as letras de cima ficam claras nesta tela.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("light");
      return () => setStatusBarStyle(escuro ? "light" : "dark");
    }, [escuro]),
  );

  return (
    <ScrollView
      style={{ backgroundColor: cores.fundo }}
      contentContainerStyle={estilos.rolagem}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[estilos.faixa, { backgroundColor: cores.faixa, paddingTop: top + espaco.md }]}>
        <View style={estilos.marcaDagua} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Simbolo tamanho={220} cor={cores.textoFaixa} corCapsula={cores.textoFaixa} />
        </View>
        <View style={estilos.topo}>
          <Assinatura sobreFaixa />
          <Pressable
            onPress={() => router.navigate("/ajuda")}
            accessibilityRole="button"
            accessibilityLabel="Ajuda"
            hitSlop={8}
            style={({ pressed }) => [estilos.ajuda, { borderColor: cores.textoFaixaSecundario }, pressed && { opacity: 0.6 }]}
          >
            <Icone name="help" size={26} color={cores.textoFaixa} />
          </Pressable>
        </View>
        <Texto variante="destaque" peso="medio" cor={cores.textoFaixaSecundario}>
          {saudacao(new Date(), nome)}
        </Texto>
        <Texto variante="titulo" cor={cores.textoFaixa}>
          Qual remédio você procura?
        </Texto>

        <View style={[estilos.campo, { backgroundColor: cores.superficie }]}>
          <Icone name="search" size={26} color={cores.textoSecundario} />
          <TextInput
            ref={campo}
            value={busca}
            onChangeText={setBusca}
            // Curto: o exemplo do campo não quebra linha e seria cortado com a letra grande.
            placeholder="Ex.: losartana"
            placeholderTextColor={cores.textoSecundario}
            accessibilityLabel="Nome do remédio"
            accessibilityHint="Pode ser o nome que está na caixa"
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            style={[
              estilos.entrada,
              { color: cores.texto, fontFamily: familia.regular, fontSize: Math.round(fonte.destaque * escalaLetra) },
            ]}
          />
          {busca ? (
            <Pressable
              onPress={() => {
                setBusca("");
                // O botão some depois de apagar: o foco (e o teclado) volta para o campo, onde se escreve de novo.
                campo.current?.focus();
              }}
              accessibilityRole="button"
              accessibilityLabel="Apagar o que foi escrito"
              style={estilos.limpar}
            >
              <Icone name="close-circle" size={28} color={cores.textoSecundario} />
            </Pressable>
          ) : null}
        </View>
        <Texto variante="legenda" cor={cores.textoFaixaSecundario} style={estilos.dicaCaixa}>
          Vale também o nome que está na caixa, como Glifage.
        </Texto>
      </View>

      <View style={estilos.corpo}>
        <ComDados>
          {(snapshot, { procurandoNovos }) => (
            <>
              <Resultados snapshot={snapshot} termo={termo} />
              <FaixaAtualizacao atualizadoEm={snapshot.meta.atualizadoEm} procurandoNovos={procurandoNovos} centro />
            </>
          )}
        </ComDados>
      </View>
    </ScrollView>
  );
}

function Resultados({ snapshot, termo }: { snapshot: Snapshot; termo: string }) {
  const router = useRouter();
  const grupos = useMemo(() => buscar(snapshot, termo), [snapshot, termo]);
  useEffect(() => {
    // Depois de a tela aparecer: a primeira tecla já encontra o índice pronto.
    const t = setTimeout(() => prepararBusca(snapshot), 0);
    return () => clearTimeout(t);
  }, [snapshot]);
  const curto = termo.trim().length < MINIMO_LETRAS;
  const quantos = grupos.length === 1 ? "1 remédio encontrado" : `${grupos.length} remédios encontrados`;
  const naoAchei = `Não achei “${termo.trim()}”`;
  // Quem usa leitor de tela fica sabendo do resultado sem sair do campo.
  useAnuncio(curto ? null : grupos.length === 0 ? naoAchei : quantos);

  if (curto) {
    return (
      <>
        <SeusRemedios snapshot={snapshot} />
        <Atalhos />
        <Rede snapshot={snapshot} />
      </>
    );
  }

  if (grupos.length === 0) {
    return (
      <Cartao>
        <Texto variante="subtitulo" accessibilityLiveRegion="polite">
          {naoAchei}
        </Texto>
        <Texto secundario>
          Confira se está escrito certo ou tente o nome que vem na caixa. Aqui aparecem só os remédios entregues nas
          farmácias das UBSs do DF.
        </Texto>
      </Cartao>
    );
  }

  const abrir = (g: GrupoResultado) => {
    const codigo = snapshot.produtos[g.produtos[0]!]!.codigo;
    const marca = g.marca?.nome;
    // Só uma forma e dose: vai direto para os postos.
    if (g.produtos.length === 1) router.push({ pathname: "/postos/[codigo]", params: { codigo, marca } });
    else router.push({ pathname: "/remedio/[codigo]", params: { codigo, marca } });
  };

  return (
    <View style={estilos.lista}>
      <Texto secundario peso="medio" accessibilityLiveRegion="polite">
        {quantos}
      </Texto>
      {grupos.map((g) => {
        const primeiro = snapshot.produtos[g.produtos[0]!]!;
        const rotulos = g.produtos.map((i) => rotuloProduto(snapshot.produtos[i]!));
        const opcoes = rotulos.length === 1 ? rotulos[0]! : `${rotulos.length} opções: ${resumir(rotulos)}`;
        const marca = g.marca ? `Mesma substância de ${capitalizarNome(g.marca.nome)}` : null;
        return (
          <ItemLista
            key={g.chave}
            onPress={() => abrir(g)}
            rotulo={[g.nome, marca, opcoes].filter(Boolean).join(". ")}
            dica="Mostra os postos que têm"
          >
            <View style={estilos.linhaResultado}>
              <Pictograma forma={primeiro.forma} />
              <View style={estilos.flex}>
                <Texto variante="destaque">{g.nome}</Texto>
                {marca ? <Texto>{marca}</Texto> : null}
                <Texto secundario>{opcoes}</Texto>
              </View>
            </View>
          </ItemLista>
        );
      })}
    </View>
  );
}

/** Quantos remédios guardados aparecem no Início; o resto, na aba Meus remédios. */
const GUARDADOS_NO_INICIO = 3;

/**
 * Painel dos remédios guardados: cada um com o anel (em quantos postos tem hoje) e, quando o app sabe
 * de onde contar, o posto mais perto. Um toque leva aos postos.
 */
function SeusRemedios({ snapshot }: { snapshot: Snapshot }) {
  const router = useRouter();
  const { cores } = useTema();
  const { width } = useWindowDimensions();
  const { remedios, carregando } = useMeusRemedios();
  const { ordem, carregando: procurandoOrigem } = useOrigem(snapshot);
  if (carregando) return null;

  if (remedios.length === 0) {
    return (
      <Cartao style={estilos.convite}>
        <View style={[estilos.coracao, { backgroundColor: cores.primariaTinta }]}>
          <Icone name="heart" size={26} color={cores.textoTonal} />
        </View>
        <View style={estilos.flex}>
          <Texto variante="destaque">Guarde os remédios que você usa</Texto>
          <Texto secundario>Eles aparecem aqui, com a situação de cada dia.</Texto>
        </View>
      </Cartao>
    );
  }

  const larguraCartao = Math.min(320, Math.max(250, width * 0.72));
  const mais = remedios.length > GUARDADOS_NO_INICIO;
  return (
    <View style={estilos.secao}>
      <View style={estilos.cabecalhoSecao}>
        <Texto variante="subtitulo" style={estilos.flex}>
          Seus remédios
        </Texto>
        {mais ? (
          <Pressable
            onPress={() => router.navigate("/meus-remedios")}
            accessibilityRole="button"
            accessibilityLabel={`Ver os ${remedios.length} em Meus remédios`}
            hitSlop={12}
            style={estilos.verTodos}
          >
            <Texto variante="legenda" peso="negrito" cor={cores.primaria}>
              Ver todos ({remedios.length})
            </Texto>
          </Pressable>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.carrossel} style={estilos.foraDaMargem}>
        {remedios.slice(0, GUARDADOS_NO_INICIO).map((r) => {
          const hoje = situacaoHoje(snapshot, r.codigo, procurandoOrigem ? { por: "nome" } : ordem);
          const nome = hoje.tipo === "fora_dos_dados" ? r.nome : nomeSubstancia([hoje.produto]);
          const apresentacao = hoje.tipo === "fora_dos_dados" ? r.apresentacao : rotuloProduto(hoje.produto);
          const postos = hoje.tipo === "tem" ? hoje.postos : 0;
          const situacao = hoje.tipo === "fora_dos_dados" ? "Não aparece nos dados de hoje" : textoQuantos(postos);
          const perto = hoje.tipo === "tem" && ordem.por !== "nome" && !procurandoOrigem ? descreverPosto(hoje.primeiro) : null;
          // Fora dos dados: a aba Meus remédios explica e deixa tirar da lista.
          const abrir = () =>
            hoje.tipo === "fora_dos_dados"
              ? router.navigate("/meus-remedios")
              : router.push({ pathname: "/postos/[codigo]", params: { codigo: r.codigo, marca: r.marca ?? undefined } });
          return (
            <Pressable
              key={r.codigo}
              onPress={abrir}
              accessibilityRole="button"
              accessibilityLabel={[nome, apresentacao, situacao, perto && `Mais perto: ${perto.nome}, ${perto.onde}`].filter(Boolean).join(". ")}
              accessibilityHint="Mostra os postos que têm"
              style={({ pressed }) => [
                estilos.cartaoRemedio,
                { width: larguraCartao, backgroundColor: cores.superficie },
                sombraCartao(cores),
                pressed && { opacity: 0.75 },
              ]}
            >
              <View style={estilos.linhaResultado}>
                <Anel valor={postos} total={snapshot.ubs.length} />
                <View style={estilos.flex}>
                  <Texto variante="destaque">{nome}</Texto>
                  <Texto variante="legenda" secundario>
                    {apresentacao}
                  </Texto>
                </View>
              </View>
              <Texto variante="legenda" peso="medio">
                {situacao}
              </Texto>
              {hoje.tipo === "tem" && perto ? (
                <>
                  <SeloEstoque dias={hoje.primeiro.dias} />
                  <View style={estilos.linhaPerto}>
                    <Icone name="location-outline" size={18} color={cores.primaria} />
                    <Texto variante="legenda" secundario style={estilos.flex}>
                      <Texto variante="legenda" peso="negrito">
                        {perto.nome}
                      </Texto>{" "}
                      · {perto.onde}
                    </Texto>
                  </View>
                </>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** Atalhos para o que se procura sem um nome de remédio. */
function Atalhos() {
  const router = useRouter();
  const itens: { titulo: string; icone: NomeIcone; abrir: () => void }[] = [
    { titulo: "Mapa dos postos", icone: "map", abrir: () => router.navigate("/mapa") },
    { titulo: "Minha região", icone: "location", abrir: () => router.push("/regiao") },
    { titulo: "Como usar o app", icone: "help-circle", abrir: () => router.navigate("/ajuda") },
  ];
  return (
    <View style={estilos.secao}>
      <Texto variante="subtitulo">Atalhos</Texto>
      <View style={estilos.atalhos}>
        {itens.map((a) => (
          <Atalho key={a.titulo} {...a} />
        ))}
      </View>
    </View>
  );
}

function Atalho({ titulo, icone, abrir }: { titulo: string; icone: NomeIcone; abrir: () => void }) {
  const { cores } = useTema();
  return (
    <Pressable
      onPress={abrir}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      style={({ pressed }) => [estilos.atalho, { backgroundColor: cores.superficie }, sombraCartao(cores), pressed && { opacity: 0.75 }]}
    >
      <View style={[estilos.iconeAtalho, { backgroundColor: cores.primariaTinta }]}>
        <Icone name={icone} size={24} color={cores.textoTonal} />
      </View>
      <Texto variante="legenda" peso="negrito" style={estilos.textoAtalho}>
        {titulo}
      </Texto>
    </Pressable>
  );
}

/** A rede pública em dois números. */
function Rede({ snapshot }: { snapshot: Snapshot }) {
  const { cores } = useTema();
  const numeros = [
    { valor: snapshot.ubs.length, texto: "farmácias de UBS" },
    { valor: snapshot.produtos.length, texto: "remédios da atenção básica" },
  ];
  return (
    <Cartao>
      <Texto variante="destaque">Rede pública do DF</Texto>
      <View
        style={estilos.numeros}
        accessible
        accessibilityLabel={`${snapshot.ubs.length} farmácias de UBS e ${snapshot.produtos.length} remédios`}
      >
        {numeros.map((n) => (
          <View key={n.texto} style={[estilos.numero, { backgroundColor: cores.superficie2 }]}>
            <Texto peso="numero" tamanho={30} cor={cores.primaria}>
              {n.valor}
            </Texto>
            <Texto variante="legenda" secundario>
              {n.texto}
            </Texto>
          </View>
        ))}
      </View>
    </Cartao>
  );
}

/** "Comprimido 5 mg, Comprimido 10 mg e mais 2" */
function resumir(rotulos: string[]): string {
  const unicos = [...new Set(rotulos)];
  const primeiros = unicos.slice(0, 3).join(", ");
  return unicos.length > 3 ? `${primeiros} e mais ${unicos.length - 3}` : primeiros;
}

const estilos = StyleSheet.create({
  rolagem: { flexGrow: 1, paddingBottom: espaco.lg },
  faixa: {
    paddingHorizontal: espaco.md,
    paddingBottom: espaco.lg,
    gap: espaco.xs,
    overflow: "hidden",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  marcaDagua: { position: "absolute", right: -96, bottom: -40, opacity: 0.08 },
  topo: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: espaco.sm, marginBottom: espaco.md },
  ajuda: { width: ALVO_MINIMO, height: ALVO_MINIMO, borderRadius: RAIO_CAPSULA, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  campo: {
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.sm,
    minHeight: ALVO_MINIMO + 8,
    borderRadius: RAIO_CARTAO,
    paddingLeft: espaco.md,
    paddingRight: espaco.xs,
    marginTop: espaco.md,
    shadowColor: "#04162C",
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  entrada: { flex: 1, paddingVertical: espaco.sm },
  dicaCaixa: { marginTop: espaco.xs },
  limpar: { minWidth: ALVO_MINIMO, minHeight: ALVO_MINIMO, alignItems: "center", justifyContent: "center" },
  corpo: { padding: espaco.md, gap: espaco.lg },
  lista: { gap: espaco.sm },
  secao: { gap: espaco.sm },
  cabecalhoSecao: { flexDirection: "row", alignItems: "center", gap: espaco.sm },
  verTodos: { minHeight: 44, justifyContent: "center" },
  foraDaMargem: { marginHorizontal: -espaco.md },
  carrossel: { gap: espaco.sm, paddingHorizontal: espaco.md, paddingVertical: espaco.sm },
  cartaoRemedio: { borderRadius: RAIO_CARTAO, padding: espaco.md, gap: espaco.sm, minHeight: ALVO_MINIMO },
  linhaResultado: { flexDirection: "row", alignItems: "center", gap: espaco.md },
  linhaPerto: { flexDirection: "row", alignItems: "center", gap: espaco.xs },
  flex: { flex: 1, flexShrink: 1 },
  convite: { flexDirection: "row", alignItems: "center", gap: espaco.md },
  coracao: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  atalhos: { flexDirection: "row", gap: espaco.sm },
  atalho: { flex: 1, borderRadius: RAIO_CARTAO, padding: espaco.sm + 4, gap: espaco.sm, minHeight: 104 },
  iconeAtalho: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  textoAtalho: { flexShrink: 1 },
  numeros: { flexDirection: "row", gap: espaco.sm },
  numero: { flex: 1, borderRadius: 16, padding: espaco.md, gap: 2 },
});
