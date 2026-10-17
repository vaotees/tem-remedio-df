import { fireEvent, renderRouter, screen, within } from "expo-router/testing-library";
import { Linking, Share } from "react-native";
import { queryClient } from "@/dados/consultas";
import { NO_PLANO_PILOTO, snapshotTeste } from "../fixtures/snapshot-teste";

// As telas leem o snapshot pequeno de teste.
jest.mock("@/dados/useSnapshot", () => {
  const { snapshotTeste: snapshot } = jest.requireActual<typeof import("../fixtures/snapshot-teste")>(
    "../fixtures/snapshot-teste",
  );
  return {
    useSnapshot: () => ({
      snapshot,
      origem: "embutido",
      carregando: false,
      erro: null,
      procurandoNovos: false,
      erroRede: null,
      temRede: false,
      procurarNovos: () => {},
    }),
  };
});

// GPS de mentira: cada teste diz se há permissão, onde a pessoa está e se o GPS responde.
// Funções comuns (não jest.fn) para o restoreAllMocks não apagar a implementação.
const mockGps = {
  permissao: { granted: true, canAskAgain: true, status: "granted" },
  posicao: { coords: { latitude: -15.7801, longitude: -47.9292 } },
  desligado: false,
};
jest.mock("expo-location", () => ({
  Accuracy: { Balanced: 3 },
  getForegroundPermissionsAsync: async () => mockGps.permissao,
  requestForegroundPermissionsAsync: async () => mockGps.permissao,
  getLastKnownPositionAsync: async () => (mockGps.desligado ? null : mockGps.posicao),
  getCurrentPositionAsync: async () => {
    if (mockGps.desligado) throw new Error("GPS desligado");
    return mockGps.posicao;
  },
}));

const APP = "src/app";

// Renderiza o app inteiro (o primeiro teste carrega o Expo Router): mais lento que um teste de componente.
jest.setTimeout(30_000);

beforeEach(() => {
  mockGps.permissao = { granted: true, canAskAgain: true, status: "granted" };
  mockGps.posicao = { coords: { latitude: NO_PLANO_PILOTO.lat, longitude: NO_PLANO_PILOTO.lng } };
  mockGps.desligado = false;
  jest.spyOn(Linking, "openURL").mockResolvedValue(true);
  jest.spyOn(Linking, "openSettings").mockResolvedValue(undefined);
  jest.spyOn(Share, "share").mockResolvedValue({ action: Share.sharedAction });
});

afterEach(() => {
  // A localização fica guardada no React Query: cada teste começa do zero.
  queryClient.clear();
  jest.restoreAllMocks();
});

async function buscarPor(termo: string) {
  await fireEvent.changeText(screen.getByLabelText("Nome do remédio"), termo);
}

/** Nomes dos postos na ordem da lista (o item inteiro é um botão com o nome primeiro). */
function postosNaTela(): string[] {
  return screen
    .getAllByRole("button", { name: /^UBS / })
    .map((b) => String(b.props.accessibilityLabel).split(".")[0]!);
}

describe("busca", () => {
  it("acha pelo nome e vai direto para os postos quando só há uma dose", async () => {
    const r = await renderRouter(APP, { initialUrl: "/" });
    await buscarPor("lozartana");

    const resultado = await screen.findByRole("button", { name: /^Losartana potassica/ });
    expect(within(resultado).getByText("Comprimido 50 mg")).toBeOnTheScreen();
    expect(screen.getByText("1 remédio encontrado")).toBeOnTheScreen();

    await fireEvent.press(resultado);
    expect(r.getPathname()).toBe("/postos/8944");
    expect(await screen.findByText("4 postos têm hoje")).toBeOnTheScreen();
  });

  it("diz quando não acha nada", async () => {
    await renderRouter(APP, { initialUrl: "/" });
    await buscarPor("xyzwq");
    expect(await screen.findByText("Não achei “xyzwq”")).toBeOnTheScreen();
  });

  it("pelo nome comercial, mostra a substância", async () => {
    await renderRouter(APP, { initialUrl: "/" });
    await buscarPor("rivotril");
    expect(await screen.findByText("Mesma substância de Rivotril")).toBeOnTheScreen();
    expect(screen.getByText("Clonazepam")).toBeOnTheScreen();
  });
});

