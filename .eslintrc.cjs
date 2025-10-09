/*
  ESLint configuration for Tilburg WOO UI
  - Supports React (and Preact JSX runtime)
  - Uses Babel parser for legacy decorators used in MobX stores
  - Enables React Hooks rules
  - Supports import aliases defined in jsconfig.json
*/

// Apply Rushstack patch to allow modern ESLint shareable configs to work in all setups
require('@rushstack/eslint-patch/modern-module-resolution');

/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
    babelOptions: {
      presets: [
        ['@babel/preset-env', { targets: { esmodules: true } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
      ],
      plugins: [
        ['@babel/plugin-proposal-decorators', { legacy: true }],
        ['@babel/plugin-transform-class-properties', { loose: true }],
        ['@babel/plugin-proposal-private-methods', { loose: true }],
        ['@babel/plugin-proposal-private-property-in-object', { loose: true }],
      ],
    },
    ecmaFeatures: {
      jsx: true,
    },
    sourceType: 'module',
  },
  plugins: ['react', 'react-hooks', 'import'],
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
          // Map React imports to Preact compat to satisfy resolver
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
    // Avoid resolving problematic package subpaths that are not exported in Node
    'import/ignore': [/@utrecht\/component-library-react\/dist\/css-module/],
    // Treat some subpath imports as core modules (skip further analysis)
    'import/core-modules': [
      '@utrecht/component-library-react',
      '@utrecht/component-library-react/dist/css-module',
    ],
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import/recommended',
  ],
  rules: {
    // Keep warnings as errors in CI-style scripts
    'no-console': [
      'error',
      { allow: ['warn', 'error', 'info', 'debug', 'group', 'groupEnd'] },
    ],
    'no-debugger': 'warn',

    // React specific
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',

    // Hooks
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'off', // project rule: minimal deps only

    // Import rules
    'import/no-unresolved': 'error',
  },
  overrides: [
    {
      files: ['**/*.config.*', 'scripts/**/*.js'],
      env: { node: true },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'build/',
    'public_html/',
    'coverage/',
    'dist/',
    '**/*.min.js',
  ],
};
