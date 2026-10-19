import { DOCUMENTOS_UBS, LIMITES_DIAS } from "@tem-remedio/shared";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Botao } from "@/componentes/Botao";
import { Cartao } from "@/componentes/Cartao";
import { ComDados } from "@/componentes/ComDados";
import { FaixaAtualizacao } from "@/componentes/FaixaAtualizacao";
import { SeloEstoque } from "@/componentes/SeloEstoque";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import type { Origem } from "@/dados/snapshot";
import { useLocalizacao } from "@/postos/localizacao";
import { useRegiaoEscolhida } from "@/postos/regiao-escolhida";
import { espaco } from "@/tema";

const TEXTO_ORIGEM: Record<Origem, string> = {
  rede: "Dados baixados agora.",
  cache: "Dados guardados neste celular.",
  embutido: "Dados que vieram com o app.",
};

const PASSOS = [
  "Escreva o nome do remédio ou o nome que está na caixa.",
  "Se houver mais de uma dose, escolha a da sua receita.",
  "Veja os postos que têm o remédio hoje, do mais perto para o mais longe, na lista ou no mapa.",
  "Toque no posto para ver o endereço, saber como chegar, ligar ou enviar no WhatsApp.",
];

const NIVEIS = [
  { dias: LIMITES_DIAS.baixo, explicacao: `Dá para ${LIMITES_DIAS.baixo} dias ou mais.` },
  { dias: LIMITES_DIAS.critico, explicacao: `Dá para ${LIMITES_DIAS.critico} a ${LIMITES_DIAS.baixo - 1} dias.` },
  { dias: 0, explicacao: `Dá para menos de ${LIMITES_DIAS.critico} dias.` },
  { dias: null, explicacao: "A UBS tem, mas não dá para saber por quanto tempo." },
];

export default function Ajuda() {
  return (
    <Tela>
      <Texto variante="titulo">Ajuda</Texto>

      <Cartao>
        <Texto variante="subtitulo">Como usar</Texto>
        {PASSOS.map((passo, n) => (
          <Texto key={passo}>
            {n + 1}. {passo}
          </Texto>
        ))}
      </Cartao>

      <Cartao>
        <Texto variante="subtitulo">De onde vêm os dados</Texto>
        <Texto>
          Do estoque das farmácias das UBSs, publicado pela Secretaria de Saúde do DF no InfoSaúde.
        </Texto>
        <Texto secundario>Sem internet, o app mostra os últimos dados guardados no celular.</Texto>
        <ComDados>
          {(snapshot, { origem, procurandoNovos, temRede, procurarNovos }) => (
            <>
              <FaixaAtualizacao atualizadoEm={snapshot.meta.atualizadoEm} procurandoNovos={procurandoNovos} />
              <Texto secundario>
                {snapshot.ubs.length} postos · {snapshot.produtos.length} remédios · {origem && TEXTO_ORIGEM[origem]}
              </Texto>
              {temRede && (
                <Botao
                  titulo="Procurar dados novos"
                  icone="refresh"
                  variante="secundario"
                  carregando={procurandoNovos}
                  onPress={procurarNovos}
                />
              )}
            </>
          )}
        </ComDados>
      </Cartao>

      <PostosPerto />

      <MeusRemediosAjuda />

      <Cartao>
        <Texto variante="subtitulo">Como ler o estoque</Texto>
        <Texto secundario>Contamos pelo quanto a própria UBS costuma entregar por mês.</Texto>
        {NIVEIS.map(({ dias, explicacao }) => (
          <View key={String(dias)} style={estilos.nivel}>
            <SeloEstoque dias={dias} />
            <Texto>{explicacao}</Texto>
          </View>
        ))}
      </Cartao>

      <Cartao>
        <Texto variante="subtitulo">O que levar na UBS</Texto>
        {DOCUMENTOS_UBS.map((doc) => (
          <Texto key={doc}>• {doc}</Texto>
        ))}
        <Texto secundario>Remédio controlado precisa da receita especial em 2 vias. Não aceitam xerox.</Texto>
      </Cartao>

      <Cartao>
        <Texto variante="subtitulo">Importante</Texto>
        <Texto>O estoque muda durante o dia. Ligue para a UBS antes de ir.</Texto>
        <Texto>Alguns remédios só são entregues em certas UBSs, como os controlados. Quando é assim, o app avisa na tela do remédio.</Texto>
        <Texto>Este app não substitui a orientação do seu médico ou farmacêutico.</Texto>
      </Cartao>
    </Tela>
  );
}

/** Como o app escolhe os postos "perto": pela localização ou pela região, e o botão para trocar. */
function PostosPerto() {
  const router = useRouter();
  const { ra, usarRegiao, preferirLocalizacao } = useRegiaoEscolhida();
  const { pedirLocalizacao, procurando } = useLocalizacao({ ativa: false });

  return (
    <Cartao>
      <Texto variante="subtitulo">Postos perto de você</Texto>
      {usarRegiao ? (
        <>
          <Texto>Sua região: {ra}.</Texto>
          <Texto secundario>Os postos dela aparecem primeiro, depois os das regiões mais perto.</Texto>
        </>
      ) : (
        <Texto>
          Os postos aparecem do mais perto para o mais longe, pela localização do celular.
          {ra ? ` Sem ela, primeiro os da sua região (${ra}).` : " Sem ela, você pode escolher a sua região."}
        </Texto>
      )}
      <Botao
        titulo={ra ? "Trocar minha região" : "Escolher minha região"}
        icone="list"
        variante="secundario"
        onPress={() => router.push("/regiao")}
      />
      {usarRegiao ? (
        <Botao
          titulo="Usar minha localização"
          icone="navigate"
          variante="secundario"
          carregando={procurando}
          onPress={() => {
            preferirLocalizacao();
            pedirLocalizacao();
          }}
        />
      ) : null}
      <Texto variante="legenda" secundario>
        A localização e a região ficam só neste celular: não vão para a internet.
      </Texto>
    </Cartao>
  );
}

/** Como guardar, ver e tirar um remédio da lista, e que a lista não sai do celular. */
function MeusRemediosAjuda() {
  const router = useRouter();
  return (
    <Cartao>
      <Texto variante="subtitulo">Meus remédios</Texto>
      <Texto>Na tela dos postos de um remédio, toque em “Guardar em Meus remédios”.</Texto>
      <Texto>
        Na aba Meus remédios você vê, para cada um, em quantos postos ele está hoje e qual é o mais perto. Os três
        primeiros também aparecem na tela de busca.
      </Texto>
      <Texto>Para tirar um remédio da lista, abra ele e toque em “Guardado em Meus remédios”.</Texto>
      <Texto secundario>O app não avisa sozinho quando um remédio chega ao posto: abra a aba para conferir.</Texto>
      <Botao titulo="Abrir Meus remédios" icone="heart-outline" variante="secundario" onPress={() => router.navigate("/meus-remedios")} />
      <Texto variante="legenda" secundario>
        A lista fica só neste celular: não vai para a internet.
      </Texto>
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  nivel: { gap: espaco.xs, paddingVertical: espaco.xs },
});