describe("Qual destes?", () => {
  it("lista as formas e doses, com quantos postos têm cada uma", async () => {
    const r = await renderRouter(APP, { initialUrl: "/" });
    await buscarPor("prednisona");
    await fireEvent.press(await screen.findByRole("button", { name: /^Prednisona/ }));

    expect(r.getPathname()).toBe("/remedio/90648");
    expect(await screen.findByText("Qual destes?")).toBeOnTheScreen();
    const opcoes = screen.getAllByRole("button", { name: /^Comprimido/ });
    expect(opcoes).toHaveLength(3);
    // As duas "Comprimido 5 mg" se diferenciam pela descrição da SES-DF.
    expect(screen.getByText("PREDNISONA COMPRIMIDO 5 MG - HANSENIASE")).toBeOnTheScreen();
    expect(screen.getAllByText("Em 1 posto hoje")).toHaveLength(3);

    await fireEvent.press(screen.getByRole("button", { name: /^Comprimido 20 mg/ }));
    expect(r.getPathname()).toBe("/postos/90649");
    expect(await screen.findByText("1 posto tem hoje")).toBeOnTheScreen();
  });

  it("marca de liberação prolongada: avisa que não é o mesmo remédio", async () => {
    await renderRouter(APP, { initialUrl: "/" });
    await buscarPor("glifage xr");
    await fireEvent.press(await screen.findByRole("button", { name: /^Metformina/ }));

    expect(await screen.findByText("Mesma substância, mas não é o mesmo remédio")).toBeOnTheScreen();
    expect(screen.getByText(/Glifage XR é de liberação prolongada.*O remédio do SUS não é.*médico ou farmacêutico/)).toBeOnTheScreen();
  });

  it("marca comum: sem aviso", async () => {
    await renderRouter(APP, { initialUrl: "/" });
    await buscarPor("glifage");
    await fireEvent.press(await screen.findByRole("button", { name: /^Metformina.*Glifage\./ }));
    expect(await screen.findByText("2 postos têm hoje")).toBeOnTheScreen();
    expect(screen.queryByText("Mesma substância, mas não é o mesmo remédio")).toBeNull();
  });
});

