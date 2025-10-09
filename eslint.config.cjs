/*
  ESLint configuration for Tilburg WOO UI
  - Supports React (and Preact JSX runtime)
  - Uses Babel parser for legacy decorators used in MobX stores
  - Enables React Hooks rules
  - Supports import aliases defined in jsconfig.json

  NEW:
  - converted to ESlint v9, flat config format.
    - `yarn dlx @eslint/migrate-config .eslintrc.cjs`
*/

const { defineConfig, globalIgnores } = require('eslint/config');

const globals = require('globals');
const babelParser = require('@babel/eslint-parser');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');
const _import = require('eslint-plugin-import');

const { fixupPluginRules, fixupConfigRules } = require('@eslint/compat');

const js = require('@eslint/js');

const { FlatCompat } = require('@eslint/eslintrc');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = defineConfig([
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      parser: babelParser,
      sourceType: 'module',

      parserOptions: {
        requireConfigFile: false,

        babelOptions: {
          presets: [
            [
              '@babel/preset-env',
              {
                targets: {
                  esmodules: true,
                },
              },
            ],
            [
              '@babel/preset-react',
              {
                runtime: 'automatic',
              },
            ],
          ],

          plugins: [
            [
              '@babel/plugin-proposal-decorators',
              {
                legacy: true,
              },
            ],
            [
              '@babel/plugin-transform-class-properties',
              {
                loose: true,
              },
            ],
            [
              '@babel/plugin-transform-private-methods',
              {
                loose: true,
              },
            ],
            [
              '@babel/plugin-transform-private-property-in-object',
              {
                loose: true,
              },
            ],
          ],
        },

        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    plugins: {
      react,
      'react-hooks': fixupPluginRules(reactHooks),
      import: fixupPluginRules(_import),
    },

    settings: {
      react: {
        version: 'detect',
      },

      'import/resolver': {
        node: {
          extensions: ['.web.js', '.js', '.web.jsx', '.jsx'],
          moduleDirectory: ['node_modules', 'src'],
        },

        alias: {
          map: [
            ['react', 'preact/compat'],
            ['react-dom', 'preact/compat'],
            ['@src', './src'],
            ['@assets', './src/assets'],
            ['@fonts', './src/assets/fonts'],
            ['@data', './src/assets/data'],
            ['@styles', './src/styles'],
            ['@atoms', './src/atoms'],
            ['@components', './src/components'],
            ['@models', './src/models'],
            ['@molecules', './src/molecules'],
            ['@tabs', './src/tabs'],
            ['@views', './src/views'],
            ['@api', './src/api'],
            ['@config', './src/config'],
            ['@constants', './src/constants'],
            ['@hooks', './src/hooks'],
            ['@services', './src/services'],
            ['@stores', './src/stores'],
            ['@utils', './src/utilities'],
          ],

          extensions: ['.web.js', '.js', '.web.jsx', '.jsx'],
        },
      },

      'import/ignore': [/@utrecht\/component-library-react\/dist\/css-module/],

      'import/core-modules': [
        '@utrecht/component-library-react',
        '@utrecht/component-library-react/dist/css-module',
      ],
    },

    extends: fixupConfigRules(
      compat.extends(
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:import/recommended'
      )
    ),

    rules: {
      'no-console': [
        'error',
        {
          allow: ['warn', 'error', 'info', 'debug', 'group', 'groupEnd'],
        },
      ],

      'no-debugger': 'warn',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off',
      'import/no-unresolved': 'error',
    },
  },
  {
    files: ['**/*.config.*', 'scripts/**/*.js'],

    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  globalIgnores([
    '**/node_modules/',
    '**/build/',
    '**/public_html/',
    '**/coverage/',
    '**/dist/',
    '**/*.min.js',
  ]),
  globalIgnores([
    '**/node_modules/',
    '**/public_html/',
    '**/build/',
    '**/dist/',
    '**/coverage/',
    '**/webpack.config.js',
    '**/*.config.js',
    '**/registerServiceWorker.js',
    'src/constants/container.constants.js',
    'src/assets/licenses/',
    '**/.eslintcache',
    '**/.cache/',
    '**/.tmp/',
    '**/.yarn/',
    '**/.pnp.cjs',
    '**/.pnp.loader.mjs',
  ]),
]);
