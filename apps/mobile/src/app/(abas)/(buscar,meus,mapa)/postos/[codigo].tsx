import { nivelEstoque, type Produto, type Snapshot, type Ubs } from "@tem-remedio/shared";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Fragment, useEffect, useMemo, useRef, useState, type Ref } from "react";
import { AccessibilityInfo, Animated, Linking, Pressable, StyleSheet, View, type HostInstance } from "react-native";
import { Alternancia } from "@/componentes/Alternancia";
import { Aviso } from "@/componentes/Aviso";
import { AvisoLiberacao } from "@/componentes/AvisoLiberacao";
import { Botao } from "@/componentes/Botao";
import { BotaoGuardar } from "@/componentes/BotaoGuardar";
import { Cartao } from "@/componentes/Cartao";
import { ComDados } from "@/componentes/ComDados";
import { EscolherMapa } from "@/componentes/EscolherMapa";
import { FaixaAtualizacao } from "@/componentes/FaixaAtualizacao";
import { Filtro } from "@/componentes/Filtro";
import { contarNiveis, LegendaNiveis, LEGENDA_NIVEL, MedidorDias, Rosca } from "@/componentes/Graficos";
import { Icone } from "@/componentes/Icone";
import { ItemLista } from "@/componentes/ItemLista";
import { MAPA_DISPONIVEL, MapaPostos } from "@/componentes/MapaPostos";
import { NumeroAnimado, Surgir, useToque } from "@/componentes/Movimento";
import { NaoEncontrado } from "@/componentes/NaoEncontrado";
import { Pictograma } from "@/componentes/Pictograma";
import { PerguntarOrigem, ProcurandoLocalizacao, SituacaoOrigem } from "@/componentes/OrigemPostos";
import { SeloEstoque } from "@/componentes/SeloEstoque";
import { SeloHorario } from "@/componentes/SeloHorario";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import { Voltar } from "@/componentes/Voltar";
import { useSnapshot } from "@/dados/useSnapshot";
import { acharMarca, indiceProduto, nomeSubstancia, precisaAvisoLiberacao, rotuloProduto } from "@/busca/remedios";
import type { NovoRemedio } from "@/meus-remedios/guardados";
import { tituloPrimeiro } from "@/meus-remedios/situacao";
import { descreverPosto } from "@/postos/descricao";
import { formatarDistancia } from "@/postos/distancia";
import { interpretarHorario, situacaoHorario } from "@/postos/horario";
import { useOrigem } from "@/postos/origem";
import { avisoRetirada, postosComEstoque, type Ordem, type PostoComEstoque } from "@/postos/postos";
import { ALVO_MINIMO, espaco, RAIO_CAPSULA, RAIO_CARTAO, sombraCartao, useTema } from "@/tema";
import { useAnuncio } from "@/util/anuncio";

/** Quantos postos aparecem de cada vez: lista curta é mais fácil de ler. */
const POR_PAGINA = 10;

type Modo = "lista" | "mapa";

export default function Postos() {
  const { codigo, marca } = useLocalSearchParams<{ codigo: string; marca?: string }>();
  const { snapshot, procurandoNovos } = useSnapshot();
  // A faixa mostra o remédio: enquanto os dados carregam, só o Voltar e o "carregando".
  if (!snapshot)
    return (
      <Tela topo={<Voltar sobreFaixa />}>
        <ComDados>{() => null}</ComDados>
      </Tela>
    );
  return <ListaPostos snapshot={snapshot} codigo={codigo} nomeMarca={marca} procurandoNovos={procurandoNovos} />;
}

interface Props {
  snapshot: Snapshot;
  codigo: string;
  nomeMarca?: string;
  procurandoNovos: boolean;
}

