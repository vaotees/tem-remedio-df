import Ionicons from "@expo/vector-icons/Ionicons";
import type { Produto, Snapshot } from "@tem-remedio/shared";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Fragment, useMemo, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { Alternancia } from "@/componentes/Alternancia";
import { Aviso } from "@/componentes/Aviso";
import { AvisoLiberacao } from "@/componentes/AvisoLiberacao";
import { Botao } from "@/componentes/Botao";
import { BotaoGuardar } from "@/componentes/BotaoGuardar";
import { Cartao } from "@/componentes/Cartao";
import { ComDados } from "@/componentes/ComDados";
import { FaixaAtualizacao } from "@/componentes/FaixaAtualizacao";
import { ItemLista } from "@/componentes/ItemLista";
import { MAPA_DISPONIVEL, MapaPostos } from "@/componentes/MapaPostos";
import { NaoEncontrado } from "@/componentes/NaoEncontrado";
import { PerguntarOrigem, ProcurandoLocalizacao, SituacaoOrigem } from "@/componentes/OrigemPostos";
import { SeloEstoque } from "@/componentes/SeloEstoque";
import { SeloHorario } from "@/componentes/SeloHorario";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import { Voltar } from "@/componentes/Voltar";
import { acharMarca, indiceProduto, nomeSubstancia, precisaAvisoLiberacao, rotuloProduto } from "@/busca/remedios";
import type { NovoRemedio } from "@/meus-remedios/guardados";
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

  return (
    <>
      <View>
        <Texto variante="titulo">{nome}</Texto>
        <Texto variante="destaque" secundario>
          {rotuloProduto(produto)}
          {produto.liberacaoProlongada ? " · liberação prolongada" : ""}
        </Texto>
      </View>

      {/* Na tela vazia, o botão fica no cartão "Nenhum posto tem", como a ação principal. */}
      {postos.length > 0 ? <BotaoGuardar remedio={paraGuardar} /> : null}

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

/**
 * Nenhum posto tem hoje. A ação principal é guardar em Meus remédios, para conferir depois, com um toque,
 * se ele chegou. O app não avisa sozinho (aviso no celular fica para a v1.1): o texto não promete isso.
 */
function Vazio({ produto, paraGuardar }: { produto: Produto; paraGuardar: NovoRemedio }) {
  const nome = `${nomeSubstancia([produto])} ${rotuloProduto(produto).toLocaleLowerCase("pt-BR")}`;
  return (
    <Cartao>
      <Texto variante="subtitulo" accessibilityLiveRegion="polite">
        Nenhum posto tem {nome} hoje
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
  lista: { gap: espaco.sm },
  regiao: { marginTop: espaco.sm },
  linha: { flexDirection: "row", alignItems: "center", gap: espaco.sm },
  flex: { flex: 1 },
});
