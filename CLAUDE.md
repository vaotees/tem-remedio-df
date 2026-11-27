# CLAUDE.md

App React Native (Expo) que mostra o estoque de remédios das UBSs do Distrito Federal, para idosos e cuidadores. Projeto de portfólio. A especificação está em `docs/SPEC.md`: siga o escopo de lá e atualize-o quando uma decisão mudar.

## Estrutura
- `packages/shared` — formato do snapshot (schemas zod), semáforo, regras de retirada, `normalizar()`. Usado pelo coletor e pelo app.
- `pipeline` — coletor diário: extrai (Power BI da SES-DF, CNES, CMED) → limpa → valida → publica `snapshot.json` + `meta.json`.
- `apps/mobile` — app Expo SDK 58 (React Native 0.88, Expo Router, rotas em `src/app/`). Leia `apps/mobile/AGENTS.md`: o Expo muda a cada SDK, consulte a documentação da versão instalada antes de usar uma API.
- `spike/` — teste de extração (M0) em Python; só referência, não é código de produção.

## Comandos
- `pnpm install`
- `pnpm test` / `pnpm typecheck` / `pnpm lint` — todos os pacotes
- `pnpm coletar` — roda o coletor de verdade (rede), grava em `pipeline/saida/`
- `pnpm --filter @tem-remedio/pipeline coletar --anterior saida/meta.json` — simula "SES-DF ainda não atualizou"
- `pnpm snapshot:app` — copia o snapshot gerado pelo coletor para dentro do app (rode `pnpm coletar` antes)
- `pnpm app` — servidor do Expo (Expo Go no celular; `w` abre a versão web)
- APK: `npx eas-cli@latest build --platform android --profile preview` em `apps/mobile` (perfis em `eas.json`; projeto `@estevao.marques/tem-remedio-df`). O EAS lê a configuração pelo `expo` do projeto: sem `node_modules` instalado, ele acha um `expo` 42 antigo em `~/node_modules` e trava.
- Versão web para o Pages: `TEM_REMEDIO_BASE_URL=/tem-remedio-df/app pnpm exec expo export --platform web --output-dir dist` em `apps/mobile`, depois `node scripts/montar-site.mjs --dados pipeline/saida --web apps/mobile/dist --saida _site`. O workflow `Coletor diário` faz isso sozinho.

## App (apps/mobile)
- Instalar pacote: `pnpm exec expo install <pacote>` **dentro de `apps/mobile`**. Não use `npx expo`: há um `expo-cli` global antigo (2021) nesta máquina que entra no lugar quando o `expo` local não é achado e instala versões erradas com npm.
- Jest 30 + Testing Library 14 (assíncrona: sempre `await render(...)`, `await renderRouter(...)`, `await fireEvent...`), com `test-renderer` no lugar do `react-test-renderer`. Ícones são simulados em `jest.setup.tsx`.
- Depois de trocar versão do Expo, rode `npx expo-doctor@latest` em `apps/mobile` (pega dependências duplicadas de outro SDK). Se sobrar pacote de outro SDK resolvido como peer no `pnpm-lock.yaml`, apague só as entradas dele no lockfile e rode `pnpm install`; `pnpm update --depth Infinity` sobe muita coisa que não tem nada a ver.
- Cores só de `src/tema/cores.ts`; o teste de contraste (`__tests__/tema-test.ts`) tem que continuar passando. Fonte da marca (Atkinson Hyperlegible Next) pelo `Texto` (`peso`, nunca `fontWeight`); cartões com `Cartao`/`sombraCartao`; gráficos (barra da rede, inteira ou `compacta`, e medidor de dias) em `src/componentes/Graficos.tsx`.
- Abertura animada em `src/componentes/Abertura.tsx`, por cima do app no `_layout` raiz; nos testes de tela ela é trocada por nada (`jest.setup.tsx`). Dica de uso que some com "Entendi": `Dica` (guarda em `preferencias.json`).
- Preferências do Perfil (nome, letra, cores) em `src/preferencias/preferencias.ts`, só no aparelho (`preferencias.json`); `useTema` já aplica a letra e as cores.
- Texto nunca é cortado com "…" (rótulos quebram linha; texto ao lado de ícone leva `flexShrink: 1`); alvo de toque mínimo `ALVO_MINIMO` (56). O ESLint barra `numberOfLines` e companhia.
- Ícones só pelo `Icone` (`src/componentes/Icone.tsx`), que os esconde do leitor de tela. Texto que muda sem toque (resultado, contagem) leva `accessibilityLiveRegion` (Android/web) e `useAnuncio` (iPhone).
- Telas usam `Tela` e `ComDados`; dados vêm de `useSnapshot()`, nunca direto da rede.
- Lógica sem tela em `src/busca` (busca, agrupamento por substância), `src/postos` (distância, horário, regras de retirada, links, regiões, ordem dos postos, mapa) e `src/meus-remedios` (lista guardada no aparelho, situação de hoje). Rotas: quatro abas (Início, Mapa, Meus remédios, Perfil). `src/app/(abas)/(buscar)/` (Início com a busca, "Qual destes?"), `(abas)/(mapa)/` (mapa da rede), `(abas)/(meus)/` (Meus remédios), `(abas)/perfil.tsx` e `(abas)/(buscar,meus,mapa)/` (postos e detalhe, compartilhados pelas três abas: abertos por uma, ficam nela). A Ajuda (`(abas)/ajuda.tsx`) não aparece na barra: abre pelo "?" do Início e pelo Perfil. A escolha da região em `src/app/regiao.tsx`.
- Mapa só no celular: `react-native-maps` é importado apenas em `src/componentes/MapaPostos.tsx`; na web vale `MapaPostos.web.tsx` (sem mapa). No Jest ele é simulado em `jest.setup.tsx`.
- Testes de tela usam o snapshot pequeno `fixtures/snapshot-teste.ts` (registros reais) e simulam o `expo-location` e os arquivos do aparelho (`@/dados/armazenamento`).

