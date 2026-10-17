import { TEXTO_RETIRADA, type Snapshot } from "@tem-remedio/shared";
import { distanciaKm, formatarDistancia } from "@/postos/distancia";
import { interpretarHorario, situacaoHorario } from "@/postos/horario";
import { formatarCep, linkAppleMaps, linkGoogleMaps, linkTelefone, textoCompartilhar } from "@/postos/links";
import {
  acharUbs,
  avisoRetirada,
  ehUnidadePrisional,
  estaForaDoDf,
  postosComEstoque,
  temOutraFarmacia,
} from "@/postos/postos";
import { EM_SAO_PAULO, NO_PLANO_PILOTO, snapshotTeste } from "../fixtures/snapshot-teste";

const real = require("../assets/dados/snapshot-inicial.json") as Snapshot;

const nomes = (iProduto: number, origem: typeof NO_PLANO_PILOTO | null) =>
  postosComEstoque(snapshotTeste, iProduto, origem).map((p) => p.ubs.nome);

describe("distância", () => {
  it("em linha reta, em km", () => {
    // Sudoeste → UBS 05 Taguatinga: uns 15 km.
    const km = distanciaKm(NO_PLANO_PILOTO, snapshotTeste.ubs[0]!);
    expect(km).toBeGreaterThan(14);
    expect(km).toBeLessThan(16);
  });

  it("formata para leitura", () => {
    expect(formatarDistancia(0.32)).toBe("300 m");
    expect(formatarDistancia(0.03)).toBe("100 m");
    expect(formatarDistancia(2.34)).toBe("2,3 km");
    expect(formatarDistancia(17.6)).toBe("18 km");
  });
});

describe("postosComEstoque", () => {
  it("ordena do mais perto para o mais longe", () => {
    expect(nomes(0, NO_PLANO_PILOTO)).toEqual(["UBS 1 ASA NORTE", "UBS 05 TAGUATINGA", "UBS 01 SAMAMBAIA", "UBS 3 CEILANDIA"]);
    const distancias = postosComEstoque(snapshotTeste, 0, NO_PLANO_PILOTO).map((p) => p.distanciaKm!);
    expect([...distancias].sort((a, b) => a - b)).toEqual(distancias);
  });

  it("sem localização, ordena por Região Administrativa e nome", () => {
    expect(nomes(0, null)).toEqual(["UBS 3 CEILANDIA", "UBS 1 ASA NORTE", "UBS 01 SAMAMBAIA", "UBS 05 TAGUATINGA"]);
    expect(postosComEstoque(snapshotTeste, 0, null).every((p) => p.distanciaKm === null)).toBe(true);
  });

  it("leva quantidade e dias de estoque da própria UBS", () => {
    const [asaNorte] = postosComEstoque(snapshotTeste, 0, NO_PLANO_PILOTO);
    expect(asaNorte).toMatchObject({ quantidade: 80, dias: 3 });
  });

  it("controlado: só UBSs que entregam controlados", () => {
    // Samambaia tem clonazepam no estoque, mas não entrega controlados.
    expect(nomes(2, NO_PLANO_PILOTO)).toEqual(["UBS 1 ASA NORTE", "UBS 05 TAGUATINGA"]);
  });

  it("unidade prisional nunca aparece para o público, mesmo com estoque e sendo a mais perto", () => {
    expect(nomes(0, NO_PLANO_PILOTO)).not.toContain("UBS 01 DCCP");
    const prisionais = real.ubs.filter(ehUnidadePrisional).map((u) => u.nome);
    expect(prisionais.sort()).toEqual(["UBS 01 DCCP", "UBS 01 SIA CPP", "UBS 15 PFDF GAMA"]);
  });

  it("nenhum posto tem: lista vazia", () => {
    expect(nomes(9, NO_PLANO_PILOTO)).toEqual([]);
    expect(nomes(99, NO_PLANO_PILOTO)).toEqual([]);
  });

  it("controlado no snapshot de verdade: nunca aparece UBS que não entrega", () => {
    const iClonazepam = real.produtos.findIndex((p) => p.retirada === "controlado");
    const postos = postosComEstoque(real, iClonazepam, NO_PLANO_PILOTO);
    expect(postos.length).toBeGreaterThan(0);
    expect(postos.every((p) => p.ubs.entregaControlados)).toBe(true);
  });
});

describe("fora do DF", () => {
  it("percebe quando a pessoa está longe de todos os postos", () => {
    expect(estaForaDoDf(snapshotTeste, EM_SAO_PAULO)).toBe(true);
    expect(estaForaDoDf(snapshotTeste, NO_PLANO_PILOTO)).toBe(false);
  });
});

describe("avisoRetirada", () => {
  const produto = (i: number) => snapshotTeste.produtos[i]!;

  it("qualquer UBS: sem aviso", () => {
    expect(avisoRetirada(produto(0))).toBeNull();
  });

  it("controlado, UBS de referência e grupo levam o texto oficial", () => {
    expect(avisoRetirada(produto(2))).toEqual({
      titulo: "Só nas UBSs que entregam controlados",
      texto: TEXTO_RETIRADA.controlado,
      link: null,
    });
    expect(avisoRetirada(produto(4))?.titulo).toBe("Retire na UBS do seu bairro");
    expect(avisoRetirada(produto(6))?.titulo).toBe("Confirme antes de ir");
  });

  it("unidades específicas e grupo de acompanhamento trazem o link oficial", () => {
    expect(avisoRetirada(produto(8))).toMatchObject({
      titulo: "Só para quem participa do grupo",
      link: "https://www.saude.df.gov.br/tabagismo/",
    });
    expect(avisoRetirada(produto(9))).toMatchObject({
      titulo: "Só em algumas unidades",
      link: "https://www.saude.df.gov.br/medicamentos-influenza-oseltamivir/",
    });
  });
});

