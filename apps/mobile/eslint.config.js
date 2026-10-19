// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*'],
  },
  // Acessibilidade (ver CLAUDE.md): o texto nunca é cortado com "…" e respeita a letra do celular.
  {
    files: ['src/**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute[name.name=/^(numberOfLines|ellipsizeMode|adjustsFontSizeToFit)$/]',
          message: 'Texto nunca é cortado com "…" nem encolhe: deixe quebrar linha (flexShrink: 1 dentro de linhas).',
        },
        {
          selector: 'JSXAttribute[name.name="allowFontScaling"]',
          message: 'O texto acompanha o tamanho de letra do celular.',
        },
      ],
    },
  },
  // Ícones só pelo Icone, que os esconde do leitor de tela.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/componentes/Icone.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@expo/vector-icons', '@expo/vector-icons/*'],
              message: 'Use o Icone (@/componentes/Icone): ele esconde o ícone do leitor de tela.',
            },
          ],
        },
      ],
    },
  },
]);
