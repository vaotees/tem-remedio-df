# Fontes de estoque de remédios fora do DF

Levantamento para decidir a próxima cidade do Tem Remédio. Feito em 26/11/2026, entre 22h e 0h: cada ferramenta citada foi aberta nessa noite e, quando possível, testada com "losartana 50 mg". Tudo o que está aqui veio de página oficial (prefeitura, secretaria, Ministério da Saúde, INPI) ou foi visto na própria ferramenta. Quando a fonte é imprensa, está dito. "Não encontrei" quer dizer só isso: a busca não achou, e a cidade pode ter algo que não está indexado.

## Resumo

- **A lei mudou o cenário.** A [Lei 14.654/2023](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14654.htm) acrescentou o art. 6º-A à Lei 8.080: toda instância gestora do SUS tem de publicar na internet "os estoques de medicamentos das farmácias públicas que estiverem sob sua gestão, com atualização quinzenal, de forma acessível ao cidadão comum". Está em vigor desde fevereiro de 2024. Das 26 capitais fora do DF, **19 publicam algum estoque** (em site, painel, app ou PDF, às vezes parado) e **9 mostram o estoque por unidade de saúde com data de 26/11/2026 ou "em tempo real"**: Recife, Belo Horizonte, Manaus, Porto Velho, Teresina, Cuiabá e Maceió (com data) e Porto Alegre e Florianópolis ("tempo real").
- **Cinco formatos se repetem:** Power BI publicado na web (Belo Horizonte, Vitória, Teresina, igual ao DF), dados abertos com licença (Recife), API JSON por trás do site (Porto Alegre, Porto Velho, Salvador, Cuiabá), sistemas de prontuário de fornecedores com página pública (CELK em Florianópolis e Goiânia, Vivver em São Luís, IDS em Aracaju) e PDF (Natal, Aracaju, Boa Vista).
- **Três capitais têm barreira técnica à coleta automática:** São Paulo (reCAPTCHA Enterprise + Firebase App Check), Maceió (Cloudflare Turnstile em cada consulta) e Aracaju (API com token de sessão). Fortaleza só mostra o estoque no app, depois de cadastro com CPF.
- **Não há atalho nacional.** A base aberta da BNAFAR está "em manutenção", parada em 06/06/2026 e agregada por município. O painel por estabelecimento, previsto para junho de 2025, não apareceu. O Plano de Dados Abertos do Ministério da Saúde promete a base mensal para janeiro de 2027.
- **Recomendação:** Recife, Belo Horizonte e Manaus (ver [no fim](#as-3-cidades-mais-viáveis)).

## Legenda

**Coleta automática**

| Nota | Quer dizer |
|---|---|
| **Aberta** | Dados abertos com licença e API documentada. |
| **Sim** | Página ou API pública, sem login nem captcha; dá para coletar como o coletor do DF faz com o Power BI (sem API oficial). |
| **Sim, com ressalva** | Pública, mas com sessão, chave embutida, só "tem / não tem" ou instabilidade (ver a ficha da cidade). |
| **Difícil** | PDF, token, ou dado que não deu para confiar no teste. |
| **Não** | Captcha, App Check, só no app com cadastro, ou nada publicado. |

**Granularidade:** "quantidade" = número de unidades em estoque por posto; "tem/não tem" = só disponível ou indisponível.

Não vi, nas páginas testadas, termos de uso que proíbam coleta; só o Recife diz expressamente que permite (licença ODbL). Não li os termos gerais de cada portal: antes de coletar, vale pedir autorização à secretaria (ou os dados por LAI), como está nos riscos do [SPEC](SPEC.md).

## Tabela por capital

| Capital | Fonte oficial | Formato | Por unidade | Coleta automática | Atualização | App oficial |
|---|---|---|---|---|---|---|
| Brasília (DF) | SES-DF, painel InfoSaúde | Power BI na web | quantidade + consumo | Sim (já em uso) | 2× ao dia | Tem Remédio DF (este projeto) |
| **Recife (PE)** | Dados Abertos Recife | CSV + API CKAN, licença ODbL | quantidade | **Aberta** | diária (arquivo de 26/11/2026 10h02) | Conecta Recife |
| **Belo Horizonte (MG)** | PBH, "Quero ver os estoques" | Power BI na web | quantidade | **Sim** | 2× por semana ("Estoque em: 26/11/2026") | não encontrei |
| **Manaus (AM)** | Semsa, Farmácia Estoque | site HTML (formulário) | quantidade | **Sim** | diária ("26/11/2026 às 19:50") | não encontrei (é site) |
| Porto Alegre (RS) | SMS, Onde Está Seu Medicamento | JSON por trás do site | quantidade | Sim, com ressalva | "tempo real" | 156+POA |
| Florianópolis (SC) | SMS, Estoques de medicamentos (CELK) | site HTML com sessão | quantidade + endereço e telefone | Sim, com ressalva | "tempo real" | não encontrei |
| Porto Velho (RO) | Semusa, FarmaPub | API REST JSON | quantidade | Sim | contínua ("26/11/2026, 23:54:16") | FarmaPub (Android) |
| Vitória (ES) | Semus, Painel de Medicamentos | Power BI na web | quantidade | Sim | diária | não encontrei (painel tem versão mobile) |
| São Luís (MA) | Semus, Estoque nas Farmácias Públicas (Vivver) | site HTML | quantidade + endereço e telefone | Sim, com ressalva | não informada na página | não encontrei |
| Teresina (PI) | FMS, Pesquisa de Medicamentos | Power BI na web | tem/não tem | Sim, com ressalva | não informada; dado de 26/11/2026 | não encontrei (QR Code nas UBS) |
| Salvador (BA) | SMS, Mapa da Saúde | API JSON por trás do site | tem/não tem | Sim, com ressalva | não confirmada | Vida+ Cidadão |
| Cuiabá (MT) | SAAF, Estoque de medicamentos | JSON estático | tem/não tem | Sim, com ressalva | não informada; dado de 26/11/2026 22h53 | não encontrei (é site) |
| Goiânia (GO) | SMS, Consulta de Medicamentos (CELK) | site HTML com sessão | quantidade | Difícil | "tempo real", mas saldo 0 suspeito | Saúde Fácil |
| Aracaju (SE) | SMS, Consulta de Medicamentos (IDS) + PDFs | app web com token + PDF | quantidade (PDF) | Difícil | consulta "diária"; PDF de 29/10/2026 | Mais Saúde Cidadão (web) |
| Natal (RN) | SMS, posição de estoque | PDF | quantidade, só 4 unidades | Difícil | último achado: out/2025 | não encontrei |
| Maceió (AL) | SMS, Portal da Transparência de Medicamentos | site com captcha | não testado | **Não** (Turnstile) | "tempo real" (notícia); dado de 26/11/2026 16h47 | não encontrei |
| São Paulo (SP) | SMS, Remédio na Hora (e-saúdeSP) | app e web Flutter | unidade mais próxima com estoque | **Não** (reCAPTCHA + App Check) | diária (aviso antigo) | e-saúdeSP |
| Fortaleza (CE) | SMS, app Mais Saúde Fortaleza | só app, com cadastro e CPF | quantidade | **Não** | não confirmada | Mais Saúde Fortaleza |
| Boa Vista (RR) | SMSA, Medicamentos por UBS | PDF | quantidade | Difícil | parado em 11/04/2025 | não encontrei |
| Campo Grande (MS) | Sesau | PDF da rede | não é por unidade | Não | parado em mar/2024 | não encontrei |
| Rio de Janeiro (RJ) | — | — | — | Não | — | não encontrei |
| Curitiba (PR) | — | — | — | Não | — | não encontrei |
| João Pessoa (PB) | — | — | — | Não | — | não encontrei |
| Belém (PA) | — | — | — | Não | — | não encontrei |
| Macapá (AP) | — | — | — | Não | — | não encontrei |
| Palmas (TO) | — | — | — | Não | — | não encontrei |
| Rio Branco (AC) | — | — | — | Não | — | não encontrei |

## Fichas das capitais

Para cada uma: onde está, formato, se dá para coletar, atualização, app e o que vi de acessibilidade. **Nenhum app nativo foi instalado ou testado**: o que vai sobre idosos é só o que se vê na versão web ou o que a fonte oficial diz.

### Brasília (DF), referência

- **Fonte:** painéis InfoSaúde da SES-DF (Power BI), já coletados pelo `pipeline/`. A SES-DF diz que [já atende à Lei 14.654](https://saude.df.gov.br/web/guest/w/df-j%C3%A1-atende-%C3%A0-nova-lei-federal-de-divulga%C3%A7%C3%A3o-de-estoques-de-medicamentos).
- **O que tem e as outras não:** consumo médio por UBS (`i_cmml`), que permite o semáforo por dias de estoque, e a regra de retirada remédio por remédio. Nenhuma outra capital publica consumo; nelas o semáforo ficaria só no "Tem" (regra "sem consumo registrado" do SPEC).

### Recife (PE)

- **Fonte:** [Estoque dos medicamentos nas farmácias da Rede Municipal de Saúde](https://dados.recife.pe.gov.br/dataset/estoque-dos-medicamentos-nas-farmacias-da-rede-municipal-de-saude), no portal de dados abertos da prefeitura.
- **Formato:** 8 CSVs, um por Distrito Sanitário, mais um dicionário de dados em JSON. A API CKAN (`datastore_search`) está ligada. Colunas: `distrito`, `unidade` (nome, como "Us 101 Policlinica Prof Waldemar de Oliveira"), `classe`, `apresentacao`, `tipo_produto`, `codigo_produto`, `produto`, `cadum`, `quantidade`. Não traz CNES, endereço nem consumo. O Distrito 1 tem 4.604 linhas.
- **Coleta:** aberta, com licença ODbL (permite reuso com atribuição). O endereço das unidades teria de vir de outro conjunto do mesmo portal ("Rede de Saúde Municipal", em GeoJSON, ou UBS/USF em CSV), casando pelo nome: não conferi se os nomes batem.
- **Atualização:** "frequência diária" (metadado). Os 8 arquivos foram gerados em 26/11/2026, às 10h02.
- **Cuidado:** o conjunto antigo, ["Medicamentos por unidade de saúde"](https://dados.recife.pe.gov.br/dataset/medicamentos), foi atualizado no portal em 02/03/2026, mas todas as 40.392 linhas têm `data_carga` de 10/10/2024. A data do metadado não basta: o coletor precisa conferir a data dos dados.
- **App:** [Conecta Recife, "Pesquisar medicamentos"](https://conecta.recife.pe.gov.br/servico/1101): a pessoa digita o remédio e a rua, e o serviço mostra a unidade mais perto com estoque, com "como chegar". Também permite reservar e agendar a retirada.

### Belo Horizonte (MG)

- **Fonte:** [Acesso aos medicamentos da Rede SUS](https://prefeitura.pbh.gov.br/saude/informacoes/atencao-a-saude/assistencia-farmaceutica/medicamentos-rede-sus) (página atualizada em 05/10/2026), botão "Quero ver os estoques". A própria página cita a Lei 14.654.
- **Formato:** Power BI publicado na web ("Estoques dos medicamentos nos Centros de Saúde de Belo Horizonte"). Filtros por medicamento, Regional e Centro de Saúde; tabela Centro de Saúde × Estoque e mapa.
- **Coleta:** sim, pela mesma técnica do coletor do DF (consultas ao Power BI publicado).
- **Atualização:** "As informações deste painel são atualizadas duas vezes por semana". Em 26/11/2026 mostrava "Estoque em: 26/11/2026".
- **Avisos no painel:** "O estoque dos medicamentos está sujeito a variações diárias e excepcionais em decorrência da transição do sistema de dispensação" e "Alguns medicamentos podem ter restrição de dispensação por faixa etária".
- **Também:** REMUME em [PDF](https://prefeitura.pbh.gov.br/sites/default/files/estrutura-de-governo/saude/2026/02-10-26-smsa-remume-vigente.pdf) e em [planilha](https://prefeitura.pbh.gov.br/sites/default/files/estrutura-de-governo/saude/2026/02-10-26-smsa-remume-vigente.xlsx).
- **Para idosos:** o painel pergunta na entrada "Computador" ou "Celular". Não é app.

### Manaus (AM)

- **Fonte:** [Farmácia Estoque](https://farmaciaestoque.manaus.am.gov.br/), da Semsa. Lançamento em [notícia oficial de 26/12/2023](https://www.manaus.am.gov.br/noticia/saude/prefeitura-disponibiliza-consulta-on-line-de-estoques-de-medicamentos-nas-unidades-de-saude/).
- **Formato:** site HTML. A pessoa escolhe um dos 209 itens numa lista (o valor é o código BR do CATMAT, por exemplo losartana 50 mg = BR0268856) e envia o formulário (com token CSRF). O resultado mostra o total na rede, quantas unidades têm, "Atualizado em" com data e hora, e a tabela Unidade × link de localização × Quantidade.
- **Teste:** losartana 50 mg, 4.272.721 comprimidos em 180 unidades; "Atualizado em: 26/11/2026 às 19:50".
- **Coleta:** sim. Uma consulta por item (cerca de 209 por rodada), sem captcha.
- **Regra de retirada:** tuberculose e hanseníase só para quem é acompanhado nas unidades da Semsa (aviso da própria página). Dúvidas: WhatsApp da Gerência de Assistência Farmacêutica, (92) 98842-8694 (notícia oficial).

### Porto Alegre (RS)

- **Fonte:** [Onde está seu medicamento?](https://prefeitura.poa.br/sms/servicos/onde-esta-seu-medicamento), da SMS ("Os estoques abaixo são atualizados em tempo real"). [Notícia de 18/07/2023](https://prefeitura.poa.br/sms/noticias/saude-facilita-localizacao-de-medicamentos-disponiveis-na-capital).
- **Formato:** a página embute `prefeitura.poa.br/external-tools/medicamentos_dis.php`, que lê JSON paginado de um proxy da prefeitura (`gmatapi.php`) ligado à API GMAT da Procempa: catálogo (538 materiais, 365 ativos), estoque por material (quantidade por "subalmoxarifado") e cadastro dos locais. Teste: losartana 50 mg em 137 locais.
- **Coleta:** sim, com ressalva. O JSON é o caminho mais limpo tecnicamente, mas o código da página traz uma chave da API da Procempa: o certo é pedir autorização (ou uma chave própria) à Procempa e à SMS. Não há data do dado no JSON, só "tempo real".
- **Regra de retirada:** as unidades de saúde entregam só remédios de receita simples; controlados, de receita especial e antibióticos só nas Farmácias Distritais (notícia oficial). As Distritais fecham alguns dias por ano para inventário (avisos da SMS).
- **App:** o mesmo serviço no app 156+POA (notícia oficial).

### Florianópolis (SC)

- **Fonte:** página de [Assistência Farmacêutica](https://www.pmf.sc.gov.br/entidades/saude/index.php?cms=assistencia+farmaceutica&menu=0) da SMS, link "Estoques de medicamentos" → [florianopolis.celk.com.br/consulta-medicamento](https://florianopolis.celk.com.br/consulta-medicamento) (sistema Celk Saúde).
- **Formato:** HTML com sessão (Apache Wicket). A busca por nome mostra o saldo da rede; a lupa abre a lista por estabelecimento com saldo, nome do centro de saúde, telefone, endereço e bairro. Teste: losartana 50 mg, 712.362 comprimidos em 101 estabelecimentos.
- **Coleta:** sim, com ressalva: paginação presa à sessão do navegador, mais trabalhosa que um JSON. Sem captcha.
- **Atualização:** "estoques disponíveis nas unidades de saúde em tempo real".
- **Regra de retirada:** controlados só nas farmácias de referência (10 em 2019, segundo a SMS).

### Porto Velho (RO)

- **Fonte:** [FarmaPub](https://farmapub.portovelho.ro.gov.br/), da Semusa ([notícia oficial](https://semusa.portovelho.ro.gov.br/noticias/farmapub-sistema-digital-facilita-acesso-do-cidadao-aos-medicamentos-da-farmacia-municipal)). Busca pelo nome genérico (DCB), mapa das farmácias e gráfico de estoque.
- **Formato:** API REST pública: `farmapubrest.portovelho.ro.gov.br/api/v1/farmacias` (22 farmácias, com latitude e longitude) e `/api/v1/estoques/groupedAll` (239 itens com código BR e total). Não conferi o endpoint por farmácia.
- **Atualização:** "Última atualização: 26/11/2026, 23:54:16".
- **Limite:** só as farmácias de atenção básica da zona urbana ([Semusa](https://portovelho.ro.gov.br/artigo/51438/ferramenta-farmapub-facilita-acesso-a-medicamentos-na-rede-municipal-de-saude-de-porto-velho)).
- **App:** FarmaPub para Android (notícia oficial).

### Vitória (ES)

- **Fonte:** [Painel de Medicamentos](https://cartadeservicos.vitoria.es.gov.br/areas/18-Saude/servicos/936-Painel-de-Medicamentos/) na Carta de Serviços. O link leva a uma página em `hmsystem.com.br` (domínio de fornecedor, fora do `.gov.br`), que embute um Power BI publicado na web, "Desenvolvido por: SEMUS/CIS".
- **Formato:** Power BI: unidade de saúde × medicamento × estoque, das 29 UBS.
- **Atualização:** diária, a partir do sistema Rede Bem Estar (Carta de Serviços). A prefeitura diz que [começou a divulgar oito meses antes de a lei valer](https://www.vitoria.es.gov.br/noticias/pmv-divulga-estoque-de-medicamentos-oito-meses-antes-de-lei-entrar-em-vigor-48537).
- **Coleta:** sim (mesma técnica do DF).
- **Para idosos:** o painel tem "Versão Mobile" e uma personagem assistente ("VitórIA").
- **Atenção:** o domínio do painel não é da prefeitura. Para o botão de fonte oficial do app (hoje restrito a `saude.df.gov.br`), o link teria de ser a Carta de Serviços.

### São Luís (MA)

- **Fonte:** [Transparência > Saúde](https://www.saoluis.ma.gov.br/portal/transparencia/221/saude/), "Estoque de Medicamentos nas Farmácias Públicas" → [saoluis-ma.vivver.com/estoque](https://saoluis-ma.vivver.com/estoque) (sistema Vivver).
- **Formato:** HTML. Lista por medicamento com o total; o "+" abre a lista por unidade com nome, endereço, telefone e estoque. Filtros por código da unidade e por medicamento.
- **Coleta:** sim, com ressalva: a página não mostra a data da posição de estoque.

### Teresina (PI)

- **Fonte:** [Pesquisa de Medicamentos](https://site.fms.pmt.pi.gov.br/pesquisa-de-medicamentos), da FMS, que embute um Power BI: "Assistência Farmacêutica Componente Básico", "Em observância à Lei Municipal 6.201 de 08 de maio de 2025".
- **Formato:** medicamento × UBS × "Disponível/Indisponível", com bairro e logradouro. Sem quantidade.
- **Atualização:** "Dados atualizados em: 26/11/2026".
- **Coleta:** sim, com ressalva (só tem/não tem).
- **Para idosos:** QR Codes nas farmácias das UBS levam ao painel ([Band Piauí, 28/08/2025](https://bandpiaui.com.br/noticias/saude/ubs-de-teresina-passam-a-disponibilizar-lista-de-medicamentos-por-qr-code-11555.html), imprensa).

### Salvador (BA)

- **Fonte:** [Mapa da Saúde](https://mapadasaude.salvador.ba.gov.br/), da SMS: busca de medicamento → unidades com "DISPONÍVEL/INDISPONÍVEL", "Disponibilidade sujeita a alteração ao longo do dia", e os documentos exigidos (receita original e cópia, documento com foto, cartão SUS de Salvador).
- **Formato:** API JSON pública por trás do mapa (`api.usopublico.vidamais.saude.salvador.ba.gov.br/api/mapa-saude/...`): unidade, distrito, endereço, CEP, telefone, latitude, longitude e `StatusEstoque` 0/1. Teste: losartana 50 mg, 56 unidades (45 com "1").
- **Coleta:** sim, com ressalva: só tem/não tem, e duas rotas da API deram erro (uma com "Unable to connect to any of the specified MySQL hosts"), inclusive a da data da última atualização.
- **App:** [Vida+ Cidadão](https://saude.salvador.ba.gov.br/vida-cidadao-aplicativo-desenvolvido-pela-prefeitura-possibilita-mapear-medicamentos-nas-unidades-de-saude/) (notícia de 27/01/2022).

### Cuiabá (MT)

- **Fonte:** [estoque-farmacias-cuiaba.web.app](https://estoque-farmacias-cuiaba.web.app/), "Desenvolvido por Secretaria Adjunta de Assistência Farmacêutica — Prefeitura Municipal de Cuiabá". Domínio do Firebase, fora do `.gov.br`. Lançado em 12/11/2026, segundo a imprensa ([Olhar Direto](https://olhardireto.com.br/noticias/cuiaba-lanca-consulta-on-line-para-localizar-medicamentos-gratuitos-nas-unidades-de-saude)): 72 USF com farmácia, CEM e SAE. Não achei a notícia no site da prefeitura.
- **Formato:** arquivos JSON estáticos (`dados/unidades.json`, 70 unidades, cada uma com "atualizadoEm", e um arquivo por unidade). O próprio código da página avisa: "A consulta diz só se a unidade TEM o medicamento: o arquivo não traz quantidade nem validade."
- **Atualização:** "Estoque atualizado em 26/11/2026, 22:53".
- **Coleta:** sim, com ressalva (só tem/não tem; fonte oficial só pelo rodapé e pela imprensa).

### Goiânia (GO)

- **Fonte:** [Acesso a Medicamentos Essenciais (REMUME)](https://www.goiania.go.gov.br/sing_servicos/acesso-a-medicamentos-essenciais-remume/), link "Para Consulta de Medicamentos" → [goiania.celk.com.br/consulta-medicamento](https://goiania.celk.com.br/consulta-medicamento) (mesmo sistema de Florianópolis).
- **Teste:** a busca respondeu, devagar, mas mostrou saldo 0 na rede toda para losartana 50 mg e metformina 850 mg. Não dá para saber se é falta real ou consulta sem dado: não serve sem confirmar com a SMS.
- **App:** [Saúde Fácil](https://saude.goiania.go.gov.br/_servicos/_prefeitura-lanca-aplicativo-para-agilizar-agendamento-de-consultas/): "É só inserir o nome do medicamento e o aplicativo localiza a unidade mais próxima onde há estoque", com rota pelo GPS. Exige criar conta.

### Aracaju (SE)

- **Fonte:** [Portal da Transparência > Saúde](https://transparencia.aracaju.se.gov.br/prefeitura/saude/), que cita a Lei 14.654.
  - "Consulta de Medicamentos das Farmácias (Atualizado Diariamente)" → [aracaju-portal.ids.inf.br/portalcidadao/#/consultamedicamento](https://aracaju-portal.ids.inf.br/portalcidadao/#/consultamedicamento): app web (Flutter) que entra como "Visitante", com abas Comum e Especializado.
  - PDFs "Saldo de Estoque" para USF, controlados nas USF, CAPS, CEMAR e CEMAR Siqueira Campos; os mais novos são de 29/10/2026 ([USF](https://transparencia.aracaju.se.gov.br/wp-content/uploads/saude/MEDICAMENTOS/2026/10/SALDO_DE_ESTOQUE_MEDICAMENTOS_USF_29_10_2026.pdf)).
- **Coleta:** difícil. A API da consulta responde 401 sem o token da sessão de visitante, e no teste a busca de losartana ficou mais de 15 s em "Aguarde! As informações estão sendo carregadas." Os PDFs dão para ler, mas o mais novo já tinha quase um mês no dia do teste.

### Natal (RN)

- **Fonte:** a [página de Medicamentos da SMS](https://www.natal.rn.gov.br/sms/medicamentos) diz: "Você pode consultar o estoque de medicamentos de quatro unidades da rede", com link para `www2.natal.rn.gov.br/transparencia/medicamentos.php`, que não abriu em 26/11/2026 (nem pelo navegador nem pelo terminal).
- **Formato:** PDFs "Posição de Estoque" por estabelecimento; o mais novo achado é de 21/10/2025 ([CAPS AD Leste](https://www2.natal.rn.gov.br/transparencia/assets/midia/arquivos/medicamentos/posicao-de-estoque_capsadleste_16_10_2025.pdf)).
- **Coleta:** difícil (PDF, poucas unidades, site fora do ar).

### Maceió (AL)

- **Fonte:** [Portal da Transparência de Medicamentos](https://transparencia.sms.maceio.al.gov.br/medicamentos), da SMS ("ÚLTIMA ATUALIZAÇÃO 26/11/2026 às 16:47"), com 236 itens da REMUME. Lançado em abril de 2026 como [mapa interativo em tempo real](https://maceio.al.gov.br/noticias/sms/saude-lanca-mapa-interativo-para-consulta-de-medicamentos-na-rede-publica-de-maceio).
- **Coleta:** não. Cada consulta passa por "Verificação de segurança" (Cloudflare Turnstile). Não testei o resultado, para não contornar o captcha.
- **Para idosos:** o captcha é uma barreira a mais. A página avisa que "os dados de estoque podem divergir das quantidades físicas".

### São Paulo (SP)

- **Fonte:** Remédio na Hora, dentro do e-saúdeSP ([notícia oficial de 10/01/2026](https://prefeitura.sp.gov.br/w/prefeitura-de-s%C3%A3o-paulo-facilita-a-busca-por-medicamentos-com-a-ferramenta-rem%C3%A9dio-na-hora)): sem cadastro, a pessoa informa o endereço (ou usa o GPS) e até 5 remédios, pelo nome genérico ou DCB, e o serviço indica a farmácia mais próxima com estoque.
- **Formato:** app (Android e iOS) e [versão web](https://e-saudesp.prefeitura.sp.gov.br/) em Flutter.
- **Coleta:** não. A web carrega reCAPTCHA Enterprise e Firebase App Check. O site antigo, `aquitemremedio.prefeitura.sp.gov.br`, não existe mais (o DNS não resolve).
- **Atualização:** um aviso antigo da SMS falava em atualização diária, no fim do dia. Não achei a regra atual.
- **Para idosos:** a busca não aceita nome comercial, só o genérico (notícia oficial).

### Fortaleza (CE)

- **Fonte:** app [Mais Saúde Fortaleza](https://apps.apple.com/br/app/mais-sa%C3%BAde-fortaleza/id1505852705), ícone "estoque de medicamentos": lista em ordem alfabética, unidades e estoque em cada uma. Começou com hipertensão e diabetes (junho de 2023) e saúde mental, 54 itens ([notícia de 07/08/2023](https://www.fortaleza.ce.gov.br/noticias/saude-mental-prefeito-entrega-novo-caps-infantil-e-lanca-mais-uma-funcao-no-app-mais-saude-fortaleza)). Não sei a cobertura atual.
- **Coleta:** não. Só no app, depois de cadastro com nome, data de nascimento e CPF ([notícia de 13/03/2025](https://www.fortaleza.ce.gov.br/noticias/secretaria-da-saude-anuncia-cronograma-de-reabastecimento-de-medicamentos)). Não achei versão web nem dados abertos.
- **Retirada:** em qualquer unidade; precisa estar no prontuário eletrônico do município (Diário do Nordeste, abril de 2026, com fala da coordenação da Assistência Farmacêutica).

### Boa Vista (RR)

- **Fonte:** [Lista de Medicamentos por UBS](https://boavista.rr.gov.br/prefeitura/secretarias-e-orgaos-municipais/secretaria-municipal-de-saude/lista-de-medicamentos-por-ubs): 35 PDFs "Balanço UBS …", com "Atualização 11/04/2025". Parado há mais de 7 meses.

### Campo Grande (MS)

- **Fonte:** só um PDF da rede inteira, "ESTOQUE REMUME 01 MARÇO 2024", no repositório da prefeitura. Não achei consulta por unidade. A Câmara aprovou projeto de divulgação diária por unidade ([Notícias CG](https://www.noticiascg.com.br/camara-aprova-projeto-que-garante-transparencia-na-distribuicao-de-medicamentos/), imprensa); não achei sinal de que esteja no ar.

### Capitais sem fonte encontrada

| Capital | O que achei |
|---|---|
| Rio de Janeiro (RJ) | Nada. O site da Saúde (`saude.prefeitura.rio`) deu erro 504 em 26/11/2026. O app minhasaude.rio é de agendamento. O "Disque-Remédio" é de 2017/2018. |
| Curitiba (PR) | Nada nas páginas de [Assistência Farmacêutica](https://saude.curitiba.pr.gov.br/atencao-primaria/assistencia-farmaceutica.html) e Farmácia Curitibana (109 unidades, 136 itens). O estado do Paraná publica "Posição de Estoque (Lei 14.654/23)", mas das farmácias estaduais. |
| João Pessoa (PB) | Nada. Existe `joaopessoa-pb.vivver.com`, do mesmo fornecedor de São Luís, mas deu erro 502/503 e não achei link oficial para ele. |
| Belém (PA) | Nada. A SESMA lista o "Saúde Belém Digital", que é de consultas. |
| Macapá (AP) | Nada (só notícia de 2024 sobre onde retirar controlados). |
| Palmas (TO) | Nada. A página de Assistência Farmacêutica mudou de endereço e não traz estoque; o app Saúde Palmas lista os remédios do município, sem estoque confirmado. |
| Rio Branco (AC) | Existe a Lei municipal 2.414/2021 (divulgação online de medicamentos disponíveis e em falta), listada no [portal da CGM](https://portalcgm.riobranco.ac.gov.br/lai/institucional/secretaria-de-saude/). Não achei a página de estoque. |

## Apps e consultas oficiais para quem é idoso

Não instalei nenhum app nem testei leitor de tela ou letra grande. O quadro junta o que a fonte oficial diz e o que se vê na versão web, para comparar com o que o Tem Remédio já faz (nome comercial, mapa, sem cadastro).

| Cidade | Mapa | Busca por nome comercial | Barreira de entrada | Observação |
|---|---|---|---|---|
| São Paulo | indica a unidade mais próxima | não: só genérico ou DCB | endereço ou GPS | até 5 remédios por vez |
| Fortaleza | não informado | não: só princípio ativo | cadastro com CPF | estoque dentro de um app de muitos serviços |
| Goiânia | rota pelo GPS | não informado | criar conta | — |
| Maceió | mapa georreferenciado | a página diz "Busque pelo nome comercial ou genérico" (não testei) | captcha a cada consulta | — |
| Salvador | sim | não informado | nenhuma | só "disponível / indisponível" |
| Porto Velho | sim | não: só DCB | nenhuma | — |
| Belo Horizonte | sim (Power BI) | não informado | nenhuma | entrada pergunta "computador ou celular" |
| Vitória | não vi | não informado | nenhuma | versão mobile e assistente "VitórIA" |
| Teresina | não | não informado | nenhuma | QR Code na farmácia da UBS |
| Manaus | link de localização por unidade | não: lista de 209 itens | nenhuma | contato por WhatsApp |
| Recife (Conecta) | "como chegar" | não informado | pede a rua | permite reservar e agendar a retirada |

Só Maceió diz aceitar nome comercial (Glifage → metformina), e atrás de captcha. Em nenhuma vi aviso de liberação prolongada, que o Tem Remédio já tem.

## BNAFAR e OpenDATASUS

**Pergunta:** o painel público e a base aberta de "estoque e saídas por estabelecimento", previstos no plano operativo de 2025, já estão no ar?

**Resposta: não encontrei nenhum dos dois.**

- **O que o plano prometia.** O Plano Operativo da BNAFAR ([CIT, 30/01/2025](https://www.conass.org.br/wp-content/uploads/2025/01/2.3-Anexo-3-SECTICS-DAF-BNFAR.pdf), p. 10) prevê a "versão 1.0 do painel público de dados de Estoque e Saídas por estabelecimento de saúde" 30 dias depois da publicação dos modelos de dados, e as bases de estoque e saídas no portal de dados abertos 30 dias depois dos modelos "e definição do prazo final dos entes para interoperar".
- **O que andou.** O [informe à CIT de 24/04/2025](https://conasems-ava-prod.s3.sa-east-1.amazonaws.com/institucional/noticias/2-7-apresentacao-informe-cit-bnafar-24-04-2025-1745608921.pdf) dá os modelos como publicados em 15/02/2025, o prazo dos entes de 17/02 a 17/06/2025 e "Painéis Externos de Estoque e Saídas – Previsão: 17 de Junho/2025" como etapa "em andamento". Adesão em 23/04/2025: 11 estados pelo SI-BNAFAR e 16 pelo Hórus; 1.254 municípios pelo SI-BNAFAR, 2.587 pelo Hórus e 1.729 sem pedido.
- **Como está hoje.** A [página da BNAFAR no Ministério](https://www.gov.br/saude/pt-br/composicao/sectics/daf/bnafar) fala dos painéis no futuro ("serão desenvolvidos"). O [bnafar.saude.gov.br](https://bnafar.saude.gov.br/) só tem acesso restrito, com login.
- **A base aberta que existe.** [BNAFAR – Posição de Estoque](https://dadosabertos.saude.gov.br/dataset/bnafar-posicao-de-estoque): descrição "Posição de estoque - BNAFAR - Em manutenção"; última atualização 06/06/2026; frequência declarada "Quinzenal"; granularidade geográfica "Município"; 3 arquivos de 06/06/2026 (um deles é um CSV zipado de 120 MB). Em 26/11/2026 estava cerca de 5 meses e meio sem atualização. Não baixei o arquivo, então não conferi as colunas; pelo metadado, não é por estabelecimento.
- **A próxima promessa.** O [Plano de Dados Abertos do Ministério da Saúde 2026–2028](https://www.gov.br/saude/pt-br/acesso-a-informacao/dados-abertos/pda/plano-de-dados-abertos-2026-2028.pdf/@@download/file) (agosto de 2026, Apêndice C, p. 81 do PDF) lista o "Conjunto de Dados de Entradas, Saídas, Dispensações, Posição de Estoque e Avaliações Deferidas do Serviço da BNAFAR (DBBNAFARSOA)" como "Dado será aberto", frequência mensal, meta **janeiro de 2027**. O plano não diz a granularidade.
- **Atraso do dado, se sair.** A [Portaria GM/MS 5.713/2024](https://saude.campinas.sp.gov.br/lista_legislacoes/legis_2024/U_PT-MS-GM-5713_091224.pdf) define que o registro da posição de estoque leva o CNES do estabelecimento, e o envio é no mínimo diário, D-1 (segundo [apresentação do Cosems-SP](https://www.cosemssp.org.br/wp-content/uploads/2025/05/WEB-BNAFAR-APRESENTACAO-MARCOS.pdf)). Mesmo assim, uma base aberta mensal chegaria com semanas de atraso: serviria para escolher cidades, não para dizer "tem hoje".
- **MedSUS.** Os dois documentos de 2025 citam o MedSUS com "Localização de Farmácias e visualização dos estoques" (versão 1.0 em 2025). Não confirmei se a função existe.

## Farmácia Popular

**Pergunta:** a lista de farmácias credenciadas e a lista de remédios gratuitos dão para baixar em lote?

- **Farmácias credenciadas: só consulta, sem download.** O [painel "Consulta de Endereço das Farmácias do Programa Farmácia Popular do Brasil"](https://infoms.saude.gov.br/extensions/SEIDIGI_DEMAS_PFPB_ENDERECOS/index.html), linkado na [página do programa](https://www.gov.br/saude/pt-br/composicao/sectics/farmacia-popular), é um Qlik com filtros por Região, UF, Município e Bairro e a tabela "Farmácias Ativas". Atualização diária: em 26/11/2026, "Atualização do painel em 26/11/2026 às 19:25:50, com dados contidos no Programa Farmácia Popular do Brasil até o dia 26/11/2026". Não vi botão de baixar.
- **Dados abertos: não há lista de farmácias.** O conjunto [[MGDI] Programa Farmácia Popular do Brasil](https://dadosabertos.saude.gov.br/dataset/mgdi-programa-farmacia-popular-do-brasil) só traz indicadores de pessoas atendidas (última carga em julho de 2026). O PDA 2026–2028 promete abrir as dispensações (DBPOPFARMA), que também não são a lista de farmácias.
- **Remédios e insumos gratuitos: PDF.** [Lista de medicamentos e insumos](https://www.gov.br/saude/pt-br/composicao/sectics/farmacia-popular/arquivos/lista-de-medicamentos-e-insumos-pfpb.pdf) e as [listas de códigos de barras (EAN)](https://www.gov.br/saude/pt-br/composicao/sectics/farmacia-popular/codigos-de-barras/2026) de medicamentos, fraldas geriátricas e absorventes (março, junho e outubro de 2026). As listas de EAN servem para o leitor de código de barras da v2.
- **Para a v1.1:** dá para coletar o painel Qlik, como fazemos com o Power BI do DF, mas sem API oficial. O caminho mais seguro é pedir a lista de farmácias ativas em CSV por LAI (Fala.BR).

## Marca

Só o levantamento, sem conclusão jurídica.

**INPI** ([pePI](https://busca.inpi.gov.br/pePI/), pesquisa anônima de marcas por radical, 26/11/2026 às 23:57). "tem remedio" e "temremedio" dão os mesmos 8 processos:

| Processo | Prioridade | Marca | Situação | Titular | Classe |
|---|---|---|---|---|---|
| 814790470 | 11/04/1989 | INFLAÇÃO TEM REMEDIO | Registro | N Landim Comercio Ltda | 05:00 |
| 817872280 | 17/05/1994 | O BRASIL TEM REMÉDIO | Extinto | The Sydney Ross Co | 05:11 |
| 824543521 | 25/03/2002 | SANTA MARTA URGÊNCIA NÃO TEM HORA, MAS TEM REMÉDIO. | Arquivado | Farmacia Santa Marta Ltda | NCL(8) 39 |
| 826816037 | 18/08/2004 | O RIO TEM REMÉDIO | Arquivado | O Rio Tem Remédio Produções Ltda | NCL(8) 35 |
| 903329450 | 27/01/2011 | VIVER TEM REMÉDIO | Registro em vigor | Globo Comunicação e Participações S.A. | NCL(9) 09 |
| 903329476 | 27/01/2011 | VIVER TEM REMÉDIO | Registro em vigor | Globo Comunicação e Participações S.A. | NCL(9) 16 |
| 903329506 | 27/01/2011 | VIVER TEM REMÉDIO | Registro em vigor | Globo Comunicação e Participações S.A. | NCL(9) 41 |
| 930878248 | 22/06/2023 | BRASIL TEM REMÉDIO | Pedido indeferido | O Rio Tem Remedio Licenciamentos e Comercio Ltda | NCL(12) 35 |

- Nenhum processo para "Tem Remédio" sozinho, "Tem Remédio DF" ou "Aqui Tem Remédio".
- "Remédio na Hora" (nome atual da ferramenta de São Paulo): um pedido de 13/02/2026, classe NCL(13) 09, "Aguardando exame de mérito", de uma pessoa física (não é da prefeitura).
- Não pesquisei marcas figurativas (logotipos) nem variações como "Onde Tem Remédio".

**Lojas de apps** (Google Play e App Store do Brasil, 26/11/2026). Nenhum app se chama "Tem Remédio". Os mais parecidos:

| App | Quem publica | O que é |
|---|---|---|
| [Aqui tem remedio](https://play.google.com/store/apps/details?id=br.com.insix.aquitemremedio) | INSIX Soluções Inteligentes | O antigo app da SMS de São Paulo, feito com a MedSP. Continua nas duas lojas (Play atualizado em 15/03/2024, nota 1,6; App Store em 16/11/2022), embora a prefeitura tenha passado a ferramenta para o e-saúdeSP. |
| Meu Remédio Prefeituras | INSIX Soluções Inteligentes | App da mesma empresa para prefeituras (App Store, versão de 2020). |
| [Remedio Agora](https://play.google.com/store/apps/details?id=br.com.duosystem.remedioagora) | Prodesp (Governo de SP) | Agendamento de retirada nas farmácias estaduais de SP. |
| Remédio Fácil | Prefeitura de Santos | App municipal de Santos (não abri). |

## As 3 cidades mais viáveis

Critérios, na ordem: dado oficial e confiável (o app não pode mostrar algo incerto para idoso), estoque **por unidade** com data, coleta automática sem contornar proteção, atualização pelo menos diária, e quanto do coletor atual dá para reaproveitar.

### 1. Recife

- **Por quê:** é a única capital com licença aberta explícita (ODbL), API CKAN e CSV por distrito, com quantidade por unidade e atualização diária. Juridicamente é a mais limpa e tecnicamente a mais simples: baixar 8 CSVs, sem raspagem.
- **Trabalho:** casar o nome da unidade ("Us 101 …") com endereço e coordenadas do conjunto "Rede de Saúde Municipal" ou com o CNES; tirar da lista o que é aplicado no posto (o CSV tem injetáveis); levantar as regras de retirada (o Conecta Recife pede morar no Recife e receita do SUS do Recife).
- **Riscos:** sem consumo médio, o semáforo fica só no "Tem"; o conjunto antigo parou em 2024 sem aviso, então o coletor tem de rejeitar arquivo velho (como já faz com o DF).

### 2. Belo Horizonte

- **Por quê:** é Power BI publicado na web, a mesma tecnologia do DF, então o extrator do `pipeline/` se reaproveita quase inteiro. Tem quantidade por Centro de Saúde, data visível ("Estoque em") e versão para celular, numa rede grande.
- **Trabalho:** mapear o modelo do painel (tabelas e medidas) e o cadastro dos Centros de Saúde; ler as restrições por faixa etária que o painel menciona.
- **Riscos:** atualiza só duas vezes por semana, e o próprio painel avisa de variações "em decorrência da transição do sistema de dispensação". O texto do app teria de deixar claro que o dado pode ter alguns dias.

### 3. Manaus

- **Por quê:** quantidade por unidade (180 unidades no teste), "Atualizado em" com data e hora, atualização diária, link de localização de cada unidade, código CATMAT em cada item e nenhum captcha. Leva o app para o Norte, onde a única alternativa testada é Porto Velho.
- **Trabalho:** coletor de formulário HTML (cerca de 209 consultas por rodada, com intervalo); cadastro das unidades pelo CNES; pedir autorização à Semsa, porque não há API oficial.
- **Riscos:** raspagem de HTML quebra quando o site muda; o coletor precisa validar antes de publicar, como já faz.

### Logo atrás

- **Porto Alegre:** o JSON em tempo real é o mais fácil de coletar, mas usa uma chave da Procempa embutida no site e não traz data do dado. Vale pedir acesso à Procempa; com ele, sobe para o primeiro grupo.
- **Florianópolis:** tempo real, com endereço e telefone de cada centro de saúde, mas a paginação depende da sessão do navegador.
- **Porto Velho e Vitória:** boas fontes (API REST e Power BI), em redes menores (22 farmácias e 29 UBS).

### Não recomendadas agora

- São Paulo, Maceió e Aracaju: a coleta exigiria contornar captcha, App Check ou token.
- Fortaleza: só no app, com CPF.
- Salvador, Teresina e Cuiabá: só "tem / não tem" (e Salvador instável).
- Goiânia: saldo zero suspeito.
- Natal, Boa Vista e Campo Grande: PDF ou dado parado.
- Rio de Janeiro, Curitiba, João Pessoa, Belém, Macapá, Palmas e Rio Branco: nada encontrado.

## Antes de começar qualquer cidade

- O app hoje só aceita link oficial em `saude.df.gov.br` (`linkOficialPermitido`). Cada cidade nova precisa do seu domínio, e Vitória e Cuiabá hospedam o painel fora do `.gov.br`: o botão deveria apontar para a página da prefeitura que leva a ele.
- Confirmar com a secretaria (e-mail ou LAI) que o dado publicado é o oficial e que a coleta automática está tudo bem, e registrar a resposta no SPEC.
- Nenhuma capital publica consumo médio: decidir como o semáforo aparece quando só existe quantidade ou só "tem / não tem", sem prometer nada que o dado não sustenta.
