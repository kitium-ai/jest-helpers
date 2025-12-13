/**
 * ESLint configuration for @kitiumai/jest-helpers
 * Uses the mandatory @kitiumai/lint library preset.
 */

import { library } from '@kitiumai/lint';

export default [
  ...library.flat(),
  {
    ignores: ['dist/**', 'node_modules/**', '*.config.js', '*.config.cjs', '*.d.ts'],
  },
  {
    name: 'jest-helpers/prettier-is-source-of-truth',
    files: ['**/*.{ts,tsx,js,jsx,cjs,mjs}'],
    rules: {
      // Defer indentation to Prettier to avoid false positives and fix cycles.
      indent: 'off',
    },
  },
  {
    name: 'jest-helpers/eslint9-rule-compat',
    rules: {
      // ESLint 9 schema compatibility for lint preset
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['../../*', '../../../*'],
              message: 'Prefer module aliases over deep relative imports for maintainability.',
            },
          ],
        },
      ],
    },
  },
  {
    name: 'jest-helpers/eslint-config-overrides',
    files: ['eslint.config.js'],
    rules: {
      '@typescript-eslint/naming-convention': 'off',
    },
  },
  {
    name: 'jest-helpers/specific-rule-overrides',
    files: ['src/**/*.ts'],
    rules: {
      // Temporarily disable rules that cause circular fixes
      '@typescript-eslint/naming-convention': 'off',
      'simple-import-sort/imports': 'off',
      // Disable space-before-function-paren as it conflicts with TypeScript type definitions
      'space-before-function-paren': 'off',
      // Allow complexity up to 15 for complex test utilities
      complexity: ['error', 15],
      // Allow unused variables that start with underscore
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      // Disable security warnings that are false positives in testing context
      'security/detect-object-injection': 'off',
      'security/detect-unsafe-regex': 'off',
      'security/detect-non-literal-regexp': 'off',
    },
  },
];
