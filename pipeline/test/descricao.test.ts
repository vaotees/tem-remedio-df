import { describe, expect, it } from "vitest";
import { separarDescricao } from "../src/transformar/descricao";
import { componentes, mesmaSubstancia } from "../src/transformar/substancia";

describe("separarDescricao (nomes reais da SES-DF)", () => {
  it.each([
    ["METFORMINA (CLORIDRATO) COMPRIMIDO 850 MG", "METFORMINA (CLORIDRATO)", "Comprimido", "850 MG"],
    ["LOSARTANA POTASSICA COMPRIMIDO REVESTIDO 50 MG", "LOSARTANA POTASSICA", "Comprimido", "50 MG"],
    ["PIRAZINAMIDA 150 MG COMPRIMIDO DISPERSIVEL - TUBERCULOSE", "PIRAZINAMIDA", "Comprimido", "150 MG"],
    ["CLONAZEPAM SOLUÇÃO ORAL 2,5 MG/ML FRASCO 20 ML", "CLONAZEPAM", "Solução oral", "2,5 MG/ML"],
    ["INSULINA HUMANA NPH SUSPENSÃO INJETÁVEL 100 UI/ML FRASCO-AMPOLA 10 ML", "INSULINA HUMANA NPH", "Injetável", "100 UI/ML"],
    [
      "AMOXICILINA + CLAVULANATO DE POTASSIO PO P/ SUSP ORAL 50 MG/ML + 12,5 MG/ML FRASCO 75 OU 100 ML",
      "AMOXICILINA + CLAVULANATO DE POTASSIO",
      "Suspensão oral",
      "50 MG/ML + 12,5 MG/ML",
    ],
    ["AMOXICILINA PO PARA SUSPENSAO ORAL 250 MG/5ML FRASCO 150 ML COM DOSEADOR", "AMOXICILINA", "Suspensão oral", "250 MG/5ML"],
    [
      "FORMOTEROL (FUMARATO) + BUDESONIDA PO INALANTE (12MCG +400MCG)/DOSE FRASCO COM 60 DOSES COM INALADOR",
      "FORMOTEROL (FUMARATO) + BUDESONIDA",
      "Inalador",
      "12MCG +400MCG",
    ],
    ["CETOCONAZOL XAMPU 2% FRASCO 100 ML", "CETOCONAZOL", "Xampu", "2%"],
    ["LIDOCAINA (CLORIDRATO) GELEIA 2 % BISNAGA 30 G", "LIDOCAINA (CLORIDRATO)", "Gel", "2 %"],
    ["TIORIDAZINA (CLORIDRATO) DRAGEA 50 MG", "TIORIDAZINA (CLORIDRATO)", "Drágea", "50 MG"],
    ["DEXAMETASONA SUSPENSÃO OFTALMICA 0,1 % FRASCO 5 ML", "DEXAMETASONA", "Colírio", "0,1 %"],
    ["BROMETO DE N BUTIL-ESCOPOLAMINA COMPRIMIDO OU DRAGEA 10MG", "BROMETO DE N BUTIL-ESCOPOLAMINA", "Comprimido", "10MG"],
  ])("%s", (descricao, substancia, forma, dose) => {
    const d = separarDescricao(descricao);
    expect(d.substancia).toBe(substancia);
    expect(d.forma).toBe(forma);
    expect(d.dose).toBe(dose);
  });

  it("detecta liberação prolongada/controlada", () => {
    expect(separarDescricao("METOPROLOL (SUCCINATO) COMPRIMIDO DE LIBERAÇÃO CONTROLADA 50 MG").liberacaoProlongada).toBe(true);
    expect(separarDescricao("GLICLAZIDA COMPRIMIDO DE LIBERACAO PROLONGADA 30 MG").liberacaoProlongada).toBe(true);
    expect(separarDescricao("METFORMINA (CLORIDRATO) COMPRIMIDO 850 MG").liberacaoProlongada).toBe(false);
  });
});

describe("componentes e mesmaSubstancia", () => {
  it("tira sais, hidratos e conectivos", () => {
    expect(componentes("CLORIDRATO DE METFORMINA")).toEqual(["METFORMINA"]);
    expect(componentes("METFORMINA (CLORIDRATO)")).toEqual(["METFORMINA"]);
    expect(componentes("AMOXICILINA TRIHIDRATADA")).toEqual(["AMOXICILINA"]);
    expect(componentes("BUDESONIDA;FUMARATO DE FORMOTEROL DI-HIDRATADO")).toEqual(["BUDESONIDA", "FORMOTEROL"]);
    expect(componentes("SALMETEROL (XINAFOATO) + FLUTICASONA (PROPIONATO)")).toEqual(["FLUTICASONA", "SALMETEROL"]);
  });

  it("casa por palavras contidas, nos dois sentidos", () => {
    expect(mesmaSubstancia(["INSULINA HUMANA"], ["INSULINA HUMANA NPH"])).toBe(true);
    expect(mesmaSubstancia(componentes("BUTILBROMETO DE ESCOPOLAMINA"), componentes("BROMETO DE N BUTIL-ESCOPOLAMINA"))).toBe(true);
  });

  it("não casa substâncias diferentes nem combinação com isolado", () => {
    expect(mesmaSubstancia(["INSULINA GLARGINA"], ["INSULINA HUMANA NPH"])).toBe(false);
    expect(mesmaSubstancia(["FORMOTEROL"], ["BUDESONIDA", "FORMOTEROL"])).toBe(false);
    expect(mesmaSubstancia(["ACIDO FOLICO"], ["ACIDO FOLINICO"])).toBe(false);
  });
});
