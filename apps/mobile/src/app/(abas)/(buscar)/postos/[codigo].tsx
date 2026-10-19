import Ionicons from "@expo/vector-icons/Ionicons";
import type { Produto, Snapshot } from "@tem-remedio/shared";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Fragment, useMemo, useState } from "react";
import { ActivityIndicator, Linking, Platform, StyleSheet, View } from "react-native";
import { Alternancia } from "@/componentes/Alternancia";
import { Aviso } from "@/componentes/Aviso";
import { AvisoLiberacao } from "@/componentes/AvisoLiberacao";
import { Botao } from "@/componentes/Botao";
import { Cartao } from "@/componentes/Cartao";
import { ComDados } from "@/componentes/ComDados";
import { FaixaAtualizacao } from "@/componentes/FaixaAtualizacao";
import { ItemLista } from "@/componentes/ItemLista";
import { MAPA_DISPONIVEL, MapaPostos } from "@/componentes/MapaPostos";
import { NaoEncontrado } from "@/componentes/NaoEncontrado";
import { SeloEstoque } from "@/componentes/SeloEstoque";
import { SeloHorario } from "@/componentes/SeloHorario";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import { Voltar } from "@/componentes/Voltar";
import { acharMarca, indiceProduto, nomeSubstancia, precisaAvisoLiberacao, rotuloProduto } from "@/busca/remedios";
import { descreverPosto } from "@/postos/descricao";
import { useOrigem } from "@/postos/origem";
import { avisoRetirada, postosComEstoque, type Ordem, type PostoComEstoque } from "@/postos/postos";
import { espaco, useTema } from "@/tema";

/** Quantos postos aparecem de cada vez: lista curta é mais fácil de ler. */
const POR_PAGINA = 10;

type Modo = "lista" | "mapa";

export default function Postos() {
  const { codigo, marca } = useLocalSearchParams<{ codigo: string; marca?: string }>();
  return (
    <Tela>
      <Voltar />
      <ComDados>
        {(snapshot, { procurandoNovos }) => (
          <ListaPostos snapshot={snapshot} codigo={codigo} nomeMarca={marca} procurandoNovos={procurandoNovos} />
        )}
      </ComDados>
    </Tela>
  );
}

interface Props {
  snapshot: Snapshot;
  codigo: string;
  nomeMarca?: string;
  procurandoNovos: boolean;
}

