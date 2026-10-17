"""Registra, a cada N minutos, a data de extração dos dados e o último refresh do dataset.

Uso: python3 -I scripts/vigiar_atualizacao.py <log.csv> <minutos> <parar_em_utc ISO>
"""
import datetime
import gzip
import json
import os
import sys
import time
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import powerbi  # noqa: E402


def refresh_info():
    req = urllib.request.Request(
        f"{powerbi.API}/{powerbi.RESOURCE_KEY}/modelsAndExploration?preferReadOnlySession=true",
        headers={"X-PowerBI-ResourceKey": powerbi.RESOURCE_KEY, "Accept-Encoding": "gzip"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = resp.read()
        if resp.headers.get("Content-Encoding") == "gzip":
            raw = gzip.decompress(raw)
    m = json.loads(raw)["models"][0]
    return m["LastRefreshTime"], m["NextRefreshTime"]


def main(log, minutos, parar_em):
    fim = datetime.datetime.fromisoformat(parar_em)
    novo = not os.path.exists(log)
    with open(log, "a", encoding="utf-8") as f:
        if novo:
            f.write("verificado_utc,data_extracao_brasilia,last_refresh_utc,next_refresh_utc\n")
        while datetime.datetime.utcnow() < fim:
            agora = datetime.datetime.utcnow().isoformat(timespec="seconds")
            try:
                ms = powerbi.query_all(["data_extracao"])[0]["data_extracao"]
                extracao = datetime.datetime.utcfromtimestamp(ms / 1000).isoformat(timespec="seconds")
                last, nxt = refresh_info()
                f.write(f"{agora},{extracao},{last},{nxt}\n")
            except Exception as e:  # registra e segue tentando
                f.write(f"{agora},ERRO {type(e).__name__},,\n")
            f.flush()
            time.sleep(minutos * 60)


if __name__ == "__main__":
    main(sys.argv[1], int(sys.argv[2]), sys.argv[3])
