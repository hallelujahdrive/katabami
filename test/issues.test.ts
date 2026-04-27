import { describe, expect, test } from "vitest";
import { DecodeError, issueMessage, katabami } from "../src/index.js";

describe("issues", () => {
	describe("boolean decoder", () => {
		const decoder = katabami.boolean();

		test("should create an issue", () => {
			const result = decoder.decodeValue("foo");

			expect(result).toStrictEqual({
				error: expect.any(DecodeError),
				ok: false,
			});

			expect(issueMessage(result.error?.issues)?.toString()).toStrictEqual(
				"A {{expected}} is expected, but the value is a {{received}}.",
			);
		});
	});
});
