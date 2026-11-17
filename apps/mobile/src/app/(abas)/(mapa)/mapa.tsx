import type { Snapshot, Ubs } from "@tem-remedio/shared";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Botao } from "@/componentes/Botao";
import { ComDados } from "@/componentes/ComDados";
import { Icone } from "@/componentes/Icone";
import { ItemLista } from "@/componentes/ItemLista";
import { MAPA_REDE_DISPONIVEL, MapaRede } from "@/componentes/MapaRede";
import { SeloHorario } from "@/componentes/SeloHorario";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import { capitalizarNome } from "@/busca/remedios";
import { distanciaKm, formatarDistancia } from "@/postos/distancia";
import { useOrigem } from "@/postos/origem";
import { ehUnidadePrisional } from "@/postos/postos";
import { espaco, useTema } from "@/tema";

/** Na web (sem mapa), quantos postos aparecem na lista. */
const NA_LISTA = 10;

/** Aba Mapa: todas as farmácias de UBS, para achar a mais perto e ver se está aberta. */
export default function Mapa() {
  return (
    <Tela>
      <Texto variante="titulo">Mapa dos postos</Texto>
      <ComDados>{(snapshot) => <Conteudo snapshot={snapshot} />}</ComDados>
    </Tela>
  );
}

function Conteudo({ snapshot }: { snapshot: Snapshot }) {
  const router = useRouter();
  const { cores } = useTema();
  const origem = useOrigem(snapshot);
  // Unidades prisionais atendem só a população presa: fora do mapa, como da lista de postos.
  const postos = useMemo(() => snapshot.ubs.filter((u) => !ehUnidadePrisional(u)), [snapshot]);
  const coordenadas = origem.ordem.por === "distancia" ? origem.ordem.origem : null;
  const abrir = (u: Ubs) => router.push({ pathname: "/posto/[cnes]", params: { cnes: u.cnes, farmacia: u.farmacia } });

  return (
    <>
      <Texto secundario>
        As {postos.length} farmácias de UBS do DF. Para saber se um remédio tem hoje, busque pelo nome no Início.
      </Texto>

      {origem.perguntar || (origem.localizacao?.situacao === "sem_permissao" && origem.localizacao.podePedir && !origem.usarRegiao) ? (
        <Botao
          titulo="Mostrar os postos perto de mim"
          icone="navigate"
          variante="secundario"
          carregando={origem.procurando}
          dica="Usa a localização do celular, que fica só neste celular"
          onPress={origem.usarLocalizacao}
        />
      ) : null}

      {MAPA_REDE_DISPONIVEL ? (
        <MapaRede postos={postos} origem={coordenadas} aoAbrir={abrir} />
      ) : (
        <ListaSemMapa postos={postos} coordenadas={coordenadas} aoAbrir={abrir} corIcone={cores.textoSecundario} />
      )}
    </>
  );
}

interface PropsLista {
  postos: Ubs[];
  coordenadas: { lat: number; lng: number } | null;
  aoAbrir: (u: Ubs) => void;
  corIcone: string;
}

/** Na web: aviso discreto e os postos em lista (os mais perto, se a localização deixar). */
function ListaSemMapa({ postos, coordenadas, aoAbrir, corIcone }: PropsLista) {
  const ordenados = useMemo(() => {
    if (!coordenadas) return [...postos].sort((a, b) => a.ra.localeCompare(b.ra, "pt-BR") || a.nome.localeCompare(b.nome, "pt-BR"));
    return [...postos].sort((a, b) => distanciaKm(coordenadas, a) - distanciaKm(coordenadas, b));
  }, [postos, coordenadas]);
  return (
    <View style={estilos.lista}>
      <View style={estilos.linha}>
        <Icone name="map-outline" size={20} color={corIcone} />
        <Texto variante="legenda" secundario style={estilos.flex}>
          O mapa aparece no app do celular. Aqui no navegador, os postos em lista.
        </Texto>
      </View>
      {ordenados.slice(0, NA_LISTA).map((u) => {
        const nome = capitalizarNome(u.nome);
        const onde = coordenadas ? `${u.ra} · ${formatarDistancia(distanciaKm(coordenadas, u))}` : u.ra;
        return (
          <ItemLista key={`${u.cnes}-${u.farmacia}`} onPress={() => aoAbrir(u)} rotulo={`${nome}. ${onde}`} dica="Mostra endereço, telefone e como chegar">
            <Texto variante="destaque">{nome}</Texto>
            <Texto secundario>{onde}</Texto>
            <SeloHorario horario={u.horario} />
          </ItemLista>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: espaco.sm },
  linha: { flexDirection: "row", alignItems: "center", gap: espaco.sm },
  flex: { flex: 1 },
});
