// @ts-check・
/** @type {import('lint-staged').Configuration} */

export default {
	"!**/*.md": ["biome format"],
	"./**/*.{js,ts}": [
		"biome check --error-on-warnings --staged",
		"eslint --max-warnings=0",
	],
};
