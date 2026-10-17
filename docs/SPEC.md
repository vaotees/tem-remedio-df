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
- Abas fixas: Buscar, Meus remédios, Ajuda. Antes da primeira tela: pedido de localização com "Escolher minha região".
- Tela vazia: "Nenhum posto perto tem X hoje" + ver mais longe + salvar em Meus remédios.

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
- Monorepo pnpm: `packages/shared` (schemas zod + regras), `pipeline` (coletor), `apps/mobile` (Expo, a fazer).
- App: Expo + TypeScript + Expo Router, TanStack Query, Fuse.js, react-native-maps, expo-sqlite (Meus remédios).
- Testes: Vitest (coletor e shared); Jest + Testing Library e Maestro (app).

## Marcos

| Marco | Status |
|---|---|
| M0. Teste de extração | Feito — ver `spike/RESULTADOS.md` |
| M1. Coletor diário | Feito — `pipeline/` |
| M2. Base do app | |
| M3. Fluxo principal (busca → dose → lista → detalhe) | |
| M4. Mapa e região manual | |
| M5. Meus remédios, tela vazia, Ajuda | |
| M6. Acabamento (E2E, acessibilidade, APK, README com GIF) | |

## Riscos
- O endpoint do Power BI não é API oficial. Mitigação: validação + pedido dos dados em formato aberto por LAI.
- Farmácias zeradas podem ser dispensação suspensa → mostrar "sem informação de estoque", não "não tem".
- Telefone falta em ~20% das UBSs (CNES + cadastro SES-DF).
