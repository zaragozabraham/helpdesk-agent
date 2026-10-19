import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
	{ ignores: ['dist/', 'coverage/', 'node_modules/'] },
	js.configs.recommended,
	tseslint.configs.strictTypeChecked,
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		// Plain JS config files are not part of the TS project; lint them without type info.
		files: ['**/*.js'],
		extends: [tseslint.configs.disableTypeChecked],
	},
);
