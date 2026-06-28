import { describe, expectTypeOf, test } from "vitest";

import {
	type Decoder,
	type Infer,
	type Issue,
	type Issues,
	katabami,
	type Primitive,
	type UnionDecodeIssues,
} from "../src/index.js";

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

		test("has promise", () => {
			const _decoder = katabami.array(
				katabami.float().andThen(() => {
					return new Promise<Decoder<number>>((resolve) =>
						resolve(katabami.int()),
					);
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
				[Decoder<number>, Decoder<number>]
			>(
				(foo, bar) => ({ bar, foo }),
				katabami.field("foo", katabami.float()),
				katabami.field("bar", katabami.float()),
			);

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<{
				bar: number;
				foo: number;
			}>();
		});

		test("complement", () => {
			const _decoder = katabami.map(
				(foo, bar) => ({ bar, foo }),
				katabami.field("foo", katabami.float()),
				katabami.field("bar", katabami.float()),
			);

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<{
				bar: number;
				foo: number;
			}>();
		});

		test("has promise decoder", () => {
			const _decoder = katabami.map(
				(foo, bar) => ({ bar, foo }),
				katabami.field(
					"foo",
					katabami.float().andThen((value) => {
						return new Promise<Decoder<number>>((resolve) =>
							resolve(katabami.succeed(value)),
						);
					}),
				),
				katabami.field("bar", katabami.float()),
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
					return { bar, foo };
				},
				katabami.field("foo", katabami.float()),
				katabami.field("bar", katabami.float()),
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
				num: katabami.float().andThen((value) => {
					return new Promise<Decoder<number>>((resolve) =>
						resolve(katabami.succeed(value)),
					);
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
		describe("sync", () => {
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

		describe("async", () => {
			test("fixed", () => {
				const _decoder = katabami.optional<Promise<number>>(
					katabami.float().andThen((value) => {
						return new Promise<Decoder<number>>((resolve) =>
							resolve(katabami.succeed(value)),
						);
					}),
				);

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
					Promise<number | undefined>
				>();
			});

			test("complement", () => {
				const _decoder = katabami.optional(
					katabami.float().andThen((value) => {
						return new Promise<Decoder<number>>((resolve) =>
							resolve(katabami.succeed(value)),
						);
					}),
				);

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
					Promise<number | undefined>
				>();
			});
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
				katabami.constant("foo").andThen((value) => {
					return new Promise<Decoder<"foo">>((resolve) =>
						resolve(katabami.succeed(value)),
					);
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
				katabami.constant("bar").andThen((value) => {
					return new Promise<Decoder<"bar">>((resolve) =>
						resolve(katabami.succeed(value)),
					);
				}),
				katabami.constant("foo"),
			);

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
				Promise<"bar" | "foo">
			>();
		});

		test("nested union flattens issues", () => {
			type UnionIssue = Issue<"union", "issue.invalidUnion", undefined>;
			type ConstantIssue<Expected extends string> = Issues<
				"constant",
				Issue<
					"constant",
					"issue.unexpectedValue",
					{ expected: Expected; received: Primitive }
				>
			>;

			type NestedUnionIssues = UnionDecodeIssues<
				[
					Decoder<"foo", ConstantIssue<"foo">>,
					Decoder<
						"bar" | "baz",
						UnionDecodeIssues<
							[
								Decoder<"bar", ConstantIssue<"bar">>,
								Decoder<"baz", ConstantIssue<"baz">>,
							],
							UnionIssue
						>
					>,
				],
				UnionIssue
			>;

			type FlatUnionIssues = UnionDecodeIssues<
				[
					Decoder<"foo", ConstantIssue<"foo">>,
					Decoder<"bar", ConstantIssue<"bar">>,
					Decoder<"baz", ConstantIssue<"baz">>,
				],
				UnionIssue
			>;

			type NestedExtendsFlat = NestedUnionIssues extends FlatUnionIssues
				? true
				: false;
			type FlatExtendsNested = FlatUnionIssues extends NestedUnionIssues
				? true
				: false;

			expectTypeOf<NestedExtendsFlat>().toEqualTypeOf<true>();
			expectTypeOf<FlatExtendsNested>().toEqualTypeOf<true>();
		});
	});

	describe("decoder method", () => {
		describe("map", () => {
			test("fixed", () => {
				const _decoder = katabami
					.string()
					.map<number>((value) => Number(value));

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<number>();
			});

			test("complement", () => {
				const _decoder = katabami.string().map((value) => Number(value));

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<number>();
			});

			test("promise", () => {
				const _decoder = katabami.string().map((value) => {
					return new Promise<number>((resolve) => resolve(Number(value)));
				});

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Promise<number>>();
			});
		});

		describe("andThen", () => {
			test("fixed", () => {
				const _decoder = katabami.value().andThen<number>(() => katabami.int());

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<number>();
			});

			test("complement", () => {
				const _decoder = katabami.value().andThen(() => katabami.int());

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<number>();
			});

			test("promise", () => {
				const _decoder = katabami.value().andThen(() => {
					return new Promise<Decoder<number>>((resolve) =>
						resolve(katabami.int()),
					);
				});

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Promise<number>>();
			});
		});
	});
});
