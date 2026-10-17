import {
  calcularDias,
  LIMITES_DF,
  normalizar,
  VERSAO_SCHEMA,
  type ItemEstoque,
  type Produto,
  type Snapshot,
  type Ubs,
} from "@tem-remedio/shared";
import { GRUPOS_DISPENSADOS } from "../config";
import type { RegistroCmed } from "../fontes/cmed";
import type { CacheCnes } from "../fontes/cnes";
import type { LinhaEstoque } from "../fontes/estoque";
import type { CadastroUbs, LinhaRegra } from "../fontes/garantir";
import { separarDescricao } from "./descricao";
import { construirMarcas } from "./marcas";
import { classificarRetirada } from "./retirada";

export interface EntradaSnapshot {
  atualizadoEm: string;
  estoque: LinhaEstoque[];
  regras: LinhaRegra[];
  cadastroUbs: CadastroUbs[];
  cnes: CacheCnes;
  cmed: RegistroCmed[];
  agora?: Date;
}

export interface ResultadoMontagem {
  snapshot: Snapshot;
  avisos: string[];
  descartes: Record<string, number>;
}

export function montarSnapshot(e: EntradaSnapshot): ResultadoMontagem {
  const avisos: string[] = [];
  const descartes: Record<string, number> = {
    almoxarifado: 0,
    material_ou_outro_grupo: 0,
    aplicado_no_posto: 0,
    ubs_sem_coordenada: 0,
    duplicado: 0,
  };
  const descartar = (motivo: string) => (descartes[motivo] = (descartes[motivo] ?? 0) + 1);

  const regrasPorCodigo = agrupar(e.regras, (r) => r.codigo);
  const cadastro = new Map(e.cadastroUbs.map((c) => [c.cnes, c]));

  const ubs: Ubs[] = [];
  const indiceUbs = new Map<string, number>();
  const produtos: Produto[] = [];
  const indiceProduto = new Map<string, number>();
  const componentesProduto: string[][] = [];
  const estoque: ItemEstoque[] = [];
  const vistos = new Set<string>();
  const ubsSemCoordenada = new Set<string>();
  const naoReconhecidas = new Set<string>();

  for (const l of e.estoque) {
    if (/^ALMOXARIFADO/i.test(l.local)) {
      descartar("almoxarifado");
      continue;
    }
    // Sem fonte de abastecimento = material (agulha, gaze); fora do elenco da UBS = não é entregue ao paciente.
    if (!l.abastecimento || !l.grupo || !GRUPOS_DISPENSADOS.includes(l.grupo)) {
      descartar("material_ou_outro_grupo");
      continue;
    }
    const chave = `${l.codLocal}|${l.codProduto}`;
    if (vistos.has(chave)) {
      descartar("duplicado");
      continue;
    }
    vistos.add(chave);

    // Produto
    let iProduto = indiceProduto.get(l.codProduto);
    if (iProduto === undefined) {
      const { retirada, link, naoReconhecida } = classificarRetirada(regrasPorCodigo.get(l.codProduto) ?? []);
      if (naoReconhecida) naoReconhecidas.add(naoReconhecida);
      if (retirada === "aplicado_no_posto") {
        indiceProduto.set(l.codProduto, -1);
        descartar("aplicado_no_posto");
        continue;
      }
      const d = separarDescricao(l.descricao);
      iProduto = produtos.length;
      indiceProduto.set(l.codProduto, iProduto);
      componentesProduto.push(d.componentes);
      produtos.push({
        codigo: l.codProduto,
        descricao: l.descricao,
        substancia: d.substancia,
        forma: d.forma,
        dose: d.dose,
        liberacaoProlongada: d.liberacaoProlongada,
        controlado: l.controlado || retirada === "controlado",
        retirada,
        linkInfo: link,
        busca: normalizar(l.descricao),
      });
    }
    if (iProduto < 0) {
      descartar("aplicado_no_posto");
      continue;
    }

    // UBS (uma por local de estoque: algumas UBSs têm duas farmácias)
    let iUbs = indiceUbs.get(l.codLocal);
    if (iUbs === undefined) {
      const c = e.cnes[l.cnes];
      const cad = cadastro.get(l.cnes);
      if (!c || c.lat === null || c.lng === null || !dentroDoDf(c.lat, c.lng)) {
        indiceUbs.set(l.codLocal, -1);
        ubsSemCoordenada.add(`${l.cnes} ${l.local}`);
        descartar("ubs_sem_coordenada");
        continue;
      }
      iUbs = ubs.length;
      indiceUbs.set(l.codLocal, iUbs);
      ubs.push({
        cnes: l.cnes,
        nome: c.nome,
        farmacia: l.local,
        regiaoSaude: l.regiaoSaude,
        ra: l.ra,
        endereco: c.endereco,
        cep: c.cep,
        telefone: cad?.telefone ?? c.telefone,
        horario: cad?.horario ?? null,
        entregaControlados: cad?.entregaControlados ?? false,
        lat: c.lat,
        lng: c.lng,
      });
    }
    if (iUbs < 0) {
      descartar("ubs_sem_coordenada");
      continue;
    }

    estoque.push([iUbs, iProduto, l.quantidade, calcularDias(l.quantidade, l.consumoMensal)]);
  }

  if (ubsSemCoordenada.size) avisos.push(`UBS sem coordenada no CNES (fora do app): ${[...ubsSemCoordenada].join("; ")}`);
  for (const t of naoReconhecidas) avisos.push(`Observação de retirada não reconhecida: "${t}"`);

  const marcas = construirMarcas(e.cmed, componentesProduto.map((c) => ({ componentes: c })));

  return {
    snapshot: {
      meta: {
        versaoSchema: VERSAO_SCHEMA,
        atualizadoEm: e.atualizadoEm,
        geradoEm: (e.agora ?? new Date()).toISOString(),
        fonte: "SES-DF (InfoSaúde), CNES e CMED/Anvisa",
      },
      ubs,
      produtos,
      marcas,
      estoque,
    },
    avisos,
    descartes,
  };
}

function dentroDoDf(lat: number, lng: number) {
  return lat >= LIMITES_DF.latMin && lat <= LIMITES_DF.latMax && lng >= LIMITES_DF.lngMin && lng <= LIMITES_DF.lngMax;
}

function agrupar<T>(itens: T[], chave: (t: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const i of itens) {
    const k = chave(i);
    const lista = m.get(k);
    if (lista) lista.push(i);
    else m.set(k, [i]);
  }
  return m;
}
