import { fireEvent, renderRouter, screen } from "expo-router/testing-library";

// Sem cache gravado: o app abre com o snapshot embutido.
jest.mock("@/dados/armazenamento", () => ({
  armazenamento: { ler: async () => null, gravar: async () => {} },
}));

// Caminho relativo à pasta onde o Jest roda (o `pnpm test` roda dentro de apps/mobile).
const APP = "src/app";

// Renderiza o app inteiro e valida o snapshot embutido (~0,5 MB): mais lento que um teste de componente.
jest.setTimeout(30_000);

describe("navegação", () => {
  it("abre na busca com os dados embutidos", async () => {
    const r = await renderRouter(APP, { initialUrl: "/" });
    expect(r.getPathname()).toBe("/");
    expect(await screen.findByText("Qual remédio você procura?")).toBeOnTheScreen();
    expect(screen.getByLabelText("Nome do remédio")).toBeOnTheScreen();
    expect(await screen.findByText(/farmácias de UBS e \d+ remédios/)).toBeOnTheScreen();
    expect(screen.getByText(/· SES-DF/)).toBeOnTheScreen();
  });

  it("as três abas têm rótulo visível e levam às telas", async () => {
    const r = await renderRouter(APP, { initialUrl: "/" });
    await screen.findByText("Qual remédio você procura?");

    await fireEvent.press(screen.getByText("Ajuda"));
    expect(r.getPathname()).toBe("/ajuda");
    expect(await screen.findByText("De onde vêm os dados")).toBeOnTheScreen();
    expect(screen.getByText("O que levar na UBS")).toBeOnTheScreen();
    expect(screen.getByText("Tem bastante")).toBeOnTheScreen();
    expect(screen.getByText(/Dados que vieram com o app/)).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Meus remédios" }));
    expect(r.getPathname()).toBe("/meus-remedios");
    expect(await screen.findByText("Guarde os remédios que você usa")).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Buscar um remédio" }));
    expect(r.getPathname()).toBe("/");
  });

  it("fluxo completo com os dados de verdade: busca → postos → detalhe", async () => {
    const r = await renderRouter(APP, { initialUrl: "/" });
    await fireEvent.changeText(await screen.findByLabelText("Nome do remédio"), "losartana");
    await fireEvent.press(await screen.findByRole("button", { name: /^Losartana potassica/ }));
    expect(r.getPathname()).toMatch(/^\/postos\//);

    // Sem GPS no teste: a lista vai por região, 10 postos de cada vez.
    expect(await screen.findByText(/^\d+ postos têm hoje$/)).toBeOnTheScreen();
    expect(screen.getAllByRole("button", { name: /^UBS / })).toHaveLength(10);
    await fireEvent.press(screen.getByRole("button", { name: "Mostrar mais postos" }));
    expect(screen.getAllByRole("button", { name: /^UBS / })).toHaveLength(20);

    await fireEvent.press(screen.getAllByRole("button", { name: /^UBS / })[0]!);
    expect(r.getPathname()).toMatch(/^\/posto\/\d{7}$/);
    expect(await screen.findByRole("button", { name: "Como chegar" })).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Enviar no WhatsApp" })).toBeOnTheScreen();
  });
});
