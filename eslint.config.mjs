import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import jestPlugin from 'eslint-plugin-jest';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default tseslint.config(
    {
        ignores: [
            '**/public/**',
            '**/dist/**',
            '**/node_modules/**',
            '**/reports/**',
            '**/coverage/**',
            'eslint.config.mjs',
            'jest.config.ts',
            'pulldevsecrets.js',
        ],
    },
    js.configs.recommended,
    tseslint.configs.recommended,
    tseslint.configs.stylistic,
    prettierConfig,
    {
        plugins: {
            jest: jestPlugin,
            prettier: prettierPlugin,
        },
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                projectService: true,
            },
        },
    },
    {
        files: ['**/src/**/*.ts'],
        rules: {
            '@typescript-eslint/consistent-type-definitions': 'off',
            '@typescript-eslint/consistent-indexed-object-style': 'off',
        },
    },
);
