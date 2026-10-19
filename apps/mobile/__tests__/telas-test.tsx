import { fireEvent, renderRouter, screen, within } from "expo-router/testing-library";
import { AccessibilityInfo, Linking, Share } from "react-native";
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

// Arquivos do aparelho (região escolhida) em memória.
const mockArquivos = new Map<string, string>();
jest.mock("@/dados/armazenamento", () => ({
  armazenamento: {
    ler: async (nome: string) => mockArquivos.get(nome) ?? null,
    gravar: async (nome: string, conteudo: string) => void mockArquivos.set(nome, conteudo),
  },
}));
const regiaoSalva = () => JSON.parse(mockArquivos.get("regiao.json") ?? "null") as unknown;

// O mapa de verdade (com o react-native-maps simulado no jest.setup) ou o substituto da web.
const mockMapa = { web: false };
type MockModulo = typeof import("@/componentes/MapaPostos");
jest.mock("@/componentes/MapaPostos", () => {
  const nativo = jest.requireActual<MockModulo>("@/componentes/MapaPostos");
  const web = jest.requireActual<MockModulo>("@/componentes/MapaPostos.web");
  return {
    get MAPA_DISPONIVEL() {
      return mockMapa.web ? web.MAPA_DISPONIVEL : nativo.MAPA_DISPONIVEL;
    },
    MapaPostos: (props: Parameters<MockModulo["MapaPostos"]>[0]) =>
      mockMapa.web ? <web.MapaPostos {...props} /> : <nativo.MapaPostos {...props} />,
  };
});

// GPS de mentira: cada teste diz se há permissão, onde a pessoa está e se o GPS responde.
// Funções comuns (não jest.fn) para o restoreAllMocks não apagar a implementação.
type Permissao = { granted: boolean; canAskAgain: boolean; status: string };
const PERMITIDO: Permissao = { granted: true, canAskAgain: true, status: "granted" };
const mockGps = {
  permissao: PERMITIDO,
  /** O que a pessoa responde quando o celular pergunta. */
  resposta: PERMITIDO,
  /** Quantas vezes o celular mostrou o pedido de permissão. */
  pedidos: 0,
  posicao: { coords: { latitude: -15.7801, longitude: -47.9292 } },
  desligado: false,
};
jest.mock("expo-location", () => ({
  Accuracy: { Balanced: 3 },
  PermissionStatus: { GRANTED: "granted", UNDETERMINED: "undetermined", DENIED: "denied" },
  getForegroundPermissionsAsync: async () => mockGps.permissao,
  requestForegroundPermissionsAsync: async () => {
    mockGps.pedidos += 1;
    mockGps.permissao = mockGps.resposta;
    return mockGps.permissao;
  },
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
  // O Linking do React Native já é um mock único: sem limpar, as chamadas de um teste passam para o outro.
  jest.clearAllMocks();
  mockArquivos.clear();
  mockMapa.web = false;
  mockGps.permissao = PERMITIDO;
  mockGps.resposta = PERMITIDO;
  mockGps.pedidos = 0;
  mockGps.posicao = { coords: { latitude: NO_PLANO_PILOTO.lat, longitude: NO_PLANO_PILOTO.lng } };
  mockGps.desligado = false;
  jest.spyOn(Linking, "openURL").mockResolvedValue(true);
  jest.spyOn(Linking, "openSettings").mockResolvedValue(undefined);
  jest.spyOn(Share, "share").mockResolvedValue({ action: Share.sharedAction });
  jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => {});
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
    expect(screen.getByText(/por Região Administrativa\. Escolha a sua para ver primeiro os postos perto de você/)).toBeOnTheScreen();
    expect(postosNaTela()).toEqual(["UBS 3 Ceilandia", "UBS 1 Asa Norte", "UBS 01 Samambaia", "UBS 05 Taguatinga"]);
    expect(screen.getByRole("header", { name: "Ceilândia" })).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Escolher minha região" })).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Permitir nos ajustes" }));
    expect(Linking.openSettings).toHaveBeenCalled();
    expect(mockGps.pedidos).toBe(0);
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

