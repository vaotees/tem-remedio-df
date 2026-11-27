import type { Snapshot, Ubs } from "@tem-remedio/shared";
import { useRouter } from "expo-router";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, TextInput, View, type TextInputInstance } from "react-native";
import { Botao } from "@/componentes/Botao";
import { Cartao } from "@/componentes/Cartao";
import { ComDados } from "@/componentes/ComDados";
import { EscolherMapa } from "@/componentes/EscolherMapa";
import { BotaoVidro } from "@/componentes/Faixa";
import { FaixaAtualizacao } from "@/componentes/FaixaAtualizacao";
import { Anel, BarraRede, BarrasDeitadas, LegendaNiveis, Rosca } from "@/componentes/Graficos";
import { Icone, type NomeIcone } from "@/componentes/Icone";
import { ItemLista } from "@/componentes/ItemLista";
import { Assinatura } from "@/componentes/Marca";
import { NumeroAnimado, PontoVivo, Surgir, useToque } from "@/componentes/Movimento";
import { Pictograma } from "@/componentes/Pictograma";
import { SeloEstoque } from "@/componentes/SeloEstoque";
import { SeloHorario } from "@/componentes/SeloHorario";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import { buscar, MINIMO_LETRAS, prepararBusca, type GrupoResultado } from "@/busca/buscar";
import { capitalizarNome, nomeSubstancia, rotuloProduto } from "@/busca/remedios";
import { useMeusRemedios, type RemedioGuardado } from "@/meus-remedios/guardados";
import { situacaoHoje, textoQuantos, tituloPrimeiro } from "@/meus-remedios/situacao";
import { descreverPosto } from "@/postos/descricao";
import { useOrigem } from "@/postos/origem";
import type { Ordem } from "@/postos/postos";
import { emCadaDez, resumirRede } from "@/postos/rede";
import { usePreferencias } from "@/preferencias/preferencias";
import { ALVO_MINIMO, espaco, familia, fonte, RAIO_CARTAO, sombraCartao, useTema } from "@/tema";
import { useAnuncio } from "@/util/anuncio";
import { dataPorExtenso, diasDesde, formatarAtualizacao, saudacao } from "@/util/datas";

/** Início: a marca, a busca e o painel do dia (seus remédios, a rede agora e os atalhos). */
export default function Inicio() {
  const { cores, escalaLetra } = useTema();
  const { nome } = usePreferencias();
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const campo = useRef<TextInputInstance>(null);
  // A lista acompanha a digitação sem travar o teclado.
  const termo = useDeferredValue(busca);
  const agora = new Date();

  return (
    <Tela
      topo={
        <>
          <Assinatura sobreFaixa />
          <BotaoVidro icone="help" rotulo="Ajuda" onPress={() => router.navigate("/ajuda")} />
        </>
      }
      faixa={
        <>
          <View style={estilos.saudacao}>
            <Texto variante="destaque" peso="medio" cor={cores.textoFaixaSecundario}>
              {saudacao(agora, nome)}
            </Texto>
            <Texto variante="legenda" cor={cores.textoFaixaSecundario}>
              {dataPorExtenso(agora)}
            </Texto>
          </View>
          <Texto variante="titulo" cor={cores.textoFaixa}>
            Qual remédio você procura?
          </Texto>

          <View style={[estilos.campo, { backgroundColor: cores.superficie }]}>
            <View style={[estilos.lupa, { backgroundColor: cores.primariaTinta }]}>
              <Icone name="search" size={24} color={cores.textoTonal} />
            </View>
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
          <Texto variante="legenda" cor={cores.textoFaixaSecundario}>
            Vale também o nome que está na caixa, como Glifage.
          </Texto>
        </>
      }
    >
      <ComDados>
        {(snapshot, { procurandoNovos }) => (
          <>
            <Resultados snapshot={snapshot} termo={termo} />
            <FaixaAtualizacao atualizadoEm={snapshot.meta.atualizadoEm} procurandoNovos={procurandoNovos} centro />
          </>
        )}
      </ComDados>
    </Tela>
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
        <HojeParaVoce snapshot={snapshot} />
        <PainelRede snapshot={snapshot} />
        <Atalhos />
      </>
    );
  }

  if (grupos.length === 0) {
    return (
      <Surgir>
        <Cartao>
          <Texto variante="subtitulo" accessibilityLiveRegion="polite">
            {naoAchei}
          </Texto>
          <Texto secundario>
            Confira se está escrito certo ou tente o nome que vem na caixa. Aqui aparecem só os remédios entregues nas
            farmácias das UBSs do DF.
          </Texto>
        </Cartao>
      </Surgir>
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
      {grupos.map((g, i) => {
        const primeiro = snapshot.produtos[g.produtos[0]!]!;
        const rotulos = g.produtos.map((p) => rotuloProduto(snapshot.produtos[p]!));
        const opcoes = rotulos.length === 1 ? rotulos[0]! : `${rotulos.length} opções: ${resumir(rotulos)}`;
        const marca = g.marca ? `Mesma substância de ${capitalizarNome(g.marca.nome)}` : null;
        return (
          <Surgir key={g.chave} ordem={i}>
            <ItemLista onPress={() => abrir(g)} rotulo={[g.nome, marca, opcoes].filter(Boolean).join(". ")} dica="Mostra os postos que têm">
              <View style={estilos.linha}>
                <Pictograma forma={primeiro.forma} />
                <View style={estilos.flex}>
                  <Texto variante="destaque">{g.nome}</Texto>
                  {marca ? <Texto>{marca}</Texto> : null}
                  <Texto secundario>{opcoes}</Texto>
                </View>
              </View>
            </ItemLista>
          </Surgir>
        );
      })}
    </View>
  );
}

