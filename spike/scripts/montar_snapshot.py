"""Monta um snapshot de exemplo (só farmácias de UBS, só remédios) e mede tamanho e semáforo.

Uso: python3 -I scripts/montar_snapshot.py <estoque.sqlite> <ubs_cnes.json> <saida.json>
"""
import collections
import gzip
import json
import sqlite3
import sys

GRUPOS = ("UBS", "Compenente Especializado", "Média Complexidade", "Injetáveis")


def faixa(dias):
    if dias is None:
        return "sem consumo"
    if dias < 7:
        return "vermelho (< 7 dias)"
    if dias < 30:
        return "amarelo (7 a 30 dias)"
    return "verde (30+ dias)"


def main(db_path, cnes_path, saida):
    db = sqlite3.connect(db_path)
    cnes = json.load(open(cnes_path))
    meta = dict(db.execute("SELECT chave, valor FROM meta"))

    linhas = db.execute(
        f"""SELECT cnes, i_cod_local_estoque, i_desc_local_estoque, i_desc_regiao_saude, i_desc_radf,
                   i_cod_produto, i_desc_produto, i_grupo, psicotropico, i_qtd_rede, i_cmml
            FROM estoque
            WHERE i_qtd_rede > 0 AND i_desc_local_estoque NOT LIKE 'ALMOX%'
              AND i_grupo IN ({','.join('?' * len(GRUPOS))})""",
        GRUPOS,
    ).fetchall()

    ubs_idx, prod_idx = {}, {}
    ubs, produtos, estoque = [], [], []
    faixas = collections.Counter()
    faixas_ubs = collections.Counter()
    for (cod_cnes, cod_local, local, regiao, ra, cod_prod, descr, grupo, psico, qtd, cmm) in linhas:
        if cod_local not in ubs_idx:
            c = cnes.get(cod_cnes, {})
            ubs_idx[cod_local] = len(ubs)
            ubs.append({
                "cnes": cod_cnes.zfill(7), "nome": c.get("nome_fantasia"), "farmacia": local,
                "regiao": regiao, "ra": ra,
                "endereco": f"{c.get('endereco_estabelecimento')}, {c.get('bairro_estabelecimento')}",
                "tel": c.get("numero_telefone_estabelecimento"),
                "lat": c.get("latitude_estabelecimento_decimo_grau"),
                "lng": c.get("longitude_estabelecimento_decimo_grau"),
            })
        if cod_prod not in prod_idx:
            prod_idx[cod_prod] = len(produtos)
            produtos.append({"cod": cod_prod, "descr": descr, "grupo": grupo, "controlado": psico == "Psicotrópicos"})
        cmm = float(str(cmm).replace(",", ".")) if cmm not in (None, "") else None
        dias = round(qtd / (cmm / 30)) if cmm else None
        faixas[faixa(dias)] += 1
        if grupo == "UBS":
            faixas_ubs[faixa(dias)] += 1
        estoque.append([ubs_idx[cod_local], prod_idx[cod_prod], qtd, cmm])

    snap = {
        "meta": {"atualizadoEm": meta["data_extracao"], "fonte": "SES-DF / InfoSaúde"},
        "ubs": ubs, "produtos": produtos,
        "estoque": estoque,  # [ubs, produto, quantidade, consumo médio mensal]
    }
    bruto = json.dumps(snap, ensure_ascii=False, separators=(",", ":")).encode()
    with open(saida, "wb") as f:
        f.write(bruto)
    print(f"Farmácias: {len(ubs)} | produtos: {len(produtos)} | pares com estoque: {len(estoque)}")
    print(f"Tamanho: {len(bruto)/1024:.0f} KB em JSON | {len(gzip.compress(bruto))/1024:.0f} KB com gzip")
    print("Semáforo (todos os grupos):", dict(faixas))
    print("Semáforo (grupo UBS):", dict(faixas_ubs))
    sem_coord = [u["nome"] for u in ubs if not u["lat"]]
    fora_df = [u["nome"] for u in ubs if u["lat"] and not (-16.1 < u["lat"] < -15.4 and -48.4 < u["lng"] < -47.2)]
    print("Sem coordenada:", sem_coord, "| coordenada fora do DF:", fora_df)


if __name__ == "__main__":
    main(*sys.argv[1:4])
