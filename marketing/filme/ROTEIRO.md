# Roteiro do filme do Tem Remédio DF

Filme vertical (1080 × 1920, 30 qps), com 34 s, para Reels, Stories e LinkedIn. Depois sai um corte horizontal (16:9), mais longo no app, para o case da EM e o YouTube. Funciona sem som: toda fala também aparece escrita na tela, palavra por palavra.

Arco: **problema → virada → prova → produto → cuidado → ação**.

| # | Tempo | Cena | O que se vê | Fala (narração) e texto na tela |
|---|---|---|---|---|
| 1 | 0,0–1,3 s | Capa | Quadro zero já é capa: o símbolo em 3D e "Tem Remédio DF". | (sem fala) |
| 2 | 0,9–5,6 s | Problema | Uma cartela de remédio em 3D esvazia, cápsula por cápsula, enquanto a pergunta é feita. | "Ir até a UBS e voltar sem o remédio?" |
| 3 | 5,2–9,6 s | Virada | Uma tabela de estoque cheia de números miúdos (UBSs e dias de estoque reais) aparece e se desfaz num desfoque. As duas metades da cápsula chegam e se encaixam com um "clique", no pico da música, e formam o símbolo. | "O estoque é público. Agora, fácil de ler." |
| 4 | 9,2–16,6 s | Prova | A câmera chega sobre o DF em relevo. As 154 farmácias de UBS sobem como cápsulas, em onda a partir de Taguatinga, nas coordenadas reais; altura = dias de estoque, cor = semáforo. O número conta junto com a fala e a legenda entra no fim. | "Hoje, 125 de 154 postos têm losartana." (número do dia do render) |
| 5 | 16,2–20,9 s | Produto | O celular entra em perspectiva com o app real: a busca por "glifage", a lista de postos, o mapa com a legenda e o detalhe. Selos saltam da tela: "Tem bastante" e "Aberto agora · fecha às 18h". | "Veja o posto mais perto e ligue antes de ir." |
| 6 | 20,5–27,0 s | Cuidado | Em Meus remédios, a letra cresce de Normal para Maior. Saltam os selos "Letra maior", "Sem senha e sem cadastro" e "A lista fica só no celular". | "Letra grande, sem cadastro, e sua lista fica só no celular." |
| 7 | 26,6–34,3 s | Ação | O símbolo 3D gira devagar; "Antes de sair de casa, veja se tem."; o QR e o link da versão web; "Um projeto da EM Soluções Digitais". | "Tem Remédio DF. Antes de sair de casa, veja se tem." |

## Direção de arte

- **Noite azul**: fundo azul-marinho (`#0B1A2B`), com a faixa azul da marca (`#0B5FA5`) e a menta (`#86E3BC`) só nos destaques.
- **Letra do app**: Atkinson Hyperlegible Next (feita para baixa visão) nos títulos e textos; a Mono nos rótulos e números.
- **Sem pessoas desenhadas e sem fotos reais.** O protagonista é o símbolo (a cápsula que vira um visto). O app aparece sempre com as telas reais.
- **Semáforo sempre com ícone e texto**, como no app. O verde da marca não aparece perto do verde do estoque.
- **Dados reais**: o mapa usa as coordenadas e o estoque do snapshot publicado (`node dados.mjs`), e o número falado é o do dia em que o filme for gerado.

## Som

- **Narração** na mesma voz do filme da Plano Alto (Gemini, `pt-br-advisor-1`), num tom calmo e acolhedor (`voz.mjs`). O Instagram pede o rótulo de IA em Reels com voz gerada.
- **Música**: "Infinity", de Arulo (Mixkit, licença gratuita da Mixkit), em `public/musica.mp3`. Começa no segundo 10 da faixa, para o pico (17 s) cair no encaixe da cápsula.
- **Efeitos** sintetizados com o ffmpeg: "clique" do encaixe, "pops" das cápsulas subindo no mapa, toque do botão.
- **Volume final** em −14 LUFS (o padrão das redes).

## Ordem de trabalho

1. Roteiro e três quadros de estilo (mapa, celular, final): aprovados em 25/11/2026.
2. Narração: a duração de cada fala define a linha do tempo (`src/tempo.ts`).
3. Animação, revisada por quadros parados (`node revisar.mjs`).
4. Render com som (vertical). O corte horizontal fica para depois.
