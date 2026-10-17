# Teste de extração (M0) — resultados

Data do teste: 17/10/2026. Dados extraídos às 00:16 (horário de Brasília).

## Resumo

O MVP é viável com dados oficiais da SES-DF. Ficou melhor do que o planejado:

- O estoque sai completo, por farmácia de UBS, em ~1,5 minuto.
- Cada UBS vem com o código CNES, então endereço, telefone e coordenadas se ligam direto, sem casar nomes à mão.
- O painel traz o **consumo médio mensal de cada UBS**, então o semáforo por "dias de estoque" entra já no MVP.
- A SES-DF publica, **remédio por remédio**, as regras de retirada e os documentos exigidos.
- O snapshot do app fica com **131 KB** (gzip).

## Fontes usadas

| Fonte | O que traz | Como |
|---|---|---|
| Painel "Estoque de Medicamentos nas UBS" (InfoSaúde) | Estoque por farmácia × produto, consumo médio mensal local, Região de Saúde, RA, controlado ou não | Power BI público, endpoint `querydata` |
| Painel "Como garantir seu medicamento" (InfoSaúde) | Documentos e observações por remédio; cadastro das UBSs com horário, telefone, farmacêutico, se entrega controlados; RAs atendidas por cada farmácia de Alto Custo | Power BI público, mesmo endpoint |
| API CNES (Ministério da Saúde) | Endereço, CEP, telefone, latitude/longitude | `apidadosabertos.saude.gov.br/cnes/estabelecimentos/{cnes}` |
| CMED (Anvisa) | Marca → substância → apresentação (dose, forma, liberação prolongada) → código de barras (EAN) | `TA_PRECO_MEDICAMENTO.csv` |
| Registro de medicamentos (Anvisa) | Marca → princípio ativo, inclusive registros antigos | `DADOS_ABERTOS_MEDICAMENTOS.csv` |

## Respostas às perguntas

### 1. Dá para puxar todas as linhas?
**Sim.** Paginando de 30 mil em 30 mil, vieram 2.231.690 linhas em 97 s. O número é alto porque o painel cruza **todos os 177 locais × 12.557 produtos**, inclusive os zerados. Só **41.626 linhas têm estoque > 0**.

### 2. O painel lista só UBS?
**Quase.** São 162 UBSs (CNES) com 177 locais de estoque:
- 163 farmácias de UBS, nas 7 Regiões de Saúde; 156 com estoque hoje.
- 14 almoxarifados internos → **descartar** (prefixo `ALMOXARIFADO`).
- Algumas UBSs têm mais de uma farmácia (ex.: "Unidade 2 UBS 06 Santa Maria").

O painel mistura remédios com material: 11.692 produtos sem grupo (agulha, gaze, açúcar...). **Filtro: `i_abastecimento` preenchido** separa os 867 itens de assistência farmacêutica; o grupo `UBS` (268 itens) é a lista da atenção básica.

### 3. O nome da UBS bate com o CNES?
**Não precisa bater:** o painel traz o código CNES. Os 162 foram achados na API do CNES, **todos com coordenadas dentro do DF**; 127 com telefone. O cadastro da SES-DF ("gabarito") cobre os 162 e completa telefone e **horário de funcionamento** (172 de 184 UBSs).

Cuidado: o painel às vezes perde zeros à esquerda (`10677` → `0010677`).

### 4. Tamanho do snapshot
Só farmácias de UBS, só remédios, só estoque > 0:
- 156 farmácias, 254 produtos, 21.759 pares farmácia × produto.
- **447 KB em JSON, 131 KB com gzip.** JSON resolve; SQLite não é necessário.

### 5. Dá para separar remédio de material?
**Sim**, por `i_abastecimento` (preenchido = remédio/insumo da assistência farmacêutica) e `i_grupo`. Além disso, a SES-DF marca **34 itens "aplicados no próprio posto"** (injetáveis, antibióticos IM): esses não devem aparecer como "retire aqui".

### 6. Dose e forma por regras?
**Sim.** Uma regex simples separa forma e dose em **250 de 268 (93%)** dos remédios da UBS. As falhas são formas que faltaram na lista (loção, xampu, drágea, geleia, líquido oral). Com 268 itens, dá para revisar à mão o que sobrar.

### 7. Regra de retirada nas UBSs
A SES-DF publica a regra **por remédio** no painel "Como garantir seu medicamento":

