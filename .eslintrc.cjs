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
        ['@babel/plugin-proposal-class-properties', { loose: true }],
        ['@babel/plugin-proposal-private-methods', { loose: true }],
        ['@babel/plugin-proposal-private-property-in-object', { loose: true }],
      ],
    },
    ecmaFeatures: {
      jsx: true,
    },
    sourceType: 'module',
  },
  plugins: ['react', 'react-hooks', 'import', 'jsx-a11y'],
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

    // Accessibility. This is a public-sector site, so WCAG regressions are
    // treated as build failures rather than warnings (`yarn lint` runs with
    // --max-warnings 0, so a warning would fail the build anyway).
    //
    // Only rules the codebase currently satisfies are enabled, so the gate is
    // meaningful from day one. The remaining jsx-a11y/recommended rules are
    // listed below with their current violation counts; enable each as its
    // backlog is cleared rather than switching the whole preset on and
    // immediately having to suppress it.
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/no-autofocus': 'error',
    'jsx-a11y/anchor-has-content': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-role': 'error',
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/heading-has-content': 'error',
    'jsx-a11y/html-has-lang': 'error',
    'jsx-a11y/iframe-has-title': 'error',
    'jsx-a11y/img-redundant-alt': 'error',
    'jsx-a11y/no-access-key': 'error',
    'jsx-a11y/no-distracting-elements': 'error',
    'jsx-a11y/no-redundant-roles': 'error',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/role-supports-aria-props': 'error',
    'jsx-a11y/scope': 'error',
    'jsx-a11y/tabindex-no-positive': 'error',
    // `assert: 'either'` accepts both explicit htmlFor and the implicit pattern
    // of nesting the control inside the label — both are valid, and the
    // codebase uses nesting for checkbox lists. ConSchemaEnhancedField renders
    // its own labelled control, so it counts as a control component.
    'jsx-a11y/label-has-associated-control': [
      'error',
      {
        assert: 'either',
        depth: 3,
        controlComponents: ['ConSchemaEnhancedField', 'ReactSelect', 'Textbox'],
      },
    ],
    // The interaction rules. The backlog behind these is now cleared, so the
    // whole jsx-a11y/recommended set is enforced. Where a rule is suppressed
    // in a source file, the comment above it states the keyboard path that
    // exists instead — that reason is a claim about behaviour, so it is meant
    // to be checked, not taken on trust.
    'jsx-a11y/click-events-have-key-events': 'error',
    'jsx-a11y/no-static-element-interactions': 'error',
    'jsx-a11y/no-noninteractive-element-interactions': 'error',
    'jsx-a11y/no-noninteractive-element-to-interactive-role': 'error',
  },
  overrides: [
    {
      files: ['**/*.config.*', 'scripts/**/*.js'],
      env: { node: true },
    },
    {
      // Jest supplies describe/it/expect as globals.
      files: ['**/*.test.js', '**/*.test.jsx', '**/*.spec.js', '**/*.spec.jsx'],
      env: { jest: true },
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
