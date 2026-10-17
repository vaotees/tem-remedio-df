import { diasDesde, formatarAtualizacao } from "@/util/datas";

const agora = new Date(2026, 9, 17, 10, 30); // 17/10/2026 10:30, horário do aparelho

describe("formatarAtualizacao", () => {
  it("diz hoje, ontem ou a data", () => {
    expect(formatarAtualizacao("2026-10-17T00:16:33", agora)).toBe("hoje às 00h16");
    expect(formatarAtualizacao("2026-10-16T13:30:00", agora)).toBe("ontem às 13h30");
    expect(formatarAtualizacao("2026-10-05T00:15:00", agora)).toBe("05/10 às 00h15");
  });

  it("vira o mês corretamente", () => {
    expect(formatarAtualizacao("2026-09-30T23:59:00", new Date(2026, 9, 1, 8))).toBe("ontem às 23h59");
  });
});

describe("diasDesde", () => {
  it("conta dias de calendário", () => {
    expect(diasDesde("2026-10-17T00:16:33", agora)).toBe(0);
    expect(diasDesde("2026-10-16T23:59:00", agora)).toBe(1);
    expect(diasDesde("2026-10-14T00:16:33", agora)).toBe(3);
  });
});
