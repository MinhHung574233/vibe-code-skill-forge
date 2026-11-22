import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

// Layer rule (ARCHITECTURE §1): domain/core code is pure TypeScript.
const PURE_RESTRICTED = {
  paths: [
    { name: 'react', message: 'Domain/core code must not depend on React.' },
    { name: 'react-dom', message: 'Domain/core code must not depend on React.' },
    { name: 'react-router', message: 'Domain/core code must not depend on the router.' },
    { name: 'zustand', message: 'Domain/core code must not depend on stores.' },
    { name: 'dexie', message: 'Domain/core code must use repository ports, not Dexie.' },
    { name: 'dexie-react-hooks', message: 'Domain/core code must not use hooks.' },
  ],
  patterns: [
    {
      group: ['@/db', '@/db/*', '**/db/*'],
      message: 'Domain/core code must not import the data layer.',
    },
    {
      group: ['@/app/*', '@/components/*', '@/pwa/*'],
      message: 'Domain/core code must not import UI or PWA layers.',
    },
  ],
};

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'coverage', 'node_modules', 'public'] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  reactHooks.configs.flat.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },
  {
    files: ['src/core/**/*.{ts,tsx}', 'src/features/*/domain/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', PURE_RESTRICTED] },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
);
