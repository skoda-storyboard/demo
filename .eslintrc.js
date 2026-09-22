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
    'import/extensions': ['error', { js: 'always' }], // require js file extensions in imports
    'linebreak-style': ['error', 'unix'], // enforce unix linebreaks
    'no-param-reassign': [2, { props: false }], // allow modifying properties of param
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