describe("acharUbs", () => {
  it("acha pelo CNES e, quando a UBS tem duas farmácias, pela farmácia", () => {
    expect(acharUbs(snapshotTeste, "0010626")?.nome).toBe("UBS 05 TAGUATINGA");
    expect(acharUbs(snapshotTeste, "9999999")).toBeNull();

    const duas = real.ubs.filter((u) => u.cnes === "0011010");
    expect(duas).toHaveLength(2);
    expect(acharUbs(real, "0011010", duas[1]!.farmacia)).toBe(duas[1]);
    expect(temOutraFarmacia(real, duas[0]!)).toBe(true);
    expect(temOutraFarmacia(snapshotTeste, snapshotTeste.ubs[0]!)).toBe(false);
  });
});

describe("horário", () => {
  // 17/10/2026 é sábado.
  const em = (dia: number, h: number, min = 0) => new Date(2026, 9, dia, h, min);
  const SEMANA = "das 07h às 17h de segunda a sexta";
  const COM_SABADO = "das 07h às 19h de segunda a sexta, e sábado das 07h às 12h";

  it("entende os formatos do cadastro da SES-DF", () => {
    expect(interpretarHorario(SEMANA)).toEqual([{ dias: [1, 2, 3, 4, 5], inicio: 420, fim: 1020 }]);
    expect(interpretarHorario(COM_SABADO)).toEqual([
      { dias: [1, 2, 3, 4, 5], inicio: 420, fim: 1140 },
      { dias: [6], inicio: 420, fim: 720 },
    ]);
  });

  it("todos os horários do snapshot de verdade, menos os sem horário, são entendidos", () => {
    const naoEntendidos = real.ubs.filter((u) => interpretarHorario(u.horario) === null).map((u) => u.horario);
    expect(new Set(naoEntendidos)).toEqual(new Set([null, "OUTRO/PRISIONAL"]));
  });

  it("não chuta quando não entende", () => {
    expect(interpretarHorario(null)).toBeNull();
    expect(interpretarHorario("OUTRO/PRISIONAL")).toBeNull();
    expect(interpretarHorario("das 07h às 17h")).toBeNull();
    expect(interpretarHorario("de segunda a sexta")).toBeNull();
  });

  it("aberto agora e quando fecha", () => {
    const faixas = interpretarHorario(SEMANA)!;
    expect(situacaoHorario(faixas, em(19, 10))).toEqual({ aberto: true, texto: "Aberto agora, fecha às 17h" });
    expect(situacaoHorario(faixas, em(19, 7))).toMatchObject({ aberto: true });
  });

  it("fechado e quando abre (hoje, amanhã ou o dia da semana)", () => {
    const faixas = interpretarHorario(SEMANA)!;
    expect(situacaoHorario(faixas, em(19, 6, 30)).texto).toBe("Fechado agora, abre hoje às 07h");
    expect(situacaoHorario(faixas, em(19, 17)).texto).toBe("Fechado agora, abre amanhã às 07h");
    expect(situacaoHorario(faixas, em(17, 9)).texto).toBe("Fechado agora, abre segunda às 07h");
    expect(situacaoHorario(interpretarHorario(COM_SABADO)!, em(17, 9)).texto).toBe("Aberto agora, fecha às 12h");
  });
});

describe("links", () => {
  const ubs = snapshotTeste.ubs[0]!;

  it("como chegar no Google Maps e no Mapas da Apple", () => {
    expect(linkGoogleMaps(ubs)).toBe("https://www.google.com/maps/dir/?api=1&destination=-15.851049,-48.047118");
    expect(linkAppleMaps(ubs)).toBe("https://maps.apple.com/?daddr=-15.851049,-48.047118&q=UBS%2005%20Taguatinga");
  });

  it("telefone com +55, de qualquer jeito que veio no cadastro", () => {
    expect(linkTelefone("(61) 3563-9176")).toBe("tel:+556135639176");
    expect(linkTelefone("61 2017 2074")).toBe("tel:+556120172074");
    expect(linkTelefone("061 3449-5849")).toBe("tel:+556134495849");
    expect(linkTelefone("3449-5849")).toBe("tel:+556134495849");
    expect(linkTelefone("123")).toBeNull();
  });

  it("CEP formatado", () => {
    expect(formatarCep("72155000")).toBe("72155-000");
  });

  it("mensagem para o WhatsApp com o remédio, o posto e o aviso de ligar antes", () => {
    const texto = textoCompartilhar({ ubs, remedio: "Losartana potassica, comprimido 50 mg", atualizacao: "hoje às 00h16" });
    expect(texto.split("\n")).toEqual([
      "Losartana potassica, comprimido 50 mg",
      "UBS 05 Taguatinga",
      "SETOR D SUL AE 23, TAGUATINGA SUL",
      "Telefone: (61) 3563-9176",
      "Horário: das 07h às 22h de segunda a sexta",
      "Como chegar: https://www.google.com/maps/dir/?api=1&destination=-15.851049,-48.047118",
      "Estoque de hoje às 00h16 (SES-DF). Ligue antes de ir.",
    ]);
  });
});
