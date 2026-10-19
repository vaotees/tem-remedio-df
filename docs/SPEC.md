# Tem Remédio DF — especificação do MVP

> "Em se tratando de medicamentos, a informação é o melhor remédio."

Nome provisório. Documento vivo: atualize quando uma decisão mudar.

## Objetivo

Em até 3 toques, a pessoa (idosa, ou o filho/cuidador) descobre **qual posto de saúde perto dela tem o remédio hoje** e como chegar lá. Começa só no Distrito Federal, com dados oficiais da SES-DF.

## Escopo

### MVP (v1)
- Busca por nome do remédio, tolerante a acento, erro de digitação e **nome comercial** (Glifage → metformina), via tradutor CMED/Anvisa.
- **Busca por voz** (reconhecimento de fala do próprio celular).
- Escolha da dose/apresentação quando houver mais de uma ("Losartana: qual destes?").
- Lista de UBSs com estoque, da mais perto para a mais longe, com **semáforo**.
- Mapa com os mesmos postos.
- Detalhe do posto: endereço, telefone, horário ("Aberto agora"), **Como chegar**, **Ligar**, **Enviar no WhatsApp**, documentos exigidos, regra de retirada do remédio.
- Localização por GPS ou escolhendo a Região Administrativa.
- **Meus remédios**: lista salva só no celular.
- Funciona offline com o último snapshot, sempre mostrando a data dos dados.
- Acessibilidade: tamanho de letra do sistema, alvos grandes, contraste AA, leitor de tela, cor nunca sozinha.

### Depois
- **v1.1**: aviso no próprio celular quando um remédio de "Meus remédios" voltar ao estoque; Farmácia Popular (selo + farmácias credenciadas); Farmácias de Alto Custo (com a farmácia do paciente, por RA).
- **v2**: leitura do **código de barras** da caixa (EAN da CMED) e/ou foto da caixa (OCR no aparelho); aviso por WhatsApp (Cloud API oficial, com servidor e consentimento LGPD).
- **Talvez**: foto da receita, sempre com confirmação.
- **Fora**: login, farmácias particulares, preços, qualquer dado de saúde do usuário em servidor.

## Telas
1. Início: busca grande, microfone, "Seus remédios", data dos dados.
2. Escolher a dose.
3. Postos com estoque (lista), com semáforo e distância.
4. Mapa.
5. Detalhe do posto.
6. Meus remédios.
- Abas fixas: Buscar, Meus remédios, Ajuda. Na primeira vez que a lista de postos abre, antes do pedido do celular: "Como achar os postos perto de você?" com "Usar minha localização" e "Escolher minha região" (M4).
- Tela vazia: "Nenhum posto tem X hoje" + "Guardar em Meus remédios" (M5). A lista já mostra todos os postos do DF, então não há "ver mais longe".

## Regras de negócio

### Semáforo (`packages/shared/src/estoque.ts`)
`dias = estoque / (consumo médio mensal da própria UBS / 30)`

| Dias | Texto |
|---|---|
| 30+ | Tem bastante |
| 7 a 29 | Tem pouco, ligue antes |
| < 7 | Quase acabando, ligue antes |
| sem consumo registrado | Tem |

Nunca prometer "seguro ir": o dado é da madrugada. Sempre ícone + texto, não só cor.

### Onde retirar (`packages/shared/src/retirada.ts`)
Vem do painel oficial "Como garantir seu medicamento", **remédio por remédio**:

| Retirada | Exemplo | O app |
|---|---|---|
| `qualquer_ubs` | anlodipino, losartana | Lista "mais perto com estoque" |
| `ubs_referencia` | oxibutinina | "Retire na UBS do seu bairro" |
| `controlado` | clonazepam | Só UBSs com `entregaControlados`; receita em 2 vias |
| `unidades_especificas` | fitoterápicos, oseltamivir | Link oficial |
| `grupo_acompanhamento` | tabagismo | Aviso |
| `sem_informacao` | — | "Confirme com a UBS" |

Remédios **aplicados no próprio posto** (injetáveis de uso na UBS) ficam fora do snapshot.

