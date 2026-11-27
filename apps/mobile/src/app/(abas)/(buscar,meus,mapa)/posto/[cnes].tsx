import { DOCUMENTOS_UBS, nivelEstoque, normalizarTelefone, TEXTO_RETIRADA, type Snapshot } from "@tem-remedio/shared";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Linking, Platform, Share, StyleSheet, View } from "react-native";
import { Botao } from "@/componentes/Botao";
import { Cartao } from "@/componentes/Cartao";
import { ComDados } from "@/componentes/ComDados";
import { EscolherMapa } from "@/componentes/EscolherMapa";
import { MedidorDias } from "@/componentes/Graficos";
import { Icone } from "@/componentes/Icone";
import { MapaPosto } from "@/componentes/MapaPosto";
import { NaoEncontrado } from "@/componentes/NaoEncontrado";
import { Pictograma } from "@/componentes/Pictograma";
import { SeloEstoque } from "@/componentes/SeloEstoque";
import { SeloHorario } from "@/componentes/SeloHorario";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import { Voltar } from "@/componentes/Voltar";
import { capitalizarNome, indiceProduto, nomeSubstancia, rotuloProduto } from "@/busca/remedios";
import {
  formatarCep,
  linkOficial,
  linkTelefone,
  linkWhatsApp,
  linkWhatsAppApp,
  telefoneParaLeitor,
  textoCompartilhar,
} from "@/postos/links";
import { interpretarHorario } from "@/postos/horario";
import { acharUbs, estoqueNoPosto, temOutraFarmacia } from "@/postos/postos";
import { espaco, useTema } from "@/tema";
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
  // Formatado e conferido de novo aqui: um snapshot antigo pode trazer o número como veio do cadastro.
  const numero = normalizarTelefone(ubs.telefone);
  const telefone = numero ? linkTelefone(numero.exibir) : null;
  const listaOficial = produto ? linkOficial(produto) : null;
  // O leitor de tela fala o número dígito por dígito.
  const telefoneFalado = numero ? telefoneParaLeitor(numero.exibir) : undefined;
  const nome = capitalizarNome(ubs.nome);

  return (
    <>
      <MapaPosto ubs={ubs} nivel={estoque ? nivelEstoque(estoque.dias) : null} />

      <View style={estilos.cabecalho}>
        <Texto variante="titulo">{nome}</Texto>
        <Texto secundario>{ubs.ra}</Texto>
        {temOutraFarmacia(snapshot, ubs) ? <Texto variante="legenda" secundario>{ubs.farmacia}</Texto> : null}
        <SeloHorario horario={ubs.horario} />
      </View>

      {produto && remedio ? (
        <Cartao>
          <View style={estilos.linha}>
            <Pictograma forma={produto.forma} tamanho={40} />
            <Texto variante="destaque" style={estilos.flex}>
              {remedio}
            </Texto>
          </View>
          {estoque ? (
            <>
              <SeloEstoque dias={estoque.dias} />
              <MedidorDias dias={estoque.dias} />
            </>
          ) : (
            <Texto>Este posto não tem este remédio nos dados de hoje.</Texto>
          )}
          <Texto secundario>Estoque de {atualizacao}, ligue antes de ir.</Texto>
          <Texto>{TEXTO_RETIRADA[produto.retirada]}</Texto>
          {listaOficial ? (
            <Botao
              titulo="Ver a lista oficial"
              icone="open-outline"
              variante="secundario"
              dica="Abre o site da Secretaria de Saúde do DF"
              onPress={() => Linking.openURL(listaOficial)}
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
        <View style={estilos.par}>
          {telefone ? (
            <Botao
              titulo="Ligar"
              icone="call"
              variante="tonal"
              detalhe={numero?.exibir}
              dica={`Liga para ${telefoneFalado}`}
              onPress={() => Linking.openURL(telefone)}
            />
          ) : null}
          <Botao
            titulo="WhatsApp"
            rotulo="Enviar no WhatsApp"
            icone="logo-whatsapp"
            variante="tonal"
            detalhe="Mandar o endereço"
            dica="Abre o WhatsApp com o endereço e o horário deste posto"
            onPress={() => enviar(textoCompartilhar({ ubs, remedio, atualizacao }))}
          />
        </View>
      </View>

      <Cartao>
        <Texto variante="subtitulo">Horário</Texto>
        <Semana horario={ubs.horario} />
        <Texto>{ubs.horario ? capitalizarPrimeira(ubs.horario) : "Horário não informado."}</Texto>
        <Texto variante="legenda" secundario>
          Em feriados o horário pode mudar.
        </Texto>
      </Cartao>

      <Cartao>
        <Texto variante="subtitulo">Endereço</Texto>
        <Texto selectable>{ubs.endereco}</Texto>
        <Texto secundario>
          {ubs.ra}
          {ubs.cep ? ` · CEP ${formatarCep(ubs.cep)}` : ""}
        </Texto>
      </Cartao>

      <Cartao>
        <Texto variante="subtitulo">Telefone</Texto>
        <Texto selectable accessibilityLabel={telefoneFalado}>
          {numero?.exibir ??
            (ubs.telefone
              ? "O telefone que a SES-DF informou para este posto está com erro."
              : "A SES-DF não informou o telefone deste posto.")}
        </Texto>
      </Cartao>

      <Cartao>
        <Texto variante="subtitulo">O que levar</Texto>
        {[...DOCUMENTOS_UBS, ...(produto?.retirada === "controlado" ? ["Receita de controle especial em 2 vias (não aceitam xerox)"] : [])].map(
          (doc) => (
            <ItemLevar key={doc} texto={doc} />
          ),
        )}
      </Cartao>

      <EscolherMapa ubs={escolhendoMapa ? ubs : null} aoFechar={() => setEscolhendoMapa(false)} />
    </>
  );
}

const LETRA_DIA = ["D", "S", "T", "Q", "Q", "S", "S"];
const NOME_DIA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

/**
 * A semana em sete quadradinhos: os dias em que o posto abre, hoje em azul, os fechados riscados.
 * Só quando o horário do cadastro dá para entender; o texto completo vem embaixo.
 */
function Semana({ horario, agora = new Date() }: { horario: string | null; agora?: Date }) {
  const { cores } = useTema();
  const faixas = interpretarHorario(horario);
  if (!faixas) return null;
  const abertos = new Set(faixas.flatMap((f) => f.dias));
  const hoje = agora.getDay();
  return (
    <View
      style={estilos.semana}
      accessible
      accessibilityLabel={`Abre ${NOME_DIA.filter((_, d) => abertos.has(d)).join(", ")}. Hoje é ${NOME_DIA[hoje]}.`}
    >
      {LETRA_DIA.map((letra, d) => {
        const aberto = abertos.has(d);
        const ehHoje = d === hoje;
        return (
          <View
            key={d}
            style={[
              estilos.dia,
              ehHoje
                ? { backgroundColor: cores.primaria }
                : aberto
                  ? { backgroundColor: cores.superficie2, borderColor: cores.divisoria, borderWidth: 1 }
                  : null,
            ]}
          >
            <Texto
              variante="legenda"
              peso="negrito"
              cor={ehHoje ? cores.textoSobrePrimaria : aberto ? cores.texto : cores.textoSecundario}
              style={!aberto ? estilos.fechado : null}
            >
              {letra}
            </Texto>
          </View>
        );
      })}
    </View>
  );
}

function ItemLevar({ texto }: { texto: string }) {
  const { cores } = useTema();
  return (
    <View style={estilos.linha}>
      <Icone name="checkmark-circle-outline" size={22} color={cores.primaria} />
      <Texto style={estilos.flex}>{texto}</Texto>
    </View>
  );
}

function capitalizarPrimeira(texto: string): string {
  return texto.charAt(0).toLocaleUpperCase("pt-BR") + texto.slice(1);
}

const estilos = StyleSheet.create({
  cabecalho: { gap: espaco.xs },
  linha: { flexDirection: "row", alignItems: "center", gap: espaco.sm },
  flex: { flex: 1 },
  botoes: { gap: espaco.sm },
  par: { flexDirection: "row", gap: espaco.sm },
  semana: { flexDirection: "row", gap: espaco.xs },
  dia: { flex: 1, minHeight: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  fechado: { textDecorationLine: "line-through" },
});
