// @ts-check
import json from "@eslint/json";

/** @type {import('eslint').Linter.Config[]} */
export default [
	{
		ignores: ["**/dist/**"],
	},
	{
		files: ["**/*.json"],
		ignores: ["**/tsconfig.json"],
		language: "json/json",
		plugins: { json },
		rules: {
			"json/sort-keys": [
				"error",
				"asc",
				{ caseSensitive: true, natural: true },
			],
		},
	},
	{
		files: ["**/tsconfig.json"],
		language: "json/jsonc",
		plugins: { json },
		rules: {
			"json/sort-keys": [
				"error",
				"asc",
				{ caseSensitive: true, natural: true },
			],
		},
	},
];