describe("lista de postos", () => {
  it("do mais perto para o mais longe, com distância, semáforo e horário", async () => {
    await renderRouter(APP, { initialUrl: "/postos/8944" });
    expect(await screen.findByText("Do mais perto para o mais longe de você, em linha reta.")).toBeOnTheScreen();
    expect(postosNaTela()).toEqual(["UBS 1 Asa Norte", "UBS 05 Taguatinga", "UBS 01 Samambaia", "UBS 3 Ceilandia"]);

    const asaNorte = screen.getByRole("button", { name: /^UBS 1 Asa Norte/ });
    expect(within(asaNorte).getByText("Plano Piloto · 4,0 km")).toBeOnTheScreen();
    expect(within(asaNorte).getByText("Quase acabando, ligue antes")).toBeOnTheScreen();
    expect(asaNorte.props.accessibilityLabel).toMatch(/a 4,0 km em linha reta\. Estoque: Quase acabando, ligue antes\. (Aberto|Fechado) agora/);
    // UBS sem horário no cadastro: sem "Aberto agora".
    expect(screen.getByRole("button", { name: /^UBS 3 Ceilandia/ }).props.accessibilityLabel).not.toMatch(/agora/);
  });

  it("sem permissão de localização: por Região Administrativa, com aviso", async () => {
    mockGps.permissao = { granted: false, canAskAgain: false, status: "denied" };
    await renderRouter(APP, { initialUrl: "/postos/8944" });

    expect(await screen.findByText("Sem a sua localização")).toBeOnTheScreen();
    expect(screen.getByText(/por Região Administrativa\. Em breve você vai poder escolher a sua região/)).toBeOnTheScreen();
    expect(postosNaTela()).toEqual(["UBS 3 Ceilandia", "UBS 1 Asa Norte", "UBS 01 Samambaia", "UBS 05 Taguatinga"]);
    expect(screen.getByRole("header", { name: "Ceilândia" })).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Permitir nos ajustes" }));
    expect(Linking.openSettings).toHaveBeenCalled();
  });

  it("GPS desligado: por região, com botão de tentar de novo", async () => {
    mockGps.desligado = true;
    await renderRouter(APP, { initialUrl: "/postos/8944" });
    expect(await screen.findByText("Não consegui achar sua localização")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Tentar de novo" })).toBeOnTheScreen();
  });

  it("remédio controlado: só UBSs que entregam controlados", async () => {
    await renderRouter(APP, { initialUrl: "/postos/90007" });
    expect(await screen.findByText("2 postos têm hoje")).toBeOnTheScreen();
    expect(screen.getByText("Só nas UBSs que entregam controlados")).toBeOnTheScreen();
    expect(postosNaTela()).toEqual(["UBS 1 Asa Norte", "UBS 05 Taguatinga"]);
  });

  it("UBS de referência: avisa para retirar na UBS do bairro", async () => {
    await renderRouter(APP, { initialUrl: "/postos/5996" });
    expect(await screen.findByText("Retire na UBS do seu bairro")).toBeOnTheScreen();
    expect(screen.getByText("Retire na UBS de referência do seu bairro.")).toBeOnTheScreen();
  });

  it("grupo de acompanhamento: aviso com o link oficial", async () => {
    await renderRouter(APP, { initialUrl: "/postos/MSE765" });
    expect(await screen.findByText("Só para quem participa do grupo")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Ver a lista oficial" }));
    expect(Linking.openURL).toHaveBeenCalledWith("https://www.saude.df.gov.br/tabagismo/");
  });

  it("nenhum posto tem: diz isso e convida para Meus remédios", async () => {
    const r = await renderRouter(APP, { initialUrl: "/postos/MSE24551" });
    expect(await screen.findByText("Nenhum posto tem Oseltamivir (fosfato) cápsula 75 mg hoje")).toBeOnTheScreen();
    expect(screen.getByText("Só em algumas unidades")).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Ir para Meus remédios" }));
    expect(r.getPathname()).toBe("/meus-remedios");
  });

  it("remédio que saiu da lista", async () => {
    await renderRouter(APP, { initialUrl: "/postos/000000" });
    expect(await screen.findByText("Não achei esse remédio")).toBeOnTheScreen();
  });
});

describe("detalhe do posto", () => {
  it("abre pela lista, com o estoque do remédio e o aviso de ligar antes", async () => {
    const r = await renderRouter(APP, { initialUrl: "/postos/8944" });
    await fireEvent.press(await screen.findByRole("button", { name: /^UBS 1 Asa Norte/ }));

    expect(r.getPathname()).toBe("/posto/0010707");
    expect(await screen.findByText("UBS 1 Asa Norte")).toBeOnTheScreen();
    expect(screen.getByText("Losartana potassica, comprimido 50 mg")).toBeOnTheScreen();
    expect(screen.getByText("Quase acabando, ligue antes")).toBeOnTheScreen();
    expect(screen.getByText(/^Estoque de .+ às 00h16, ligue antes de ir\.$/)).toBeOnTheScreen();
    expect(screen.getByText("Pode retirar em qualquer UBS que tenha o remédio.")).toBeOnTheScreen();
    expect(screen.getByText("SGAN, ASA NORTE")).toBeOnTheScreen();
    expect(screen.getByText("Plano Piloto · CEP 70790-054")).toBeOnTheScreen();
    expect(screen.getByText("Das 07h às 18h de segunda a sexta, e sábado das 07h às 12h")).toBeOnTheScreen();
    expect(screen.getByText("• Documento oficial com foto")).toBeOnTheScreen();
  });

  it("Como chegar, Ligar e Enviar no WhatsApp", async () => {
    await renderRouter(APP, { initialUrl: "/posto/0010626?produto=8944" });

    await fireEvent.press(await screen.findByRole("button", { name: "Como chegar" }));
    expect(Linking.openURL).toHaveBeenLastCalledWith(
      "https://maps.apple.com/?daddr=-15.851049,-48.047118&q=UBS%2005%20Taguatinga",
    );

    await fireEvent.press(screen.getByRole("button", { name: "Abrir no Google Maps" }));
    expect(Linking.openURL).toHaveBeenLastCalledWith(
      "https://www.google.com/maps/dir/?api=1&destination=-15.851049,-48.047118",
    );

    await fireEvent.press(screen.getByRole("button", { name: "Ligar" }));
    expect(Linking.openURL).toHaveBeenLastCalledWith("tel:+556135639176");

    await fireEvent.press(screen.getByRole("button", { name: "Enviar no WhatsApp" }));
    const mensagem = (Share.share as jest.Mock).mock.calls[0][0].message as string;
    expect(mensagem).toContain("Losartana potassica, comprimido 50 mg\nUBS 05 Taguatinga\nSETOR D SUL AE 23");
    expect(mensagem).toContain("Ligue antes de ir.");
  });

  it("controlado: lembra a receita especial; sem telefone, não mostra Ligar", async () => {
    await renderRouter(APP, { initialUrl: "/posto/0010634?produto=8829" });
    expect(await screen.findByText("• Receita de controle especial em 2 vias (não aceitam xerox)")).toBeOnTheScreen();
    expect(screen.getByText("A SES-DF não informou o telefone deste posto.")).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Ligar" })).toBeNull();
  });

  it("posto que saiu da lista", async () => {
    await renderRouter(APP, { initialUrl: "/posto/9999999" });
    expect(await screen.findByText("Não achei esse posto")).toBeOnTheScreen();
  });

  it("Voltar volta para a lista", async () => {
    const r = await renderRouter(APP, { initialUrl: "/postos/8944" });
    await fireEvent.press(await screen.findByRole("button", { name: /^UBS 05 Taguatinga/ }));
    expect(r.getPathname()).toBe("/posto/0010626");
    await fireEvent.press(await screen.findByRole("button", { name: "Voltar" }));
    expect(r.getPathname()).toBe("/postos/8944");
  });
});

// O snapshot de teste não muda sem querer.
it("fixture tem 6 postos e 10 produtos", () => {
  expect([snapshotTeste.ubs.length, snapshotTeste.produtos.length]).toEqual([6, 10]);
});
