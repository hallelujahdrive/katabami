import { describe, expectTypeOf, test } from "vitest";

import * as katabami from "../src/index.js";
import {
	type ArrayDecodeIssues,
	createIssues,
	DecodeError,
	type Decoder,
	type Issue,
	type Issues,
	type IssueType,
	type ObjectDecodeIssues,
	type Primitive,
	type RecordDecodeIssues,
	type Resolved,
	type Result,
	type TupleDecodeIssues,
	type TypeKeys,
	type UnionDecodeIssues,
} from "../src/index.js";

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
				: U extends RecordDecodeIssues<Decoder<unknown>, infer Issue>
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
		const _decoder = katabami.array(katabami.int());

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

	test("boolean", () => {
		const _decoder = katabami.boolean();

		expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<{
			expected: "type.boolean";
			received: string;
		}>();
	});

	test("constant", () => {
		const _decoder = katabami.constant("foo");

		expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<{
			expected: "foo";
			received: Primitive;
		}>();
	});

	test("int", () => {
		const _decoder = katabami.int();

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
		const _decoder = katabami.failed();

		expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<undefined>();

		expectTypeOf<GetIssues<DecodeResult<typeof _decoder>>>().toEqualTypeOf<
			Record<never, never>
		>();
	});

	test("field", () => {
		const _decoder = katabami.field("foo", katabami.string());

		expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<
			{ expected: "type.object"; received: TypeKeys } | { key: "foo" }
		>();
	});

	test("index", () => {
		const _decoder = katabami.index(0, katabami.string());

		expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<
			{ expected: "type.array"; received: TypeKeys } | { index: 0 }
		>();
	});

	test("optional", () => {
		const _decoder = katabami.optional(katabami.int());

		expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<{
			expected: "type.integer" | "type.number";
			received: string;
		}>();
	});

	test("float", () => {
		const _decoder = katabami.float();

		expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<{
			expected: "type.number";
			received: string;
		}>();
	});

	test("string", () => {
		const _decoder = katabami.string();

		expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<{
			expected: "type.string";
			received: string;
		}>();
	});

	describe("map", () => {
		const _decoder = katabami.map(
			(foo, bar) => ({ ...foo, ...bar }),
			katabami.object({ foo: katabami.float() }),
			katabami.object({ bar: katabami.string() }),
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
			const _decoder = katabami.object({
				bar: katabami.int(),
				foo: katabami.string(),
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
			const _decoder = katabami.object({
				bar: katabami.object({
					foo: katabami.string(),
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
		const _decoder = katabami.record(katabami.string());

		test("issue message", () => {
			expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<{
				expected: "type.object";
				received: TypeKeys;
			}>();
		});

		test("record decode issues", () => {
			expectTypeOf<GetIssues<DecodeResult<typeof _decoder>>>().toExtend<{
				readonly [key: string]: Record<never, never>;
			}>();
		});
	});

	describe("tuple", () => {
		const _decoder = katabami.tuple(katabami.int(), katabami.string());

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
		const _decoder = katabami.union(katabami.int(), katabami.string());

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
			const _decoder = katabami.union(
				katabami.constant("foo"),
				katabami.union(katabami.constant("bar"), katabami.constant("baz")),
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
			const _decoder = katabami.int();

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
				const _decoder = katabami
					.string()
					.andThen(() => katabami.constant("foo"));

				expectTypeOf<GetVars<typeof _decoder>>().toEqualTypeOf<
					| { expected: "foo"; received: Primitive }
					| { expected: "type.string"; received: string }
				>();

				expectTypeOf<GetIssues<DecodeResult<typeof _decoder>>>().toEqualTypeOf<
					Record<never, never>
				>();
			});

			test("nested decode issues", () => {
				const _decoder = katabami
					.object({ foo: katabami.string() })
					.andThen(() => katabami.int());

				expectTypeOf<{
					readonly foo?: Record<never, never>;
				}>().toExtend<GetIssues<DecodeResult<typeof _decoder>>>();
			});
		});

		describe("catch", () => {
			test("issue message", () => {
				const _decoder = katabami.int().catch(() => {
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
				const _decoder = katabami.int().map((value) => value.toString());

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
