import { globSync } from "node:fs";
import { defineConfig } from "rolldown";
import { dts } from "rolldown-plugin-dts";

const input = globSync("src/**/*.ts");

const isTestBuild = process.env.npm_lifecycle_event === "build:test";

export default defineConfig({
	external: ["i18next", "katabami"],
	input,
	output: {
		cleanDir: true,
		dir: "dist",
		format: "esm",
		preserveModules: true,
		preserveModulesRoot: "src",
		sourcemap: isTestBuild,
	},
	platform: "neutral",
	plugins: [
		dts({
			entry: ["src/**/*.ts"],
			tsconfig: "tsconfig.build.json",
		}),
	],
});
