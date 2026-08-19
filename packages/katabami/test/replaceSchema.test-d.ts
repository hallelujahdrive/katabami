import { describe, expectTypeOf, test } from "vitest";
import * as katabami from "../src";
import {
	type Decoder,
	type DecoderSchema,
	type Infer,
	type IssuesFromDecoder,
	lazy,
	object,
	type SchemaAsyncOf,
	string,
	succeed,
} from "../src";
import { replaceSchema } from "../src/dev";

describe("replaceSchema", () => {
	test("keeps inferred value and issue types", () => {
		const decoder = replaceSchema(string(), {
			format: "date-time",
			kind: "string",
		});

		expectTypeOf<Infer<typeof decoder>>().toEqualTypeOf<string>();
		expectTypeOf<IssuesFromDecoder<typeof decoder>>().toEqualTypeOf<
			IssuesFromDecoder<ReturnType<typeof string>>
		>();
		expectTypeOf<SchemaAsyncOf<typeof decoder>>().toEqualTypeOf<false>();
		expectTypeOf(decoder.getSchema()).toEqualTypeOf<DecoderSchema>();
	});

	test("keeps async decode and makes schema sync", () => {
		const decoder = replaceSchema(
			string().andThen((value) => {
				return new Promise<Decoder<string, never>>((resolve) =>
					resolve(succeed(value)),
				);
			}),
			{ kind: "string", minLength: 1 },
		);

		expectTypeOf<Infer<typeof decoder>>().toEqualTypeOf<Promise<string>>();
		expectTypeOf<SchemaAsyncOf<typeof decoder>>().toEqualTypeOf<false>();
	});

	test("replacing lazy async schema is sync", () => {
		const decoder = replaceSchema(
			lazy(() => Promise.resolve(object({ name: string() }))),
			{ kind: "string" },
		);

		expectTypeOf<SchemaAsyncOf<typeof decoder>>().toEqualTypeOf<false>();
		expectTypeOf(decoder.getSchema()).toEqualTypeOf<DecoderSchema>();
	});

	test("is not exported from katabami", () => {
		expectTypeOf(katabami).not.toHaveProperty("replaceSchema");
	});
});
