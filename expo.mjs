import expo from 'eslint-config-expo/flat.js';
import prettier from 'eslint-config-prettier';

/**
 * Studio ESLint config for Expo / React-Native apps.
 *
 * Composes `eslint-config-expo` (React Native + React Hooks + TS rules) and
 * Prettier. It intentionally does NOT spread the studio `base` preset: Expo's
 * flat config already registers the typescript-eslint / react / react-native
 * plugins, and spreading our base on top would trigger ESLint's
 * "plugin redefined" conflict. Consumers add their own `no-restricted-imports`
 * / boundary blocks after this spread.
 */
export default [
  ...expo,
  {
    // The `@typescript-eslint/*` rules must be scoped to TS files: eslint-config-expo
    // registers the typescript-eslint plugin only on `**/*.{ts,tsx}`, so applying these
    // rules to a non-TS file (e.g. `babel.config.js`, `metro.config.js`) makes ESLint
    // fail config resolution with "could not find plugin @typescript-eslint".
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' }
      ]
    }
  },
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }]
    }
  },
  prettier
];