function ListaPostos({ snapshot, codigo, nomeMarca, procurandoNovos }: Props) {
  const router = useRouter();
  const { cores } = useTema();
  const origem = useOrigem(snapshot);
  const { ordem } = origem;
  const [quantos, setQuantos] = useState(POR_PAGINA);
  const [modo, setModo] = useState<Modo>("lista");
  const [soAbertos, setSoAbertos] = useState(false);
  const [soBastante, setSoBastante] = useState(false);
  const [caminhoPara, setCaminhoPara] = useState<Ubs | null>(null);
  const [acabouDeGuardar, setAcabouDeGuardar] = useState(false);
  // "Mostrar mais postos": o leitor de tela vai para o primeiro posto novo, não fica no botão lá embaixo.
  const [primeiroNovo, setPrimeiroNovo] = useState<number | null>(null);
  const itemNovo = useRef<HostInstance>(null);
  useEffect(() => {
    if (primeiroNovo !== null && itemNovo.current) AccessibilityInfo.sendAccessibilityEvent(itemNovo.current, "focus");
  }, [primeiroNovo]);

  const iProduto = indiceProduto(snapshot, codigo);
  const produto = snapshot.produtos[iProduto];
  const postos = useMemo(() => postosComEstoque(snapshot, iProduto, ordem), [snapshot, iProduto, ordem]);
  const visiveis = useMemo(
    () => postos.filter((p) => (!soAbertos || abertoAgora(p)) && (!soBastante || nivelEstoque(p.dias) === "alto")),
    [postos, soAbertos, soBastante],
  );
  const contagem = postos.length === 1 ? "1 posto tem hoje" : `${postos.length} postos têm hoje`;
  // A lista aparece (ou muda de ordem) depois da pergunta ou do GPS, sem a pessoa tocar nela.
  useAnuncio(
    !produto
      ? null
      : postos.length === 0
        ? textoVazio(produto)
        : origem.carregando || origem.perguntar
          ? null
          : `${contagem}. ${textoOrdem(ordem)}`,
  );

  if (!produto)
    return (
      <Tela topo={<Voltar sobreFaixa />}>
        <NaoEncontrado oQue="remédio" />
      </Tela>
    );

  const nome = nomeSubstancia([produto]);
  const marca = acharMarca(snapshot, nomeMarca);
  const retirada = avisoRetirada(produto);
  const paraGuardar: NovoRemedio = {
    codigo: produto.codigo,
    nome,
    apresentacao: rotuloProduto(produto),
    marca: marca?.nome ?? null,
  };
  const escolherRegiao = () => router.push("/regiao");
  const abrir = (p: PostoComEstoque) =>
    router.push({
      pathname: "/posto/[cnes]",
      params: { cnes: p.ubs.cnes, farmacia: p.ubs.farmacia, produto: produto.codigo },
    });

  // Com localização ou região, o primeiro da lista ganha destaque, com "Como chegar" (sem elas, não há
  // "mais perto": a lista vai por Região Administrativa e nenhum posto aparece como o melhor).
  const primeiro = visiveis[0];
  const titulo = primeiro ? tituloPrimeiro(ordem, primeiro) : null;
  const emLista = !MAPA_DISPONIVEL || modo === "lista";
  const pronto = postos.length > 0 && !origem.carregando && !origem.perguntar;
  const destaque = pronto && emLista && primeiro && titulo ? { posto: primeiro, titulo } : null;
  const mudarFiltro = (mudar: (ligado: boolean) => void) => (ligado: boolean) => {
    mudar(ligado);
    setQuantos(POR_PAGINA);
  };

  const niveis = contarNiveis(postos.map((p) => p.dias));

  return (
    <Tela
      cartaoPorCima={postos.length > 0}
      topo={
        <>
          <Voltar sobreFaixa />
          {postos.length > 0 ? <BotaoGuardar remedio={paraGuardar} sobreFaixa aoMudar={setAcabouDeGuardar} /> : null}
        </>
      }
      faixa={
        <>
          {acabouDeGuardar ? (
            <Texto variante="legenda" cor={cores.textoFaixaSecundario} style={estilos.guardado}>
              Está na aba Meus remédios.
            </Texto>
          ) : null}
          <View style={estilos.titulo}>
            <Pictograma forma={produto.forma} tamanho={60} sobreFaixa />
            <View style={estilos.flex}>
              <Texto variante="titulo" cor={cores.textoFaixa}>
                {nome}
              </Texto>
              <Texto variante="destaque" peso="medio" cor={cores.textoFaixaSecundario}>
                {rotuloProduto(produto)}
                {produto.liberacaoProlongada ? " · liberação prolongada" : ""}
              </Texto>
            </View>
          </View>
        </>
      }
    >
      {postos.length > 0 ? (
        <Surgir>
          <Cartao style={estilos.resumo}>
            <View style={estilos.linhaResumo}>
              <Rosca contagem={niveis} tamanho={112} espessura={16}>
                <NumeroAnimado valor={postos.length} peso="numero" tamanho={30} cor={cores.texto} />
                <Texto variante="legenda" tamanho={12} peso="medio" secundario>
                  {postos.length === 1 ? "posto" : "postos"}
                </Texto>
              </Rosca>
              <View style={estilos.flex}>
                <Texto variante="subtitulo" accessibilityLiveRegion="polite">
                  {contagem}
                </Texto>
                <Texto variante="legenda" secundario>
                  De {snapshot.ubs.length} farmácias de UBS do DF.
                </Texto>
              </View>
            </View>
            <View
              accessible
              accessibilityLabel={(["alto", "baixo", "critico", "sem_consumo"] as const)
                .filter((n) => niveis[n] > 0)
                .map((n) => `${niveis[n]} ${LEGENDA_NIVEL[n]}`)
                .join(", ")}
            >
              <LegendaNiveis contagem={niveis} />
            </View>
            <FaixaAtualizacao atualizadoEm={snapshot.meta.atualizadoEm} procurandoNovos={procurandoNovos} />
          </Cartao>
        </Surgir>
      ) : (
        <FaixaAtualizacao atualizadoEm={snapshot.meta.atualizadoEm} procurandoNovos={procurandoNovos} />
      )}

      {precisaAvisoLiberacao(marca, produto) && marca ? <AvisoLiberacao marca={marca} quais="um" /> : null}

      {retirada ? (
        <Aviso tipo={produto.retirada === "controlado" ? "aviso" : "info"} titulo={retirada.titulo} texto={retirada.texto}>
          {retirada.link ? (
            <Botao
              titulo="Ver a lista oficial"
              icone="open-outline"
              variante="secundario"
              dica="Abre o site da Secretaria de Saúde do DF"
              onPress={() => Linking.openURL(retirada.link!)}
            />
          ) : null}
        </Aviso>
      ) : null}

      {destaque ? (
        <Surgir ordem={1}>
        <PrimeiroPosto
          posto={destaque.posto}
          titulo={destaque.titulo}
          aoAbrir={() => abrir(destaque.posto)}
          aoComoChegar={() => setCaminhoPara(destaque.posto.ubs)}
        />
        </Surgir>
      ) : null}

      {postos.length === 0 ? (
        <Vazio produto={produto} paraGuardar={paraGuardar} />
      ) : origem.carregando ? (
        <ProcurandoLocalizacao />
      ) : origem.perguntar ? (
        <PerguntarOrigem procurando={origem.procurando} usarLocalizacao={origem.usarLocalizacao} escolherRegiao={escolherRegiao} />
      ) : (
        <>
          <SituacaoOrigem origem={origem} escolherRegiao={escolherRegiao} />
          {ordem.por === "regiao" && !postos.some((p) => p.ubs.ra === ordem.ra) ? (
            <Texto>Nenhum posto da sua região ({ordem.ra}) tem hoje. Abaixo, os das regiões mais perto.</Texto>
          ) : null}
          {postos.length > 1 ? (
            <View style={estilos.filtros} accessibilityLabel="Filtros" accessibilityRole="toolbar">
              <Filtro titulo="Aberto agora" ligado={soAbertos} aoMudar={mudarFiltro(setSoAbertos)} />
              <Filtro titulo="Tem bastante" ligado={soBastante} aoMudar={mudarFiltro(setSoBastante)} />
            </View>
          ) : null}
          {MAPA_DISPONIVEL ? (
            <Alternancia
              valor={modo}
              aoMudar={setModo}
              opcoes={[
                { valor: "lista", titulo: "Lista", icone: "list" },
                { valor: "mapa", titulo: "Mapa", icone: "map-outline" },
              ]}
            />
          ) : (
            <SemMapa />
          )}

          {visiveis.length === 0 ? (
            <Cartao>
              <Texto variante="destaque" accessibilityLiveRegion="polite">
                Nenhum posto com esses filtros agora
              </Texto>
              <Botao
                titulo="Mostrar todos os postos"
                variante="secundario"
                onPress={() => {
                  setSoAbertos(false);
                  setSoBastante(false);
                }}
              />
            </Cartao>
          ) : MAPA_DISPONIVEL && modo === "mapa" ? (
            <MapaPostos postos={visiveis} ordem={ordem} aoAbrir={abrir} />
          ) : (
            <>
              <View style={estilos.lista}>
                {visiveis.slice(0, quantos).map((p, n, pagina) => {
                  // O primeiro já está no alto, em destaque.
                  if (n === 0 && destaque) return null;
                  const cabecalho = cabecalhoAntes(ordem, p, pagina[n - 1]);
                  return (
                    <Fragment key={`${p.ubs.cnes}-${p.ubs.farmacia}`}>
                      {cabecalho ? (
                        <Texto variante="destaque" accessibilityRole="header" style={estilos.regiao}>
                          {cabecalho}
                        </Texto>
                      ) : null}
                      <Surgir ordem={primeiroNovo !== null && n >= primeiroNovo ? n - primeiroNovo : n + 2}>
                        <ItemPosto posto={p} onPress={() => abrir(p)} ref={n === primeiroNovo ? itemNovo : undefined} />
                      </Surgir>
                    </Fragment>
                  );
                })}
              </View>
              {quantos < visiveis.length ? (
                <Botao
                  titulo="Mostrar mais postos"
                  icone="chevron-down"
                  variante="secundario"
                  dica={`Faltam ${visiveis.length - quantos}`}
                  onPress={() => {
                    setPrimeiroNovo(quantos);
                    setQuantos(quantos + POR_PAGINA);
                  }}
                />
              ) : null}
            </>
          )}
        </>
      )}
      <EscolherMapa ubs={caminhoPara} aoFechar={() => setCaminhoPara(null)} />
    </Tela>
  );
}

