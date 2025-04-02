import importPlugin from 'eslint-plugin-import';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import prettierConfig from 'eslint-config-prettier/flat';
import globals from 'globals';
import js from '@eslint/js';

export default [
  js.configs.recommended,
  importPlugin.flatConfigs.recommended,
  sonarjsPlugin.configs.recommended,
  prettierConfig,
  {
    // default config
    files: ['src/**/*', 'test/**/*'],
    languageOptions: {
      globals: {
        ...globals['shared-node-browser'],
      },
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      'default-param-last': 'off',
      'new-cap': 'off',
      'no-console': 'error',
      'no-unused-vars': ['error', { ignoreRestSiblings: true }],
      'no-underscore-dangle': [
        'error',
        {
          allow: [
            '_args',
            '_data',
            '_ethersType',
            '_eventName',
            '_execs',
            '_hex',
            '_name',
            '_options',
            '_signTypedData',
            '_subscribe',
            '_chainId',
            '_contracts',
            '_bridgedContracts',
            '_chainConfDefaults',
            '_bridgedConf',
          ],
        },
      ],
      'no-template-curly-in-string': 'off',
      'max-classes-per-file': 'off',
      'max-len': 'off',
      'import/prefer-default-export': 'off',
      'import/extensions': ['error', 'ignorePackages'],
      'sonarjs/cognitive-complexity': ['warn', 15],
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/no-nested-functions': 'warn', // todo refactor to enforce error on this rule
      'sonarjs/todo-tag': 'warn',
    },
    settings: {
      'import/ignore': ['ethers', 'graphql-request'],
    },
  },
  {
    // cli specific files using nodejs globals
    files: ['src/cli/**/*'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['src/cli/utils/cli-helper.js', 'src/lib/IExecConfig.js'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    // test specific files using jest globals
    files: ['test/**/*'],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
      'no-await-in-loop': 'off',
    },
  },
  {
    files: ['*.cjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      ecmaVersion: 2022,
      sourceType: 'script',
    },
  },
];