**Unidades prisionais** atendem só a população presa: o coletor tira do snapshot (`pipeline/src/transformar/montar.ts`). O cadastro da SES-DF marca as 9 com horário "OUTRO/PRISIONAL"; o nome da farmácia ("… PRISIONAL …") é a segunda pista. Em 17/10/2026, 3 tinham estoque: UBS DCCP, PFDF Gama e CPP SIA. O app continua filtrando (`ehUnidadePrisional` em `apps/mobile/src/postos/postos.ts`), como defesa.

Ressalva: "sem observação" = sem restrição publicada, não uma regra escrita de "qualquer UBS". Confirmar com a Ouvidoria da SES-DF.

### Tradutor de marcas
- Fonte: tabela CMED (Anvisa), marca → substância → apresentação.
- Compara substâncias por palavras, sem sais ("cloridrato de metformina" = "metformina (cloridrato)").
- **Mesma substância ≠ mesmo remédio**: se a marca é de liberação prolongada (Glifage XR) e o produto do SUS não é, o app avisa e manda confirmar com médico ou farmacêutico.
- Lacuna conhecida: a CMED só tem remédios com preço regulado (ex.: falta Os-Cal D). Complemento previsto: cadastro de registros da Anvisa.

## Arquitetura

```
Painéis InfoSaúde (Power BI)  ─┐
API CNES (Ministério da Saúde) ─┼─► coletor (GitHub Actions, 01:00 e 14:00) ─► snapshot.json + meta.json (GitHub Pages) ─► app Expo (cache local, busca offline)
Tabela CMED (Anvisa)          ─┘
```

- **Sem servidor no MVP**: snapshot de ~465 KB (~120 KB com gzip); busca e distância no celular; custo zero; nenhum dado do usuário sai do aparelho.
- O coletor **valida antes de publicar** (schema, mínimos, queda > 25%); se rejeitar, o snapshot anterior continua valendo. Se a SES-DF não atualizou, não republica.
- O app nunca consulta o Power BI direto.

### Stack
- Monorepo pnpm: `packages/shared` (schemas zod + regras), `pipeline` (coletor), `apps/mobile` (Expo).
- App: Expo SDK 57 + TypeScript + Expo Router (abas em JS), TanStack Query, expo-file-system (snapshot, região e Meus remédios em arquivos JSON), Fuse.js (busca), expo-location, react-native-maps.
- **Por que SDK 57:** o SDK 58 saiu em 15/10/2026, mas o Expo Go para ele ainda não está nas lojas. Quando chegar, o novo Expo Go só abre SDK 58: aí subimos o projeto (`pnpm exec expo install expo@~58.0.0` + `expo install --fix`, Testing Library 14 e Jest 30).
- Testes: Vitest (coletor e shared); Jest 29 + Testing Library 13 (app); Maestro (E2E, M6).

### Dados no app (M2)
- O app **abre com o snapshot embutido** (`apps/mobile/assets/dados/snapshot-inicial.json`): funciona na primeira abertura, sem internet.
- Depois usa o último snapshot baixado (cache), se for válido e mais novo que o embutido.
- Em segundo plano, baixa só o `meta.json`; o `snapshot.json` inteiro só vem se a SES-DF atualizou. Também procura ao voltar o app para a frente.
- Tudo que vem de fora passa pelo mesmo schema zod do coletor. Snapshot de outra `versaoSchema` é ignorado (app desatualizado).
- Armazenamento: `expo-file-system` no celular, `localStorage` na web.
- Endereço dos dados: `EXPO_PUBLIC_SNAPSHOT_URL` (GitHub Pages). Sem ele, só o embutido.

### Tema acessível (M2)
- Cores só de `src/tema/cores.ts`, com teste de contraste: todo texto ≥ 4,5:1 (AA), bordas ≥ 3:1, nos temas claro e escuro.
- Fonte base 18 (títulos 28), respeitando o tamanho de letra do celular. Alvo de toque mínimo 56.
- Rótulos das abas quebram em 2 linhas; nunca cortam com "…".