## Convenções
- Código, comentários, testes e mensagens em **português do Brasil**.
- TypeScript estrito (`noUncheckedIndexedAccess`). Sem `any` fora das respostas cruas do Power BI.
- Testes com dados reais em `pipeline/test/fixtures/` (respostas do Power BI, trechos da CMED e das regras). Nada de rede nos testes.
- Mudou o formato do snapshot? Suba `VERSAO_SCHEMA` em `packages/shared/src/snapshot.ts` e ajuste o app.

## Regras do domínio (não quebrar)
- O app **nunca** consulta o Power BI; só lê o snapshot publicado.
- Estoque por UBS usa `i_cmml` (consumo da UBS). `i_cmm` é o consumo da rede inteira.
- O painel cruza todos os locais × produtos; o coletor filtra `i_qtd_rede > 0` na própria consulta.
- Ao paginar com RestartTokens, o Power BI repete a última linha da página anterior: o cliente descarta.
- Material (sem `i_abastecimento`), almoxarifados e remédios "aplicados no próprio posto" ficam fora.
- Unidades prisionais (horário "OUTRO/PRISIONAL" no cadastro ou "PRISIONAL" no nome da farmácia) atendem só a população presa: o coletor as tira do snapshot e o app continua filtrando (`ehUnidadePrisional` em `src/postos/postos.ts`), como defesa, inclusive no detalhe aberto por link (`acharUbs`).
- Observação de retirada desconhecida vira `sem_informacao` + aviso no log, nunca `qualquer_ubs`.
- "Ver a lista oficial" só abre `https` em `saude.df.gov.br` e subdomínios (`linkOficialPermitido` em `packages/shared/src/confianca.ts`): o schema recusa outro endereço, o coletor troca por `null` com aviso no log e o app confere de novo antes do botão.
- Telefone só no formato brasileiro (`normalizarTelefone` em `packages/shared/src/telefone.ts`): o coletor grava formatado e troca o resto por `null` com aviso no log; o app confere de novo e não mostra Ligar para número com erro.
- Dados com data mais de 1 dia no futuro não entram (`dataNoFuturo`): o coletor rejeita e ignora um publicado assim; o app descarta. Snapshot acima de `LIMITES_SNAPSHOT` (tamanho, listas, textos) também não.
- Textos do semáforo nunca prometem que é "seguro ir"; cor sempre acompanhada de ícone e texto.
- Mesma substância ≠ mesmo remédio: avisar quando a marca é de liberação prolongada e o produto do SUS não.
- LGPD: lista de remédios do usuário fica só no aparelho (`meus-remedios.json`). Nenhum dado de saúde em servidor no MVP.
