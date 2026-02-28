import { describe, expect, test } from "vitest";

import { DecodeError, katabami } from "../src/index.js";

describe("decoder", () => {
	describe("boolean", () => {
		const decoder = katabami.boolean();

		describe("decode value", () => {
			test("success", () => {
				const result = decoder.decodeValue(true);

				const expectedResult = { ok: true, value: true } as const;

				expect(result).toStrictEqual(expectedResult);
			});

			test("fail", () => {
				const result = decoder.decodeValue("foo");

				const expectedResult = {
					error: expect.any(DecodeError),
					ok: false,
				} as const;

				expect(result).toStrictEqual(expectedResult);
			});
		});

		describe("decode string", () => {
			test("success", () => {
				const result = decoder.decodeString("true");

				const expectedResult = { ok: true, value: true } as const;

				expect(result).toStrictEqual(expectedResult);
			});

			test("fail", () => {
				const result = decoder.decodeValue("foo");

				const expectedResult = {
					error: expect.any(DecodeError),
					ok: false,
				} as const;

				expect(result).toStrictEqual(expectedResult);
			});
		});
	});

	describe("constant", () => {
		const decoder = katabami.constant("foo");

		describe("decode value", () => {
			test("success", () => {
				const result = decoder.decodeValue("foo");

				const expectedResult = { ok: true, value: "foo" } as const;

				expect(result).toStrictEqual(expectedResult);
			});

			test("fail", () => {
				const result = decoder.decodeValue("bar");

				const expectedResult = {
					error: expect.any(DecodeError),
					ok: false,
				} as const;

				expect(result).toStrictEqual(expectedResult);
			});
		});

		describe("decode string", () => {
			test("success", () => {
				const result = decoder.decodeString('"foo"');

				const expectedResult = { ok: true, value: "foo" } as const;

				expect(result).toStrictEqual(expectedResult);
			});

			test("fail", () => {
				const result = decoder.decodeString('"bar"');

				const expectedResult = {
					error: expect.any(DecodeError),
					ok: false,
				} as const;

				expect(result).toStrictEqual(expectedResult);
			});
		});
	});

	describe("object", () => {
		describe("flattened object", () => {
			const decoder = katabami.object({
				bar: katabami.integer(),
				foo: katabami.string(),
			});

			describe("decode value", () => {
				test("success", () => {
					const result = decoder.decodeValue({
						bar: 1,
						foo: "foo",
					});

					const expectedResult = {
						ok: true,
						value: { bar: 1, foo: "foo" },
					} as const;

					expect(result).toStrictEqual(expectedResult);
				});

				test("fail", () => {
					const result = decoder.decodeValue({
						bar: "1",
						foo: "foo",
					});

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					expect(result).toStrictEqual(expectedResult);
				});
			});

			describe("decode string", () => {
				test("success", () => {
					const result = decoder.decodeString('{"bar":1,"foo":"foo"}');

					const expectedResult = {
						ok: true,
						value: { bar: 1, foo: "foo" },
					} as const;

					expect(result).toStrictEqual(expectedResult);
				});

				test("fail", () => {
					const result = decoder.decodeString('{"bar":"1","foo":"foo"}');

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					expect(result).toStrictEqual(expectedResult);
				});
			});
		});
	});

	describe("nested object", () => {
		const decoder = katabami.object({
			bar: katabami.object({
				foo: katabami.string(),
			}),
		});

		describe("decode value", () => {
			test("success", () => {
				const result = decoder.decodeValue({
					bar: {
						foo: "foo",
					},
				});

				const expectedResult = {
					ok: true,
					value: { bar: { foo: "foo" } },
				} as const;

				expect(result).toStrictEqual(expectedResult);
			});

			test("fail", () => {
				const result = decoder.decodeValue({
					bar: "1",
					foo: "foo",
				});

				const expectedResult = {
					error: expect.any(DecodeError),
					ok: false,
				} as const;

				expect(result).toStrictEqual(expectedResult);
			});
		});

		describe("decode string", () => {
			test("success", () => {
				const result = decoder.decodeString('{"bar":{"foo":"foo"}}');

				const expectedResult = {
					ok: true,
					value: { bar: { foo: "foo" } },
				} as const;

				expect(result).toStrictEqual(expectedResult);
			});

			test("fail", () => {
				const result = decoder.decodeString('{"bar":"1","foo":"foo"}');

				const expectedResult = {
					error: expect.any(DecodeError),
					ok: false,
				} as const;

				expect(result).toStrictEqual(expectedResult);
			});
		});
	});

	describe("string", () => {
		const decoder = katabami.string();

		describe("decode value", () => {
			test("success", () => {
				const result = decoder.decodeValue("foo");

				const expectedResult = { ok: true, value: "foo" } as const;

				expect(result).toStrictEqual(expectedResult);
			});

			test("fail", () => {
				const result = decoder.decodeValue(true);

				const expectedResult = {
					error: expect.any(DecodeError),
					ok: false,
				} as const;

				expect(result).toStrictEqual(expectedResult);
			});
		});

		describe("decode string", () => {
			test("success", () => {
				const result = decoder.decodeString('"foo"');

				const expectedResult = { ok: true, value: "foo" } as const;

				expect(result).toStrictEqual(expectedResult);
			});

			test("fail", () => {
				const result = decoder.decodeString("true");

				const expectedResult = {
					error: expect.any(DecodeError),
					ok: false,
				} as const;

				expect(result).toStrictEqual(expectedResult);
			});
		});
	});

	describe("tuple", () => {
		const decoder = katabami.tuple(katabami.string(), katabami.integer());

		describe("decode value", () => {
			test("success", () => {
				const result = decoder.decodeValue(["foo", 1]);

				const expectedResult = { ok: true, value: ["foo", 1] } satisfies {
					ok: true;
					value: ["foo", number];
				};

				expect(result).toStrictEqual(expectedResult);
			});

			test("fail", () => {
				const result = decoder.decodeValue([true, 1]);

				const expectedResult = {
					error: expect.any(DecodeError),
					ok: false,
				} as const;

				expect(result).toStrictEqual(expectedResult);
			});
		});

		describe("decode string", () => {
			test("success", () => {
				const result = decoder.decodeString('["foo",1]');

				const expectedResult = { ok: true, value: ["foo", 1] } satisfies {
					ok: true;
					value: ["foo", number];
				};

				expect(result).toStrictEqual(expectedResult);
			});

			test("fail", () => {
				const result = decoder.decodeString("[true,1]");

				const expectedResult = {
					error: expect.any(DecodeError),
					ok: false,
				} as const;

				expect(result).toStrictEqual(expectedResult);
			});
		});
	});

	describe("union", () => {
		const decoder = katabami.union(katabami.string(), katabami.integer());

		describe("decode value", () => {
			test("success", () => {
				const result = decoder.decodeValue("foo");

				const expectedResult = { ok: true, value: "foo" } as const;

				expect(result).toStrictEqual(expectedResult);
			});

			test("fail", async () => {
				const result = decoder.decodeValue(true);

				const expectedResult = {
					error: expect.any(DecodeError),
					ok: false,
				} as const;

				expect(result).toStrictEqual(expectedResult);
			});
		});

		describe("decode string", () => {
			test("success", () => {
				const result = decoder.decodeString('"foo"');

				const expectedResult = { ok: true, value: "foo" } as const;

				expect(result).toStrictEqual(expectedResult);
			});

			test("fail", () => {
				const result = decoder.decodeString("true");

				const expectedResult = {
					error: expect.any(DecodeError),
					ok: false,
				} as const;

				expect(result).toStrictEqual(expectedResult);
			});
		});
	});
});
