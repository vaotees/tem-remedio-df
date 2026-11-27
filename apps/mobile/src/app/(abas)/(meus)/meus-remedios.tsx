import type { Snapshot } from "@tem-remedio/shared";
import { useRouter } from "expo-router";
import { useMemo, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Botao } from "@/componentes/Botao";
import { Cartao } from "@/componentes/Cartao";
import { ComDados } from "@/componentes/ComDados";
import { BotaoVidro, TituloFaixa } from "@/componentes/Faixa";
import { FaixaAtualizacao } from "@/componentes/FaixaAtualizacao";
import { Anel, BarraRede } from "@/componentes/Graficos";
import { Icone, type NomeIcone } from "@/componentes/Icone";
import { ItemLista } from "@/componentes/ItemLista";
import { NumeroAnimado, Surgir } from "@/componentes/Movimento";
import { PerguntarOrigem, ProcurandoLocalizacao, SituacaoOrigem } from "@/componentes/OrigemPostos";
import { Pictograma } from "@/componentes/Pictograma";
import { SeloEstoque } from "@/componentes/SeloEstoque";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import { acharMarca, capitalizarNome, nomeSubstancia, precisaAvisoLiberacao, rotuloProduto } from "@/busca/remedios";
import { useMeusRemedios, type RemedioGuardado } from "@/meus-remedios/guardados";
import { situacaoHoje, textoQuantos, tituloPrimeiro, type SituacaoHoje } from "@/meus-remedios/situacao";
import { descreverPosto } from "@/postos/descricao";
import { useOrigem } from "@/postos/origem";
import { avisoRetirada, type Ordem } from "@/postos/postos";
import { espaco, useTema } from "@/tema";

/** Os remédios que a pessoa guardou, com a situação de hoje de cada um. A lista fica só no aparelho. */
export default function MeusRemedios() {
  const router = useRouter();
  const { carregando, remedios } = useMeusRemedios();
  const temLista = !carregando && remedios.length > 0;

  return (
    <Tela
      cartaoPorCima={temLista}
      faixa={
        <View style={estilos.cabecalho}>
          <View style={estilos.flex}>
            <TituloFaixa titulo="Meus remédios" subtitulo="A situação de hoje, num toque" />
          </View>
          {remedios.length > 0 ? (
            <BotaoVidro
              titulo="Adicionar"
              rotulo="Adicionar remédio"
              dica="Vai para a busca"
              icone="add"
              onPress={() => router.navigate("/")}
            />
          ) : null}
        </View>
      }
    >
      {carregando ? null : remedios.length === 0 ? (
        <Convite />
      ) : (
        <ComDados>
          {(snapshot, { procurandoNovos }) => (
            <Lista snapshot={snapshot} remedios={remedios} procurandoNovos={procurandoNovos} />
          )}
        </ComDados>
      )}
    </Tela>
  );
}

/** Lista vazia: o convite para começar. */
function Convite() {
  const { cores } = useTema();
  const router = useRouter();
  return (
    <View style={estilos.vazio}>
      <View style={[estilos.circulo, { backgroundColor: cores.primariaTinta }]}>
        <Icone name="heart" size={48} color={cores.textoTonal} />
      </View>
      <Texto variante="subtitulo" style={estilos.centro}>
        Guarde os remédios que você usa
      </Texto>
      <Texto secundario style={estilos.centro}>
        Assim, com um toque, você vê em quais postos perto de você eles estão disponíveis.
      </Texto>
      <Texto secundario style={estilos.centro}>
        Busque o remédio e, na tela dos postos, toque em “Guardar em Meus remédios”.
      </Texto>
      <Texto variante="legenda" secundario style={estilos.centro}>
        Sua lista fica só neste celular.
      </Texto>
      <Botao titulo="Buscar um remédio" icone="search" onPress={() => router.navigate("/")} />
    </View>
  );
}

interface PropsLista {
  snapshot: Snapshot;
  remedios: RemedioGuardado[];
  procurandoNovos: boolean;
}

/**
 * Cada remédio com quantos postos têm hoje e o primeiro deles pela origem atual (GPS ou região).
 * Como na lista de postos, a aba nunca pede a localização sozinha: na primeira vez, pergunta antes.
 */
