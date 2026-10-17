import { describe, expect, it } from "vitest";
import {
  calcularDias,
  nivelEstoque,
  normalizar,
  snapshotSchema,
  VERSAO_SCHEMA,
  type Snapshot,
} from "../src";

describe("normalizar", () => {
  it("tira acentos, pontuação e deixa maiúsculo", () => {
    expect(normalizar("Losartana potássica 50 mg")).toBe("LOSARTANA POTASSICA 50 MG");
    expect(normalizar("  Ácido fólico (5 mg) ")).toBe("ACIDO FOLICO 5 MG");
  });

  it("mantém o + das combinações", () => {
    expect(normalizar("Amoxicilina + clavulanato")).toBe("AMOXICILINA + CLAVULANATO");
  });
});

describe("semáforo", () => {
  it("calcula dias pelo consumo mensal da própria UBS", () => {
    expect(calcularDias(300, 300)).toBe(30);
    expect(calcularDias(30, 300)).toBe(3);
  });

  it("sem consumo registrado não estima", () => {
    expect(calcularDias(100, null)).toBeNull();
    expect(calcularDias(100, 0)).toBeNull();
  });

  it("classifica nas faixas", () => {
    expect(nivelEstoque(null)).toBe("sem_consumo");
    expect(nivelEstoque(0)).toBe("critico");
    expect(nivelEstoque(6)).toBe("critico");
    expect(nivelEstoque(7)).toBe("baixo");
    expect(nivelEstoque(29)).toBe("baixo");
    expect(nivelEstoque(30)).toBe("alto");
  });
});

function snapshotValido(): Snapshot {
  return {
    meta: {
      versaoSchema: VERSAO_SCHEMA,
      atualizadoEm: "2026-10-17T00:16:33",
      geradoEm: "2026-10-17T04:00:00.000Z",
      fonte: "SES-DF",
    },
    ubs: [
      {
        cnes: "0010626",
        nome: "UBS 05 TAGUATINGA",
        farmacia: "FARMÁCIA - UBS 5 TAGUATINGA (CST05)",
        regiaoSaude: "Região Sudoeste",
        ra: "Taguatinga",
        endereco: "SETOR D SUL AE 23, TAGUATINGA SUL",
        cep: "72155000",
        telefone: "(61) 3563-9176",
        horario: "das 07h às 17h de segunda a sexta",
        entregaControlados: false,
        lat: -15.851049,
        lng: -48.047118,
      },
    ],
    produtos: [
      {
        codigo: "10520",
        descricao: "LOSARTANA POTASSICA COMPRIMIDO REVESTIDO 50 MG",
        substancia: "LOSARTANA",
        forma: "COMPRIMIDO",
        dose: "50 MG",
        liberacaoProlongada: false,
        controlado: false,
        retirada: "qualquer_ubs",
        linkInfo: null,
        busca: "LOSARTANA POTASSICA COMPRIMIDO REVESTIDO 50 MG",
      },
    ],
    marcas: [{ nome: "COZAAR", produtos: [0], liberacaoProlongada: false }],
    estoque: [[0, 0, 18159, 13]],
  };
}

describe("snapshotSchema", () => {
  it("aceita um snapshot válido", () => {
    expect(snapshotSchema.safeParse(snapshotValido()).success).toBe(true);
  });

  it("rejeita índice de estoque apontando para UBS inexistente", () => {
    const s = snapshotValido();
    s.estoque.push([5, 0, 10, null]);
    expect(snapshotSchema.safeParse(s).success).toBe(false);
  });

  it("rejeita marca apontando para produto inexistente", () => {
    const s = snapshotValido();
    s.marcas.push({ nome: "X", produtos: [9], liberacaoProlongada: false });
    expect(snapshotSchema.safeParse(s).success).toBe(false);
  });

  it("rejeita coordenada fora do DF", () => {
    const s = snapshotValido();
    s.ubs[0]!.lat = -23.55;
    expect(snapshotSchema.safeParse(s).success).toBe(false);
  });
});
