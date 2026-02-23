import { describe, expectTypeOf, test } from "vitest";

import { type Decoder, type Infer, katabami } from "../src/index.js";

describe("Decoder", () => {
	describe("array", () => {
		test("fixed", () => {
			const _decoder = katabami.array<number>(katabami.float());

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Array<number>>();
		});

		test("complement", () => {
			const _decoder = katabami.array(katabami.float());

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Array<number>>();
		});
	});

	describe("map", () => {
		test("fixed", () => {
			const _decoder = katabami.map<
				{ bar: number; foo: number },
				[Decoder<{ bar: number }>, Decoder<{ foo: number }>]
			>(
				(foo, bar) => ({ ...foo, ...bar }),
				katabami.object({ bar: katabami.float() }),
				katabami.object({ foo: katabami.float() }),
			);

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<{
				bar: number;
				foo: number;
			}>();
		});

		test("complement", () => {
			const _decoder = katabami.map(
				(foo, bar) => ({ ...foo, ...bar }),
				katabami.object({ foo: katabami.float() }),
				katabami.object({ bar: katabami.float() }),
			);

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<{
				bar: number;
				foo: number;
			}>();
		});
	});

	describe("object", () => {
		test("fixed", () => {
			const _decoder = katabami.object<{ num: number; optionalStr?: string }>({
				num: katabami.float(),
				optionalStr: katabami.optional(katabami.string()),
			});

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<{
				num: number;
				optionalStr: string | undefined;
			}>();
		});

		test("complement", () => {
			const _decoder = katabami.object({
				num: katabami.float(),
				optionalStr: katabami.optional(katabami.string()),
			});

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<{
				num: number;
				optionalStr: string | undefined;
			}>();
		});
	});

	describe("optional", () => {
		test("fixed", () => {
			const _decoder = katabami.optional<number>(katabami.float());

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
				number | undefined
			>();
		});

		test("complement", () => {
			const _decoder = katabami.optional(katabami.float());

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
				number | undefined
			>();
		});
	});

	describe("tuple", () => {
		test("fixed", () => {
			const _decoder = katabami.tuple<["foo", "bar"]>(
				katabami.constant("foo"),
				katabami.constant("bar"),
			);

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<["foo", "bar"]>();
		});

		test("complement", () => {
			const _decoder = katabami.tuple(
				katabami.constant("foo"),
				katabami.constant("bar"),
			);

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<["foo", "bar"]>();
		});
	});

	describe("union", () => {
		test("fixed", () => {
			const _decoder = katabami.union<"bar" | "foo">(
				katabami.constant("bar"),
				katabami.constant("foo"),
			);

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<"bar" | "foo">();
		});

		test("complement", () => {
			const _decoder = katabami.union(
				katabami.constant("bar"),
				katabami.constant("foo"),
			);

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<"bar" | "foo">();
		});
	});
});
