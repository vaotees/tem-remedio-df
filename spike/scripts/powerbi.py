"""Cliente mínimo para relatórios Power BI publicados na web ("publish to web").

Usa o mesmo endpoint público que o próprio painel chama no navegador.
Não é uma API oficial: pode mudar sem aviso.
"""
import gzip
import json
import urllib.request

API = "https://wabi-brazil-south-api.analysis.windows.net/public/reports"
RESOURCE_KEY = "5ccba871-5230-4333-86f6-7fc3a29b5d5b"
MODEL_ID = 10723062
DATASET_ID = "ceb0186a-2546-4bfd-814e-5dad49b318cc"
REPORT_ID = "5cec075d-5810-42a0-8581-821cc46dfd6b"
ENTITY = "st_stage_trak tab_sismateriais_epi"


def _post(path, body):
    req = urllib.request.Request(
        f"{API}/{path}",
        data=json.dumps(body).encode(),
        headers={
            "X-PowerBI-ResourceKey": RESOURCE_KEY,
            "Content-Type": "application/json",
            "Accept-Encoding": "gzip",
        },
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        raw = resp.read()
        if resp.headers.get("Content-Encoding") == "gzip":
            raw = gzip.decompress(raw)
        return json.loads(raw)


def _column(prop, entity_alias="t"):
    return {
        "Column": {"Expression": {"SourceRef": {"Source": entity_alias}}, "Property": prop},
        "Name": f"{entity_alias}.{prop}",
    }


def _query_body(columns, entity, count, restart_tokens=None):
    window = {"Count": count}
    if restart_tokens:
        window["RestartTokens"] = restart_tokens
    return {
        "version": "1.0.0",
        "queries": [
            {
                "Query": {
                    "Commands": [
                        {
                            "SemanticQueryDataShapeCommand": {
                                "Query": {
                                    "Version": 2,
                                    "From": [{"Name": "t", "Entity": entity, "Type": 0}],
                                    "Select": [_column(c) for c in columns],
                                },
                                "Binding": {
                                    "Primary": {"Groupings": [{"Projections": list(range(len(columns)))}]},
                                    "DataReduction": {"DataVolume": 4, "Primary": {"Window": window}},
                                    "Version": 1,
                                },
                                "ExecutionMetricsKind": 1,
                            }
                        }
                    ]
                },
                "QueryId": "",
                "ApplicationContext": {
                    "DatasetId": DATASET_ID,
                    "Sources": [{"ReportId": REPORT_ID}],
                },
            }
        ],
        "cancelQueries": [],
        "modelId": MODEL_ID,
    }


def _decode(ds, n_cols, prev):
    """Decodifica o formato DSR comprimido (bitmasks R = repete, Ø = nulo)."""
    dicts = ds.get("ValueDicts", {})
    rows = []
    schema = None
    for row in ds["PH"][0].get("DM0", []):
        if "S" in row:
            schema = row["S"]
        if "C" in row:
            values = iter(row["C"])
        else:
            # Com uma coluna só, o valor vem como {"G0": ...} em vez de "C".
            keys = [s["N"] for s in schema]
            if not any(k in row for k in keys):
                continue  # linha só com o schema
            values = iter([row[k] for k in keys if k in row])
        repeat = row.get("R", 0)
        nulls = row.get("Ø", 0)
        out = []
        for i in range(n_cols):
            if repeat >> i & 1:
                out.append(prev[i])
            elif nulls >> i & 1:
                out.append(None)
            else:
                v = next(values)
                dn = schema[i].get("DN") if schema else None
                if dn is not None and isinstance(v, int):
                    v = dicts[dn][v]
                out.append(v)
        prev = out
        rows.append(out)
    return rows, prev


def iter_pages(columns, entity=ENTITY, page_size=30000):
    """Gera as linhas página a página (listas na ordem de `columns`), paginando com RestartTokens."""
    prev = [None] * len(columns)
    tokens = None
    while True:
        resp = _post("querydata?synchronous=true", _query_body(columns, entity, page_size, tokens))
        result = resp["results"][0]["result"]
        if "error" in result.get("data", {}).get("dsr", {}).get("DataShapes", [{}])[0]:
            raise RuntimeError(json.dumps(result)[:2000])
        ds = result["data"]["dsr"]["DS"][0]
        rows, prev = _decode(ds, len(columns), prev)
        yield rows
        tokens = ds.get("RT")
        if not tokens or not rows:
            break


def query_all(columns, entity=ENTITY, page_size=30000):
    """Busca todas as linhas de uma vez (só para consultas pequenas)."""
    return [dict(zip(columns, r)) for page in iter_pages(columns, entity, page_size) for r in page]
