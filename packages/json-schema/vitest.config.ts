import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		name: "@katabami/json-schema",
		typecheck: {
			enabled: true,
		},
	},
});
