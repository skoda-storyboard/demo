module.exports = {
  root: true,
  extends: 'airbnb-base',
  env: {
    browser: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    allowImportExportEverywhere: true,
    sourceType: 'module',
    requireConfigFile: false,
  },
  rules: {
    'import/extensions': ['error', { js: 'always', mjs: 'always' }], // require explicit file extensions in imports
    'linebreak-style': ['error', 'unix'], // enforce unix linebreaks
    eqeqeq: ['error', 'always'],
    'no-async-promise-executor': 'error',
    'no-eval': 'error',
    'no-implicit-coercion': 'error',
    'no-nested-ternary': 'error',
    'no-new-func': 'error',
    'no-param-reassign': ['error', { props: false }],
    'no-throw-literal': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
  },
  overrides: [
    {
      // Node CLI tooling (import pipeline). Sequential I/O scripts, not browser
      // block code: allow console output and ordered await-in-loop / for-of.
      files: ['tools/importer/**/*.mjs'],
      env: { node: true, browser: false },
      rules: {
        'no-console': 'off',
        'no-await-in-loop': 'off',
        'no-restricted-syntax': 'off',
        'no-continue': 'off',
        'import/extensions': ['error', { mjs: 'always', js: 'always' }],
      },
    },
  ],
};
