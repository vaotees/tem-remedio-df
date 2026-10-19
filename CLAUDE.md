# CLAUDE.md

App React Native (Expo) que mostra o estoque de remédios das UBSs do Distrito Federal, para idosos e cuidadores. Projeto de portfólio. A especificação está em `docs/SPEC.md`: siga o escopo de lá e atualize-o quando uma decisão mudar.

## Estrutura
- `packages/shared` — formato do snapshot (schemas zod), semáforo, regras de retirada, `normalizar()`. Usado pelo coletor e pelo app.
- `pipeline` — coletor diário: extrai (Power BI da SES-DF, CNES, CMED) → limpa → valida → publica `snapshot.json` + `meta.json`.
- `apps/mobile` — app Expo SDK 57 (Expo Router, rotas em `src/app/`). Fica no 57 até o Expo Go do SDK 58 chegar às lojas (ver `docs/SPEC.md`). Leia `apps/mobile/AGENTS.md`: o Expo muda a cada SDK, consulte a documentação da versão instalada antes de usar uma API.
- `spike/` — teste de extração (M0) em Python; só referência, não é código de produção.

## Comandos
- `pnpm install`
- `pnpm test` / `pnpm typecheck` / `pnpm lint` — todos os pacotes
- `pnpm coletar` — roda o coletor de verdade (rede), grava em `pipeline/saida/`
- `pnpm --filter @tem-remedio/pipeline coletar --anterior saida/meta.json` — simula "SES-DF ainda não atualizou"
- `pnpm snapshot:app` — copia o snapshot gerado pelo coletor para dentro do app (rode `pnpm coletar` antes)
- `pnpm app` — servidor do Expo (Expo Go no celular; `w` abre a versão web)

## App (apps/mobile)
- Instalar pacote: `pnpm exec expo install <pacote>` **dentro de `apps/mobile`**. Não use `npx expo`: há um `expo-cli` global antigo (2021) nesta máquina que entra no lugar quando o `expo` local não é achado e instala versões erradas com npm.
- Testing Library 13 (o Expo Router 57 exige). Os testes já usam `await render(...)`/`await fireEvent...`, que também serve para a 14 (assíncrona) quando subirmos para o SDK 58. Ícones são simulados em `jest.setup.tsx`.
- Depois de trocar versão do Expo, rode `npx expo-doctor@latest` em `apps/mobile` (pega dependências duplicadas de outro SDK).
- Cores só de `src/tema/cores.ts`; o teste de contraste (`__tests__/tema-test.ts`) tem que continuar passando.
- Texto nunca é cortado com "…" (rótulos quebram linha); alvo de toque mínimo `ALVO_MINIMO` (56).
- Telas usam `Tela` e `ComDados`; dados vêm de `useSnapshot()`, nunca direto da rede.
- Lógica sem tela em `src/busca` (busca, agrupamento por substância), `src/postos` (distância, horário, regras de retirada, links, regiões, ordem dos postos, mapa) e `src/meus-remedios` (lista guardada no aparelho, situação de hoje). Rotas: `src/app/(abas)/(buscar)/` (busca, "Qual destes?"), `(abas)/(meus)/` (Meus remédios) e `(abas)/(buscar,meus)/` (postos e detalhe, compartilhados pelas duas abas: abertos por uma, ficam nela); a escolha da região em `src/app/regiao.tsx`.
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
- Unidades prisionais (horário "OUTRO/PRISIONAL" no cadastro ou "PRISIONAL" no nome da farmácia) atendem só a população presa: o coletor as tira do snapshot e o app continua filtrando (`ehUnidadePrisional` em `src/postos/postos.ts`), como defesa.
- Observação de retirada desconhecida vira `sem_informacao` + aviso no log, nunca `qualquer_ubs`.
- Textos do semáforo nunca prometem que é "seguro ir"; cor sempre acompanhada de ícone e texto.
- Mesma substância ≠ mesmo remédio: avisar quando a marca é de liberação prolongada e o produto do SUS não.
- LGPD: lista de remédios do usuário fica só no aparelho (`meus-remedios.json`). Nenhum dado de saúde em servidor no MVP.