/** Quantos remédios guardados aparecem no Início; o resto, na aba Meus remédios. */
const GUARDADOS_NO_INICIO = 3;

/**
 * "Hoje para você": a resposta primeiro. Cada remédio guardado num cartão, um embaixo do outro (nada
 * escondido para o lado): o anel de em quantos postos tem, como está o estoque neles (a barra do
 * semáforo) e, quando o app sabe de onde contar, o posto mais perto, com "Como chegar".
 */
function HojeParaVoce({ snapshot }: { snapshot: Snapshot }) {
  const router = useRouter();
  const { cores } = useTema();
  const { remedios, carregando } = useMeusRemedios();
  const { ordem, carregando: procurandoOrigem } = useOrigem(snapshot);
  const [caminhoPara, setCaminhoPara] = useState<Ubs | null>(null);
  const totalPostos = useMemo(() => resumirRede(snapshot).postos, [snapshot]);
  if (carregando) return null;

  if (remedios.length === 0) {
    return (
      <Surgir>
        <Pressable
          onPress={() => router.navigate("/meus-remedios")}
          accessibilityRole="button"
          accessibilityLabel="Guarde os remédios que você usa. Eles aparecem aqui, com a situação de cada dia."
          accessibilityHint="Abre Meus remédios"
          style={({ pressed }) => [estilos.convite, { backgroundColor: cores.superficie }, sombraCartao(cores), pressed && { opacity: 0.85 }]}
        >
          <View style={[estilos.coracao, { backgroundColor: cores.primariaTinta }]}>
            <Icone name="heart" size={30} color={cores.textoTonal} />
          </View>
          <View style={estilos.flex}>
            <Texto variante="destaque">Guarde os remédios que você usa</Texto>
            <Texto secundario>Eles aparecem aqui, com a situação de cada dia.</Texto>
          </View>
        </Pressable>
      </Surgir>
    );
  }

  const mais = remedios.length > GUARDADOS_NO_INICIO;
  // Enquanto o GPS não responde, não existe "mais perto": os cartões mostram só a contagem.
  const de: Ordem = procurandoOrigem ? { por: "nome" } : ordem;
  return (
    <View style={estilos.secao}>
      <Surgir style={estilos.cabecalhoSecao}>
        <Texto variante="subtitulo" style={estilos.flex}>
          Hoje para você
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
      </Surgir>
      {remedios.slice(0, GUARDADOS_NO_INICIO).map((r, i) => (
        <Surgir key={r.codigo} ordem={i + 1}>
          <CartaoHoje snapshot={snapshot} remedio={r} ordem={de} totalPostos={totalPostos} aoComoChegar={setCaminhoPara} />
        </Surgir>
      ))}
      <EscolherMapa ubs={caminhoPara} aoFechar={() => setCaminhoPara(null)} />
    </View>
  );
}

interface PropsCartaoHoje {
  snapshot: Snapshot;
  remedio: RemedioGuardado;
  ordem: Ordem;
  totalPostos: number;
  aoComoChegar: (ubs: Ubs) => void;
}

/**
 * Um remédio guardado. A parte de cima é um botão só (leva aos postos, e o leitor de tela lê tudo de uma
 * vez); "Como chegar" fica embaixo, separado, para não ter um botão dentro do outro.
 */
