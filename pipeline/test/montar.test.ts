import { describe, expect, it } from "vitest";
import { snapshotSchema } from "@tem-remedio/shared";
import type { RegistroCmed } from "../src/fontes/cmed";
import type { CacheCnes } from "../src/fontes/cnes";
import type { LinhaEstoque } from "../src/fontes/estoque";
import type { CadastroUbs, LinhaRegra } from "../src/fontes/garantir";
import { montarSnapshot } from "../src/transformar/montar";

const base: LinhaEstoque = {
  cnes: "0010626",
  codLocal: "500705",
  local: "FARMÁCIA - UBS 5 TAGUATINGA (CST05)",
  regiaoSaude: "Região Sudoeste",
  ra: "Taguatinga",
  grupo: "UBS",
  codProduto: "8944",
  descricao: "LOSARTANA POTASSICA COMPRIMIDO REVESTIDO 50 MG",
  controlado: false,
  abastecimento: "SES-DF",
  quantidade: 18159,
  consumoMensal: 40904,
};

const linha = (mudancas: Partial<LinhaEstoque>): LinhaEstoque => ({ ...base, ...mudancas });

const cnes: CacheCnes = {
  "0010626": {
    cnes: "0010626",
    nome: "UBS 05 TAGUATINGA",
    endereco: "SETOR D SUL AE 23, TAGUATINGA SUL",
    cep: "72155000",
    telefone: "(61) 3563-9176",
    lat: -15.851049,
    lng: -48.047118,
  },
  // Coordenada errada (São Paulo): a UBS fica fora do app.
  "0099999": { cnes: "0099999", nome: "UBS X", endereco: "", cep: null, telefone: null, lat: -23.55, lng: -46.63 },
};

const cadastroUbs: CadastroUbs[] = [
  { cnes: "0010626", telefone: "(61) 2017-1145", horario: "das 07h às 22h de segunda a sexta", entregaControlados: true, inativa: false },
];

const regras: LinhaRegra[] = [
  { codigo: "8944", tipo: "Documentos pessoais", texto: "Documento de identificação oficial com foto", link: null },
  {
    codigo: "90024",
    tipo: "Observações",
    texto: "Esse medicamento é fornecido para as equipes de saúde da UBS e administrado no próprio local.",
    link: null,
  },
];

const cmed: RegistroCmed[] = [
  { substancia: "LOSARTANA POTÁSSICA", produto: "COZAAR", apresentacao: "50 MG COM REV CT BL AL AL X 30" },
  { substancia: "CLORTALIDONA", produto: "HIGROTON", apresentacao: "25 MG COM CT BL AL PLAS X 30" },
];

function montar(estoque: LinhaEstoque[]) {
  return montarSnapshot({
    atualizadoEm: "2026-10-17T00:16:33",
    estoque,
    regras,
    cadastroUbs,
    cnes,
    cmed,
    agora: new Date("2026-10-17T04:00:00Z"),
  });
}

describe("montarSnapshot", () => {
  it("monta UBS, produto, marca e estoque com dias calculados", () => {
    const { snapshot } = montar([base]);
    expect(snapshotSchema.safeParse(snapshot).success).toBe(true);
    expect(snapshot.ubs).toHaveLength(1);
    expect(snapshot.ubs[0]).toMatchObject({
      cnes: "0010626",
      nome: "UBS 05 TAGUATINGA",
      // telefone e horário do cadastro da SES-DF têm preferência sobre o CNES
      telefone: "(61) 2017-1145",
      horario: "das 07h às 22h de segunda a sexta",
      entregaControlados: true,
    });
    expect(snapshot.produtos[0]).toMatchObject({
      substancia: "LOSARTANA POTASSICA",
      forma: "Comprimido",
      dose: "50 MG",
      retirada: "qualquer_ubs",
    });
    // 18159 / (40904 / 30) ≈ 13 dias
    expect(snapshot.estoque).toEqual([[0, 0, 18159, 13]]);
    expect(snapshot.marcas).toEqual([{ nome: "COZAAR", produtos: [0], liberacaoProlongada: false }]);
  });

  it("descarta almoxarifado, material, outro grupo, aplicado no posto e duplicados", () => {
    const { snapshot, descartes } = montar([
      base,
      linha({}), // duplicado
      linha({ local: "ALMOXARIFADO - CST05", codLocal: "999" }),
      linha({ codProduto: "36048", descricao: "LUVA NITRÍLICA TAMANHO P", abastecimento: null, grupo: null }),
      linha({ codProduto: "90106", descricao: "AZITROMICINA COMPRIMIDO 500 MG", grupo: "Compenente Especializado" }),
      linha({ codProduto: "90024", descricao: "BENZILPENICILINA BENZATINA SUSPENSÃO INJETAVEL 1.200.000 UI" }),
    ]);
    expect(snapshot.produtos.map((p) => p.codigo)).toEqual(["8944"]);
    expect(snapshot.estoque).toHaveLength(1);
    expect(descartes).toMatchObject({
      duplicado: 1,
      almoxarifado: 1,
      material_ou_outro_grupo: 2,
      aplicado_no_posto: 1,
    });
  });

  it("UBS com coordenada fora do DF sai do snapshot com aviso", () => {
    const { snapshot, avisos, descartes } = montar([base, linha({ cnes: "0099999", codLocal: "777", local: "FARMÁCIA - UBS X" })]);
    expect(snapshot.ubs.map((u) => u.cnes)).toEqual(["0010626"]);
    expect(descartes.ubs_sem_coordenada).toBe(1);
    expect(avisos.join(" ")).toContain("0099999");
  });

  it("sem consumo registrado, dias fica nulo", () => {
    const { snapshot } = montar([linha({ consumoMensal: null })]);
    expect(snapshot.estoque[0]![3]).toBeNull();
  });

  it("remédio sem regra publicada fica 'sem informação'", () => {
    const { snapshot } = montar([linha({ codProduto: "12345", descricao: "CAPTOPRIL COMPRIMIDO SULCADO 25 MG" })]);
    expect(snapshot.produtos[0]!.retirada).toBe("sem_informacao");
  });
});
