import { DOCUMENTOS_UBS, nivelEstoque, normalizarTelefone, TEXTO_RETIRADA, type Snapshot } from "@tem-remedio/shared";
import { useLocalSearchParams } from "expo-router";
import { useState, type ReactNode } from "react";
import { Animated, Linking, Platform, Pressable, Share, StyleSheet, View } from "react-native";
import { Botao } from "@/componentes/Botao";
import { Cartao } from "@/componentes/Cartao";
import { ComDados } from "@/componentes/ComDados";
import { EscolherMapa } from "@/componentes/EscolherMapa";
import { MedidorArco } from "@/componentes/Graficos";
import { Icone, type NomeIcone } from "@/componentes/Icone";
import { MapaPosto } from "@/componentes/MapaPosto";
import { Surgir, useToque } from "@/componentes/Movimento";
import { NaoEncontrado } from "@/componentes/NaoEncontrado";
import { Pictograma } from "@/componentes/Pictograma";
import { SeloEstoque } from "@/componentes/SeloEstoque";
import { SeloHorario } from "@/componentes/SeloHorario";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import { Voltar } from "@/componentes/Voltar";
import { useSnapshot } from "@/dados/useSnapshot";
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
import { ALVO_MINIMO, espaco, RAIO_CARTAO, sombraCartao, useTema } from "@/tema";
import { formatarAtualizacao } from "@/util/datas";

/** Detalhe do posto: onde fica, quando abre, como chegar, ligar e mandar para alguém. */
export default function DetalhePosto() {
  const { cnes, farmacia, produto } = useLocalSearchParams<{ cnes: string; farmacia?: string; produto?: string }>();
  const { snapshot } = useSnapshot();
  // A faixa mostra o posto: enquanto os dados carregam, só o Voltar e o "carregando".
  if (!snapshot)
    return (
      <Tela topo={<Voltar sobreFaixa />}>
        <ComDados>{() => null}</ComDados>
      </Tela>
    );
  return <Detalhe snapshot={snapshot} cnes={cnes} farmacia={farmacia} codigoProduto={produto} />;
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
  const { cores } = useTema();
  const [escolhendoMapa, setEscolhendoMapa] = useState(false);
  const ubs = acharUbs(snapshot, cnes, farmacia);
  if (!ubs)
    return (
      <Tela topo={<Voltar sobreFaixa />}>
        <NaoEncontrado oQue="posto" />
      </Tela>
    );

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
    <Tela
      cartaoPorCima
      topo={<Voltar sobreFaixa />}
      faixa={
        <View style={estilos.cabecalho}>
          <Texto variante="titulo" cor={cores.textoFaixa}>
            {nome}
          </Texto>
          <Texto peso="medio" cor={cores.textoFaixaSecundario}>
            {ubs.ra}
          </Texto>
          {temOutraFarmacia(snapshot, ubs) ? (
            <Texto variante="legenda" cor={cores.textoFaixaSecundario}>
              {ubs.farmacia}
            </Texto>
          ) : null}
          <SeloHorario horario={ubs.horario} sobreFaixa />
        </View>
      }
    >
      {/* As três ações num cartão que sobe por cima da faixa: o que se faz com um posto, logo de cara. */}
      <Surgir>
        <View style={[estilos.acoes, { backgroundColor: cores.superficie }, sombraCartao(cores)]}>
          <AcaoRedonda
            titulo="Como chegar"
            icone="navigate"
            principal
            dica="Pergunta qual app de mapa você quer usar"
            onPress={() => setEscolhendoMapa(true)}
          />
          {telefone ? (
            <AcaoRedonda
              titulo="Ligar"
              icone="call"
              detalhe={numero?.exibir}
              dica={`Liga para ${telefoneFalado}`}
              onPress={() => Linking.openURL(telefone)}
            />
          ) : null}
          <AcaoRedonda
            titulo="WhatsApp"
            rotulo="Enviar no WhatsApp"
            icone="logo-whatsapp"
            detalhe="Mandar o endereço"
            dica="Abre o WhatsApp com o endereço e o horário deste posto"
            onPress={() => enviar(textoCompartilhar({ ubs, remedio, atualizacao }))}
          />
        </View>
      </Surgir>

      <MapaPosto ubs={ubs} nivel={estoque ? nivelEstoque(estoque.dias) : null} />

      {produto && remedio ? (
        <Surgir ordem={1}>
          <Cartao style={estilos.cartaoRemedio}>
            <View style={estilos.linha}>
              <Pictograma forma={produto.forma} tamanho={44} />
              <Texto variante="destaque" style={estilos.flex}>
                {remedio}
              </Texto>
            </View>
            {estoque ? (
              <>
                {estoque.dias !== null ? <MedidorArco dias={estoque.dias} /> : null}
                <View style={estilos.centroSelo}>
                  <SeloEstoque dias={estoque.dias} />
                </View>
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
        </Surgir>
      ) : null}

      <Surgir ordem={2}>
        <CartaoInfo icone="time" titulo="Horário">
          <Semana horario={ubs.horario} />
          <Texto>{ubs.horario ? capitalizarPrimeira(ubs.horario) : "Horário não informado."}</Texto>
          <Texto variante="legenda" secundario>
            Em feriados o horário pode mudar.
          </Texto>
        </CartaoInfo>
      </Surgir>

      <Surgir ordem={3}>
        <CartaoInfo icone="location" titulo="Endereço">
          <Texto selectable>{ubs.endereco}</Texto>
          <Texto secundario>
            {ubs.ra}
            {ubs.cep ? ` · CEP ${formatarCep(ubs.cep)}` : ""}
          </Texto>
        </CartaoInfo>
      </Surgir>

      <Surgir ordem={4}>
        <CartaoInfo icone="call" titulo="Telefone">
          <Texto selectable accessibilityLabel={telefoneFalado}>
            {numero?.exibir ??
              (ubs.telefone
                ? "O telefone que a SES-DF informou para este posto está com erro."
                : "A SES-DF não informou o telefone deste posto.")}
          </Texto>
        </CartaoInfo>
      </Surgir>

      <Surgir ordem={5}>
        <CartaoInfo icone="document-text" titulo="O que levar">
          {[...DOCUMENTOS_UBS, ...(produto?.retirada === "controlado" ? ["Receita de controle especial em 2 vias (não aceitam xerox)"] : [])].map(
            (doc) => (
              <ItemLevar key={doc} texto={doc} />
            ),
          )}
        </CartaoInfo>
      </Surgir>

      <EscolherMapa ubs={escolhendoMapa ? ubs : null} aoFechar={() => setEscolhendoMapa(false)} />
    </Tela>
  );
}

interface PropsAcao {
  titulo: string;
  icone: NomeIcone;
  onPress: () => void;
  dica?: string;
  rotulo?: string;
  /** Linha pequena embaixo (o número do telefone, por exemplo). */
  detalhe?: string;
  /** A ação principal: círculo cheio azul. As outras, azul-claro. */
  principal?: boolean;
}

/** Ação do posto: um círculo grande com o ícone e o nome embaixo, como os atalhos do telefone. */
function AcaoRedonda({ titulo, icone, onPress, dica, rotulo, detalhe, principal }: PropsAcao) {
  const { cores } = useTema();
  const toque = useToque(0.92);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={toque.aoEncostar}
      onPressOut={toque.aoSoltar}
      accessibilityRole="button"
      accessibilityLabel={rotulo ?? titulo}
      accessibilityHint={dica}
      style={estilos.acao}
    >
      <Animated.View
        style={[estilos.circuloAcao, { backgroundColor: principal ? cores.primaria : cores.primariaTinta }, toque.estilo]}
      >
        <Icone name={icone} size={28} color={principal ? cores.textoSobrePrimaria : cores.textoTonal} />
      </Animated.View>
      <Texto variante="legenda" peso="negrito" cor={cores.texto} style={estilos.centro}>
        {titulo}
      </Texto>
      {detalhe ? (
        <Texto variante="legenda" tamanho={13} secundario style={estilos.centro}>
          {detalhe}
        </Texto>
      ) : null}
    </Pressable>
  );
}