function CartaoHoje({ snapshot, remedio: r, ordem, totalPostos, aoComoChegar }: PropsCartaoHoje) {
  const router = useRouter();
  const { cores } = useTema();
  const toque = useToque(0.98);
  const hoje = situacaoHoje(snapshot, r.codigo, ordem);
  const nome = hoje.tipo === "fora_dos_dados" ? r.nome : nomeSubstancia([hoje.produto]);
  const apresentacao = hoje.tipo === "fora_dos_dados" ? r.apresentacao : rotuloProduto(hoje.produto);
  const postos = hoje.tipo === "tem" ? hoje.postos : 0;
  const situacao = hoje.tipo === "fora_dos_dados" ? "Não aparece nos dados de hoje" : textoQuantos(postos);
  const titulo = hoje.tipo === "tem" ? tituloPrimeiro(ordem, hoje.primeiro) : null;
  const perto = hoje.tipo === "tem" && titulo ? descreverPosto(hoje.primeiro) : null;
  // Fora dos dados: a aba Meus remédios explica e deixa tirar da lista.
  const abrir = () =>
    hoje.tipo === "fora_dos_dados"
      ? router.navigate("/meus-remedios")
      : router.push({ pathname: "/postos/[codigo]", params: { codigo: r.codigo, marca: r.marca ?? undefined } });

  return (
    <Animated.View style={[estilos.cartaoRemedio, { backgroundColor: cores.superficie }, sombraCartao(cores), toque.estilo]}>
      <Pressable
        onPress={abrir}
        onPressIn={toque.aoEncostar}
        onPressOut={toque.aoSoltar}
        accessibilityRole="button"
        accessibilityLabel={[nome, apresentacao, situacao, perto && `${titulo}: ${perto.rotulo}`].filter(Boolean).join(". ")}
        accessibilityHint="Mostra os postos que têm"
        style={estilos.topoCartao}
      >
        <View style={estilos.linha}>
          {/* O anel enche com a parte da rede que tem; dentro, o número escrito com "postos" (não é porcentagem). */}
          <Anel parte={totalPostos ? postos / totalPostos : 0} tamanho={88} espessura={8} cor={cores.primaria} trilho={cores.trilho}>
            <NumeroAnimado valor={postos} peso="numero" tamanho={24} cor={cores.texto} />
            <Texto variante="legenda" tamanho={12} peso="medio" secundario>
              {postos === 1 ? "posto" : "postos"}
            </Texto>
          </Anel>
          <View style={estilos.flex}>
            <Texto variante="destaque">{nome}</Texto>
            <Texto variante="legenda" secundario>
              {apresentacao}
            </Texto>
            <Texto variante="legenda" peso="negrito" cor={postos ? cores.primaria : cores.textoSecundario}>
              {situacao}
            </Texto>
          </View>
          <View style={[estilos.seta, { backgroundColor: cores.primariaTinta }]}>
            <Icone name="chevron-forward" size={22} color={cores.textoTonal} />
          </View>
        </View>
        {hoje.tipo === "tem" ? <BarraRede contagem={hoje.niveis} compacta /> : null}
        {hoje.tipo === "tem" && perto ? (
          <View style={[estilos.perto, { backgroundColor: cores.superficie2 }]}>
            <View style={estilos.linhaPequena}>
              <Icone name="location" size={18} color={cores.primaria} />
              <Texto variante="legenda" peso="negrito" cor={cores.primaria} style={estilos.flex}>
                {titulo}
              </Texto>
            </View>
            <Texto variante="destaque" peso="extra">
              {perto.nome}
            </Texto>
            <Texto variante="legenda" secundario>
              {perto.onde}
            </Texto>
            <View style={estilos.selos}>
              <SeloEstoque dias={hoje.primeiro.dias} />
              <SeloHorario horario={hoje.primeiro.ubs.horario} />
            </View>
          </View>
        ) : null}
      </Pressable>
      {hoje.tipo === "tem" && perto ? (
        <Botao
          titulo="Como chegar"
          icone="navigate"
          variante="secundario"
          dica={`Até ${perto.nome}. Pergunta qual app de mapa você quer usar`}
          onPress={() => aoComoChegar(hoje.primeiro.ubs)}
        />
      ) : null}
    </Animated.View>
  );
}

/**
 * O painel da rede, com os dados do dia: quantos postos estão abertos agora, como está o estoque de todos
 * os remédios em todos os postos e os abertos em cada Região de Saúde. Cada gráfico tem o texto ao lado.
 */
