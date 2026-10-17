# CLAUDE.md

App React Native (Expo) que mostra o estoque de remédios das UBSs do Distrito Federal, para idosos e cuidadores. Projeto de portfólio. A especificação está em `docs/SPEC.md`: siga o escopo de lá e atualize-o quando uma decisão mudar.

## Estrutura
- `packages/shared` — formato do snapshot (schemas zod), semáforo, regras de retirada, `normalizar()`. Usado pelo coletor e pelo app.
- `pipeline` — coletor diário: extrai (Power BI da SES-DF, CNES, CMED) → limpa → valida → publica `snapshot.json` + `meta.json`.
- `apps/mobile` — app Expo (ainda não criado; M2).
- `spike/` — teste de extração (M0) em Python; só referência, não é código de produção.

## Comandos
- `pnpm install`
- `pnpm test` / `pnpm typecheck` — todos os pacotes
- `pnpm coletar` — roda o coletor de verdade (rede), grava em `pipeline/saida/`
- `pnpm --filter @tem-remedio/pipeline coletar --anterior saida/meta.json` — simula "SES-DF ainda não atualizou"

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
- Observação de retirada desconhecida vira `sem_informacao` + aviso no log, nunca `qualquer_ubs`.
- Textos do semáforo nunca prometem que é "seguro ir"; cor sempre acompanhada de ícone e texto.
- Mesma substância ≠ mesmo remédio: avisar quando a marca é de liberação prolongada e o produto do SUS não.
- LGPD: lista de remédios do usuário fica só no aparelho. Nenhum dado de saúde em servidor no MVP.
