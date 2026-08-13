import { globSync } from "node:fs";
import { defineConfig } from "rolldown";
import { dts } from "rolldown-plugin-dts";

const input = globSync("src/**/*.ts").filter(
	(file) => !file.includes("/@types/"),
);

export default defineConfig({
	external: ["katabami"],
	input,
	output: {
		cleanDir: true,
		dir: "dist",
		format: "esm",
		preserveModules: true,
		preserveModulesRoot: "src",
		sourcemap: true,
	},
	platform: "neutral",
	plugins: [
		dts({
			entry: ["src/**/*.ts", "!src/@types/**"],
			tsconfig: "tsconfig.build.json",
		}),
	],
});
