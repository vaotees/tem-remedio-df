# Como apresentar o Tem Remédio DF

## Links

- Versão web: https://vaotees.github.io/tem-remedio-df/app/
- APK para Android: https://github.com/vaotees/tem-remedio-df/releases/latest
- Código: https://github.com/vaotees/tem-remedio-df
- Estudo de caso (EM Soluções Digitais): https://emsolucoesdigitais.com.br/cases/tem-remedio-df

## Em 30 segundos

> Muita gente idosa no DF sai de casa para buscar remédio na UBS e volta sem ele. A Secretaria de Saúde publica o estoque de cada farmácia, mas num painel difícil até para quem tem prática. O Tem Remédio DF lê esses dados públicos todo dia e responde, em letra grande: em qual posto perto de você tem o seu remédio hoje, como chegar e o telefone para ligar antes. Não pede cadastro nem senha, e a lista de remédios fica só no celular.

## Vídeo (60 a 90 segundos)

Grave com a gravação de tela do iPhone, de dia (para aparecer "Aberto agora"), com a letra normal e o tema claro. Ative o "Não perturbe" antes. Uma ação por cena e sem pressa: quem assiste não conhece o app.

| # | Tela | O que fazer | Legenda (texto na tela) |
|---|---|---|---|
| 1 | Início | Abrir o app e esperar 2 segundos | "Em qual UBS do DF tem o meu remédio hoje?" |
| 2 | Busca | Escrever "glifage" devagar | "Vale o nome da caixa: Glifage → metformina" |
| 3 | Postos | Abrir o resultado e mostrar o resumo | "Quantos postos têm hoje, e como está o estoque" |
| 4 | Mapa | Tocar em "Mapa", mostrar a legenda e tocar num pino | "Cor, ícone e texto: nunca só a cor" |
| 5 | Detalhe | Tocar em "Ver posto" e descer até o horário | "Como chegar, ligar antes, horário da semana" |
| 6 | Guardar | Voltar e tocar em "Guardar em Meus remédios" | "Guarda sem cadastro: fica só no celular" |
| 7 | Meus remédios | Abrir a aba | "Todo dia, a situação dos seus remédios" |
| 8 | Perfil | Escolher "Maior" no tamanho da letra | "Letra grande para quem enxerga pouco" |
| 9 | Fim | Voltar ao Início | "Dados públicos da SES-DF, atualizados todo dia" + link |

Para o LinkedIn, sobra espaço para uma frase sobre o porquê ("fiz para a minha mãe", se for o caso) e o link da versão web.

## Perguntas de entrevista que o projeto responde

- **De onde vêm os dados?** Do painel de estoque da SES-DF (Power BI público), do CNES e da tabela CMED. Um coletor em GitHub Actions confere de hora em hora, valida tudo com zod e publica um arquivo estático no GitHub Pages. Se a SES-DF publicar dado quebrado, o anterior continua no ar.
- **Por que não tem servidor nem login?** A lista de remédios de uma pessoa é dado de saúde (LGPD, art. 11). Sem servidor, não há o que vazar; sem senha, não há a principal porta de golpe contra idosos.
- **E sem internet?** O app vem com um snapshot embutido e guarda o último baixado; diz sempre de quando é o dado.
- **Acessibilidade?** Letra de 18 pt ou mais, que cresce com o celular e com o Perfil; fonte Atkinson Hyperlegible; contraste testado automaticamente nos dois temas; alvos de toque de 56; leitor de tela revisado (VoiceOver e TalkBack).
- **Qualidade?** Cerca de 300 testes (coletor, regras e telas), TypeScript estrito, CI em todo PR, e a versão web exportada a cada mudança.
- **O que você faria a seguir?** "Pessoas que eu cuido" (uma lista para cada pessoa), histórico de 30 dias ("costuma ter neste posto") e a publicação nas lojas.
