import type { MessageResources } from "katabami";
import { describe, expectTypeOf, test } from "vitest";
import { resources } from "../src";

describe("resources", () => {
	test("en", () => {
		expectTypeOf(resources.en).toEqualTypeOf<MessageResources>();
	});

	test("ja", () => {
		expectTypeOf(resources.ja).toEqualTypeOf<MessageResources>();
	});
});
