import type { Snapshot } from "@tem-remedio/shared";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { AvisoLiberacao } from "@/componentes/AvisoLiberacao";
import { ComDados } from "@/componentes/ComDados";
import { ItemLista } from "@/componentes/ItemLista";
import { NaoEncontrado } from "@/componentes/NaoEncontrado";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import { Voltar } from "@/componentes/Voltar";
import {
  acharMarca,
  chaveSubstancia,
  indiceProduto,
  nomeSubstancia,
  produtosDaSubstancia,
  rotuloProduto,
} from "@/busca/remedios";
import { postosComEstoque } from "@/postos/postos";
import { espaco, useTema } from "@/tema";

/** "Qual destes?": a substância tem mais de uma forma ou dose. */
export default function QualDestes() {
  const { codigo, marca } = useLocalSearchParams<{ codigo: string; marca?: string }>();
  return (
    <Tela>
      <Voltar />
      <ComDados>{(snapshot) => <Opcoes snapshot={snapshot} codigo={codigo} nomeMarca={marca} />}</ComDados>
    </Tela>
  );
}

function Opcoes({ snapshot, codigo, nomeMarca }: { snapshot: Snapshot; codigo: string; nomeMarca?: string }) {
  const router = useRouter();
  const { cores } = useTema();
  const iBase = indiceProduto(snapshot, codigo);
  const base = snapshot.produtos[iBase];

  const opcoes = useMemo(() => {
    if (!base) return [];
    const indices = produtosDaSubstancia(snapshot, chaveSubstancia(base.substancia));
    const rotulos = indices.map((i) => rotuloProduto(snapshot.produtos[i]!));
    return indices.map((i, n) => ({
      i,
      produto: snapshot.produtos[i]!,
      rotulo: rotulos[n]!,
      // "Comprimido 5 mg" repetido (ex.: prednisona comum e para hanseníase): mostra a descrição da SES-DF.
      repetido: rotulos.filter((r) => r === rotulos[n]).length > 1,
      postos: postosComEstoque(snapshot, i, { por: "nome" }).length,
    }));
  }, [snapshot, base]);

  if (!base) return <NaoEncontrado oQue="remédio" />;

  const marca = acharMarca(snapshot, nomeMarca);
  const naoProlongados = marca?.liberacaoProlongada ? opcoes.filter((o) => !o.produto.liberacaoProlongada).length : 0;
  const nome = nomeSubstancia(opcoes.map((o) => o.produto));

  return (
    <>
      <View>
        <Texto variante="titulo">Qual destes?</Texto>
        <Texto variante="subtitulo">{nome}</Texto>
      </View>
      <Texto secundario>Confira na receita ou na caixa a forma e a dose.</Texto>

      {marca && naoProlongados > 0 ? (
        <AvisoLiberacao marca={marca} quais={naoProlongados === opcoes.length ? "todos" : "alguns"} />
      ) : null}

      <View style={estilos.lista}>
        {opcoes.map((o) => {
          const prolongada = o.produto.liberacaoProlongada ? "Liberação prolongada" : null;
          const onde = o.postos === 0 ? "Nenhum posto tem hoje" : o.postos === 1 ? "Em 1 posto hoje" : `Em ${o.postos} postos hoje`;
          return (
            <ItemLista
              key={o.produto.codigo}
              onPress={() =>
                router.push({ pathname: "/postos/[codigo]", params: { codigo: o.produto.codigo, marca: nomeMarca } })
              }
              rotulo={[o.rotulo, prolongada, o.repetido && o.produto.descricao, onde].filter(Boolean).join(". ")}
            >
              <Texto variante="destaque">{o.rotulo}</Texto>
              {prolongada ? <Texto cor={cores.primaria}>{prolongada}</Texto> : null}
              {o.repetido ? <Texto variante="legenda" secundario>{o.produto.descricao}</Texto> : null}
              <Texto secundario>{onde}</Texto>
            </ItemLista>
          );
        })}
      </View>
    </>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: espaco.sm },
});
