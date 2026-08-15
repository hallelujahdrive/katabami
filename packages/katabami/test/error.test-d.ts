import { describe, expectTypeOf, test } from "vitest";
import {
	type ArrayDecodeIssues,
	type Awaitable,
	array,
	at,
	boolean,
	constant,
	createIssues,
	DecodeError,
	type Decoder,
	failed,
	field,
	float,
	type Issue,
	type Issues,
	type IssueType,
	index,
	int,
	map,
	nullable,
	type ObjectDecodeIssues,
	object,
	oneOrMore,
	optional,
	type Primitive,
	type RecordDecodeIssues,
	type Resolved,
	type Result,
	record,
	string,
	type TupleDecodeIssues,
	type TypeKeys,
	tuple,
	type UnionDecodeIssues,
	union,
} from "../src";

type DecodeResult<T extends Decoder<unknown, Issues>> = Resolved<
	ReturnType<T["decodeValue"]>
>;

type DecodeStringResult<T extends Decoder<unknown, Issues>> = Resolved<
	ReturnType<T["decodeString"]>
>;

type ExtractIssue<I> = I extends infer U
	? U extends UnionDecodeIssues<infer _, infer Issue>
		? Issue
		: U extends TupleDecodeIssues<infer _, infer Issue>
			? Issue
			: U extends ArrayDecodeIssues<Decoder<unknown>, infer Issue>
				? Issue
				: U extends RecordDecodeIssues<
							Decoder<Awaitable<PropertyKey>>,
							Decoder<unknown>,
							infer Issue
						>
					? Issue
					: U extends ObjectDecodeIssues<
								Record<string, Decoder<unknown>>,
								infer Issue
							>
						? Issue
						: U extends Issues<IssueType, infer Issue>
							? Issue
							: U extends Issue<infer _, infer __, infer ___>
								? U
								: never
	: never;

type GetIssues<T extends Result<unknown, Issues>> = [T] extends [
	Result<unknown, infer Is>,
]
	? GetIssuesObject<Is>
	: never;

type GetIssuesFromIssueTuple<T> = {
	readonly [K in keyof T as K extends `${number}`
		? K
		: never]: T[K] extends Issues ? GetIssuesObject<T[K]> : never;
};

type GetIssuesObject<I> = I extends infer U
	? U extends UnionDecodeIssues<infer _, infer __>
		? GetIssuesFromIssueTuple<U>
		: U extends Record<string, Issues>
			? { [k in keyof Omit<U, symbol>]: GetIssuesObject<U[k]> }
			: U
	: never;

type GetVars<T extends Decoder<unknown>> =
	IssueVars<
		ExtractIssue<T extends Decoder<unknown, infer I> ? I : never>
	> extends infer Vars
		? [Vars] extends [undefined]
			? undefined
			: NonNullable<Vars>
		: never;

type IssueVars<I> =
	I extends Issue<infer _, infer __, infer Vars> ? Vars : never;

