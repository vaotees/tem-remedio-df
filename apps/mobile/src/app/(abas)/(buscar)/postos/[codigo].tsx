import Ionicons from "@expo/vector-icons/Ionicons";
import { nivelEstoque, TEXTO_NIVEL, type Produto, type Snapshot } from "@tem-remedio/shared";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Fragment, useMemo, useState } from "react";
import { ActivityIndicator, Linking, Platform, StyleSheet, View } from "react-native";
import { Aviso } from "@/componentes/Aviso";
import { AvisoLiberacao } from "@/componentes/AvisoLiberacao";
import { Botao } from "@/componentes/Botao";
import { Cartao } from "@/componentes/Cartao";
import { ComDados } from "@/componentes/ComDados";
import { FaixaAtualizacao } from "@/componentes/FaixaAtualizacao";
import { ItemLista } from "@/componentes/ItemLista";
import { NaoEncontrado } from "@/componentes/NaoEncontrado";
import { SeloEstoque } from "@/componentes/SeloEstoque";
import { SeloHorario } from "@/componentes/SeloHorario";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import { Voltar } from "@/componentes/Voltar";
import { acharMarca, capitalizarNome, indiceProduto, nomeSubstancia, precisaAvisoLiberacao, rotuloProduto } from "@/busca/remedios";
import { formatarDistancia } from "@/postos/distancia";
import { interpretarHorario, situacaoHorario } from "@/postos/horario";
import { useLocalizacao, type Localizacao } from "@/postos/localizacao";
import { avisoRetirada, estaForaDoDf, postosComEstoque, type PostoComEstoque } from "@/postos/postos";
import { espaco, useTema } from "@/tema";

/** Quantos postos aparecem de cada vez: lista curta é mais fácil de ler. */
const POR_PAGINA = 10;

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
  const { localizacao, procurando, tentarDeNovo } = useLocalizacao();
  const [quantos, setQuantos] = useState(POR_PAGINA);

  const iProduto = indiceProduto(snapshot, codigo);
  const produto = snapshot.produtos[iProduto];
  const foraDoDf = localizacao?.situacao === "ok" && estaForaDoDf(snapshot, localizacao);
  const origem = localizacao?.situacao === "ok" && !foraDoDf ? localizacao : null;

  const postos = useMemo(() => postosComEstoque(snapshot, iProduto, origem), [snapshot, iProduto, origem]);

  if (!produto) return <NaoEncontrado oQue="remédio" />;

  const nome = nomeSubstancia([produto]);
  const marca = acharMarca(snapshot, nomeMarca);
  const retirada = avisoRetirada(produto);

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

      {!localizacao && procurando ? (
        <View style={estilos.procurando} accessibilityLiveRegion="polite">
          <ActivityIndicator size="large" />
          <Texto secundario>Procurando sua localização para mostrar os postos mais perto…</Texto>
        </View>
      ) : postos.length === 0 ? (
        <Vazio produto={produto} />
      ) : (
        <>
          <SituacaoLocalizacao localizacao={localizacao} foraDoDf={foraDoDf} procurando={procurando} tentarDeNovo={tentarDeNovo} />
          <Texto variante="subtitulo" accessibilityLiveRegion="polite">
            {postos.length === 1 ? "1 posto tem hoje" : `${postos.length} postos têm hoje`}
          </Texto>
          <View style={estilos.lista}>
            {postos.slice(0, quantos).map((p, n, visiveis) => (
              <Fragment key={`${p.ubs.cnes}-${p.ubs.farmacia}`}>
                {!origem && p.ubs.ra !== visiveis[n - 1]?.ubs.ra ? (
                  <Texto variante="destaque" accessibilityRole="header" style={estilos.regiao}>
                    {p.ubs.ra}
                  </Texto>
                ) : null}
                <ItemPosto
                  posto={p}
                  onPress={() =>
                    router.push({
                      pathname: "/posto/[cnes]",
                      params: { cnes: p.ubs.cnes, farmacia: p.ubs.farmacia, produto: produto.codigo },
                    })
                  }
                />
              </Fragment>
            ))}
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
  );
}

function ItemPosto({ posto, onPress }: { posto: PostoComEstoque; onPress: () => void }) {
  const { ubs, dias, distanciaKm } = posto;
  const nome = capitalizarNome(ubs.nome);
  const distancia = distanciaKm !== null ? formatarDistancia(distanciaKm) : null;
  const faixas = interpretarHorario(ubs.horario);
  const horario = faixas ? situacaoHorario(faixas).texto : null;
  const rotulo = [
    nome,
    distancia ? `${ubs.ra}, a ${distancia} em linha reta` : ubs.ra,
    `Estoque: ${TEXTO_NIVEL[nivelEstoque(dias)]}`,
    horario,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <ItemLista onPress={onPress} rotulo={rotulo} dica="Mostra endereço, telefone e como chegar">
      <Texto variante="destaque">{nome}</Texto>
      <Texto secundario>{distancia ? `${ubs.ra} · ${distancia}` : ubs.ra}</Texto>
      <SeloEstoque dias={dias} />
      <SeloHorario horario={ubs.horario} />
    </ItemLista>
  );
}

interface PropsSituacao {
  localizacao: Localizacao | undefined;
  foraDoDf: boolean;
  procurando: boolean;
  tentarDeNovo: () => void;
}

/** Explica a ordem da lista e, sem localização, como ter os postos mais perto. */
function SituacaoLocalizacao({ localizacao, foraDoDf, procurando, tentarDeNovo }: PropsSituacao) {
  const { cores } = useTema();

  if (localizacao?.situacao === "ok" && !foraDoDf) {
    return (
      <View style={estilos.ordem}>
        <Ionicons name="navigate" size={20} color={cores.textoSecundario} />
        <Texto secundario style={estilos.flex}>
          Do mais perto para o mais longe de você, em linha reta.
        </Texto>
      </View>
    );
  }

  const regiao = "Os postos aparecem por Região Administrativa. Em breve você vai poder escolher a sua região.";
  if (foraDoDf) {
    return <Aviso tipo="info" titulo="Você parece estar fora do DF" texto={regiao} />;
  }
  if (localizacao?.situacao === "sem_permissao") {
    const nosAjustes = !localizacao.podePedir && Platform.OS !== "web";
    return (
      <Aviso tipo="info" titulo="Sem a sua localização" texto={regiao}>
        {localizacao.podePedir ? (
          <Botao titulo="Usar minha localização" icone="navigate" variante="secundario" carregando={procurando} onPress={tentarDeNovo} />
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
    <Aviso tipo="info" titulo="Não consegui achar sua localização" texto={regiao}>
      <Botao titulo="Tentar de novo" icone="refresh" variante="secundario" carregando={procurando} onPress={tentarDeNovo} />
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
  ordem: { flexDirection: "row", alignItems: "center", gap: espaco.sm },
  flex: { flex: 1 },
});
