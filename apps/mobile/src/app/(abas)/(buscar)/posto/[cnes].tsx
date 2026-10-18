import { DOCUMENTOS_UBS, TEXTO_RETIRADA, type Snapshot } from "@tem-remedio/shared";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Linking, Platform, Share, StyleSheet, View } from "react-native";
import { Botao } from "@/componentes/Botao";
import { Cartao } from "@/componentes/Cartao";
import { ComDados } from "@/componentes/ComDados";
import { EscolherMapa } from "@/componentes/EscolherMapa";
import { NaoEncontrado } from "@/componentes/NaoEncontrado";
import { SeloEstoque } from "@/componentes/SeloEstoque";
import { SeloHorario } from "@/componentes/SeloHorario";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import { Voltar } from "@/componentes/Voltar";
import { capitalizarNome, indiceProduto, nomeSubstancia, rotuloProduto } from "@/busca/remedios";
import {
  formatarCep,
  linkStreetView,
  linkTelefone,
  linkWhatsApp,
  linkWhatsAppApp,
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
 * Abre o WhatsApp direto, já com a mensagem: a pessoa só escolhe o contato.
 * Celular sem WhatsApp: a folha de compartilhar do sistema (SMS, e-mail...). Na web: WhatsApp Web.
 */
async function enviar(texto: string) {
  if (Platform.OS === "web") {
    await Linking.openURL(linkWhatsApp(texto));
    return;
  }
  try {
    await Linking.openURL(linkWhatsAppApp(texto));
  } catch {
    await Share.share({ message: texto });
  }
}

function Detalhe({ snapshot, cnes, farmacia, codigoProduto }: Props) {
  const [escolhendoMapa, setEscolhendoMapa] = useState(false);
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
          dica="Pergunta qual app de mapa você quer usar"
          onPress={() => setEscolhendoMapa(true)}
        />
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
          dica="Abre o WhatsApp com o endereço e o horário deste posto"
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
        <Botao
          titulo="Ver a fachada"
          icone="eye-outline"
          variante="secundario"
          dica="Abre a foto da rua no Google Street View"
          onPress={() => Linking.openURL(linkStreetView(ubs))}
        />
        <Texto variante="legenda" secundario>
          Foto da rua do Google. A localização vem do cadastro e pode cair num prédio vizinho: gire a imagem se
          precisar.
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

      <EscolherMapa ubs={escolhendoMapa ? ubs : null} aoFechar={() => setEscolhendoMapa(false)} />
    </>
  );
}

function capitalizarPrimeira(texto: string): string {
  return texto.charAt(0).toLocaleUpperCase("pt-BR") + texto.slice(1);
}

const estilos = StyleSheet.create({
  botoes: { gap: espaco.sm },
});
