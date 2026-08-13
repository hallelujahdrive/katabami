import { describe, expectTypeOf, test } from "vitest";
import type {
	Decoder,
	DecoderSchema,
	Infer,
	Issues,
	SchemaAsyncOf,
	SchemaResult,
} from "../src/index.js";
import * as katabami from "../src/index.js";

type GetSchema<T extends Decoder<unknown, Issues, boolean>> = ReturnType<
	T["getSchema"]
>;

describe("getSchema", () => {
	test("sync decoder", () => {
		const _decoder = katabami.string();

		expectTypeOf<SchemaAsyncOf<typeof _decoder>>().toEqualTypeOf<false>();
		expectTypeOf<GetSchema<typeof _decoder>>().toEqualTypeOf<DecoderSchema>();
		expectTypeOf(_decoder.getSchema()).toEqualTypeOf<DecoderSchema>();
	});

	test("async decoder", () => {
		const _decoder = katabami.lazy(() =>
			Promise.resolve(katabami.object({ name: katabami.string() })),
		);

		expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
			Promise<{ name: string }>
		>();
		expectTypeOf<SchemaAsyncOf<typeof _decoder>>().toEqualTypeOf<true>();
		expectTypeOf<GetSchema<typeof _decoder>>().toEqualTypeOf<
			Promise<DecoderSchema>
		>();
		expectTypeOf(_decoder.getSchema()).toEqualTypeOf<Promise<DecoderSchema>>();
	});

	test("array with async decode preserves sync schema", () => {
		const _decoder = katabami.array(
			katabami.string().andThen(() => {
				return new Promise<Decoder<string>>((resolve) =>
					resolve(katabami.succeed("foo")),
				);
			}),
		);

		expectTypeOf<SchemaAsyncOf<typeof _decoder>>().toEqualTypeOf<false>();
		expectTypeOf<
			SchemaResult<SchemaAsyncOf<typeof _decoder>>
		>().toEqualTypeOf<DecoderSchema>();
		expectTypeOf(_decoder.getSchema()).toEqualTypeOf<DecoderSchema>();
	});

	test("object with async decode preserves sync schema", () => {
		const _decoder = katabami.object({
			age: katabami.int().andThen((value) => {
				return new Promise<Decoder<typeof value, never>>((resolve) =>
					resolve(katabami.succeed(value)),
				);
			}),
			name: katabami.string(),
		});

		expectTypeOf<SchemaAsyncOf<typeof _decoder>>().toEqualTypeOf<false>();
		expectTypeOf(_decoder.getSchema()).toEqualTypeOf<DecoderSchema>();
	});

	test("record with async decode preserves sync schema", () => {
		const _decoder = katabami.record(
			katabami.string().andThen(() => {
				return new Promise<Decoder<string>>((resolve) =>
					resolve(katabami.succeed("foo")),
				);
			}),
		);

		expectTypeOf<SchemaAsyncOf<typeof _decoder>>().toEqualTypeOf<false>();
		expectTypeOf(_decoder.getSchema()).toEqualTypeOf<DecoderSchema>();
	});
});
