/**
 * ESLint configuration for @kitiumai/jest-helpers
 * Uses @kitiumai/lint as the base configuration
 */

import {
  eslintBaseConfig,
  eslintTypeScriptConfig,
  eslintJestConfig,
} from '@kitiumai/lint';

export default [
  ...eslintBaseConfig,
  ...eslintTypeScriptConfig,
  eslintJestConfig,
  {
    ignores: ['dist/**', 'node_modules/**', '*.config.js', '*.config.cjs'],
  },
  {
    name: 'console-utilities',
    files: ['**/console/**/*.ts'],
    rules: {
      'no-console': 'off', // Console utilities need to override console
    },
  },
  {
    name: 'jest-helpers-overrides',
    files: ['**/*.{ts,tsx}'],
    rules: {
      // Allow higher complexity for utility functions
      complexity: ['warn', 15],
      'max-statements': ['warn', 25],
      // Allow bitwise operators in data generators (UUID generation)
      'no-bitwise': 'off',
      // Allow non-null assertions in test utilities
      '@typescript-eslint/no-non-null-assertion': 'warn',
      // Allow any type in utility functions
      '@typescript-eslint/no-explicit-any': 'warn',
      // Relax naming convention for local variables
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          modifiers: ['const'],
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
        },
        {
          selector: 'variable',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          filter: {
            regex: '^(result|hasResult|conditionResult|sourceValue|targetValue)$',
            match: true,
          },
        },
        {
          selector: 'variable',
          format: null, // Allow any format for unused variables (e.g., _)
          filter: {
            regex: '^_',
            match: true,
          },
        },
      ],
      // Allow console in console utilities
      'no-console': 'off',
      // Allow async methods without await (for mock implementations)
      '@typescript-eslint/require-await': 'warn',
      // Allow useless catch in some cases
      'no-useless-catch': 'warn',
      // Allow nullish coalescing preference warnings
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      // Disable indent rule - let prettier handle it
      indent: 'off',
      // Allow relative imports within the package
      'no-restricted-imports': 'off',
      // Allow interfaces (some are needed for declaration merging)
      '@typescript-eslint/consistent-type-definitions': 'warn',
      // Allow case declarations with braces
      'no-case-declarations': 'off',
      // Allow floating promises in some cases (e.g., fire-and-forget)
      '@typescript-eslint/no-floating-promises': 'warn',
      // Disable space-before-function-paren - handled by prettier
      'space-before-function-paren': 'off',
      // Allow missing return types in some utility functions
      '@typescript-eslint/explicit-function-return-type': 'warn',
    },
  },
];
