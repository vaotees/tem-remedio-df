import { render, renderHook, screen, userEvent } from "@testing-library/react-native";
import { AccessibilityInfo, Platform, StyleSheet } from "react-native";
import { Botao } from "@/componentes/Botao";
import { FaixaAtualizacao } from "@/componentes/FaixaAtualizacao";
import { Icone } from "@/componentes/Icone";
import { SeloEstoque } from "@/componentes/SeloEstoque";
import { ESPERA_ANUNCIO_MS, useAnuncio } from "@/util/anuncio";

/** Num texto dentro de uma linha (ícone + texto), sem encolher ele vaza para fora da tela com letra grande. */
const quebraLinha = (texto: string) => StyleSheet.flatten(screen.getByText(texto).props.style).flexShrink;

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

describe("Icone", () => {
  it("fica escondido do leitor de tela (é enfeite: o texto ao lado diz o que é)", async () => {
    await render(<Icone name="heart" size={24} color="#000" />);
    expect(screen.queryByTestId("icone-heart")).toBeNull();
    expect(screen.getByTestId("icone-heart", { includeHiddenElements: true })).toBeTruthy();
  });
});

describe("letra grande", () => {
  it("o título do botão quebra linha dentro do botão", async () => {
    await render(<Botao titulo="Guardado em Meus remédios" icone="heart" onPress={() => {}} />);
    expect(quebraLinha("Guardado em Meus remédios")).toBe(1);
  });

  it("o texto do semáforo quebra linha dentro do selo", async () => {
    await render(<SeloEstoque dias={2} />);
    expect(quebraLinha("Quase acabando, ligue antes")).toBe(1);
    expect(StyleSheet.flatten(screen.getByTestId("selo-critico").props.style).maxWidth).toBe("100%");
  });
});

describe("useAnuncio", () => {
  beforeEach(() => {
    // O AccessibilityInfo do React Native já é um mock único: sem limpar, as chamadas de um teste passam para o outro.
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => {});
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("no iPhone, anuncia só depois que o texto para de mudar", async () => {
    const { rerender } = await renderHook(({ m }: { m: string | null }) => useAnuncio(m), { initialProps: { m: "2 remédios encontrados" } });
    await rerender({ m: "1 remédio encontrado" });
    jest.advanceTimersByTime(ESPERA_ANUNCIO_MS - 1);
    expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledTimes(1);
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith("1 remédio encontrado");
    // Uma vez só: nada fica agendado depois do anúncio.
    jest.advanceTimersByTime(ESPERA_ANUNCIO_MS * 3);
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledTimes(1);
  });

  it("sem mensagem, não anuncia", async () => {
    await renderHook(() => useAnuncio(null));
    jest.advanceTimersByTime(ESPERA_ANUNCIO_MS * 2);
    expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();
  });

  it.each(["android", "web"] as const)("no %s, não anuncia: o accessibilityLiveRegion do texto já faz isso", async (os) => {
    jest.replaceProperty(Platform, "OS", os);
    await renderHook(() => useAnuncio("1 remédio encontrado"));
    jest.advanceTimersByTime(ESPERA_ANUNCIO_MS * 2);
    expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();
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
