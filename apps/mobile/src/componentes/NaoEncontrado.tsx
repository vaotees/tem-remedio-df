import { useRouter } from "expo-router";
import { Botao } from "./Botao";
import { Cartao } from "./Cartao";
import { Texto } from "./Texto";

/** Link antigo ou dados atualizados sem aquele remédio/posto: explica e leva de volta à busca. */
export function NaoEncontrado({ oQue }: { oQue: "remédio" | "posto" }) {
  const router = useRouter();
  return (
    <Cartao>
      <Texto variante="subtitulo">Não achei esse {oQue}</Texto>
      <Texto secundario>Os dados da SES-DF foram atualizados e ele não está mais na lista.</Texto>
      <Botao titulo="Fazer outra busca" icone="search" onPress={() => router.navigate("/")} />
    </Cartao>
  );
}
