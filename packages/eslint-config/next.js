import { globalIgnores } from 'eslint/config';
import pluginNext from '@next/eslint-plugin-next';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

import { config as baseConfig } from './base.js';

/**
 * A custom ESLint configuration for libraries that use Next.js.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const nextJsConfig = [
  ...baseConfig,
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
      },
    },
  },
  {
    plugins: {
      '@next/next': pluginNext,
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs['core-web-vitals'].rules,
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@patchpilot/qloo-client*',
                '@patchpilot/decision-engine*',
                '*apps/api*',
                '*packages/qloo-client*',
                '*packages/decision-engine*',
              ],
              message:
                'ARCHITECTURAL VIOLATION: apps/web is restricted from importing qloo-client, decision-engine, or apps/api per ARCHITECTURE.md §5.',
            },
          ],
        },
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  pluginReactHooks.configs.flat.recommended,
];
