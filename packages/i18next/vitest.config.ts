import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		name: "@katabami/i18next",
		setupFiles: ["./test/setup.ts"],
		typecheck: {
			enabled: true,
		},
	},
});
