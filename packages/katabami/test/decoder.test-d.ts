import { describe, expectTypeOf, test } from "vitest";
import {
	type Awaitable,
	array,
	at,
	boolean,
	constant,
	createIssues,
	type Decoder,
	failed,
	field,
	type Infer,
	type Issue,
	type Issues,
	index,
	int,
	map,
	nullable,
	number,
	object,
	oneOrMore,
	optional,
	type Primitive,
	record,
	string,
	succeed,
	tuple,
	type UnionDecodeIssues,
	union,
	value,
} from "../src";

describe("Decoder", () => {
	describe("array", () => {
		test("fixed", () => {
			const _decoder = array<number>(number());

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Array<number>>();
		});

		test("complement", () => {
			const _decoder = array(number());

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Array<number>>();
		});

		test("has promise", () => {
			const _decoder = array(
				number().andThen(() => {
					return new Promise<Decoder<number>>((resolve) => resolve(int()));
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
				const _decoder = at<string>(["foo", "bar"], string());

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<string>();
			});

			test("complement", () => {
				const _decoder = at(["foo", "bar"], string());

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<string>();
			});

			test("equivalent to nested field", () => {
				const _at = at(["foo", "bar"], string());
				const _field = field("foo", field("bar", string()));

				expectTypeOf<Infer<typeof _at>>().toEqualTypeOf<Infer<typeof _field>>();
			});
		});

		describe("async", () => {
			test("fixed", () => {
				const _decoder = at<string>(["foo", "bar"], string()).andThen(
					(value) => {
						return new Promise<Decoder<string>>((resolve) =>
							resolve(succeed(value)),
						);
					},
				);

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Promise<string>>();
			});

			test("complement", () => {
				const _decoder = at(["foo", "bar"], string()).andThen((value) => {
					return new Promise<Decoder<string>>((resolve) =>
						resolve(succeed(value)),
					);
				});

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Promise<string>>();
			});
		});
	});

	describe("boolean", () => {
		test("fixed", () => {
			const _decoder = boolean();

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<boolean>();
		});

		test("promise", () => {
			const _decoder = boolean().andThen((value) => {
				return new Promise<Decoder<boolean>>((resolve) =>
					resolve(succeed(value)),
				);
			});

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Promise<boolean>>();
		});
	});

	describe("constant", () => {
		test("sync", () => {
			const _decoder = constant("foo");

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<"foo">();
		});

		test("null", () => {
			const _decoder = constant(null);

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<null>();
		});

		test("promise", () => {
			const _decoder = constant("foo").andThen((value) => {
				return new Promise<Decoder<"foo">>((resolve) =>
					resolve(succeed(value)),
				);
			});

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Promise<"foo">>();
		});
	});

	describe("failed", () => {
		test("sync", () => {
			const _decoder = failed();

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<never>();
		});

		test("promise", () => {
			const _decoder = failed().andThen((value) => {
				return new Promise<Decoder<never>>((resolve) =>
					resolve(succeed(value)),
				);
			});

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Promise<never>>();
		});
	});

	describe("field", () => {
		describe("sync", () => {
			test("fixed", () => {
				const _decoder = field<string>("foo", string());

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<string>();
			});

			test("complement", () => {
				const _decoder = field("foo", string());

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<string>();
			});
		});

		describe("async", () => {
			test("fixed", () => {
				const _decoder = field<string>("foo", string()).andThen((value) => {
					return new Promise<Decoder<string>>((resolve) =>
						resolve(succeed(value)),
					);
				});

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Promise<string>>();
			});

			test("complement", () => {
				const _decoder = field("foo", string()).andThen((value) => {
					return new Promise<Decoder<string>>((resolve) =>
						resolve(succeed(value)),
					);
				});

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Promise<string>>();
			});
		});
	});

	describe("index", () => {
		describe("sync", () => {
			test("fixed", () => {
				const _decoder = index<string>(0, string());

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<string>();
			});

			test("complement", () => {
				const _decoder = index(0, string());

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<string>();
			});
		});

		describe("async", () => {
			test("fixed", () => {
				const _decoder = index<string>(0, string()).andThen((value) => {
					return new Promise<Decoder<string>>((resolve) =>
						resolve(succeed(value)),
					);
				});

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Promise<string>>();
			});

			test("complement", () => {
				const _decoder = index(0, string()).andThen((value) => {
					return new Promise<Decoder<string>>((resolve) =>
						resolve(succeed(value)),
					);
				});

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Promise<string>>();
			});
		});
	});

	describe("int", () => {
		test("fixed", () => {
			const _decoder = int();

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<number>();
		});

		test("complement", () => {
			const _decoder = int();

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<number>();
		});

		test("promise", () => {
			const _decoder = int().andThen((value) => {
				return new Promise<Decoder<number>>((resolve) =>
					resolve(succeed(value)),
				);
			});

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Promise<number>>();
		});
	});

	describe("map", () => {
		test("fixed", () => {
			const _decoder = map<
				{ bar: number; foo: number },
				[Decoder<number>, Decoder<number>]
			>(
				(foo, bar) => ({ bar, foo }),
				field("foo", number()),
				field("bar", number()),
			);

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<{
				bar: number;
				foo: number;
			}>();
		});

		test("complement", () => {
			const _decoder = map(
				(foo, bar) => ({ bar, foo }),
				field("foo", number()),
				field("bar", number()),
			);

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<{
				bar: number;
				foo: number;
			}>();
		});

		test("has promise decoder", () => {
			const _decoder = map(
				(foo, bar) => ({ bar, foo }),
				field(
					"foo",
					number().andThen((value) => {
						return new Promise<Decoder<number>>((resolve) =>
							resolve(succeed(value)),
						);
					}),
				),
				field("bar", number()),
			);

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
				Promise<{
					bar: number;
					foo: number;
				}>
			>();
		});

		test("has promise map function", () => {
			const _decoder = map(
				async (foo, bar) => {
					await new Promise((resolve) => setTimeout(resolve, 100));
					return { bar, foo };
				},
				field("foo", number()),
				field("bar", number()),
			);

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
				Promise<{
					bar: number;
					foo: number;
				}>
			>();
		});
	});

	describe("number", () => {
		test("sync", () => {
			const _decoder = number();

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<number>();
		});

		test("promise", () => {
			const _decoder = number().andThen((value) => {
				return new Promise<Decoder<number>>((resolve) =>
					resolve(succeed(value)),
				);
			});

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Promise<number>>();
		});
	});

	describe("object", () => {
		test("fixed", () => {
			const _decoder = object<{ num: number; optionalStr?: string }>({
				num: number(),
				optionalStr: optional(string()),
			});

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<{
				num: number;
				optionalStr: string | undefined;
			}>();
		});

		test("complement", () => {
			const _decoder = object({
				num: number(),
				optionalStr: optional(string()),
			});

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<{
				num: number;
				optionalStr: string | undefined;
			}>();
		});

		test("has promise", () => {
			const _decoder = object({
				num: number().andThen((value) => {
					return new Promise<Decoder<number>>((resolve) =>
						resolve(succeed(value)),
					);
				}),
				optionalStr: optional(string()),
			});

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
				Promise<{
					num: number;
					optionalStr: string | undefined;
				}>
			>();
		});

		test("nullable field", () => {
			const _decoder = object({
				nullableStr: nullable(string()),
				num: number(),
			});

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<{
				nullableStr: null | string;
				num: number;
			}>();
		});
	});

	describe("oneOrMore", () => {
		test("fixed", () => {
			const _decoder = oneOrMore<number>(number());

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
				[number, ...number[]]
			>();
		});

		test("complement", () => {
			const _decoder = oneOrMore(number());

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
				[number, ...number[]]
			>();
		});

		test("has promise", () => {
			const _decoder = oneOrMore(
				number().andThen(() => {
					return new Promise<Decoder<number>>((resolve) => resolve(int()));
				}),
			);

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
				Promise<[number, ...number[]]>
			>();
		});
	});

	describe("record", () => {
		test("fixed", () => {
			const _decoder = record(string(), number());

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
				Record<string, number>
			>();
		});

		test("complement", () => {
			const _decoder = record(string(), number());

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
				Record<string, number>
			>();
		});

		test("literal keys", () => {
			const _decoder = record(union(constant("a"), constant("b")), number());

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
				Record<"a" | "b", number>
			>();
		});

		test("has promise", () => {
			const _decoder = record(
				string(),
				number().andThen(() => {
					return new Promise<Decoder<number>>((resolve) => resolve(int()));
				}),
			);

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
				Promise<Record<string, number>>
			>();
		});

		test("has promise from key", () => {
			const _decoder = record(
				string().andThen(() => {
					return new Promise<Decoder<string>>((resolve) => resolve(string()));
				}),
				number(),
			);

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
				Promise<Record<string, number>>
			>();
		});

		test("key decoder must decode PropertyKey", () => {
			expectTypeOf<Parameters<typeof record>[0]>().toEqualTypeOf<
				Decoder<Awaitable<PropertyKey>>
			>();
			expectTypeOf(string()).toExtend<Parameters<typeof record>[0]>();
			expectTypeOf(boolean()).not.toExtend<Parameters<typeof record>[0]>();
		});
	});

	describe("nullable", () => {
		describe("sync", () => {
			test("fixed", () => {
				const _decoder = nullable<number>(number());

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<null | number>();
			});

			test("complement", () => {
				const _decoder = nullable(number());

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<null | number>();
			});
		});

		describe("async", () => {
			test("fixed", () => {
				const _decoder = nullable<Promise<number>>(
					number().andThen((value) => {
						return new Promise<Decoder<number>>((resolve) =>
							resolve(succeed(value)),
						);
					}),
				);

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
					Promise<null | number>
				>();
			});

			test("complement", () => {
				const _decoder = nullable(
					number().andThen((value) => {
						return new Promise<Decoder<number>>((resolve) =>
							resolve(succeed(value)),
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
				const _decoder = optional<number>(number());

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
					number | undefined
				>();
			});

			test("complement", () => {
				const _decoder = optional(number());

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
					number | undefined
				>();
			});
		});

		describe("async", () => {
			test("fixed", () => {
				const _decoder = optional<Promise<number>>(
					number().andThen((value) => {
						return new Promise<Decoder<number>>((resolve) =>
							resolve(succeed(value)),
						);
					}),
				);

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
					Promise<number | undefined>
				>();
			});

			test("complement", () => {
				const _decoder = optional(
					number().andThen((value) => {
						return new Promise<Decoder<number>>((resolve) =>
							resolve(succeed(value)),
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
			const _decoder = string();

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<string>();
		});

		test("promise", () => {
			const _decoder = string().andThen((value) => {
				return new Promise<Decoder<string>>((resolve) =>
					resolve(succeed(value)),
				);
			});

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Promise<string>>();
		});
	});

	describe("tuple", () => {
		test("fixed", () => {
			const _decoder = tuple<["foo", "bar"]>(constant("foo"), constant("bar"));

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<["foo", "bar"]>();
		});

		test("complement", () => {
			const _decoder = tuple(constant("foo"), constant("bar"));

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<["foo", "bar"]>();
		});

		test("has promise", () => {
			const _decoder = tuple(
				constant("foo").andThen((value) => {
					return new Promise<Decoder<"foo">>((resolve) =>
						resolve(succeed(value)),
					);
				}),
				constant("bar"),
			);

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<
				Promise<["foo", "bar"]>
			>();
		});
	});

	describe("union", () => {
		test("fixed", () => {
			const _decoder = union(constant("foo"), constant("bar"));

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<"bar" | "foo">();
		});

		test("complement", () => {
			const _decoder = union(constant("bar"), constant("foo"));

			expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<"bar" | "foo">();
		});

		test("has promise", () => {
			const _decoder = union(
				constant("bar").andThen((value) => {
					return new Promise<Decoder<"bar">>((resolve) =>
						resolve(succeed(value)),
					);
				}),
				constant("foo"),
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
				const _decoder = value().andThen<number>(() => int());

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<number>();
			});

			test("complement", () => {
				const _decoder = value().andThen(() => int());

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<number>();
			});

			test("promise", () => {
				const _decoder = value().andThen(() => {
					return new Promise<Decoder<number>>((resolve) => resolve(int()));
				});

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Promise<number>>();
			});
		});

		describe("catch", () => {
			test("fixed", () => {
				const _decoder = int().catch<
					Issues<"custom", Issue<"custom", "Custom issue", undefined>>
				>(() => {
					return {
						issues: createIssues("custom", "Custom issue"),
						ok: false,
					};
				});

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<number>();
			});

			test("complement", () => {
				const _decoder = int().catch(() => {
					return {
						issues: createIssues("custom", "Custom issue"),
						ok: false,
					};
				});

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<number>();
			});
		});

		describe("map", () => {
			test("fixed", () => {
				const _decoder = string().map<number>((value) => Number(value));

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<number>();
			});

			test("complement", () => {
				const _decoder = string().map((value) => Number(value));

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<number>();
			});

			test("promise", () => {
				const _decoder = string().map((value) => {
					return new Promise<number>((resolve) => resolve(Number(value)));
				});

				expectTypeOf<Infer<typeof _decoder>>().toEqualTypeOf<Promise<number>>();
			});
		});
	});
});