| Situação | Remédios | O que o app faz |
|---|---|---|
| Sem restrição de local | 163 (61%) — ex.: anlodipino, amoxicilina, alopurinol | Lista "posto mais perto com estoque" |
| Exige vínculo com a UBS de referência do domicílio | 12 — ex.: oxibutinina, PQT hanseníase | Aviso "Retire na UBS do seu bairro" |
| Aplicado no próprio posto | 34 | Não mostrar como retirada |
| Controlado (UBSs específicas, receita em 2 vias, sem xerox) | 33 | Só UBSs com `psicotropico = SIM` (53 UBSs) |
| Fitoterápicos, tabagismo, influenza | 24 | Aviso com o link oficial da SES-DF |

Documentos para todos: **receita, documento oficial com foto, cartão SUS (físico ou digital) ou número SES-DF**.

Ressalva: "sem observação" não é o mesmo que uma regra escrita dizendo "qualquer UBS". Vale confirmar com a Ouvidoria da SES-DF.

### Alto Custo (v1.1)
Confirmado no painel oficial. Cada farmácia atende RAs definidas:
- **Asa Sul:** Asa Norte, Asa Sul, Cruzeiro, Guará, Itapoã, Jardim Botânico, Lago Norte/Sul, Noroeste, Núcleo Bandeirante, Paranoá, Planaltina, São Sebastião, SMDB, Sobradinho, Sudoeste, Varjão, Jardins Mangueiral, Park Way, Unaí e outros estados.
- **Ceilândia:** Águas Claras, Areal, Arniqueira, Brazlândia, Ceilândia, Pôr do Sol, Samambaia, Sol Nascente, Taguatinga, Vicente Pires e municípios de GO (Águas Lindas, Santo Antônio do Descoberto...).
- **Gama:** Gama, Recanto das Emas, Riacho Fundo I e II, Santa Maria e municípios de GO (Valparaíso, Novo Gama, Luziânia...).

## Horário de atualização
- O dataset do painel atualiza **pelo menos 2× por dia**: último refresh 00:32 e próximo marcado para 13:30 (Brasília).
- A data dos dados (`data_extracao`) era 00:16. Um script registra a cada 30 min até 15h para ver se a extração da tarde traz dados novos (`raw/atualizacoes.csv`).
- Coletor do app: rodar **~01:00 e ~14:00**, e só publicar se `data_extracao` mudou.

## Tradutor de marcas
- CMED: 27.731 códigos de barras; marca → substância → dose → forma.
- Teste com 46 marcas comuns: **36 acertos de primeira**. Das 10 falhas:
  - 4 são remédios **que o SUS-DF não distribui** (Higroton/clortalidona, Zoloft/sertralina, Dramin oral, Meronem) → resposta certa é "não tem no SUS".
  - 6 são ajustes de regra (sal "tri-hidratada", insulina NPH, combinações budesonida + formoterol, salmeterol + fluticasona, "N-butil" escopolamina).
- 75% das substâncias da SES-DF aparecem na CMED; as demais são fórmulas do SUS (PQT hanseníase, dietas), combinações e nomes com grafia diferente.
- Caso "mesma substância, outra forma": Glifage **XR** caiu em metformina **comum**. A CMED marca "LIB PROL" na apresentação → o app avisa a diferença.

## Semáforo (consumo médio mensal da própria UBS)
`dias = estoque / (consumo médio mensal local / 30)`. Remédios do grupo UBS, pares com estoque:
- Verde (30+ dias): 15.317 (75%)
- Amarelo (7 a 30 dias): 2.610 (13%)
- Vermelho (< 7 dias): 544 (3%)
- Sem consumo registrado: 1.763 (9%) → mostrar só "Tem"

Atenção: o campo `i_cmm` é o consumo da **rede inteira**; o certo é `i_cmml` (local), que vem como texto.

## Riscos
- O endpoint do Power BI não é oficial e pode mudar. Mitigação: o coletor valida e não publica se algo quebrar; em paralelo, pedir os dados em formato aberto por LAI.
- 7 farmácias estão zeradas hoje (ex.: UBS 3 Samambaia): pode ser dispensação suspensa → mostrar "sem informação de estoque".
- 22% das UBSs sem telefone no CNES; o cadastro da SES-DF cobre parte disso.

## Arquivos
- `scripts/powerbi.py` — cliente do Power BI público (paginação + decodificação DSR)
- `scripts/extrair.py` — estoque completo → SQLite
- `scripts/buscar_cnes.py` — endereço/coordenadas pelo CNES
- `scripts/cruzar_anvisa.py` — teste do tradutor de marcas
- `scripts/montar_snapshot.py` — snapshot de exemplo + semáforo
- `scripts/vigiar_atualizacao.py` — registra o horário de atualização
- `raw/snapshot_exemplo.json` — snapshot de exemplo (447 KB)
- `raw/regras_por_remedio_ubs.json`, `raw/documentos_ubs.json` — regras de retirada
- `raw/estoque_ubs.sqlite` — extração completa (~470 MB; não versionar)