describe("região escolhida", () => {
  const NUNCA_PERGUNTADO: Permissao = { granted: false, canAskAgain: true, status: "undetermined" };

  it("primeira vez: pergunta antes de pedir a localização ao celular", async () => {
    mockGps.permissao = NUNCA_PERGUNTADO;
    await renderRouter(APP, { initialUrl: "/postos/8944" });

    expect(await screen.findByText("Como achar os postos perto de você?")).toBeOnTheScreen();
    expect(screen.getByText("A localização e a região ficam só neste celular.")).toBeOnTheScreen();
    expect(screen.queryAllByRole("button", { name: /^UBS / })).toHaveLength(0);
    expect(mockGps.pedidos).toBe(0);

    await fireEvent.press(screen.getByRole("button", { name: "Usar minha localização" }));
    expect(await screen.findByText("Do mais perto para o mais longe de você, em linha reta.")).toBeOnTheScreen();
    expect(mockGps.pedidos).toBe(1);
    expect(postosNaTela()[0]).toBe("UBS 1 Asa Norte");
  });

  it("navegador sem localização: não pergunta, oferece a região", async () => {
    mockGps.permissao = { granted: false, canAskAgain: false, status: "undetermined" };
    await renderRouter(APP, { initialUrl: "/postos/8944" });
    expect(await screen.findByText("Sem a sua localização")).toBeOnTheScreen();
    expect(screen.queryByText("Como achar os postos perto de você?")).toBeNull();
    expect(screen.getByRole("button", { name: "Escolher minha região" })).toBeOnTheScreen();
  });

  it("primeira vez: escolhe a região numa lista grande e volta com a região primeiro", async () => {
    mockGps.permissao = NUNCA_PERGUNTADO;
    const r = await renderRouter(APP, { initialUrl: "/postos/8944" });
    await fireEvent.press(await screen.findByRole("button", { name: "Escolher minha região" }));

    expect(r.getPathname()).toBe("/regiao");
    expect(await screen.findByText("Qual é a sua região?")).toBeOnTheScreen();
    const regioes = screen.getAllByRole("button").filter((b) => b.props.accessibilityState?.selected !== undefined);
    expect(regioes).toHaveLength(35);
    expect(screen.getByRole("button", { name: /^Plano Piloto\. Asa Norte, Asa Sul/ })).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Taguatinga" }));
    expect(r.getPathname()).toBe("/postos/8944");
    expect(await screen.findByText("Sua região: Taguatinga")).toBeOnTheScreen();
    expect(postosNaTela()).toEqual(["UBS 05 Taguatinga", "UBS 3 Ceilandia", "UBS 01 Samambaia", "UBS 1 Asa Norte"]);
    expect(screen.getByRole("header", { name: "Taguatinga" })).toBeOnTheScreen();
    expect(screen.getByRole("header", { name: "Outras regiões, da mais perto para a mais longe" })).toBeOnTheScreen();
    // Sem localização, a distância não aparece (o centro da região não é onde a pessoa está).
    expect(screen.queryByText(/ km$/)).toBeNull();
    // Guardada só no aparelho, e o celular nem chegou a pedir a localização.
    expect(regiaoSalva()).toEqual({ ra: "Taguatinga", usarRegiao: true });
    expect(mockGps.pedidos).toBe(0);
  });

  it("região salva: abre já por ela, mesmo com GPS; dá para trocar e para voltar à localização", async () => {
    mockArquivos.set("regiao.json", JSON.stringify({ ra: "Samambaia", usarRegiao: true }));
    const r = await renderRouter(APP, { initialUrl: "/postos/8944" });

    expect(await screen.findByText("Sua região: Samambaia")).toBeOnTheScreen();
    expect(postosNaTela()[0]).toBe("UBS 01 Samambaia");

    await fireEvent.press(screen.getByRole("button", { name: "Trocar minha região" }));
    expect(r.getPathname()).toBe("/regiao");
    const atual = await screen.findByRole("button", { name: "Samambaia. Sua região agora" });
    expect(atual.props.accessibilityState).toEqual({ selected: true });
    await fireEvent.press(screen.getByRole("button", { name: "Plano Piloto. Asa Norte, Asa Sul, Noroeste, Vila Planalto" }));
    expect(await screen.findByText("Sua região: Plano Piloto")).toBeOnTheScreen();
    expect(postosNaTela()[0]).toBe("UBS 1 Asa Norte");

    await fireEvent.press(screen.getByRole("button", { name: "Usar minha localização" }));
    expect(await screen.findByText("Do mais perto para o mais longe de você, em linha reta.")).toBeOnTheScreen();
    expect(regiaoSalva()).toEqual({ ra: "Plano Piloto", usarRegiao: false });
  });

  it("GPS falhou: usa a região guardada", async () => {
    mockGps.desligado = true;
    mockArquivos.set("regiao.json", JSON.stringify({ ra: "Taguatinga", usarRegiao: false }));
    await renderRouter(APP, { initialUrl: "/postos/8944" });

    expect(await screen.findByText("Não consegui achar sua localização")).toBeOnTheScreen();
    expect(screen.getByText("Sua região: Taguatinga. Primeiro os postos dela, depois os das regiões mais perto.")).toBeOnTheScreen();
    expect(postosNaTela()[0]).toBe("UBS 05 Taguatinga");
    expect(screen.getByRole("button", { name: "Trocar minha região" })).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Tentar de novo" })).toBeOnTheScreen();
  });

  it("região sem posto com o remédio: avisa e mostra os mais perto dela", async () => {
    mockArquivos.set("regiao.json", JSON.stringify({ ra: "Sol Nascente/Pôr do Sol", usarRegiao: true }));
    await renderRouter(APP, { initialUrl: "/postos/8944" });
    expect(
      await screen.findByText("Nenhum posto da sua região (Sol Nascente/Pôr do Sol) tem hoje. Abaixo, os das regiões mais perto."),
    ).toBeOnTheScreen();
    expect(postosNaTela()[0]).toBe("UBS 3 Ceilandia");
  });

  it("pela aba Ajuda: escolhe a região e volta para a Ajuda", async () => {
    const r = await renderRouter(APP, { initialUrl: "/ajuda" });
    expect(await screen.findByText("Postos perto de você")).toBeOnTheScreen();
    expect(screen.getByText(/Sem ela, você pode escolher a sua região\./)).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Escolher minha região" }));
    expect(r.getPathname()).toBe("/regiao");
    await fireEvent.press(await screen.findByRole("button", { name: "Gama" }));

    expect(r.getPathname()).toBe("/ajuda");
    expect(await screen.findByText("Sua região: Gama.")).toBeOnTheScreen();
    expect(regiaoSalva()).toEqual({ ra: "Gama", usarRegiao: true });

    await fireEvent.press(screen.getByRole("button", { name: "Usar minha localização" }));
    expect(await screen.findByText(/Sem ela, primeiro os da sua região \(Gama\)\./)).toBeOnTheScreen();
    expect(regiaoSalva()).toEqual({ ra: "Gama", usarRegiao: false });
  });
});