function PainelRede({ snapshot }: { snapshot: Snapshot }) {
  const { cores } = useTema();
  const rede = useMemo(() => resumirRede(snapshot), [snapshot]);
  const totalNiveis = rede.niveis.alto + rede.niveis.baixo + rede.niveis.critico + rede.niveis.sem_consumo;
  const dez = emCadaDez(rede.niveis.alto, totalNiveis);
  const porcentagemAlto = totalNiveis ? Math.round((rede.niveis.alto / totalNiveis) * 100) : 0;
  // O selo "ao vivo" só pulsa com dado recente; dado velho vira aviso (como na faixa de atualização).
  const recente = diasDesde(snapshot.meta.atualizadoEm) <= 1;
  const selo = recente ? cores.aberto : cores.aviso;
  // De madrugada todos estão fechados: as barras mostram quantos postos cada região tem.
  const algumAberto = rede.abertosAgora > 0;

  return (
    <View style={estilos.secao}>
      <Surgir ordem={2} style={estilos.cabecalhoSecao}>
        <Texto variante="subtitulo" style={estilos.flex}>
          A rede agora
        </Texto>
        <View style={[estilos.aoVivo, { backgroundColor: selo.fundo }]}>
          {recente ? <PontoVivo cor={cores.barraSemaforo.alto} tamanho={10} /> : <Icone name="warning" size={16} color={selo.texto} />}
          <Texto variante="legenda" peso="negrito" cor={selo.texto}>
            Dados de {formatarAtualizacao(snapshot.meta.atualizadoEm)}
          </Texto>
        </View>
      </Surgir>

      <Surgir ordem={3}>
        <Cartao style={estilos.cartaoPainel}>
          <View style={estilos.linha}>
            <Anel parte={rede.postos ? rede.abertosAgora / rede.postos : 0} tamanho={116} espessura={12} cor={cores.primaria} trilho={cores.trilho}>
              <NumeroAnimado valor={rede.abertosAgora} peso="numero" tamanho={32} cor={cores.texto} />
              <Texto variante="legenda" tamanho={13} peso="medio" secundario>
                abertos
              </Texto>
            </Anel>
            <View style={estilos.flex}>
              <Texto variante="destaque">{algumAberto ? "Postos abertos agora" : "Todos fechados agora"}</Texto>
              <Texto variante="legenda" secundario>
                {algumAberto
                  ? `${rede.abertosAgora} de ${rede.postos}, pelo horário de cada um.`
                  : rede.proximaAbertura
                    ? `${rede.proximaAbertura.postos} de ${rede.postos} abrem ${rede.proximaAbertura.quando}.`
                    : "Confira o horário de cada posto."}
              </Texto>
            </View>
          </View>
          <View
            style={estilos.numeros}
            accessible
            accessibilityLabel={`${rede.postos} farmácias de UBS e ${rede.remedios} remédios`}
          >
            <Numero valor={rede.postos} texto="farmácias de UBS" icone="business" />
            <Numero valor={rede.remedios} texto="remédios na lista" icone="medkit" />
          </View>
        </Cartao>
      </Surgir>

      <Surgir ordem={4}>
        <Cartao style={estilos.cartaoPainel}>
          <Texto variante="destaque">Estoque nas farmácias</Texto>
          <View style={estilos.linha}>
            <Rosca contagem={rede.niveis} tamanho={128} espessura={18}>
              <NumeroAnimado valor={porcentagemAlto} formatar={(n) => `${n}%`} peso="numero" tamanho={28} cor={cores.texto} />
              <Texto variante="legenda" tamanho={12} peso="medio" secundario>
                com bastante
              </Texto>
            </Rosca>
            <View style={estilos.flex}>
              <LegendaNiveis contagem={rede.niveis} porcentagem />
            </View>
          </View>
          <Texto variante="legenda" secundario>
            Em {dez} de cada 10 remédios nos postos, o estoque dá para mais de 1 mês. Mesmo assim, ligue antes de ir.
          </Texto>
        </Cartao>
      </Surgir>

      {rede.regioes.length > 1 ? (
        <Surgir ordem={5}>
          <Cartao style={estilos.cartaoPainel}>
            <Texto variante="destaque">{algumAberto ? "Abertos agora, por região" : "Postos por região"}</Texto>
            <BarrasDeitadas
              cor={cores.primaria}
              barras={rede.regioes.map((r) => ({
                nome: r.nome,
                valor: algumAberto ? r.abertos : r.postos,
                total: r.postos,
                rotulo: algumAberto ? `${r.abertos} de ${r.postos}` : `${r.postos} ${r.postos === 1 ? "posto" : "postos"}`,
              }))}
            />
          </Cartao>
        </Surgir>
      ) : null}
    </View>
  );
}

