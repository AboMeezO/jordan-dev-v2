//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import reactDoctor from 'eslint-plugin-react-doctor'
export default [
  ...tanstackConfig,
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
    },
  },
  {
    ignores: [
      '.output/**',
      '.tanstack/**',
      'node_modules/**',
      'eslint.config.js',
      'prettier.config.js',
    ],
  },
  reactDoctor.configs.recommended,
  reactDoctor.configs.next,
  reactDoctor.configs['react-native'],
  reactDoctor.configs['tanstack-start'],
  reactDoctor.configs['tanstack-query'],
]
