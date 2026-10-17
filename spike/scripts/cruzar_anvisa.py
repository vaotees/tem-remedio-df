"""Testa o "tradutor": nome comercial (CMED/Anvisa) -> substância -> produtos da SES-DF.

Uso: python3 -I scripts/cruzar_anvisa.py <estoque.sqlite> <TA_PRECO_MEDICAMENTO.csv> <DADOS_ABERTOS_MEDICAMENTOS.csv>
"""
import collections
import csv
import json
import re
import sqlite3
import sys
import unicodedata

# Palavras que marcam onde termina o nome da substância na descrição da SES-DF.
FORMAS = (
    "COMPRIMIDO|CAPSULA|CÁPSULA|SOLUCAO|SOLUÇÃO|SOLUÇAO|SUSPENSAO|SUSPENSÃO|XAROPE|CREME|POMADA|GEL|"
    "AEROSSOL|PO |PÓ |INJETAVEL|INJETÁVEL|ADESIVO|GOMA|PASTILHA|DRAGEA|DRÁGEA|ELIXIR|EMULSAO|EMULSÃO|"
    "LOCAO|LOÇÃO|SHAMPOO|OVULO|ÓVULO|SUPOSITORIO|SUPOSITÓRIO|ENEMA|FRASCO|AMPOLA|TUBO|BISNAGA|GOTAS|SPRAY|"
    "TINTURA|CAPS|COMP|SOL |SUSP|CPR|ENVELOPE|SACHE|SACHÊ|INALANTE|INALATÓRIO|PÓ"
)
RE_SUBST = re.compile(rf"^(.*?)(?:\b(?:{FORMAS})\b|\d)", re.IGNORECASE)
# Sais e palavras de ligação que não mudam qual é a substância.
SAIS = {
    "CLORIDRATO", "DICLORIDRATO", "MALEATO", "SODICA", "SODICO", "POTASSICA", "POTASSICO", "SUCCINATO",
    "TARTARATO", "BESILATO", "MESILATO", "ACETATO", "SULFATO", "FOSFATO", "CITRATO", "BROMIDRATO",
    "BROMETO", "FUMARATO", "HEMIFUMARATO", "VALERATO", "PROPIONATO", "DIPROPIONATO", "DE", "DO", "DA",
    "MONOIDRATADO", "MONOIDRATADA", "DI-HIDRATADO", "TRI-HIDRATADO", "TRIIDRATADA", "CALCICA", "CALCICO",
    "HIDROCLORIDRATO", "NITRATO", "ESTOLATO", "DIIDRATADO", "HIDRATADO", "BENZOATO", "DECANOATO",
    "CARBONATO", "MAGNESICO", "LACTATO", "GLUCONATO", "OXALATO", "EQUIVALENTE", "A", "BASE", "E",
}


