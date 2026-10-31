// @ts-check
/** @type {import('lint-staged').Configuration} */

export default {
	"**/*": ["oxfmt --check --no-error-on-unmatched-pattern"],
	"**/*.{js,mjs,ts}": [
		"oxlint --max-warnings=0 --report-unused-disable-directives",
	],
	"**/*.json": ["eslint --max-warnings=0"],
};