function Lista({ snapshot, remedios, procurandoNovos }: PropsLista) {
  const router = useRouter();
  const origem = useOrigem(snapshot);
  // Enquanto o GPS não responde, só a contagem: o "mais perto" não pula de um posto para outro.
  const { carregando, ordem: ordemOrigem } = origem;
  const ordem = useMemo<Ordem>(() => (carregando ? { por: "nome" } : ordemOrigem), [carregando, ordemOrigem]);
  const situacoes = useMemo(
    () => remedios.map((remedio) => ({ remedio, hoje: situacaoHoje(snapshot, remedio.codigo, ordem) })),
    [snapshot, remedios, ordem],
  );
  const escolherRegiao = () => router.push("/regiao");

  return (
    <>
      <Surgir>
        <Resumo tem={situacoes.filter((x) => x.hoje.tipo === "tem").length} total={situacoes.length}>
          <FaixaAtualizacao atualizadoEm={snapshot.meta.atualizadoEm} procurandoNovos={procurandoNovos} />
        </Resumo>
      </Surgir>

      {origem.carregando ? (
        <ProcurandoLocalizacao />
      ) : origem.perguntar ? (
        <PerguntarOrigem procurando={origem.procurando} usarLocalizacao={origem.usarLocalizacao} escolherRegiao={escolherRegiao} />
      ) : (
        <SituacaoOrigem origem={origem} escolherRegiao={escolherRegiao} resumida />
      )}

      <View style={estilos.listaRemedios}>
        {situacoes.map(({ remedio, hoje }, i) => (
          <Surgir key={remedio.codigo} ordem={i + 1}>
            {hoje.tipo === "fora_dos_dados" ? (
              <ForaDosDados remedio={remedio} />
            ) : (
              <ItemRemedio
                snapshot={snapshot}
                remedio={remedio}
                hoje={hoje}
                ordem={ordem}
                onPress={() =>
                  router.push({
                    pathname: "/postos/[codigo]",
                    params: { codigo: remedio.codigo, marca: remedio.marca ?? undefined },
                  })
                }
              />
            )}
          </Surgir>
        ))}
      </View>

      <Texto variante="legenda" secundario>
        Sua lista fica só neste celular: não vai para a internet.
      </Texto>
      <Botao titulo="Buscar outro remédio" icone="search" variante="secundario" onPress={() => router.navigate("/")} />
    </>
  );
}

interface PropsItem {
  snapshot: Snapshot;
  remedio: RemedioGuardado;
  hoje: Exclude<SituacaoHoje, { tipo: "fora_dos_dados" }>;
  ordem: Ordem;
  onPress: () => void;
}

function ItemRemedio({ snapshot, remedio, hoje, ordem, onPress }: PropsItem) {
  const { cores } = useTema();
  const { produto } = hoje;
  const nome = nomeSubstancia([produto]);
  const apresentacao = `${rotuloProduto(produto)}${produto.liberacaoProlongada ? " · liberação prolongada" : ""}`;
  const marca = acharMarca(snapshot, remedio.marca ?? undefined);
  const mesmaSubstancia = marca ? `Mesma substância de ${capitalizarNome(marca.nome)}` : null;
  // Mesma substância ≠ mesmo remédio: lembra aqui também, não só na tela de postos.
  const liberacao =
    marca && precisaAvisoLiberacao(marca, produto)
      ? `${capitalizarNome(marca.nome)} é de liberação prolongada; este não é. Confirme com seu médico ou farmacêutico.`
      : null;
  const quantos = textoQuantos(hoje.tipo === "tem" ? hoje.postos : 0);
  const primeiro = hoje.tipo === "tem" ? hoje.primeiro : null;
  const titulo = primeiro ? tituloPrimeiro(ordem, primeiro) : null;
  const posto = primeiro && titulo ? descreverPosto(primeiro) : null;
  const retirada = avisoRetirada(produto);

  const rotulo = [
    nome,
    apresentacao,
    mesmaSubstancia,
    liberacao,
    quantos,
    posto && `${titulo}: ${posto.rotulo}`,
    retirada?.titulo,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <ItemLista onPress={onPress} rotulo={rotulo} dica="Mostra os postos que têm hoje" semSeta>
      <View style={estilos.topoRemedio}>
        <Pictograma forma={produto.forma} />
        <View style={estilos.flex}>
          <Texto variante="destaque">{nome}</Texto>
          <Texto secundario>{apresentacao}</Texto>
        </View>
      </View>
      {mesmaSubstancia ? <Texto>{mesmaSubstancia}</Texto> : null}
      {liberacao ? (
        <Linha icone="warning" cor={cores.aviso.texto}>
          {liberacao}
        </Linha>
      ) : null}
      <Linha icone={primeiro ? "medkit-outline" : "close-circle-outline"}>{quantos}</Linha>
      {hoje.tipo === "tem" ? <BarraRede contagem={hoje.niveis} compacta /> : null}
      {primeiro && posto ? (
        <View style={[estilos.primeiro, { backgroundColor: cores.superficie2 }]}>
          <Texto variante="legenda" secundario>
            {titulo}:
          </Texto>
          <Texto variante="destaque">{posto.nome}</Texto>
          <Texto secundario>{posto.onde}</Texto>
          <SeloEstoque dias={primeiro.dias} />
        </View>
      ) : null}
      {retirada ? <Linha icone="information-circle-outline">{retirada.titulo}</Linha> : null}
      {hoje.tipo === "tem" ? (
        <View style={estilos.ver}>
          <Texto variante="destaque" cor={cores.primaria} style={estilos.flex}>
            {hoje.postos === 1 ? "Ver o posto" : `Ver os ${hoje.postos} postos`}
          </Texto>
          <Icone name="chevron-forward" size={24} color={cores.primaria} />
        </View>
      ) : null}
    </ItemLista>
  );
}

