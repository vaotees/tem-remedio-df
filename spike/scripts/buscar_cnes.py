"""Busca endereço, telefone e coordenadas no CNES (API de dados abertos do Ministério da Saúde).

Uso: python3 -I scripts/buscar_cnes.py <estoque.sqlite> <saida.json>
"""
import json
import sqlite3
import sys
import time
import urllib.error
import urllib.request

API = "https://apidadosabertos.saude.gov.br/cnes/estabelecimentos/{}"
CAMPOS = [
    "codigo_cnes", "nome_fantasia", "endereco_estabelecimento", "numero_estabelecimento",
    "bairro_estabelecimento", "codigo_cep_estabelecimento", "numero_telefone_estabelecimento",
    "latitude_estabelecimento_decimo_grau", "longitude_estabelecimento_decimo_grau",
    "descricao_turno_atendimento", "codigo_tipo_unidade",
]


def main(db_path, saida):
    db = sqlite3.connect(db_path)
    codigos = sorted({r[0] for r in db.execute("SELECT DISTINCT cnes FROM locais")})
    out = {}
    for cod in codigos:
        cod7 = cod.zfill(7)  # o painel às vezes perde os zeros à esquerda ('10677')
        try:
            with urllib.request.urlopen(API.format(int(cod7)), timeout=60) as resp:
                d = json.loads(resp.read())
            out[cod] = {k: d.get(k) for k in CAMPOS}
        except urllib.error.HTTPError as e:
            out[cod] = {"erro": e.code}
        time.sleep(0.2)
    json.dump(out, open(saida, "w"), ensure_ascii=False, indent=1)
    ok = [v for v in out.values() if "erro" not in v]
    com_coord = [v for v in ok if v.get("latitude_estabelecimento_decimo_grau")]
    com_tel = [v for v in ok if v.get("numero_telefone_estabelecimento")]
    print(f"CNES consultados: {len(out)} | encontrados: {len(ok)} | com coordenadas: {len(com_coord)} | com telefone: {len(com_tel)}")
    print("Não encontrados:", [k for k, v in out.items() if "erro" in v])


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