function Numero({ valor, texto, icone }: { valor: number; texto: string; icone: NomeIcone }) {
  const { cores } = useTema();
  return (
    <View style={[estilos.numero, { backgroundColor: cores.superficie2 }]}>
      <Icone name={icone} size={22} color={cores.primaria} />
      <NumeroAnimado valor={valor} peso="numero" tamanho={28} cor={cores.primaria} />
      <Texto variante="legenda" secundario>
        {texto}
      </Texto>
    </View>
  );
}

/** Atalhos para o que se procura sem um nome de remédio. */
function Atalhos() {
  const router = useRouter();
  const itens: { titulo: string; texto: string; icone: NomeIcone; abrir: () => void }[] = [
    { titulo: "Mapa dos postos", texto: "Todas as farmácias de UBS", icone: "map", abrir: () => router.navigate("/mapa") },
    { titulo: "Minha região", texto: "Onde procurar primeiro", icone: "location", abrir: () => router.push("/regiao") },
    { titulo: "Como usar o app", texto: "Passo a passo, com exemplos", icone: "help-circle", abrir: () => router.navigate("/ajuda") },
  ];
  return (
    <View style={estilos.secao}>
      <Surgir ordem={6}>
        <Texto variante="subtitulo">Atalhos</Texto>
      </Surgir>
      {itens.map((a, i) => (
        <Surgir key={a.titulo} ordem={7 + i}>
          <Atalho {...a} />
        </Surgir>
      ))}
    </View>
  );
}

function Atalho({ titulo, texto, icone, abrir }: { titulo: string; texto: string; icone: NomeIcone; abrir: () => void }) {
  const { cores } = useTema();
  return (
    <ItemLista onPress={abrir} rotulo={titulo} dica={texto}>
      <View style={estilos.linha}>
        <View style={[estilos.iconeAtalho, { backgroundColor: cores.primaria }]}>
          <Icone name={icone} size={24} color={cores.textoSobrePrimaria} />
        </View>
        <View style={estilos.flex}>
          <Texto variante="destaque">{titulo}</Texto>
          <Texto variante="legenda" secundario>
            {texto}
          </Texto>
        </View>
      </View>
    </ItemLista>
  );
}

/** "Comprimido 5 mg, Comprimido 10 mg e mais 2" */
function resumir(rotulos: string[]): string {
  const unicos = [...new Set(rotulos)];
  const primeiros = unicos.slice(0, 3).join(", ");
  return unicos.length > 3 ? `${primeiros} e mais ${unicos.length - 3}` : primeiros;
}

const estilos = StyleSheet.create({
  saudacao: { gap: 0, marginTop: espaco.sm },
  campo: {
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.sm,
    minHeight: ALVO_MINIMO + 12,
    borderRadius: 22,
    paddingLeft: espaco.sm,
    paddingRight: espaco.xs,
    marginTop: espaco.sm,
    shadowColor: "#04162C",
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  lupa: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  entrada: { flex: 1, paddingVertical: espaco.sm },
  limpar: { minWidth: ALVO_MINIMO, minHeight: ALVO_MINIMO, alignItems: "center", justifyContent: "center" },
  lista: { gap: espaco.sm },
  secao: { gap: espaco.sm + 4 },
  cabecalhoSecao: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: espaco.sm, marginTop: espaco.xs },
  verTodos: { minHeight: 44, justifyContent: "center" },
  cartaoRemedio: { borderRadius: RAIO_CARTAO, padding: espaco.md, gap: espaco.md },
  topoCartao: { gap: espaco.md, minHeight: ALVO_MINIMO },
  linha: { flexDirection: "row", alignItems: "center", gap: espaco.md },
  linhaPequena: { flexDirection: "row", alignItems: "center", gap: 6 },
  seta: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  perto: { gap: 2, borderRadius: 16, padding: espaco.sm + 4 },
  selos: { flexDirection: "row", flexWrap: "wrap", gap: espaco.xs, marginTop: espaco.xs },
  flex: { flex: 1, flexShrink: 1 },
  convite: { flexDirection: "row", alignItems: "center", gap: espaco.md, borderRadius: RAIO_CARTAO, padding: espaco.md, minHeight: ALVO_MINIMO },
  coracao: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  aoVivo: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: espaco.sm + 2, paddingVertical: 6, borderRadius: 999 },
  cartaoPainel: { gap: espaco.md, padding: espaco.md + 4 },
  numeros: { flexDirection: "row", gap: espaco.sm },
  numero: { flex: 1, borderRadius: 16, padding: espaco.md, gap: 2 },
  iconeAtalho: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
});