/**
 * A pergunta de toda manhã, respondida no alto, num cartão que sobe por cima da faixa: os meus remédios
 * têm hoje? O anel enche com a parte que tem.
 */
function Resumo({ tem, total, children }: { tem: number; total: number; children?: ReactNode }) {
  const { cores } = useTema();
  const todos = tem === total;
  const par = todos ? cores.semaforo.alto : cores.aviso;
  const texto = todos
    ? total === 1
      ? "Seu remédio tem em algum posto hoje"
      : `Os ${total} remédios têm em algum posto hoje`
    : tem === 0
      ? total === 1
        ? "Seu remédio não tem em nenhum posto hoje"
        : "Nenhum dos seus remédios tem hoje"
      : `${tem} de ${total} remédios têm em algum posto hoje`;
  return (
    <Cartao style={estilos.resumo}>
      <View style={estilos.linhaResumo} accessible accessibilityLabel={texto}>
        <Anel parte={total ? tem / total : 0} tamanho={92} espessura={10} cor={cores.primaria} trilho={cores.trilho}>
          <View style={estilos.fracao}>
            <NumeroAnimado valor={tem} peso="numero" tamanho={28} cor={cores.texto} />
            <Texto variante="legenda" peso="negrito" secundario>
              /{total}
            </Texto>
          </View>
        </Anel>
        <View style={estilos.flex}>
          <View style={[estilos.situacao, { backgroundColor: par.fundo }]}>
            <Icone name={todos ? "checkmark-circle" : "alert-circle"} size={20} color={par.texto} />
            <Texto variante="legenda" peso="negrito" cor={par.texto} style={estilos.flexTexto}>
              {todos ? "Tudo certo hoje" : tem === 0 ? "Nenhum tem hoje" : "Falta algum hoje"}
            </Texto>
          </View>
          <Texto variante="destaque">{texto}</Texto>
        </View>
      </View>
      {children}
    </Cartao>
  );
}

/** O código não aparece nos dados de hoje: o app não apaga sozinho, a pessoa decide. */
function ForaDosDados({ remedio }: { remedio: RemedioGuardado }) {
  const { tirar } = useMeusRemedios();
  return (
    <Cartao>
      <Texto variante="destaque">{remedio.nome}</Texto>
      <Texto secundario>{remedio.apresentacao}</Texto>
      <Linha icone="help-circle-outline">Não aparece nos dados de hoje</Linha>
      <Texto secundario>Se ele voltar para a lista da SES-DF, aparece aqui de novo.</Texto>
      <Botao
        titulo="Tirar de Meus remédios"
        icone="trash-outline"
        variante="secundario"
        onPress={() => void tirar(remedio.codigo)}
      />
    </Cartao>
  );
}

function Linha({ icone, cor, children }: { icone: NomeIcone; cor?: string; children: ReactNode }) {
  const { cores } = useTema();
  return (
    <View style={estilos.linha}>
      <Icone name={icone} size={22} color={cor ?? cores.textoSecundario} />
      <Texto style={estilos.flex}>{children}</Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  cabecalho: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: espaco.sm, marginTop: espaco.sm },
  resumo: { gap: espaco.md, padding: espaco.md + 4 },
  linhaResumo: { flexDirection: "row", alignItems: "center", gap: espaco.md },
  fracao: { flexDirection: "row", alignItems: "baseline" },
  situacao: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: espaco.sm + 2,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: espaco.xs,
    maxWidth: "100%",
  },
  flexTexto: { flexShrink: 1 },
  circulo: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center" },
  listaRemedios: { gap: espaco.md },
  topoRemedio: { flexDirection: "row", alignItems: "center", gap: espaco.md },
  ver: { flexDirection: "row", alignItems: "center", gap: espaco.xs },
  vazio: { flex: 1, alignItems: "center", justifyContent: "center", gap: espaco.md, paddingVertical: espaco.xl },
  centro: { textAlign: "center" },
  lista: { gap: espaco.sm },
  linha: { flexDirection: "row", alignItems: "flex-start", gap: espaco.sm },
  flex: { flex: 1 },
  primeiro: { gap: espaco.xs, borderRadius: 14, padding: espaco.sm + 4 },
});
