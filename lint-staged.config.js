// @ts-check・
/** @type {import('lint-staged').Configuration} */

export default {
	"./**/*.{js,ts}": [
		"biome check --error-on-warnings --staged",
		"eslint --max-warnings=0",
	],
	"*": ["biome format"],
};
