import { describe, expectTypeOf, test } from "vitest";
import type { IsUnion, TypeOf, UnionToTuple } from "../src";

describe("helpers", () => {
	describe("isUnion", () => {
		test("boolean", () => {
			type T = IsUnion<boolean>;

			expectTypeOf<T>().toEqualTypeOf<true>();
		});

		test("union", () => {
			type T = IsUnion<boolean | number>;

			expectTypeOf<T>().toEqualTypeOf<true>();
		});
	});

	describe("typeOf", () => {
		test("array", () => {
			type T = TypeOf<number[]>;

			expectTypeOf<T>().toEqualTypeOf<"array">();
		});

		test("boolean", () => {
			type T = TypeOf<boolean>;

			expectTypeOf<T>().toEqualTypeOf<"boolean">();
		});

		describe("constant", () => {
			test("number", () => {
				type T = TypeOf<0>;

				expectTypeOf<T>().toEqualTypeOf<"constant">();
			});

			test("true", () => {
				type T = TypeOf<true>;

				expectTypeOf<T>().toEqualTypeOf<"constant">();
			});
		});

		test("object", () => {
			type T = TypeOf<{ foo: number }>;

			expectTypeOf<T>().toEqualTypeOf<"object">();
		});

		test("union", () => {
			type T = TypeOf<boolean | number>;

			expectTypeOf<T>().toEqualTypeOf<"union">();
		});
	});

	describe("unionToTuple", () => {
		test("union", () => {
			type T = UnionToTuple<number | string>;

			expectTypeOf<T>().toEqualTypeOf<[string, number]>();
		});
	});
});