def norm(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().upper()
    return re.sub(r"[^A-Z0-9+ ]", " ", s)


def componentes(subst):
    """'cloridrato de metformina' -> frozenset({'METFORMINA'}); combinações viram vários itens."""
    partes = re.split(r"\+|,| E (?=[A-Z])", norm(subst))
    out = []
    for p in partes:
        palavras = [w for w in p.split() if w not in SAIS and not w.isdigit()]
        if palavras:
            out.append(" ".join(palavras))
    return frozenset(out)


def subst_ses(descr):
    m = RE_SUBST.match(descr + " 0")
    base = m.group(1) if m else descr
    base = re.sub(r"\(.*?\)", " ", base)  # tira '(CLORIDRATO)'
    return componentes(base)


def main(db_path, cmed_path, registro_path):
    db = sqlite3.connect(db_path)
    ses = db.execute(
        "SELECT cod, descr FROM produtos WHERE grupo IN ('UBS','Compenente Especializado','Média Complexidade')"
    ).fetchall()
    ses_por_subst = collections.defaultdict(list)
    for cod, descr in ses:
        ses_por_subst[subst_ses(descr)].append(descr)

    # CMED: marca -> substâncias e apresentações; EAN -> (marca, substância, apresentação)
    marca = collections.defaultdict(set)
    apresent = collections.defaultdict(set)
    ean = {}
    with open(cmed_path, encoding="utf-8-sig") as f:
        r = csv.reader(f, delimiter=";")
        next(r)
        for row in r:
            subst, produto, apr = row[0], row[8], row[9]
            k = norm(produto).strip()
            marca[k].add(componentes(subst))
            apresent[k].add(apr.strip())
            for e in row[5:8]:
                if e.strip() and e.strip() != "-":
                    ean[e.strip()] = (produto, subst, apr.strip())
    # Registro Anvisa: complementa marcas que não estão na CMED (ex.: registros antigos).
    marca_reg = collections.defaultdict(set)
    with open(registro_path, encoding="latin-1") as f:
        for row in csv.DictReader(f, delimiter=";"):
            if row["PRINCIPIO_ATIVO"]:
                marca_reg[norm(row["NOME_PRODUTO"]).strip()].add(componentes(row["PRINCIPIO_ATIVO"]))

    # 1) Quantos produtos da SES têm a substância reconhecida na CMED?
    subst_cmed = set().union(*marca.values())
    reconhecidos = [s for s in ses_por_subst if s in subst_cmed]
    print(f"Substâncias distintas na SES (UBS+especializado+média): {len(ses_por_subst)}")
    print(f"  reconhecidas na CMED: {len(reconhecidos)} ({100*len(reconhecidos)//len(ses_por_subst)}%)")
    nao = sorted(" + ".join(sorted(s)) for s in ses_por_subst if s not in subst_cmed)
    print("  exemplos não reconhecidos:", nao[:25])

    # 2) Teste com marcas que idosos costumam falar.
    marcas_teste = [
        "GLIFAGE", "GLIFAGE XR", "ASPIRINA", "AAS", "PURAN T4", "SYNTHROID", "EUTHYROX", "SELOZOK",
        "COZAAR", "ARADOIS", "RIVOTRIL", "LASIX", "HIGROTON", "ATENOL", "RENITEC", "CAPOTEN", "NORVASC",
        "ALDACTONE", "MAREVAN", "TAPAZOL", "DEPAKENE", "GARDENAL", "TEGRETOL", "PROZAC", "ZOLOFT",
        "TRYPTANOL", "LOSEC", "PLASIL", "BUSCOPAN", "DRAMIN", "NOVALGINA", "TYLENOL", "AMOXIL",
        "ZOCOR", "DIAMICRON", "HUMULIN N", "NOVOLIN N", "ALENIA", "SERETIDE", "BEROTEC", "AEROLIN",
        "PREDSIM", "MERONEM", "SINVASTACOR", "LOSARTEC", "DAONIL",
    ]
    resultado = []
    for m in marcas_teste:
        k = norm(m).strip()
        substs = marca.get(k) or marca_reg.get(k) or set()
        fonte = "CMED" if k in marca else ("registro" if k in marca_reg else "-")
        achados = sorted({d for s in substs for d in ses_por_subst.get(s, [])})
        resultado.append({
            "marca": m, "fonte": fonte,
            "substancias": sorted(" + ".join(sorted(s)) for s in substs),
            "apresentacoes_exemplo": sorted(apresent.get(k, []))[:3],
            "no_sus_df": achados[:4],
        })
    ok = sum(1 for x in resultado if x["no_sus_df"])
    print(f"\nMarcas testadas: {len(resultado)}; com equivalente no SUS-DF: {ok}")
    for x in resultado:
        sus = "; ".join(x["no_sus_df"][:2]) or "—"
        print(f"  {x['marca']:<12} [{x['fonte']:<8}] {', '.join(x['substancias'])[:45]:<45} -> {sus[:110]}")

    # 3) Código de barras: exemplo.
    print("\nEANs na CMED:", len(ean), "| exemplo 7891721027437 ->", ean.get("7891721027437"))
    json.dump(resultado, open("raw/teste_marcas.json", "w"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main(*sys.argv[1:4])
