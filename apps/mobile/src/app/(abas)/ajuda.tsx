import { DOCUMENTOS_UBS, LIMITES_DIAS } from "@tem-remedio/shared";
import { StyleSheet, View } from "react-native";
import { Botao } from "@/componentes/Botao";
import { Cartao } from "@/componentes/Cartao";
import { ComDados } from "@/componentes/ComDados";
import { FaixaAtualizacao } from "@/componentes/FaixaAtualizacao";
import { SeloEstoque } from "@/componentes/SeloEstoque";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import type { Origem } from "@/dados/snapshot";
import { espaco } from "@/tema";

const TEXTO_ORIGEM: Record<Origem, string> = {
  rede: "Dados baixados agora.",
  cache: "Dados guardados neste celular.",
  embutido: "Dados que vieram com o app.",
};

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
        <Texto variante="subtitulo">De onde vêm os dados</Texto>
        <Texto>
          Do estoque das farmácias das UBSs, publicado pela Secretaria de Saúde do DF no InfoSaúde.
        </Texto>
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
        <Texto>Este app não substitui a orientação do seu médico ou farmacêutico.</Texto>
      </Cartao>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  nivel: { gap: espaco.xs, paddingVertical: espaco.xs },
});
