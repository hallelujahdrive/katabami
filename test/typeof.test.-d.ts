import { describe, expectTypeOf, test } from "vitest";

import type { TypeOf } from "../src/index.js";

describe("TypeOf", () => {
	test("array", () => {
		expectTypeOf<TypeOf<unknown[]>>().toEqualTypeOf<"array">();
	});

	test("boolean", () => {
		expectTypeOf<TypeOf<boolean>>().toEqualTypeOf<"boolean">();
		expectTypeOf<TypeOf<false | true>>().toEqualTypeOf<"boolean">();
	});

	test("constant", () => {
		expectTypeOf<TypeOf<true>>().toEqualTypeOf<"constant">();
		expectTypeOf<TypeOf<0>>().toEqualTypeOf<"constant">();
		expectTypeOf<TypeOf<"foo">>().toEqualTypeOf<"constant">();
	});

	test("null", () => {
		expectTypeOf<TypeOf<null>>().toEqualTypeOf<"null">();
	});

	test("number", () => {
		expectTypeOf<TypeOf<number>>().toEqualTypeOf<"number">();
	});

	test("object", () => {
		expectTypeOf<TypeOf<Record<string, unknown>>>().toEqualTypeOf<"object">();
	});

	test("string", () => {
		expectTypeOf<TypeOf<string>>().toEqualTypeOf<"string">();
	});

	test("undefined", () => {
		expectTypeOf<TypeOf<undefined>>().toEqualTypeOf<"undefined">();
	});

	test("union", () => {
		expectTypeOf<TypeOf<number | string>>().toEqualTypeOf<"union">();
		expectTypeOf<TypeOf<boolean | number>>().toEqualTypeOf<"union">();
	});
});
