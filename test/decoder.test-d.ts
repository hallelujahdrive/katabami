import { describe, expectTypeOf, test } from "vitest";

import { type Decoder, type Infer, katabami } from "../src/index.js";

describe("Decoder", () => {
	describe("array", () => {
		test("fixed", () => {
			const decoder = katabami.array<number>(katabami.float());

			expectTypeOf<Infer<typeof decoder>>().toEqualTypeOf<Array<number>>();
		});

		test("complement", () => {
			const decoder = katabami.array(katabami.float());

			expectTypeOf<Infer<typeof decoder>>().toEqualTypeOf<Array<number>>();
		});

		test("has promise", () => {
			const decoder = katabami.array(
				katabami.float().andThen(async () => {
					return new Promise<Decoder<number>>((resolve) =>
						resolve(katabami.integer()),
					);
				}),
			);

			expectTypeOf<Infer<typeof decoder>>().toEqualTypeOf<
				Promise<Array<number>>
			>();
		});
	});

	describe("map", () => {
		test("fixed", () => {
			const decoder = katabami.map<
				{ bar: number; foo: number },
				[Decoder<number>, Decoder<number>]
			>(
				(foo, bar) => ({ bar, foo }),
				katabami.field("foo", katabami.float()),
				katabami.field("bar", katabami.float()),
			);

			expectTypeOf<Infer<typeof decoder>>().toEqualTypeOf<{
				bar: number;
				foo: number;
			}>();
		});

		test("complement", () => {
			const decoder = katabami.map(
				(foo, bar) => ({ bar, foo }),
				katabami.field("foo", katabami.float()),
				katabami.field("bar", katabami.float()),
			);

			expectTypeOf<Infer<typeof decoder>>().toEqualTypeOf<{
				bar: number;
				foo: number;
			}>();
		});

		test("has promise decoder", () => {
			const decoder = katabami.map(
				(foo, bar) => ({ bar, foo }),
				katabami.field(
					"foo",
					katabami.float().andThen(async () => {
						await new Promise((resolve) => setTimeout(resolve, 100));
						return katabami.float();
					}),
				),
				katabami.field("bar", katabami.float()),
			);

			expectTypeOf<Infer<typeof decoder>>().toEqualTypeOf<
				Promise<{
					bar: number;
					foo: number;
				}>
			>();
		});

		test("has promise map function", () => {
			const decoder = katabami.map(
				async (foo, bar) => {
					await new Promise((resolve) => setTimeout(resolve, 100));
					return { bar, foo };
				},
				katabami.field("foo", katabami.float()),
				katabami.field("bar", katabami.float()),
			);

			expectTypeOf<Infer<typeof decoder>>().toEqualTypeOf<
				Promise<{
					bar: number;
					foo: number;
				}>
			>();
		});
	});

	describe("object", () => {
		test("fixed", () => {
			const decoder = katabami.object<{ num: number; optionalStr?: string }>({
				num: katabami.float(),
				optionalStr: katabami.optional(katabami.string()),
			});

			expectTypeOf<Infer<typeof decoder>>().toEqualTypeOf<{
				num: number;
				optionalStr: string | undefined;
			}>();
		});

		test("complement", () => {
			const decoder = katabami.object({
				num: katabami.float(),
				optionalStr: katabami.optional(katabami.string()),
			});

			expectTypeOf<Infer<typeof decoder>>().toEqualTypeOf<{
				num: number;
				optionalStr: string | undefined;
			}>();
		});

		test("has promise", () => {
			const decoder = katabami.object({
				num: katabami.float().andThen(async () => {
					await new Promise((resolve) => setTimeout(resolve, 100));

					return katabami.integer();
				}),
				optionalStr: katabami.optional(katabami.string()),
			});

			expectTypeOf<Infer<typeof decoder>>().toEqualTypeOf<
				Promise<{
					num: number;
					optionalStr: string | undefined;
				}>
			>();
		});
	});

	describe("optional", () => {
		test("fixed", () => {
			const decoder = katabami.optional<number>(katabami.float());

			expectTypeOf<Infer<typeof decoder>>().toEqualTypeOf<number | undefined>();
		});

		test("complement", () => {
			const decoder = katabami.optional(katabami.float());

			expectTypeOf<Infer<typeof decoder>>().toEqualTypeOf<number | undefined>();
		});
	});

	describe("tuple", () => {
		test("fixed", () => {
			const decoder = katabami.tuple<["foo", "bar"]>(
				katabami.constant("foo"),
				katabami.constant("bar"),
			);

			expectTypeOf<Infer<typeof decoder>>().toEqualTypeOf<["foo", "bar"]>();
		});

		test("complement", () => {
			const decoder = katabami.tuple(
				katabami.constant("foo"),
				katabami.constant("bar"),
			);

			expectTypeOf<Infer<typeof decoder>>().toEqualTypeOf<["foo", "bar"]>();
		});

		test("has promise", () => {
			const decoder = katabami.tuple(
				katabami.constant("foo").andThen(async (value) => {
					await new Promise((resolve) => setTimeout(resolve, 100));

					return katabami.succeed(value);
				}),
				katabami.constant("bar"),
			);

			expectTypeOf<Infer<typeof decoder>>().toEqualTypeOf<
				Promise<["foo", "bar"]>
			>();
		});
	});

	describe("union", () => {
		test("fixed", () => {
			const decoder = katabami.union<"bar" | "foo">(
				katabami.constant("bar"),
				katabami.constant("foo"),
			);

			expectTypeOf<Infer<typeof decoder>>().toEqualTypeOf<"bar" | "foo">();
		});

		test("complement", () => {
			const decoder = katabami.union(
				katabami.constant("bar"),
				katabami.constant("foo"),
			);

			expectTypeOf<Infer<typeof decoder>>().toEqualTypeOf<"bar" | "foo">();
		});

		test("has promise", () => {
			const decoder = katabami.union(
				katabami.constant("bar").andThen(async (value) => {
					await new Promise((resolve) => setTimeout(resolve, 100));

					return katabami.succeed(value);
				}),
				katabami.constant("foo"),
			);

			expectTypeOf<Infer<typeof decoder>>().toEqualTypeOf<
				Promise<"bar" | "foo">
			>();
		});
	});

	describe("decoder method", () => {
		describe("map", () => {
			test("fixed", () => {
				const decoder = katabami.string().map<number>((value) => Number(value));

				expectTypeOf<Infer<typeof decoder>>().toEqualTypeOf<number>();
			});

			test("complement", () => {
				const decoder = katabami.string().map((value) => Number(value));

				expectTypeOf<Infer<typeof decoder>>().toEqualTypeOf<number>();
			});

			test("promise", () => {
				const decoder = katabami.string().map(async (value) => {
					return new Promise<number>((resolve) => resolve(Number(value)));
				});

				expectTypeOf<Infer<typeof decoder>>().toEqualTypeOf<Promise<number>>();
			});
		});

		describe("andThen", () => {
			test("fixed", () => {
				const decoder = katabami
					.value()
					.andThen<number>(() => katabami.integer());

				expectTypeOf<Infer<typeof decoder>>().toEqualTypeOf<number>();
			});

			test("complement", () => {
				const decoder = katabami.value().andThen(() => katabami.integer());

				expectTypeOf<Infer<typeof decoder>>().toEqualTypeOf<number>();
			});

			test("promise", () => {
				const decoder = katabami.value().andThen(() => {
					return new Promise<Decoder<number>>((resolve) =>
						resolve(katabami.integer()),
					);
				});

				expectTypeOf<Infer<typeof decoder>>().toEqualTypeOf<Promise<number>>();
			});
		});
	});
});