/** Aberto agora pelo horário do cadastro. Horário que o app não entende não conta como aberto. */
function abertoAgora(p: PostoComEstoque, agora: Date = new Date()): boolean {
  const faixas = interpretarHorario(p.ubs.horario);
  return !!faixas && situacaoHorario(faixas, agora).aberto;
}

interface PropsPrimeiro {
  posto: PostoComEstoque;
  titulo: string;
  aoAbrir: () => void;
  aoComoChegar: () => void;
}

/**
 * O mais perto (ou o primeiro da região), no alto e em destaque: a resposta antes da lista. A parte de cima
 * abre o posto, como os outros itens; "Como chegar" fica embaixo, separado, sem botão dentro de botão.
 */
function PrimeiroPosto({ posto, titulo, aoAbrir, aoComoChegar }: PropsPrimeiro) {
  const { cores } = useTema();
  const toque = useToque(0.98);
  const { nome, rotulo } = descreverPosto(posto);
  return (
    <Animated.View style={[estilos.primeiro, { backgroundColor: cores.superficie, borderColor: cores.primaria }, sombraCartao(cores), toque.estilo]}>
      <Pressable
        onPress={aoAbrir}
        onPressIn={toque.aoEncostar}
        onPressOut={toque.aoSoltar}
        accessibilityRole="button"
        accessibilityLabel={rotulo}
        accessibilityHint={`${titulo}. Mostra endereço, telefone e como chegar`}
        style={estilos.topoPrimeiro}
      >
        <View style={estilos.linha}>
          <View style={[estilos.etiqueta, { backgroundColor: cores.primaria }]}>
            <Icone name="location" size={18} color={cores.textoSobrePrimaria} />
            <Texto variante="legenda" peso="negrito" cor={cores.textoSobrePrimaria} style={estilos.flexTexto}>
              {titulo}
            </Texto>
          </View>
          {posto.distanciaKm !== null ? (
            <Texto peso="numero" tamanho={22} cor={cores.primaria}>
              {formatarDistancia(posto.distanciaKm)}
            </Texto>
          ) : null}
        </View>
        <View style={estilos.topoPosto}>
          <Texto variante="destaque" peso="extra" tamanho={24} style={estilos.flex}>
            {nome}
          </Texto>
          <View style={[estilos.seta, { backgroundColor: cores.primariaTinta }]}>
            <Icone name="chevron-forward" size={22} color={cores.textoTonal} />
          </View>
        </View>
        <Texto secundario>{posto.ubs.ra}</Texto>
        <View style={estilos.selos}>
          <SeloEstoque dias={posto.dias} />
          <SeloHorario horario={posto.ubs.horario} />
        </View>
        <MedidorDias dias={posto.dias} />
      </Pressable>
      <Botao titulo="Como chegar" icone="navigate" dica={`Até ${nome}. Pergunta qual app de mapa você quer usar`} onPress={aoComoChegar} />
    </Animated.View>
  );
}

