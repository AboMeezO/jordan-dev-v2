import js from "@eslint/js";
import { globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import unusedImports from "eslint-plugin-unused-imports";
import simpleImportSort from "eslint-plugin-simple-import-sort";

export default tseslint.config(
	globalIgnores([
		"**/.output/**",
		"**/dist/**",
		"eslint.config.js",
	]),
	js.configs.recommended,
	...tseslint.configs.recommendedTypeChecked,

	{
		files: ["**/*.{ts,tsx}"],

		languageOptions: {
			parserOptions: {
				project: [
					"./apps/*/tsconfig.json",
					"./packages/*/tsconfig.json",
				],
				tsconfigRootDir: import.meta.dirname,
			},
		},

		plugins: {
			"unused-imports": unusedImports,
			"simple-import-sort": simpleImportSort,
		},

		rules: {
			"simple-import-sort/imports": "error",
			"simple-import-sort/exports": "error",
			"unused-imports/no-unused-imports": "error",

			"unused-imports/no-unused-vars": [
				"warn",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
				},
			],

			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
				},
			],

			"@typescript-eslint/no-explicit-any": "error",
			"@typescript-eslint/no-floating-promises": "error",
			"@typescript-eslint/no-misused-promises": "error",
			"@typescript-eslint/consistent-type-imports": "error",

			"@typescript-eslint/no-unsafe-argument": "error",

			"@typescript-eslint/no-unsafe-call": "warn",

			"no-console": "off",
		},
	},

	{
		files: ["apps/bot/src/Events/**/*.ts"],
		rules: {
			"@typescript-eslint/no-floating-promises": "error",
		},
	},

	{
		files: ["apps/bot/src/Commands/**/*.ts"],
		rules: {
			"@typescript-eslint/no-explicit-any": "error",
		},
	},
);
