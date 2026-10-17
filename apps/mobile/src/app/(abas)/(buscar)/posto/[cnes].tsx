import { DOCUMENTOS_UBS, TEXTO_RETIRADA, type Snapshot } from "@tem-remedio/shared";
import { useLocalSearchParams } from "expo-router";
import { Linking, Platform, Share, StyleSheet, View } from "react-native";
import { Botao } from "@/componentes/Botao";
import { Cartao } from "@/componentes/Cartao";
import { ComDados } from "@/componentes/ComDados";
import { NaoEncontrado } from "@/componentes/NaoEncontrado";
import { SeloEstoque } from "@/componentes/SeloEstoque";
import { SeloHorario } from "@/componentes/SeloHorario";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import { Voltar } from "@/componentes/Voltar";
import { capitalizarNome, indiceProduto, nomeSubstancia, rotuloProduto } from "@/busca/remedios";
import {
  formatarCep,
  linkAppleMaps,
  linkGoogleMaps,
  linkTelefone,
  linkWhatsApp,
  textoCompartilhar,
} from "@/postos/links";
import { acharUbs, estoqueNoPosto, temOutraFarmacia } from "@/postos/postos";
import { espaco } from "@/tema";
import { formatarAtualizacao } from "@/util/datas";

/** Detalhe do posto: onde fica, quando abre, como chegar, ligar e mandar para alguém. */
export default function DetalhePosto() {
  const { cnes, farmacia, produto } = useLocalSearchParams<{ cnes: string; farmacia?: string; produto?: string }>();
  return (
    <Tela>
      <Voltar />
      <ComDados>
        {(snapshot) => <Detalhe snapshot={snapshot} cnes={cnes} farmacia={farmacia} codigoProduto={produto} />}
      </ComDados>
    </Tela>
  );
}

interface Props {
  snapshot: Snapshot;
  cnes: string;
  farmacia?: string;
  codigoProduto?: string;
}

/**
 * No celular, a folha de compartilhar do sistema (o WhatsApp aparece nela).
 * Na web, ou se o celular não tiver como compartilhar, abre o WhatsApp direto.
 */
async function enviar(texto: string) {
  if (Platform.OS !== "web") {
    try {
      await Share.share({ message: texto });
      return;
    } catch {
      // segue para o link do WhatsApp
    }
  }
  await Linking.openURL(linkWhatsApp(texto));
}

function Detalhe({ snapshot, cnes, farmacia, codigoProduto }: Props) {
  const ubs = acharUbs(snapshot, cnes, farmacia);
  if (!ubs) return <NaoEncontrado oQue="posto" />;

  const iProduto = codigoProduto ? indiceProduto(snapshot, codigoProduto) : -1;
  const produto = snapshot.produtos[iProduto];
  const estoque = produto ? estoqueNoPosto(snapshot, ubs, iProduto) : null;
  const remedio = produto ? `${nomeSubstancia([produto])}, ${rotuloProduto(produto).toLocaleLowerCase("pt-BR")}` : null;
  const atualizacao = formatarAtualizacao(snapshot.meta.atualizadoEm);
  const telefone = ubs.telefone ? linkTelefone(ubs.telefone) : null;
  const nome = capitalizarNome(ubs.nome);

  return (
    <>
      <View>
        <Texto variante="titulo">{nome}</Texto>
        <Texto secundario>{ubs.ra}</Texto>
        {temOutraFarmacia(snapshot, ubs) ? <Texto variante="legenda" secundario>{ubs.farmacia}</Texto> : null}
      </View>

      {produto && remedio ? (
        <Cartao>
          <Texto variante="destaque">{remedio}</Texto>
          {estoque ? (
            <SeloEstoque dias={estoque.dias} />
          ) : (
            <Texto>Este posto não tem este remédio nos dados de hoje.</Texto>
          )}
          <Texto secundario>Estoque de {atualizacao}, ligue antes de ir.</Texto>
          <Texto>{TEXTO_RETIRADA[produto.retirada]}</Texto>
          {produto.linkInfo ? (
            <Botao
              titulo="Ver a lista oficial"
              icone="open-outline"
              variante="secundario"
              dica="Abre o site da Secretaria de Saúde do DF"
              onPress={() => Linking.openURL(produto.linkInfo!)}
            />
          ) : null}
        </Cartao>
      ) : null}

      <View style={estilos.botoes}>
        <Botao
          titulo="Como chegar"
          icone="navigate"
          dica={Platform.OS === "ios" ? "Abre o Mapas" : "Abre o Google Maps"}
          onPress={() => Linking.openURL(Platform.OS === "ios" ? linkAppleMaps(ubs) : linkGoogleMaps(ubs))}
        />
        {Platform.OS === "ios" ? (
          <Botao
            titulo="Abrir no Google Maps"
            icone="map-outline"
            variante="secundario"
            onPress={() => Linking.openURL(linkGoogleMaps(ubs))}
          />
        ) : null}
        {telefone ? (
          <Botao
            titulo="Ligar"
            icone="call"
            dica={`Liga para ${ubs.telefone}`}
            onPress={() => Linking.openURL(telefone)}
          />
        ) : null}
        <Botao
          titulo="Enviar no WhatsApp"
          icone="logo-whatsapp"
          variante="secundario"
          dica="Manda o endereço e o horário deste posto"
          onPress={() => enviar(textoCompartilhar({ ubs, remedio, atualizacao }))}
        />
      </View>

      <Cartao>
        <Texto variante="subtitulo">Endereço</Texto>
        <Texto selectable>{ubs.endereco}</Texto>
        <Texto secundario>
          {ubs.ra}
          {ubs.cep ? ` · CEP ${formatarCep(ubs.cep)}` : ""}
        </Texto>
      </Cartao>

      <Cartao>
        <Texto variante="subtitulo">Horário</Texto>
        <SeloHorario horario={ubs.horario} />
        <Texto>{ubs.horario ? capitalizarPrimeira(ubs.horario) : "Horário não informado."}</Texto>
        <Texto variante="legenda" secundario>
          Em feriados o horário pode mudar.
        </Texto>
      </Cartao>

      <Cartao>
        <Texto variante="subtitulo">Telefone</Texto>
        <Texto selectable>{ubs.telefone ?? "A SES-DF não informou o telefone deste posto."}</Texto>
      </Cartao>

      <Cartao>
        <Texto variante="subtitulo">O que levar</Texto>
        {DOCUMENTOS_UBS.map((doc) => (
          <Texto key={doc}>• {doc}</Texto>
        ))}
        {produto?.retirada === "controlado" ? (
          <Texto>• Receita de controle especial em 2 vias (não aceitam xerox)</Texto>
        ) : null}
      </Cartao>
    </>
  );
}

function capitalizarPrimeira(texto: string): string {
  return texto.charAt(0).toLocaleUpperCase("pt-BR") + texto.slice(1);
}

const estilos = StyleSheet.create({
  botoes: { gap: espaco.sm },
});
