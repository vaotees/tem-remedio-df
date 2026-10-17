"""Extrai o estoque completo do painel 'Estoque de Medicamentos nas UBS - SES/DF' para SQLite.

Uso: python3 -I scripts/extrair.py <arquivo.sqlite>
"""
import datetime
import os
import sqlite3
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import powerbi  # noqa: E402

COLUNAS = [
    "cnes", "i_desc_sigla_estab_cnes", "i_sigla_estab_cnes",
    "i_cod_local_estoque", "i_desc_local_estoque",
    "i_tipo_unidade", "i_nivel_atencao", "i_desc_regiao_saude", "i_desc_radf",
    "i_grupo", "i_subgrupo", "i_cod_produto", "i_desc_produto", "psicotropico",
    "i_abastecimento", "i_farmacia_central",
    "i_qtd_rede", "i_qtd_central", "i_cmm", "i_cmml",
]


def main(caminho):
    inicio = time.time()
    if os.path.exists(caminho):
        os.remove(caminho)
    db = sqlite3.connect(caminho)
    db.execute(f"CREATE TABLE estoque ({', '.join(COLUNAS)})")
    db.execute("CREATE TABLE meta (chave TEXT PRIMARY KEY, valor TEXT)")

    ms = powerbi.query_all(["data_extracao"])[0]["data_extracao"]
    # O Power BI guarda a data sem fuso; o painel mostra o mesmo valor (horário de Brasília).
    data_extracao = datetime.datetime.utcfromtimestamp(ms / 1000).isoformat()

    total = 0
    marcadores = ", ".join("?" * len(COLUNAS))
    for pagina in powerbi.iter_pages(COLUNAS, page_size=30000):
        db.executemany(f"INSERT INTO estoque VALUES ({marcadores})", pagina)
        db.commit()
        total += len(pagina)
        print(f"  {total} linhas...", flush=True)

    meta = {
        "data_extracao": data_extracao,
        "coletado_em_utc": datetime.datetime.utcnow().isoformat(timespec="seconds"),
        "linhas": str(total),
        "segundos": str(round(time.time() - inicio, 1)),
    }
    db.executemany("INSERT INTO meta VALUES (?, ?)", meta.items())
    db.commit()
    print(meta)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "raw/estoque_ubs.sqlite")
