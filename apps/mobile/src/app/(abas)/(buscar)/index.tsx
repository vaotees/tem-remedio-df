import Ionicons from "@expo/vector-icons/Ionicons";
import type { Snapshot } from "@tem-remedio/shared";
import { useRouter } from "expo-router";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Cartao } from "@/componentes/Cartao";
import { ComDados } from "@/componentes/ComDados";
import { FaixaAtualizacao } from "@/componentes/FaixaAtualizacao";
import { ItemLista } from "@/componentes/ItemLista";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import { buscar, MINIMO_LETRAS, prepararBusca, type GrupoResultado } from "@/busca/buscar";
import { capitalizarNome, rotuloProduto } from "@/busca/remedios";
import { ALVO_MINIMO, espaco, fonte, raio, useTema } from "@/tema";

export default function Buscar() {
  const { cores } = useTema();
  const [busca, setBusca] = useState("");
  // A lista acompanha a digitação sem travar o teclado.
  const termo = useDeferredValue(busca);

  return (
    <Tela>
      <Texto variante="titulo">Qual remédio você procura?</Texto>

      <View style={[estilos.campo, { borderColor: cores.borda, backgroundColor: cores.fundo }]}>
        <Ionicons name="search" size={26} color={cores.textoSecundario} />
        <TextInput
          value={busca}
          onChangeText={setBusca}
          placeholder="Ex.: losartana ou Glifage"
          placeholderTextColor={cores.textoSecundario}
          accessibilityLabel="Nome do remédio"
          accessibilityHint="Pode ser o nome que está na caixa"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          style={[estilos.entrada, { color: cores.texto }]}
        />
        {busca ? (
          <Pressable
            onPress={() => setBusca("")}
            accessibilityRole="button"
            accessibilityLabel="Apagar o que foi escrito"
            style={estilos.limpar}
          >
            <Ionicons name="close-circle" size={28} color={cores.textoSecundario} />
          </Pressable>
        ) : null}
      </View>

      <ComDados>
        {(snapshot, { procurandoNovos }) => (
          <>
            <Resultados snapshot={snapshot} termo={termo} />
            <View style={estilos.rodape}>
              <FaixaAtualizacao atualizadoEm={snapshot.meta.atualizadoEm} procurandoNovos={procurandoNovos} />
            </View>
          </>
        )}
      </ComDados>
    </Tela>
  );
}

function Resultados({ snapshot, termo }: { snapshot: Snapshot; termo: string }) {
  const router = useRouter();
  const grupos = useMemo(() => buscar(snapshot, termo), [snapshot, termo]);
  useEffect(() => {
    // Depois de a tela aparecer: a primeira tecla já encontra o índice pronto.
    const t = setTimeout(() => prepararBusca(snapshot), 0);
    return () => clearTimeout(t);
  }, [snapshot]);

  if (termo.trim().length < MINIMO_LETRAS) {
    return (
      <Cartao>
        <Texto variante="destaque">Rede pública do DF</Texto>
        <Texto secundario>
          {snapshot.ubs.length} farmácias de UBS e {snapshot.produtos.length} remédios da atenção básica.
        </Texto>
        <Texto secundario>Escreva o nome do remédio ou o nome que está na caixa.</Texto>
      </Cartao>
    );
  }

  if (grupos.length === 0) {
    return (
      <Cartao>
        <Texto variante="destaque" accessibilityLiveRegion="polite">
          Não achei “{termo.trim()}”
        </Texto>
        <Texto secundario>
          Confira se está escrito certo ou tente o nome que vem na caixa. Aqui aparecem só os remédios entregues nas
          farmácias das UBSs do DF.
        </Texto>
      </Cartao>
    );
  }

  const abrir = (g: GrupoResultado) => {
    const codigo = snapshot.produtos[g.produtos[0]!]!.codigo;
    const marca = g.marca?.nome;
    // Só uma forma e dose: vai direto para os postos.
    if (g.produtos.length === 1) router.push({ pathname: "/postos/[codigo]", params: { codigo, marca } });
    else router.push({ pathname: "/remedio/[codigo]", params: { codigo, marca } });
  };

  return (
    <View style={estilos.lista}>
      <Texto secundario accessibilityLiveRegion="polite">
        {grupos.length === 1 ? "1 remédio encontrado" : `${grupos.length} remédios encontrados`}
      </Texto>
      {grupos.map((g) => {
        const rotulos = g.produtos.map((i) => rotuloProduto(snapshot.produtos[i]!));
        const opcoes =
          rotulos.length === 1 ? rotulos[0]! : `${rotulos.length} opções: ${resumir(rotulos)}`;
        const marca = g.marca ? `Mesma substância de ${capitalizarNome(g.marca.nome)}` : null;
        return (
          <ItemLista
            key={g.chave}
            onPress={() => abrir(g)}
            rotulo={[g.nome, marca, opcoes].filter(Boolean).join(". ")}
            dica="Mostra os postos que têm"
          >
            <Texto variante="destaque">{g.nome}</Texto>
            {marca ? <Texto>{marca}</Texto> : null}
            <Texto secundario>{opcoes}</Texto>
          </ItemLista>
        );
      })}
    </View>
  );
}

/** "Comprimido 5 mg, Comprimido 10 mg e mais 2" */
function resumir(rotulos: string[]): string {
  const unicos = [...new Set(rotulos)];
  const primeiros = unicos.slice(0, 3).join(", ");
  return unicos.length > 3 ? `${primeiros} e mais ${unicos.length - 3}` : primeiros;
}

const estilos = StyleSheet.create({
  campo: {
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.sm,
    minHeight: ALVO_MINIMO + 8,
    borderWidth: 2,
    borderRadius: raio,
    paddingLeft: espaco.md,
    paddingRight: espaco.xs,
  },
  entrada: { flex: 1, fontSize: fonte.destaque, paddingVertical: espaco.sm },
  limpar: { minWidth: ALVO_MINIMO, minHeight: ALVO_MINIMO, alignItems: "center", justifyContent: "center" },
  lista: { gap: espaco.sm },
  rodape: { marginTop: "auto" },
});
