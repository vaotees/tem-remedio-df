import { render, screen, userEvent } from "@testing-library/react-native";
import { Botao } from "@/componentes/Botao";
import { FaixaAtualizacao } from "@/componentes/FaixaAtualizacao";
import { SeloEstoque } from "@/componentes/SeloEstoque";

describe("SeloEstoque", () => {
  it.each([
    [45, "Tem bastante"],
    [10, "Tem pouco, ligue antes"],
    [2, "Quase acabando, ligue antes"],
    [null, "Tem"],
  ])("%p dias → texto e rótulo para leitor de tela (cor nunca sozinha)", async (dias, texto) => {
    await render(<SeloEstoque dias={dias} />);
    expect(screen.getByText(texto)).toBeOnTheScreen();
    expect(screen.getByLabelText(`Estoque: ${texto}`)).toBeOnTheScreen();
  });
});

describe("Botao", () => {
  it("é anunciado como botão e responde ao toque", async () => {
    const onPress = jest.fn();
    await render(<Botao titulo="Procurar dados novos" onPress={onPress} />);
    const botao = screen.getByRole("button", { name: "Procurar dados novos" });
    await userEvent.setup().press(botao);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("não dispara de novo enquanto carrega", async () => {
    const onPress = jest.fn();
    await render(<Botao titulo="Procurar dados novos" onPress={onPress} carregando />);
    await userEvent.setup().press(screen.getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByRole("button")).toBeBusy();
  });
});

describe("FaixaAtualizacao", () => {
  const agora = new Date(2026, 9, 17, 10, 0);

  it("mostra quando os dados foram atualizados", async () => {
    await render(<FaixaAtualizacao atualizadoEm="2026-10-17T00:16:33" agora={agora} />);
    expect(screen.getByText("Dados de hoje às 00h16 · SES-DF")).toBeOnTheScreen();
    expect(screen.queryByText(/Ligue antes de ir/)).toBeNull();
  });

  it("avisa quando os dados têm mais de 2 dias", async () => {
    await render(<FaixaAtualizacao atualizadoEm="2026-10-13T00:16:33" agora={agora} />);
    expect(screen.getByText("Podem estar desatualizados. Ligue antes de ir.")).toBeOnTheScreen();
    expect(screen.getByLabelText(/ligue para a UBS antes de ir/)).toBeOnTheScreen();
  });
});
