import pluginJs from "@eslint/js";
import perfectionist from "eslint-plugin-perfectionist";
import sort from "eslint-plugin-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.{js,ts}", "./package.json"],
    ignores: ["!./eslint.config.js"],
  },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  sort.configs["flat/recommended"],
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.eslint.json",
      },
    },
    plugins: { perfectionist },
    rules: {
      "@typescript-eslint/array-type": ["error", { default: "array-simple" }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          ignoreRestSiblings: true,
          varsIgnorePattern: "^_",
        },
      ],
      "perfectionist/sort-intersection-types": "error",
      "perfectionist/sort-union-types": "error",
      "sort/object-properties": [
        "error",
        { caseSensitive: true, natural: true },
      ],
      "sort/type-properties": ["error", { caseSensitive: true, natural: true }],
      "sort-keys": ["error", "asc", { caseSensitive: true, natural: true }],
    },
  },
];
