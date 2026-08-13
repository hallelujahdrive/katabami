import { describe, expectTypeOf, test } from "vitest";
import * as katabami from "../src/index.js";
import {
	createIssues,
	DecodeError,
	type Decoder,
	type Infer,
	type Issue,
	type Issues,
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

	describe("at", () => {
		describe("sync", () => {
			test("fixed", () => {
				const _decoder = katabami.at<string>(["foo", "bar"], katabami.string());

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<string>();
			});

			test("complement", () => {
				const _decoder = katabami.at(["foo", "bar"], katabami.string());

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<string>();
			});

			test("equivalent to nested field", () => {
				const _at = katabami.at(["foo", "bar"], katabami.string());
				const _field = katabami.field(
					"foo",
					katabami.field("bar", katabami.string()),
				);

				expectTypeOf<Infer<typeof _at>>().toEqualTypeOf<Infer<typeof _field>>();
			});
		});

		describe("async", () => {
			test("fixed", () => {
				const _decoder = katabami
					.at<string>(["foo", "bar"], katabami.string())
					.andThen((value) => {
						return new Promise<Decoder<string>>((resolve) =>
							resolve(katabami.succeed(value)),
						);
					});

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Promise<string>>();
			});

			test("complement", () => {
				const _decoder = katabami
					.at(["foo", "bar"], katabami.string())
					.andThen((value) => {
						return new Promise<Decoder<string>>((resolve) =>
							resolve(katabami.succeed(value)),
						);
					});

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Promise<string>>();
			});
		});
	});

	describe("boolean", () => {
		test("fixed", () => {
			const _decoder = katabami.boolean();

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<boolean>();
		});

		test("promise", () => {
			const _decoder = katabami.boolean().andThen((value) => {
				return new Promise<Decoder<boolean>>((resolve) =>
					resolve(katabami.succeed(value)),
				);
			});

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Promise<boolean>>();
		});
	});

	describe("constant", () => {
		test("sync", () => {
			const _decoder = katabami.constant("foo");

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<"foo">();
		});

		test("promise", () => {
			const _decoder = katabami.constant("foo").andThen((value) => {
				return new Promise<Decoder<"foo">>((resolve) =>
					resolve(katabami.succeed(value)),
				);
			});

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Promise<"foo">>();
		});
	});

	describe("failed", () => {
		test("sync", () => {
			const _decoder = katabami.failed();

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<never>();
		});

		test("promise", () => {
			const _decoder = katabami.failed().andThen((value) => {
				return new Promise<Decoder<never>>((resolve) =>
					resolve(katabami.succeed(value)),
				);
			});

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Promise<never>>();
		});
	});

	describe("field", () => {
		describe("sync", () => {
			test("fixed", () => {
				const _decoder = katabami.field<string>("foo", katabami.string());

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<string>();
			});

			test("complement", () => {
				const _decoder = katabami.field("foo", katabami.string());

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<string>();
			});
		});

		describe("async", () => {
			test("fixed", () => {
				const _decoder = katabami
					.field<string>("foo", katabami.string())
					.andThen((value) => {
						return new Promise<Decoder<string>>((resolve) =>
							resolve(katabami.succeed(value)),
						);
					});

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Promise<string>>();
			});

			test("complement", () => {
				const _decoder = katabami
					.field("foo", katabami.string())
					.andThen((value) => {
						return new Promise<Decoder<string>>((resolve) =>
							resolve(katabami.succeed(value)),
						);
					});

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Promise<string>>();
			});
		});
	});

	describe("float", () => {
		test("sync", () => {
			const _decoder = katabami.float();

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<number>();
		});

		test("promise", () => {
			const _decoder = katabami.float().andThen((value) => {
				return new Promise<Decoder<number>>((resolve) =>
					resolve(katabami.succeed(value)),
				);
			});

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Promise<number>>();
		});
	});

	describe("index", () => {
		describe("sync", () => {
			test("fixed", () => {
				const _decoder = katabami.index<string>(0, katabami.string());

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<string>();
			});

			test("complement", () => {
				const _decoder = katabami.index(0, katabami.string());

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<string>();
			});
		});

		describe("async", () => {
			test("fixed", () => {
				const _decoder = katabami
					.index<string>(0, katabami.string())
					.andThen((value) => {
						return new Promise<Decoder<string>>((resolve) =>
							resolve(katabami.succeed(value)),
						);
					});

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Promise<string>>();
			});

			test("complement", () => {
				const _decoder = katabami
					.index(0, katabami.string())
					.andThen((value) => {
						return new Promise<Decoder<string>>((resolve) =>
							resolve(katabami.succeed(value)),
						);
					});

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Promise<string>>();
			});
		});
	});

	describe("int", () => {
		test("fixed", () => {
			const _decoder = katabami.int();

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<number>();
		});

		test("complement", () => {
			const _decoder = katabami.int();

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<number>();
		});

		test("promise", () => {
			const _decoder = katabami.int().andThen((value) => {
				return new Promise<Decoder<number>>((resolve) =>
					resolve(katabami.succeed(value)),
				);
			});

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Promise<number>>();
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

		test("nullable field", () => {
			const _decoder = katabami.object({
				nullableStr: katabami.nullable(katabami.string()),
				num: katabami.float(),
			});

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<{
				nullableStr: null | string;
				num: number;
			}>();
		});
	});

	describe("record", () => {
		test("fixed", () => {
			const _decoder = katabami.record<number>(katabami.float());

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
				Record<string, number>
			>();
		});

		test("complement", () => {
			const _decoder = katabami.record(katabami.float());

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
				Record<string, number>
			>();
		});

		test("has promise", () => {
			const _decoder = katabami.record(
				katabami.float().andThen(() => {
					return new Promise<Decoder<number>>((resolve) =>
						resolve(katabami.int()),
					);
				}),
			);

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
				Promise<Record<string, number>>
			>();
		});
	});

	describe("nullable", () => {
		describe("sync", () => {
			test("fixed", () => {
				const _decoder = katabami.nullable<number>(katabami.float());

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<null | number>();
			});

			test("complement", () => {
				const _decoder = katabami.nullable(katabami.float());

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<null | number>();
			});
		});

		describe("async", () => {
			test("fixed", () => {
				const _decoder = katabami.nullable<Promise<number>>(
					katabami.float().andThen((value) => {
						return new Promise<Decoder<number>>((resolve) =>
							resolve(katabami.succeed(value)),
						);
					}),
				);

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
					Promise<null | number>
				>();
			});

			test("complement", () => {
				const _decoder = katabami.nullable(
					katabami.float().andThen((value) => {
						return new Promise<Decoder<number>>((resolve) =>
							resolve(katabami.succeed(value)),
						);
					}),
				);

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
					Promise<null | number>
				>();
			});
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

	describe("string", () => {
		test("sync", () => {
			const _decoder = katabami.string();

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<string>();
		});

		test("promise", () => {
			const _decoder = katabami.string().andThen((value) => {
				return new Promise<Decoder<string>>((resolve) =>
					resolve(katabami.succeed(value)),
				);
			});

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Promise<string>>();
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
			const _decoder = katabami.union(
				katabami.constant("foo"),
				katabami.constant("bar"),
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

		describe("catch", () => {
			test("fixed", () => {
				const _decoder = katabami
					.int()
					.catch<Issues<"custom", Issue<"custom", "Custom issue", undefined>>>(
						() => {
							return {
								error: new DecodeError(
									"Custom error",
									createIssues("custom", "Custom issue"),
								),
								ok: false,
							};
						},
					);

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<number>();
			});

			test("complement", () => {
				const _decoder = katabami.int().catch(() => {
					return {
						error: new DecodeError(
							"Custom error",
							createIssues("custom", "Custom issue"),
						),
						ok: false,
					};
				});

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<number>();
			});
		});

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
	});
});