describe("mapa", () => {
  const pinos = () => screen.getAllByTestId(/^pino-\d{7}$/);

  it("alterna entre lista e mapa, com os mesmos postos e o cartão do mais perto", async () => {
    await renderRouter(APP, { initialUrl: "/postos/8944" });
    const lista = await screen.findByRole("tab", { name: "Lista" });
    expect(lista.props.accessibilityState).toEqual({ selected: true });

    await fireEvent.press(screen.getByRole("tab", { name: "Mapa" }));
    expect(screen.getByRole("tab", { name: "Mapa" }).props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByLabelText("Mapa com 4 postos que têm hoje.")).toBeOnTheScreen();
    expect(pinos()).toHaveLength(4);
    expect(screen.queryAllByRole("button", { name: /^UBS / })).toHaveLength(0);
    // O leitor de tela anuncia quantos postos há no mapa.
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
      "Mapa com 4 postos que têm hoje. Embaixo do mapa, o mais perto de você.",
    );

    // Pino com o ícone do semáforo; o cartão tem cor, ícone e texto.
    expect(within(screen.getByTestId("pino-0010707")).getByTestId("icone-warning", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByText("O mais perto de você")).toBeOnTheScreen();
    expect(screen.getByText("UBS 1 Asa Norte")).toBeOnTheScreen();
    expect(screen.getByLabelText("Estoque: Quase acabando, ligue antes")).toBeOnTheScreen();
    // Legenda com os quatro níveis que aparecem no mapa.
    for (const texto of ["Tem bastante", "Tem pouco, ligue antes", "Quase acabando, ligue antes", "Tem"]) {
      expect(screen.getAllByText(texto).length).toBeGreaterThan(0);
    }

    await fireEvent.press(screen.getByRole("tab", { name: "Lista" }));
    expect(postosNaTela()).toEqual(["UBS 1 Asa Norte", "UBS 05 Taguatinga", "UBS 01 Samambaia", "UBS 3 Ceilandia"]);
  });

  it("tocar no pino mostra o posto; Ver o próximo anda pela lista; Ver posto abre o detalhe", async () => {
    const r = await renderRouter(APP, { initialUrl: "/postos/8944" });
    await fireEvent.press(await screen.findByRole("tab", { name: "Mapa" }));

    await fireEvent.press(screen.getByTestId("pino-0010642"));
    expect(screen.getByText("3º mais perto de você")).toBeOnTheScreen();
    expect(screen.getByText("UBS 01 Samambaia")).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Ver o próximo mais perto" }));
    expect(screen.getByText("4º mais perto de você")).toBeOnTheScreen();
    expect(screen.getByText("UBS 3 Ceilandia")).toBeOnTheScreen();
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenLastCalledWith(expect.stringMatching(/^UBS 3 Ceilandia\. Ceilândia/));

    await fireEvent.press(screen.getByRole("button", { name: "Voltar ao primeiro" }));
    expect(screen.getByText("O mais perto de você")).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId("pino-0010626"));
    await fireEvent.press(screen.getByRole("button", { name: "Ver posto" }));
    expect(r.getPathname()).toBe("/posto/0010626");
    expect(await screen.findByText("UBS 05 Taguatinga")).toBeOnTheScreen();

    // Voltar volta para o mapa, que continua escolhido.
    await fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
    expect(r.getPathname()).toBe("/postos/8944");
    expect((await screen.findByRole("tab", { name: "Mapa" })).props.accessibilityState).toEqual({ selected: true });
  });

  it("mesmo filtro de retirada da lista: controlado só nas UBSs que entregam", async () => {
    await renderRouter(APP, { initialUrl: "/postos/90007" });
    await fireEvent.press(await screen.findByRole("tab", { name: "Mapa" }));
    expect(pinos().map((p) => p.props.testID)).toEqual(["pino-0010707", "pino-0010626"]);
    expect(screen.getByLabelText("Mapa com 2 postos que têm hoje.")).toBeOnTheScreen();
  });

  it("pela região: o cartão diz a posição na lista", async () => {
    mockArquivos.set("regiao.json", JSON.stringify({ ra: "Taguatinga", usarRegiao: true }));
    await renderRouter(APP, { initialUrl: "/postos/8944" });
    await fireEvent.press(await screen.findByRole("tab", { name: "Mapa" }));
    expect(screen.getByText("Posto 1 de 4")).toBeOnTheScreen();
    expect(screen.getByText("UBS 05 Taguatinga")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Ver o próximo da lista" })).toBeOnTheScreen();
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
      "Mapa com 4 postos que têm hoje. Embaixo do mapa, o primeiro da lista.",
    );
  });

  it("na web: só a lista, com um aviso discreto, e a navegação continua funcionando", async () => {
    mockMapa.web = true;
    const r = await renderRouter(APP, { initialUrl: "/postos/8944" });
    expect(await screen.findByText("O mapa dos postos aparece no app do celular. Aqui no navegador, só a lista.")).toBeOnTheScreen();
    expect(screen.queryByRole("tab", { name: "Mapa" })).toBeNull();
    expect(postosNaTela()).toHaveLength(4);

    await fireEvent.press(screen.getByRole("button", { name: /^UBS 05 Taguatinga/ }));
    expect(r.getPathname()).toBe("/posto/0010626");
    await fireEvent.press(await screen.findByRole("button", { name: "Voltar" }));
    expect(r.getPathname()).toBe("/postos/8944");
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

  it("Como chegar pergunta qual app de mapa usar", async () => {
    await renderRouter(APP, { initialUrl: "/posto/0010626?produto=8944" });
    const comoChegar = await screen.findByRole("button", { name: "Como chegar" });

    // No iPhone: Mapas, Google Maps e Waze.
    await fireEvent.press(comoChegar);
    expect(screen.getByText("Abrir o caminho com qual app?")).toBeOnTheScreen();
    expect(Linking.openURL).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole("button", { name: "Waze" }));
    expect(Linking.openURL).toHaveBeenLastCalledWith("https://waze.com/ul?ll=-15.851049,-48.047118&navigate=yes");
    expect(screen.queryByText("Abrir o caminho com qual app?")).toBeNull();

    await fireEvent.press(comoChegar);
    await fireEvent.press(screen.getByRole("button", { name: "Mapas" }));
    expect(Linking.openURL).toHaveBeenLastCalledWith(
      "https://maps.apple.com/?daddr=-15.851049,-48.047118&q=UBS%2005%20Taguatinga",
    );

    await fireEvent.press(comoChegar);
    await fireEvent.press(screen.getByRole("button", { name: "Google Maps" }));
    expect(Linking.openURL).toHaveBeenLastCalledWith(
      "https://www.google.com/maps/dir/?api=1&destination=-15.851049,-48.047118",
    );

    await fireEvent.press(comoChegar);
    await fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));
    expect(Linking.openURL).toHaveBeenCalledTimes(3);
    expect(screen.queryByText("Abrir o caminho com qual app?")).toBeNull();
  });

  it("Ligar e Enviar no WhatsApp (abre o WhatsApp direto, já com a mensagem)", async () => {
    await renderRouter(APP, { initialUrl: "/posto/0010626?produto=8944" });

    await fireEvent.press(await screen.findByRole("button", { name: "Ligar" }));
    expect(Linking.openURL).toHaveBeenLastCalledWith("tel:+556135639176");

    await fireEvent.press(screen.getByRole("button", { name: "Enviar no WhatsApp" }));
    const url = (Linking.openURL as jest.Mock).mock.lastCall[0] as string;
    expect(url).toMatch(/^whatsapp:\/\/send\?text=/);
    const mensagem = decodeURIComponent(url.split("text=")[1]!);
    expect(mensagem).toContain("Losartana potassica, comprimido 50 mg\nUBS 05 Taguatinga\nSETOR D SUL AE 23");
    expect(mensagem).toContain("Ligue antes de ir.");
    expect(Share.share).not.toHaveBeenCalled();
  });

  it("sem WhatsApp no celular: oferece a folha de compartilhar", async () => {
    jest.spyOn(Linking, "openURL").mockRejectedValue(new Error("Unable to open URL"));
    await renderRouter(APP, { initialUrl: "/posto/0010626?produto=8944" });

    await fireEvent.press(await screen.findByRole("button", { name: "Enviar no WhatsApp" }));
    expect(Share.share).toHaveBeenCalledWith({ message: expect.stringContaining("UBS 05 Taguatinga") });
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
