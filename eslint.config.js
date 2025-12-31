// @ts-check
import tsEslintParser from "@typescript-eslint/parser";
import perfectionist from "eslint-plugin-perfectionist";

/** @type {import('eslint').Linter.Config[]} */
export default [
	{
		files: ["**/*.{js,ts}"],
	},
	{
		languageOptions: {
			parser: tsEslintParser,
			parserOptions: {
				project: "./tsconfig.eslint.json",
			},
		},
		plugins: { perfectionist },
		rules: {
			"perfectionist/sort-array-includes": "error",
			"perfectionist/sort-classes": "error",
			"perfectionist/sort-enums": "error",
			"perfectionist/sort-exports": "error",
			"perfectionist/sort-imports": "error",
			"perfectionist/sort-interfaces": "error",
			"perfectionist/sort-jsx-props": "error",
			"perfectionist/sort-named-exports": "error",
			"perfectionist/sort-object-types": "error",
			"perfectionist/sort-objects": "error",
			"perfectionist/sort-union-types": "error",
		},
	},
];