### Fluxo principal (M3)
- Navegação: pilha dentro da aba Buscar (`src/app/(abas)/(buscar)/`), para a barra de abas ficar sempre visível. Rotas: `/` busca → `/remedio/[codigo]` "Qual destes?" → `/postos/[codigo]` → `/posto/[cnes]?farmacia=…&produto=…`. As rotas usam o código SES-DF do produto e o CNES (+ farmácia, porque 3 UBSs têm duas farmácias), que não mudam quando o snapshot atualiza. Cada tela tem um "Voltar" grande, escrito.
- **Busca** (`src/busca/`): Fuse.js sobre `produtos[].busca` e `marcas[].nome`, com o texto passado por `normalizar()`. Cada palavra digitada precisa casar (tolerando erro de digitação), em qualquer parte do nome; resultados muito piores que o melhor são descartados ("puran" acha Puran T4, não alopurinol). Resultados agrupados por substância (sem sal entre parênteses e sem acento: "ACIDO FOLICO" = "ACIDO FÓLICO"). Marca que é só o nome genérico na CMED ("DIPIRONA SODICA") não aparece como nome comercial. O índice é montado logo depois que a tela abre (~100 ms).
- Uma forma e dose só: o resultado vai direto para os postos. Mais de uma: "Qual destes?", com quantos postos têm cada uma; doses repetidas mostram a descrição da SES-DF (ex.: prednisona comum × hanseníase).
- **Liberação prolongada**: buscou por marca de liberação prolongada e o produto do SUS não é → aviso em "Qual destes?" e na lista de postos.
- **Lista de postos** (`src/postos/`): distância em linha reta pela localização do aparelho (expo-location; a localização não sai do celular). Sem permissão, sem GPS ou fora do DF (posto mais perto a mais de 60 km): pela região escolhida ou, sem ela, por Região Administrativa (ver M4). 10 postos por vez ("Mostrar mais postos"). Cada posto: nome, RA, distância, semáforo e "Aberto agora / Fechado agora, abre …" quando o horário do cadastro dá para interpretar (não conhece feriados). Avisos de retirada conforme `retirada`; controlado mostra só UBSs com `entregaControlados`.
- Tela vazia: "Nenhum posto tem X hoje" + guardar em Meus remédios (ver M5).
- **Detalhe do posto**: estoque do remédio escolhido com "Estoque de hoje às HHhMM, ligue antes de ir", regra de retirada, Como chegar (pergunta qual app usar: Mapas, só no iPhone, Google Maps ou Waze; links https, que abrem no navegador se o app não estiver instalado, porque o Expo Go não deixa consultar os apps instalados), Ligar (`tel:+55…`), Enviar no WhatsApp (abre o WhatsApp direto com a mensagem pronta, `whatsapp://send`; sem WhatsApp, a folha de compartilhar do celular; na web, `wa.me`), endereço, horário, telefone e documentos.
- **Fachada (Street View) testada e retirada.** Um botão "Ver a fachada" abria o Street View do Google Maps por link, sem chave de API. No iPhone, o Google escolheu o panorama mais próximo da coordenada, que era uma foto enviada por usuário: uma imagem antiga, em preto e branco, do "SAMDU Posto de Taguatinga" (UBS 5 Taguatinga). Para um idoso, isso confunde mais do que ajuda, e o link não deixa escolher só a foto oficial e recente da rua. Caminho para depois, se valer a pena: o coletor consulta a metadata API do Street View (`source=outdoor`; as consultas não são cobradas, mas exigem chave de um projeto do Google Cloud, guardada só no segredo do GitHub Actions) e guarda no snapshot o id do panorama oficial e a data da foto. O app abre esse panorama já virado para o posto e mostra a data ("foto de maio de 2026"), sem chave no celular.
- **Busca por voz** ficou para depois: precisa de módulo nativo, que não roda no Expo Go (entra com o development build/APK do M6).