function ListaPostos({ snapshot, codigo, nomeMarca, procurandoNovos }: Props) {
  const router = useRouter();
  const origem = useOrigem(snapshot);
  const { ordem } = origem;
  const [quantos, setQuantos] = useState(POR_PAGINA);
  const [modo, setModo] = useState<Modo>("lista");

  const iProduto = indiceProduto(snapshot, codigo);
  const produto = snapshot.produtos[iProduto];
  const postos = useMemo(() => postosComEstoque(snapshot, iProduto, ordem), [snapshot, iProduto, ordem]);

  if (!produto) return <NaoEncontrado oQue="remédio" />;

  const nome = nomeSubstancia([produto]);
  const marca = acharMarca(snapshot, nomeMarca);
  const retirada = avisoRetirada(produto);
  const escolherRegiao = () => router.push("/regiao");
  const abrir = (p: PostoComEstoque) =>
    router.push({
      pathname: "/posto/[cnes]",
      params: { cnes: p.ubs.cnes, farmacia: p.ubs.farmacia, produto: produto.codigo },
    });

  return (
    <>
      <View>
        <Texto variante="titulo">{nome}</Texto>
        <Texto variante="destaque" secundario>
          {rotuloProduto(produto)}
          {produto.liberacaoProlongada ? " · liberação prolongada" : ""}
        </Texto>
      </View>

      <FaixaAtualizacao atualizadoEm={snapshot.meta.atualizadoEm} procurandoNovos={procurandoNovos} />

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

      {postos.length === 0 ? (
        <Vazio produto={produto} />
      ) : origem.carregando ? (
        <View style={estilos.procurando} accessibilityLiveRegion="polite">
          <ActivityIndicator size="large" />
          <Texto secundario>Procurando sua localização para mostrar os postos mais perto…</Texto>
        </View>
      ) : origem.perguntar ? (
        <PerguntarOrigem procurando={origem.procurando} usarLocalizacao={origem.usarLocalizacao} escolherRegiao={escolherRegiao} />
      ) : (
        <>
          <SituacaoOrigem origem={origem} escolherRegiao={escolherRegiao} />
          {ordem.por === "regiao" && !postos.some((p) => p.ubs.ra === ordem.ra) ? (
            <Texto>Nenhum posto da sua região ({ordem.ra}) tem hoje. Abaixo, os das regiões mais perto.</Texto>
          ) : null}
          <Texto variante="subtitulo" accessibilityLiveRegion="polite">
            {postos.length === 1 ? "1 posto tem hoje" : `${postos.length} postos têm hoje`}
          </Texto>

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

          {MAPA_DISPONIVEL && modo === "mapa" ? (
            <MapaPostos postos={postos} ordem={ordem} aoAbrir={abrir} />
          ) : (
            <>
              <View style={estilos.lista}>
                {postos.slice(0, quantos).map((p, n, visiveis) => {
                  const cabecalho = cabecalhoAntes(ordem, p, visiveis[n - 1]);
                  return (
                    <Fragment key={`${p.ubs.cnes}-${p.ubs.farmacia}`}>
                      {cabecalho ? (
                        <Texto variante="destaque" accessibilityRole="header" style={estilos.regiao}>
                          {cabecalho}
                        </Texto>
                      ) : null}
                      <ItemPosto posto={p} onPress={() => abrir(p)} />
                    </Fragment>
                  );
                })}
              </View>
              {quantos < postos.length ? (
                <Botao
                  titulo="Mostrar mais postos"
                  icone="chevron-down"
                  variante="secundario"
                  dica={`Faltam ${postos.length - quantos}`}
                  onPress={() => setQuantos((q) => q + POR_PAGINA)}
                />
              ) : null}
            </>
          )}
        </>
      )}
    </>
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

function ItemPosto({ posto, onPress }: { posto: PostoComEstoque; onPress: () => void }) {
  const { nome, onde, rotulo } = descreverPosto(posto);
  return (
    <ItemLista onPress={onPress} rotulo={rotulo} dica="Mostra endereço, telefone e como chegar">
      <Texto variante="destaque">{nome}</Texto>
      <Texto secundario>{onde}</Texto>
      <SeloEstoque dias={posto.dias} />
      <SeloHorario horario={posto.ubs.horario} />
    </ItemLista>
  );
}

/** Na web não há mapa: um aviso pequeno, para ninguém procurar o botão. */
function SemMapa() {
  const { cores } = useTema();
  return (
    <View style={estilos.linha}>
      <Ionicons name="map-outline" size={20} color={cores.textoSecundario} />
      <Texto variante="legenda" secundario style={estilos.flex}>
        O mapa dos postos aparece no app do celular. Aqui no navegador, só a lista.
      </Texto>
    </View>
  );
}

interface PropsPerguntar {
  procurando: boolean;
  usarLocalizacao: () => void;
  escolherRegiao: () => void;
}

/** Primeira vez: antes do pedido do celular, explica e deixa escolher a região em vez da localização. */
function PerguntarOrigem({ procurando, usarLocalizacao, escolherRegiao }: PropsPerguntar) {
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
  origem: ReturnType<typeof useOrigem>;
  escolherRegiao: () => void;
}

/** Explica a ordem da lista e oferece a outra forma de achar os postos perto. */
function SituacaoOrigem({ origem, escolherRegiao }: PropsSituacao) {
  const { cores } = useTema();
  const { ordem, localizacao, foraDoDf, ra, usarRegiao, procurando, usarLocalizacao } = origem;

  if (ordem.por === "distancia") {
    return (
      <View style={estilos.linha}>
        <Ionicons name="navigate" size={20} color={cores.textoSecundario} />
        <Texto secundario style={estilos.flex}>
          Do mais perto para o mais longe de você, em linha reta.
        </Texto>
      </View>
    );
  }

  const textoRegiao = ra
    ? `Sua região: ${ra}. Primeiro os postos dela, depois os das regiões mais perto.`
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

/** Nenhum posto tem hoje. Salvar em Meus remédios (para saber quando chegar) vem no M5. */
function Vazio({ produto }: { produto: Produto }) {
  const router = useRouter();
  const nome = `${nomeSubstancia([produto])} ${rotuloProduto(produto).toLocaleLowerCase("pt-BR")}`;
  return (
    <Cartao>
      <Texto variante="subtitulo" accessibilityLiveRegion="polite">
        Nenhum posto tem {nome} hoje
      </Texto>
      <Texto secundario>
        O estoque muda todo dia. Em breve você vai poder salvar este remédio em Meus remédios e ver logo quando ele
        chegar.
      </Texto>
      <Botao titulo="Ir para Meus remédios" icone="heart-outline" variante="secundario" onPress={() => router.navigate("/meus-remedios")} />
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  procurando: { alignItems: "center", gap: espaco.md, paddingVertical: espaco.xl },
  lista: { gap: espaco.sm },
  regiao: { marginTop: espaco.sm },
  linha: { flexDirection: "row", alignItems: "center", gap: espaco.sm },
  flex: { flex: 1 },
});
