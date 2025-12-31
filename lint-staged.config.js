// @ts-check
/** @type {import('lint-staged').Configuration} */

export default {
	"*.": ["eslint --max-warnings=0"],
	"src/**/*.{js|ts}": ["@biomejs/biome check"],
};
