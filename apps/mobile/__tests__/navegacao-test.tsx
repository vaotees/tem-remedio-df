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

    await fireEvent.press(screen.getByText("Meus remédios"));
    expect(r.getPathname()).toBe("/meus-remedios");
    expect(await screen.findByText("Guarde os remédios que você usa")).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Buscar um remédio" }));
    expect(r.getPathname()).toBe("/");
  });
});
