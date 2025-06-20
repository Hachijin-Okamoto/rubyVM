import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';

export default [
  ...tseslint.configs.recommended,

  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      'import/no-unresolved': 'error',
      '@typescript-eslint/typedef': [
      'warn',
      {
        'parameter': true,
        'propertyDeclaration': true,
        'variableDeclaration': true,
        'memberVariableDeclaration': true
      }
    ]
    },
    settings: {
      'import/resolver': {
        typescript: {},
      }
    },
    files: ['**/*.ts', '**/*.tsx'],
  },
];