/**
 * Títulos que separam a lista: por Região Administrativa sem localização;
 * com a região escolhida, o nome dela e depois "Outras regiões"; por distância, nenhum.
 */
function cabecalhoAntes(ordem: Ordem, posto: PostoComEstoque, anterior: PostoComEstoque | undefined): string | null {
  if (ordem.por === "nome") return posto.ubs.ra !== anterior?.ubs.ra ? posto.ubs.ra : null;
  if (ordem.por === "regiao") {
    const daRegiao = posto.ubs.ra === ordem.ra;
    if (daRegiao && !anterior) return ordem.ra;
    if (!daRegiao && (!anterior || anterior.ubs.ra === ordem.ra)) return "Outras regiões, da mais perto para a mais longe";
  }
  return null;
}

/** O que o leitor de tela diz da ordem da lista, junto com a contagem. */
function textoOrdem(ordem: Ordem): string {
  if (ordem.por === "distancia") return "Do mais perto para o mais longe de você.";
  if (ordem.por === "regiao") return `Primeiro os da sua região, ${ordem.ra}.`;
  return "Por Região Administrativa.";
}

function textoVazio(produto: Produto): string {
  return `Nenhum posto tem ${nomeSubstancia([produto])} ${rotuloProduto(produto).toLocaleLowerCase("pt-BR")} hoje`;
}