### Mapa e região (M4)
- Rota nova: `/regiao` ("Qual é a sua região?"), fora das abas, aberta pela lista de postos e pela aba Ajuda; ao escolher, volta para onde estava.
- **Lista | Mapa** na tela de postos (abas lado a lado; a escolhida fica preenchida e com ícone de marcado). O mapa (react-native-maps 1.27.2, a versão do SDK 57, que já vem no Expo Go: Mapas da Apple no iPhone, Google Maps no Android, sem chave) mostra os mesmos postos, na mesma ordem e com o mesmo filtro de retirada da lista. Abre enquadrando a pessoa (ou o centro da região escolhida) e os 5 primeiros postos.
- **Pinos**: bolinha com a cor e o ícone do semáforo, borda branca e área de toque de 56; o escolhido fica maior. Cores próprias (`cores.pino`), iguais nos dois temas porque o mapa do Android continua claro no tema escuro. O teste de contraste confere o ícone sobre o pino (4,5:1) e o pino sobre o chão do mapa claro e do escuro (3:1). Legenda com os níveis que aparecem no mapa.
- **Cartão embaixo do mapa**: começa no mais perto (ou no primeiro da lista, sem localização), com nome, região, distância, semáforo (cor + ícone + texto), horário, **Ver posto** e **Ver o próximo mais perto**, que anda pela lista sem precisar acertar o pino (mais fácil para quem treme a mão e para quem usa leitor de tela). O leitor de tela anuncia "Mapa com N postos que têm hoje" quando o mapa aparece, e o posto novo a cada "Ver o próximo".
- **Web**: o react-native-maps não funciona no navegador. `MapaPostos.web.tsx` faz o Metro nunca carregá-lo; a tela mostra só a lista, com um aviso discreto ("O mapa dos postos aparece no app do celular").
- **Regiões** (`src/postos/regioes.ts`): as 35 Regiões Administrativas, em ordem alfabética, uma por linha, com um ponto de referência no centro urbano de cada uma (não o centro geográfico, que nas regiões rurais cai no mato). Conferido com o cadastro: todo ponto fica a menos de 5 km de um posto da própria região. Cinco regiões não aparecem no cadastro da SES-DF (Sudoeste/Octogonal, Sol Nascente/Pôr do Sol, Arniqueira, Arapoanga e Água Quente): quem escolhe uma delas vê primeiro os postos mais perto dela.
- **Ordem pela região**: primeiro os postos dela, depois os outros pela distância do ponto de referência. A distância não aparece: não é a distância da pessoa.
- **Qual vale**: a região, se a pessoa a escolheu por último (vale mesmo com o GPS ligado, ex.: o filho procurando para a mãe); senão a localização; se o GPS falhar ou a pessoa estiver fora do DF, a região escolhida antes; sem nada, por Região Administrativa e nome. "Usar minha localização" volta para o GPS e guarda a região como reserva.
- **Primeira vez**: a lista não pede a localização sozinha. Mostra "Como achar os postos perto de você?" com **Usar minha localização** (aí o celular pergunta) e **Escolher minha região**. Se a pessoa negar, o aviso oferece "Escolher minha região" e "Permitir nos ajustes".
- A região fica só no aparelho (`regiao.json` com expo-file-system; `localStorage` na web) e pode ser trocada pela tela de postos e pela aba Ajuda ("Postos perto de você").

