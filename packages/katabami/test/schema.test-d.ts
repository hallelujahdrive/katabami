import { describe, expectTypeOf, test } from "vitest";
import {
	array,
	type Decoder,
	type DecoderSchema,
	type Infer,
	type Issues,
	int,
	lazy,
	object,
	record,
	type SchemaAsyncOf,
	type SchemaResult,
	string,
	succeed,
} from "../src";

type GetSchema<T extends Decoder<unknown, Issues, boolean>> = ReturnType<
	T["getSchema"]
>;

describe("getSchema", () => {
	test("sync decoder", () => {
		const _decoder = string();

		expectTypeOf<SchemaAsyncOf<typeof _decoder>>().toEqualTypeOf<false>();
		expectTypeOf<GetSchema<typeof _decoder>>().toEqualTypeOf<DecoderSchema>();
		expectTypeOf(_decoder.getSchema()).toEqualTypeOf<DecoderSchema>();
	});

	test("async decoder", () => {
		const _decoder = lazy(() => Promise.resolve(object({ name: string() })));

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
		const _decoder = array(
			string().andThen(() => {
				return new Promise<Decoder<string>>((resolve) =>
					resolve(succeed("foo")),
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
		const _decoder = object({
			age: int().andThen((value) => {
				return new Promise<Decoder<typeof value, never>>((resolve) =>
					resolve(succeed(value)),
				);
			}),
			name: string(),
		});

		expectTypeOf<SchemaAsyncOf<typeof _decoder>>().toEqualTypeOf<false>();
		expectTypeOf(_decoder.getSchema()).toEqualTypeOf<DecoderSchema>();
	});

	test("record with async decode preserves sync schema", () => {
		const _decoder = record(
			string().andThen(() => {
				return new Promise<Decoder<string>>((resolve) =>
					resolve(succeed("foo")),
				);
			}),
		);

		expectTypeOf<SchemaAsyncOf<typeof _decoder>>().toEqualTypeOf<false>();
		expectTypeOf(_decoder.getSchema()).toEqualTypeOf<DecoderSchema>();
	});
});
