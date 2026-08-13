import type { StandardJSONSchemaV1 as SpecStandardJSONSchemaV1 } from "@standard-schema/spec";
import * as katabami from "katabami";
import { describe, expectTypeOf, it } from "vitest";
import {
	type StandardJSONSchemaV1,
	toStandardJsonSchema,
} from "../src/index.js";

describe("toStandardJsonSchema types", () => {
	it("satisfies StandardJSONSchemaV1", () => {
		const schema = toStandardJsonSchema(katabami.string());

		expectTypeOf(schema).toExtend<StandardJSONSchemaV1<string>>();
		expectTypeOf(schema).toExtend<SpecStandardJSONSchemaV1<string>>();
		expectTypeOf(
			schema["~standard"].jsonSchema.input({ target: "draft-2020-12" }),
		).toEqualTypeOf<Record<string, unknown>>();
	});
});
