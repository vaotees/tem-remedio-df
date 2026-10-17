import type { Marca } from "@tem-remedio/shared";
import { capitalizarNome } from "@/busca/remedios";
import { Aviso } from "./Aviso";

const QUAIS = {
  um: "O remédio do SUS não é.",
  todos: "Os remédios do SUS abaixo não são.",
  alguns: "Dos remédios do SUS abaixo, só os marcados com “liberação prolongada” são.",
} as const;

/**
 * Mesma substância ≠ mesmo remédio: a marca buscada é de liberação prolongada
 * (ex.: Glifage XR) e o produto do SUS não é. Nunca sugerir a troca sem orientação.
 */
export function AvisoLiberacao({ marca, quais }: { marca: Marca; quais: keyof typeof QUAIS }) {
  return (
    <Aviso
      titulo="Mesma substância, mas não é o mesmo remédio"
      texto={`${capitalizarNome(marca.nome)} é de liberação prolongada (o efeito dura mais no corpo). ${QUAIS[quais]} Confirme com seu médico ou farmacêutico antes de trocar.`}
    />
  );
}
