import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LIMITES_SNAPSHOT, VERSAO_SCHEMA, type Snapshot } from "@tem-remedio/shared";
import { escreverSaida, lerPublicado } from "../src/publicar";
import { validarSnapshot, type ResumoPublicado } from "../src/validar";

const LIMITES = { minUbs: 2, minProdutos: 1, minItensEstoque: 2, quedaMaxima: 0.25 };

function snapshot(nUbs = 4, atualizadoEm = "2026-10-17T00:16:33"): Snapshot {
  return {
    meta: { versaoSchema: VERSAO_SCHEMA, atualizadoEm, geradoEm: "2026-10-17T04:00:00.000Z", fonte: "teste" },
    ubs: Array.from({ length: nUbs }, (_, i) => ({
      cnes: String(1000000 + i),
      nome: `UBS ${i}`,
      farmacia: `FARMÁCIA - UBS ${i}`,
      regiaoSaude: "Região Central",
      ra: "Plano Piloto",
      endereco: "",
      cep: null,
      telefone: null,
      horario: null,
      entregaControlados: false,
      lat: -15.8,
      lng: -47.9,
    })),
    produtos: [
      {
        codigo: "1",
        descricao: "PARACETAMOL COMPRIMIDO 500 MG",
        substancia: "PARACETAMOL",
        forma: "Comprimido",
        dose: "500 MG",
        liberacaoProlongada: false,
        controlado: false,
        retirada: "qualquer_ubs",
        linkInfo: null,
        busca: "PARACETAMOL COMPRIMIDO 500 MG",
      },
    ],
    marcas: [],
    estoque: Array.from({ length: nUbs }, (_, i) => [i, 0, 100, 30] as [number, number, number, number]),
  };
}

const publicado = (atualizadoEm: string, ubs = 4): ResumoPublicado => ({
  atualizadoEm,
  contagens: { ubs, produtos: 1, estoque: ubs },
});

describe("validarSnapshot", () => {
  it("publica quando os dados são novos", () => {
    expect(validarSnapshot(snapshot(), publicado("2026-10-16T00:15:00"), LIMITES).status).toBe("publicar");
    expect(validarSnapshot(snapshot(), null, LIMITES).status).toBe("publicar");
  });

  it("não publica de novo quando a SES-DF ainda não atualizou", () => {
    expect(validarSnapshot(snapshot(), publicado("2026-10-17T00:16:33"), LIMITES).status).toBe("sem_mudanca");
  });

  it("rejeita queda grande em relação ao publicado", () => {
    const r = validarSnapshot(snapshot(2), publicado("2026-10-16T00:15:00", 4), LIMITES);
    expect(r.status).toBe("rejeitar");
    expect(r.erros.join(" ")).toMatch(/UBSs caíram de 4 para 2/);
  });

  it("rejeita dados mais antigos que os publicados", () => {
    expect(validarSnapshot(snapshot(), publicado("2026-10-18T00:15:00"), LIMITES).status).toBe("rejeitar");
  });

  it("rejeita abaixo dos mínimos", () => {
    const r = validarSnapshot(snapshot(1), null, LIMITES);
    expect(r.status).toBe("rejeitar");
    expect(r.erros.join(" ")).toMatch(/só 1 UBSs/);
  });

  it("rejeita snapshot fora do schema", () => {
    const s = snapshot();
    s.estoque.push([99, 0, 1, null]);
    expect(validarSnapshot(s, null, LIMITES).status).toBe("rejeitar");
  });

  describe("datas no futuro", () => {
    const AGORA = Date.parse("2026-10-17T15:00:00Z");

    it("rejeita dados com data no futuro (ano errado na fonte): travariam o app e as próximas coletas", () => {
      const r = validarSnapshot(snapshot(4, "2062-10-17T00:16:33"), publicado("2026-10-16T00:15:00"), LIMITES, AGORA);
      expect(r.status).toBe("rejeitar");
      expect(r.erros.join(" ")).toMatch(/data no futuro \(2062-10-17T00:16:33/);
    });

    it("publicado com data no futuro é ignorado: os dados de agora o substituem", () => {
      // Sem isso, toda coleta seria "mais antiga que a publicada" para sempre.
      const r = validarSnapshot(snapshot(4), publicado("2099-01-01T00:00:00", 4000), LIMITES, AGORA);
      expect(r.status).toBe("publicar");
      expect(r.avisos.join(" ")).toMatch(/publicado tem data no futuro \(2099-01-01T00:00:00\)/);
    });

    it("dados de hoje continuam valendo", () => {
      expect(validarSnapshot(snapshot(4), publicado("2026-10-16T00:15:00"), LIMITES, AGORA).status).toBe("publicar");
    });
  });

  it("rejeita snapshot maior que o app aceita baixar", () => {
    const s = snapshot();
    // Textos no limite do schema, em quantidade suficiente para passar do teto de bytes.
    const enchimento = "A".repeat(LIMITES_SNAPSHOT.texto);
    const n = Math.ceil(LIMITES_SNAPSHOT.bytes / (LIMITES_SNAPSHOT.texto * 5)) + 1;
    s.ubs = Array.from({ length: n }, (_, i) => ({
      ...s.ubs[0]!,
      cnes: String(1000000 + i),
      nome: enchimento,
      farmacia: enchimento,
      endereco: enchimento,
      horario: enchimento,
      regiaoSaude: enchimento,
    }));
    s.estoque = s.ubs.map((_, i) => [i, 0, 100, 30]);
    const r = validarSnapshot(s, null, LIMITES);
    expect(r.status).toBe("rejeitar");
    expect(r.erros.join(" ")).toMatch(/bytes \(máximo 5000000\): o app não baixaria/);
  });
});

describe("escreverSaida e lerPublicado", () => {
  it("grava snapshot.json e um meta.json que o próximo run consegue ler", async () => {
    const dir = await mkdtemp(join(tmpdir(), "coletor-"));
    const meta = await escreverSaida(dir, snapshot());
    expect(meta.contagens).toEqual({ ubs: 4, produtos: 1, estoque: 4, marcas: 0 });
    expect(meta.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.parse(await readFile(join(dir, "snapshot.json"), "utf8")).ubs).toHaveLength(4);

    const lido = await lerPublicado(join(dir, "meta.json"));
    expect(lido).toEqual({ atualizadoEm: "2026-10-17T00:16:33", contagens: meta.contagens });
  });

  it("sem publicado (primeiro run ou 404) devolve null", async () => {
    expect(await lerPublicado(undefined)).toBeNull();
    expect(await lerPublicado("/caminho/que/nao/existe/meta.json")).toBeNull();
    const fetch404 = (async () => new Response("", { status: 404 })) as unknown as typeof fetch;
    expect(await lerPublicado("https://exemplo.github.io/meta.json", fetch404)).toBeNull();
  });
});