function ItemPosto({ posto, onPress, ref }: { posto: PostoComEstoque; onPress: () => void; ref?: Ref<HostInstance> }) {
  const { cores } = useTema();
  const { nome, rotulo } = descreverPosto(posto);
  return (
    <ItemLista
      onPress={onPress}
      rotulo={rotulo}
      dica="Mostra endereço, telefone e como chegar"
      ref={ref}
      filete={cores.barraSemaforo[nivelEstoque(posto.dias)]}
    >
      <View style={estilos.topoPosto}>
        <Texto variante="destaque" style={estilos.flex}>
          {nome}
        </Texto>
        {posto.distanciaKm !== null ? (
          <View style={[estilos.distancia, { backgroundColor: cores.primariaTinta }]}>
            <Texto variante="legenda" peso="numero" cor={cores.textoTonal}>
              {formatarDistancia(posto.distanciaKm)}
            </Texto>
          </View>
        ) : null}
      </View>
      <Texto secundario>{posto.ubs.ra}</Texto>
      <View style={estilos.selos}>
        <SeloEstoque dias={posto.dias} />
        <SeloHorario horario={posto.ubs.horario} />
      </View>
      <MedidorDias dias={posto.dias} />
    </ItemLista>
  );
}

/** Na web não há mapa: um aviso pequeno, para ninguém procurar o botão. */
function SemMapa() {
  const { cores } = useTema();
  return (
    <View style={estilos.linha}>
      <Icone name="map-outline" size={20} color={cores.textoSecundario} />
      <Texto variante="legenda" secundario style={estilos.flex}>
        O mapa dos postos aparece no app do celular. Aqui no navegador, só a lista.
      </Texto>
    </View>
  );
}

/**
 * Nenhum posto tem hoje. A ação principal é guardar em Meus remédios, para conferir depois, com um toque,
 * se ele chegou. O app não avisa sozinho (aviso no celular fica para a v1.1): o texto não promete isso.
 */
function Vazio({ produto, paraGuardar }: { produto: Produto; paraGuardar: NovoRemedio }) {
  return (
    <Cartao>
      <Texto variante="subtitulo" accessibilityLiveRegion="polite">
        {textoVazio(produto)}
      </Texto>
      <Texto secundario>
        O estoque muda todo dia. Guarde este remédio: depois, é só abrir a aba Meus remédios para ver se ele chegou
        a algum posto.
      </Texto>
      <BotaoGuardar remedio={paraGuardar} principal />
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  guardado: { textAlign: "right", marginTop: -espaco.xs },
  titulo: { flexDirection: "row", alignItems: "center", gap: espaco.md, marginTop: espaco.xs },
  resumo: { gap: espaco.md, padding: espaco.md + 4 },
  linhaResumo: { flexDirection: "row", alignItems: "center", gap: espaco.md },
  filtros: { flexDirection: "row", flexWrap: "wrap", gap: espaco.sm },
  primeiro: { borderRadius: RAIO_CARTAO, borderWidth: 2, padding: espaco.md, gap: espaco.md },
  topoPrimeiro: { gap: espaco.xs, minHeight: ALVO_MINIMO },
  etiqueta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: espaco.sm,
    paddingRight: espaco.sm + 4,
    paddingVertical: 5,
    borderRadius: RAIO_CAPSULA,
    flexShrink: 1,
    marginRight: "auto",
  },
  flexTexto: { flexShrink: 1 },
  seta: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  topoPosto: { flexDirection: "row", alignItems: "flex-start", gap: espaco.sm },
  distancia: { borderRadius: 10, paddingHorizontal: espaco.sm, paddingVertical: 2 },
  selos: { flexDirection: "row", flexWrap: "wrap", gap: espaco.xs },
  lista: { gap: espaco.sm + 4 },
  regiao: { marginTop: espaco.sm },
  linha: { flexDirection: "row", alignItems: "center", gap: espaco.sm },
  flex: { flex: 1 },
});