describe("DecodeError", () => {
	describe("array", () => {
		const _decoder = array(int());

		test("issue message", () => {
			expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<{
				expected: "type.array";
				received: TypeKeys;
			}>();
		});

		test("array decode issues", () => {
			expectTypeOf<GetIssues<DecodeResult<typeof _decoder>>>().toEqualTypeOf<{
				readonly [key: number]: Record<never, never>;
			}>();
		});
	});

	test("oneOrMore", () => {
		const _decoder = oneOrMore(int());

		expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<
			| {
					expected: "type.array";
					received: TypeKeys;
			  }
			| {
					expected: 1;
					received: number;
			  }
		>();
	});

	test("at", () => {
		const _decoder = at(["foo", "bar"], string());
		const _field = field("foo", field("bar", string()));

		expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<
			GetVars<typeof _field>
		>();
	});

	test("boolean", () => {
		const _decoder = boolean();

		expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<{
			expected: "type.boolean";
			received: string;
		}>();
	});

	test("constant", () => {
		const _decoder = constant("foo");

		expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<{
			expected: "foo";
			received: Primitive;
		}>();
	});

	test("constant null", () => {
		const _decoder = constant(null);

		expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<{
			expected: null;
			received: Primitive;
		}>();
	});

	test("int", () => {
		const _decoder = int();

		expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<{
			expected: "type.integer" | "type.number";
			received: string;
		}>();

		expectTypeOf<{
			expected: "type.integer";
			received: "type.float";
		}>().toExtend<GetVars<typeof _decoder>>();
	});

	test("failed", () => {
		const _decoder = failed();

		expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<undefined>();

		expectTypeOf<GetIssues<DecodeResult<typeof _decoder>>>().toEqualTypeOf<
			Record<never, never>
		>();
	});

	test("field", () => {
		const _decoder = field("foo", string());

		expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<
			{ expected: "type.object"; received: TypeKeys } | { key: "foo" }
		>();
	});

	test("index", () => {
		const _decoder = index(0, string());

		expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<
			{ expected: "type.array"; received: TypeKeys } | { index: 0 }
		>();
	});

	test("nullable", () => {
		const _decoder = nullable(int());

		expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<{
			expected: "type.integer" | "type.number";
			received: string;
		}>();
	});

	test("optional", () => {
		const _decoder = optional(int());

		expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<{
			expected: "type.integer" | "type.number";
			received: string;
		}>();
	});

	test("float", () => {
		const _decoder = float();

		expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<{
			expected: "type.number";
			received: string;
		}>();
	});

	test("string", () => {
		const _decoder = string();

		expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<{
			expected: "type.string";
			received: string;
		}>();
	});

	describe("map", () => {
		const _decoder = map(
			(foo, bar) => ({ ...foo, ...bar }),
			object({ foo: float() }),
			object({ bar: string() }),
		);

		test("issue message", () => {
			expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<{
				expected: "type.object";
				received: TypeKeys;
			}>();
		});

		test("map decode issues", () => {
			expectTypeOf<GetIssues<DecodeResult<typeof _decoder>>>().toEqualTypeOf<
				| {
						readonly bar?: Record<never, never>;
				  }
				| {
						readonly foo?: Record<never, never>;
				  }
			>();
		});
	});

	describe("object", () => {
		describe("flattened", () => {
			const _decoder = object({
				bar: int(),
				foo: string(),
			});

			test("issue message", () => {
				expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<{
					expected: "type.object";
					received: TypeKeys;
				}>();
			});

			test("object decode issues", () => {
				expectTypeOf<GetIssues<DecodeResult<typeof _decoder>>>().toEqualTypeOf<{
					readonly bar?: Record<never, never>;
					readonly foo?: Record<never, never>;
				}>();
			});
		});

		describe("nested", () => {
			const _decoder = object({
				bar: object({
					foo: string(),
				}),
			});

			test("issue message", () => {
				expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<{
					expected: "type.object";
					received: TypeKeys;
				}>();
			});

			test("object decode issues", () => {
				expectTypeOf<GetIssues<DecodeResult<typeof _decoder>>>().toEqualTypeOf<{
					readonly bar?: {
						readonly foo?: Record<never, never>;
					};
				}>();
			});
		});
	});

	describe("record", () => {
		const _decoder = record(string(), string());

		test("issue message", () => {
			expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<
				| {
						expected: "type.object";
						received: TypeKeys;
				  }
				| { key: string }
			>();
		});

		test("record decode issues", () => {
			expectTypeOf<GetIssues<DecodeResult<typeof _decoder>>>().toExtend<{
				readonly [key: string]: Record<never, never>;
			}>();
		});

		describe("literal keys", () => {
			const _keyed = record(union(constant("a"), constant("b")), int());

			test("issue message", () => {
				expectTypeOf<GetVars<typeof _keyed>>().toEqualTypeOf<
					| {
							expected: "type.object";
							received: TypeKeys;
					  }
					| { key: string }
				>();
			});

			test("invalid keys are not issue paths", () => {
				expectTypeOf<GetIssues<DecodeResult<typeof _keyed>>>().toHaveProperty(
					"a",
				);
				expectTypeOf<GetIssues<DecodeResult<typeof _keyed>>>().toHaveProperty(
					"b",
				);
				expectTypeOf<
					GetIssues<DecodeResult<typeof _keyed>>
				>().not.toHaveProperty("c");
			});
		});
	});

	describe("tuple", () => {
		const _decoder = tuple(int(), string());

		test("issue message", () => {
			expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<
				| {
						expected: "type.array";
						received: TypeKeys;
				  }
				| {
						expected: number;
						received: number;
				  }
			>();
		});

		test("tuple decode issues", () => {
			expectTypeOf<GetIssues<DecodeResult<typeof _decoder>>>().toEqualTypeOf<{
				readonly 0?: Record<never, never>;
				readonly 1?: Record<never, never>;
			}>();
		});
	});

	describe("union", () => {
		const _decoder = union(int(), string());

		test("issue message", () => {
			expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<undefined>();
		});

		test("union decode issues", () => {
			expectTypeOf<GetIssues<DecodeResult<typeof _decoder>>>().toEqualTypeOf<{
				readonly 0: Record<never, never>;
				readonly 1: Record<never, never>;
			}>();
		});

		describe("nested", () => {
			const _decoder = union(
				constant("foo"),
				union(constant("bar"), constant("baz")),
			);

			test("issue message", () => {
				expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<undefined>();
			});

			test("union decode issues", () => {
				expectTypeOf<GetIssues<DecodeResult<typeof _decoder>>>().toEqualTypeOf<{
					readonly 0: Record<never, never>;
					readonly 1: Record<never, never>;
					readonly 2: Record<never, never>;
				}>();
			});
		});
	});

	describe("parseJson", () => {
		test("issue message", () => {
			const _decoder = int();

			expectTypeOf<{
				expected: "type.integer" | "type.number";
				received: string;
			}>().toExtend<
				IssueVars<
					ExtractIssue<
						typeof _decoder extends Decoder<unknown, infer I>
							?
									| I
									| Issues<
											"parseJson",
											Issue<"parseJson", "issue.failedToDecode", never>
									  >
							: never
					>
				>
			>();

			expectTypeOf<
				Issue<"parseJson", "issue.failedToDecode", never>
			>().toExtend<
				ExtractIssue<
					typeof _decoder extends Decoder<unknown, infer I>
						?
								| I
								| Issues<
										"parseJson",
										Issue<"parseJson", "issue.failedToDecode", never>
								  >
						: never
				>
			>();

			expectTypeOf<
				GetIssues<DecodeStringResult<typeof _decoder>>
			>().toEqualTypeOf<Record<never, never>>();
		});
	});

	describe("Decoder methods", () => {
		describe("andThen", () => {
			test("issue message", () => {
				const _decoder = string().andThen(() => constant("foo"));

				expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<
					| { expected: "foo"; received: Primitive }
					| { expected: "type.string"; received: string }
				>();

				expectTypeOf<GetIssues<DecodeResult<typeof _decoder>>>().toEqualTypeOf<
					Record<never, never>
				>();
			});

			test("nested decode issues", () => {
				const _decoder = object({ foo: string() }).andThen(() => int());

				expectTypeOf<{
					readonly foo?: Record<never, never>;
				}>().toExtend<GetIssues<DecodeResult<typeof _decoder>>>();
			});
		});

		describe("catch", () => {
			test("issue message", () => {
				const _decoder = int().catch(() => {
					return {
						error: new DecodeError(
							"Custom error",
							createIssues("custom", "Custom issue"),
						),
						ok: false as const,
					};
				});

				expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<undefined>();

				expectTypeOf<GetIssues<DecodeResult<typeof _decoder>>>().toEqualTypeOf<
					Record<never, never>
				>();
			});
		});

		describe("map", () => {
			test("issue message", () => {
				const _decoder = int().map((value) => value.toString());

				expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<{
					expected: "type.integer" | "type.number";
					received: string;
				}>();

				expectTypeOf<GetIssues<DecodeResult<typeof _decoder>>>().toEqualTypeOf<
					Record<never, never>
				>();
			});
		});
	});
});
