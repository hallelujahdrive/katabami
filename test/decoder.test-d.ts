import { describe, expectTypeOf, test } from "vitest";

import { type Decoder, type Infer, katabami } from "../src/index.js";

describe("Decoder", () => {
	describe("andMap", () => {
		test("fixed", () => {
			const _decoder = katabami
				.string()
				.andMap<number>((value) => Number(value));

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<number>();
		});

		test("complement", () => {
			const _decoder = katabami.string().andMap((value) => Number(value));

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<number>();
		});

		test("promise", () => {
			const _decoder = katabami.string().andMap(async (value) => {
				await new Promise((resolve) => setTimeout(resolve, 100));

				return Number(value);
			});

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Promise<number>>();
		});
	});

	describe("andThen", () => {
		test("fixed", () => {
			const _decoder = katabami
				.value()
				.andThen<number>(() => katabami.integer());

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<number>();
		});

		test("complement", () => {
			const _decoder = katabami.value().andThen(() => katabami.integer());

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<number>();
		});

		test("promise", () => {
			const _decoder = katabami.value().andThen(async () => {
				await new Promise((resolve) => setTimeout(resolve, 100));

				return katabami.integer();
			});

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Promise<number>>();
		});
	});

	describe("array", () => {
		test("fixed", () => {
			const _decoder = katabami.array<number>(katabami.float());

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Array<number>>();
		});

		test("complement", () => {
			const _decoder = katabami.array(katabami.float());

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Array<number>>();
		});

		test("has promise", () => {
			const _decoder = katabami.array(
				katabami.float().andThen(async () => {
					await new Promise((resolve) => setTimeout(resolve, 100));

					return katabami.integer();
				}),
			);

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
				Promise<Array<number>>
			>();
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

		test("has promise decoder", () => {
			const _decoder = katabami.map(
				(foo, bar) => ({ ...foo, ...bar }),
				katabami.object({
					foo: katabami.float().andThen(async () => {
						await new Promise((resolve) => setTimeout(resolve, 100));
						return katabami.float();
					}),
				}),
				katabami.object({ bar: katabami.float() }),
			);

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
				Promise<{
					bar: number;
					foo: number;
				}>
			>();
		});

		test("has promise map function", () => {
			const _decoder = katabami.map(
				async (foo, bar) => {
					await new Promise((resolve) => setTimeout(resolve, 100));
					return { ...foo, ...bar };
				},
				katabami.object({ foo: katabami.float() }),
				katabami.object({ bar: katabami.float() }),
			);

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
				Promise<{
					bar: number;
					foo: number;
				}>
			>();
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

		test("has promise", () => {
			const _decoder = katabami.object({
				num: katabami.float().andThen(async () => {
					await new Promise((resolve) => setTimeout(resolve, 100));

					return katabami.integer();
				}),
				optionalStr: katabami.optional(katabami.string()),
			});

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
				Promise<{
					num: number;
					optionalStr: string | undefined;
				}>
			>();
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

		test("has promise", () => {
			const _decoder = katabami.tuple(
				katabami.constant("foo").andThen(async (value) => {
					await new Promise((resolve) => setTimeout(resolve, 100));

					return katabami.succeed(value);
				}),
				katabami.constant("bar"),
			);

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
				Promise<["foo", "bar"]>
			>();
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

		test("has promise", () => {
			const _decoder = katabami.union(
				katabami.constant("bar").andThen(async (value) => {
					await new Promise((resolve) => setTimeout(resolve, 100));

					return katabami.succeed(value);
				}),
				katabami.constant("foo"),
			);

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
				Promise<"bar" | "foo">
			>();
		});
	});
});
