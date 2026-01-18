import { describe, expect, test } from "vitest";
import { replaceArticle } from "../src/index.js";

describe("utils", () => {
	describe("replaceArticle", () => {
		test("should replace 'a' with 'an' if the value starts with 'a'", () => {
			const result = replaceArticle("A apple");

			expect(result).toBe("An apple");
		});

		test("should replace 'a' with 'an' if the value contains 'a'", () => {
			const result = replaceArticle("This is a apple");

			expect(result).toBe("This is an apple");
		});
	});
});