/** Cartão de informação com o ícone no alto, ao lado do título. */
function CartaoInfo({ icone, titulo, children }: { icone: NomeIcone; titulo: string; children: ReactNode }) {
  const { cores } = useTema();
  return (
    <Cartao>
      <View style={estilos.linha}>
        <View style={[estilos.iconeInfo, { backgroundColor: cores.primariaTinta }]}>
          <Icone name={icone} size={20} color={cores.textoTonal} />
        </View>
        <Texto variante="subtitulo" style={estilos.flex}>
          {titulo}
        </Texto>
      </View>
      {children}
    </Cartao>
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
  cabecalho: { gap: espaco.xs, marginTop: espaco.xs },
  acoes: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start",
    gap: espaco.sm,
    borderRadius: RAIO_CARTAO,
    paddingVertical: espaco.md,
    paddingHorizontal: espaco.sm,
  },
  acao: { flex: 1, alignItems: "center", gap: 6, minHeight: ALVO_MINIMO },
  circuloAcao: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  centro: { textAlign: "center" },
  cartaoRemedio: { gap: espaco.md },
  centroSelo: { flexDirection: "row", justifyContent: "center" },
  iconeInfo: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  linha: { flexDirection: "row", alignItems: "center", gap: espaco.sm },
  flex: { flex: 1 },
  semana: { flexDirection: "row", gap: espaco.xs },
  dia: { flex: 1, minHeight: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  fechado: { textDecorationLine: "line-through" },
});