### Meus remédios, tela vazia e Ajuda (M5)
- **Guardar**: botão "Guardar em Meus remédios" na lista de postos, logo abaixo do nome do remédio; na tela vazia, dentro do cartão "Nenhum posto tem X hoje", como ação principal. Guardado, o mesmo botão mostra o estado com ícone e texto (coração cheio + "Guardado em Meus remédios", e embaixo "Está na aba Meus remédios. Para tirar, toque no botão de novo.") e tira da lista com outro toque. O leitor de tela anuncia "Guardado em Meus remédios" / "Tirado de Meus remédios".
- O **detalhe do posto não tem o botão**: a tela é sobre o lugar, e a lista de postos, um "Voltar" atrás, já tem.
- **Onde fica**: `meus-remedios.json` no aparelho, pelo mesmo `armazenamento` da região (expo-file-system no celular, `localStorage` na web), com schema zod e React Query (`staleTime: Infinity`), em `src/meus-remedios/guardados.ts`. JSON em vez de expo-sqlite: a lista é curta, segue o padrão da região e não traz dependência nativa nova. Guarda o código SES-DF do produto (não muda entre snapshots), o nome e a forma/dose da hora (para mostrar mesmo se o remédio sumir dos dados), a marca que a pessoa buscou (para lembrar o aviso de liberação prolongada) e a data. Arquivo estragado vira lista vazia; um item estragado fica de fora sem levar os outros. Antes de gravar, o app lê o arquivo: nunca grava por cima de uma lista que ainda não leu.
- **Aba Meus remédios**: os remédios em ordem alfabética. Cada um mostra quantos postos têm hoje e o primeiro pela origem atual ("Mais perto de você", "Na sua região" ou "Mais perto da sua região"), com nome, região, distância (só com GPS) e semáforo (cor + ícone + texto). Usa a mesma lista da tela de postos (`postosComEstoque`): controlado só nas UBSs que entregam controlados, unidade prisional nunca. Avisos de retirada aparecem pelo título ("Retire na UBS do seu bairro", "Só nas UBSs que entregam controlados"…), e a marca de liberação prolongada ganha o lembrete "Glifage XR é de liberação prolongada; este não é. Confirme com seu médico ou farmacêutico." Um toque abre a lista de postos do remédio (com a marca, para o aviso aparecer lá também).
- **Localização na aba**: segue a regra "Primeira vez" do M4, a aba nunca pede a localização sozinha. Na primeira vez, a mesma pergunta "Como achar os postos perto de você?"; até a resposta, e enquanto o GPS não responde, só a contagem. Sem localização nem região não existe "mais perto": a aba mostra só quantos postos têm e o aviso para escolher a região, sem apresentar um posto qualquer como o melhor. Com origem, uma linha diz de onde conta ("O posto mais perto de você, em linha reta." ou "Pela sua região: X."); trocar a região fica na tela de postos e na Ajuda.
- **Código que sumiu do snapshot**: o item continua guardado, com "Não aparece nos dados de hoje", "Se ele voltar para a lista da SES-DF, aparece aqui de novo." e o botão "Tirar de Meus remédios". O app não apaga sozinho.
- **Navegação**: as telas de postos e do posto ficam em `(abas)/(buscar,meus)/` (rotas compartilhadas do Expo Router). Abertas pela aba Meus remédios, ficam nessa aba, e o "Voltar" volta para a lista guardada, não para a busca. Um link frio (`/postos/…`) abre na aba Buscar, a primeira do layout das abas.
- **Busca** (Telas, item 1): antes de digitar, "Seus remédios" com os 3 primeiros (só a contagem de postos, sem localização) e "Ver os N em Meus remédios" quando há mais.
- O app **não avisa sozinho** quando um remédio chega (isso é a v1.1): a tela vazia e a Ajuda dizem para abrir a aba e conferir, sem prometer aviso.
- **Ajuda**: "Como usar" (buscar, escolher a dose, ver os postos, tocar no posto), cartão "Meus remédios" (guardar, ver, tirar; não avisa sozinho; a lista fica só no celular), dados sem internet e "alguns remédios só são entregues em certas UBSs, como os controlados". Nada de telefone, endereço ou regra que não venha de fonte oficial.

### Como testar no celular
- **Expo Go** no celular (de preferência Android), lendo o QR code do `pnpm app`.
- **Web** para conferência rápida de layout.
- **EAS Build** (nuvem) quando entrar módulo nativo fora do Expo Go (busca por voz) e para o APK (M6). Xcode/Android SDK locais não são necessários.

## Marcos

| Marco | Status |
|---|---|
| M0. Teste de extração | Feito — ver `spike/RESULTADOS.md` |
| M1. Coletor diário | Feito — `pipeline/` |
| M2. Base do app | Feito — `apps/mobile/`: abas, tema acessível, snapshot embutido + cache + atualização |
| M3. Fluxo principal (busca → dose → lista → detalhe) | Feito — busca tolerante com marcas, "Qual destes?", postos por distância, detalhe com Como chegar/Ligar/WhatsApp. Busca por voz adiada (precisa de development build) |
| M4. Mapa e região manual | Feito — Lista \| Mapa com pinos do semáforo e cartão do mais perto (na web, só a lista); Região Administrativa escolhida à mão, salva no aparelho, trocável pela lista e pela Ajuda; pergunta antes do pedido de localização |
| M5. Meus remédios, tela vazia, Ajuda | Feito — guardar e tirar pela lista de postos (e pela tela vazia), lista no aparelho em JSON; aba com a situação de hoje de cada remédio (quantos postos e o primeiro pela localização ou região, com semáforo e avisos de retirada); "Seus remédios" na busca; Ajuda com "Como usar" e "Meus remédios" |
| M6. Acabamento (E2E, acessibilidade, APK, busca por voz, README com GIF) | |

## Riscos
- O endpoint do Power BI não é API oficial. Mitigação: validação + pedido dos dados em formato aberto por LAI.
- Farmácias zeradas podem ser dispensação suspensa → mostrar "sem informação de estoque", não "não tem".
- Telefone falta em ~20% das UBSs (CNES + cadastro SES-DF).
