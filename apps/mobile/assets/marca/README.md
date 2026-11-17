# Marca do Tem Remédio DF

O símbolo é um visto feito de cápsula: o "tem" que a pessoa procura e o remédio numa forma só.
Desenhado à mão em SVG, sem texto, sem cruz e sem brasão ou bandeira (o app é independente do GDF, da SES-DF e do SUS).

## Arquivos

| SVG (esta pasta) | Uso | PNG exportado |
|---|---|---|
| `simbolo-claro.svg` | Símbolo sobre fundo claro | — |
| `simbolo-escuro.svg` | Símbolo sobre fundo escuro | — |
| `simbolo-mono.svg` | Símbolo em uma cor | — |
| `icone-ios.svg` | Ícone do app (iOS e base para o resto) | `assets/icon.png`, 1024 × 1024, sem transparência |
| `android-frente.svg` | Frente do ícone adaptável; o fundo é a cor `#0B5FA5` no `app.json` | `assets/android-icon-foreground.png`, 1024 |
| `android-mono.svg` | Ícone temático do Android 13+ (o sistema usa só a transparência) | `assets/android-icon-monochrome.png`, 1024 |
| `abertura-claro.svg` | Tela de abertura, tema claro (fundo `#FFFFFF`) | `assets/splash-icon.png`, 1024 |
| `abertura-escuro.svg` | Tela de abertura, tema escuro (fundo `#0F1115`) | `assets/splash-icon-dark.png`, 1024 |
| `favicon.svg` | Favicon da web | `assets/favicon.png`, 48 (o Expo gera o `.ico` de 16, 32 e 48) |

## Cores

| Cor | Onde | Contraste |
|---|---|---|
| `#0B5FA5` azul (primária do app) | Fundo do ícone; símbolo no fundo claro | branco sobre ele: 6,6:1 |
| `#86E3BC` menta (nova) | Metade de cima da cápsula no ícone e no fundo escuro | 4,3:1 sobre o azul; 12,4:1 sobre `#0F1115` |
| `#1F8A5E` verde (nova) | Metade de cima da cápsula no fundo claro | 4,3:1 sobre branco |
| `#6CB4F5` azul-claro (primária do tema escuro) | Símbolo no fundo escuro | 8,5:1 sobre `#0F1115` |

Para formas, o mínimo da WCAG é 3:1.

## Regras de uso

- O símbolo é marca, não indicador. Não use ao lado do semáforo de estoque: o verde lembra "tem bastante".
- Nada de texto dentro do ícone.
- Android: o símbolo cabe no círculo seguro de 66 dp (o script confere e para com erro se não couber).
- Tela de abertura: imagem com 160 dp, fundo igual ao do app em cada tema. No Android 12+ o sistema corta o ícone num círculo de 192 dp; o símbolo cabe nele.
- Assinatura (símbolo + nome): "Tem Remédio" em Atkinson Hyperlegible Next ExtraBold e "DF" na cor primária (`#0B5FA5` no claro, `#6CB4F5` no escuro), com o símbolo à esquerda, na altura de duas linhas de texto.

## Como gerar de novo

```bash
node apps/mobile/scripts/gerar-marca.mjs
```

O desenho mora no script (medidas e cores no topo). Ele grava os SVGs aqui e os PNGs em `apps/mobile/assets/`.
Precisa do Google Chrome; em outro caminho, use `CHROME=/caminho/do/chrome`.
O ícone e a tela de abertura só aparecem num build (o Expo Go mostra o próprio ícone).
