import { describe, expect, test } from "vitest";
import {
	array,
	at,
	boolean,
	constant,
	DecodeError,
	type Decoder,
	field,
	float,
	index,
	int,
	map,
	nullable,
	object,
	oneOrMore,
	record,
	string,
	succeed,
	tuple,
	union,
} from "../src";

describe("decoder", () => {
	describe("array", () => {
		describe("sync", () => {
			const decoder = array(string());

			describe("decode value", () => {
				test("success", () => {
					const result = decoder.decodeValue(["foo", "bar"]);

					const expectedResult = { ok: true, value: ["foo", "bar"] };

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
					const result = decoder.decodeString('["foo","bar"]');

					const expectedResult = { ok: true, value: ["foo", "bar"] };

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

		describe("async", () => {
			const decoder = array(
				string().andThen((value) => {
					return new Promise<Decoder<string, never>>((resolve) =>
						resolve(succeed(value)),
					);
				}),
			);

			describe("decode value", () => {
				test("success", async () => {
					const result = decoder.decodeValue(["foo", "bar"]);

					const expectedResult = { ok: true, value: ["foo", "bar"] };

					await expect(result).resolves.toStrictEqual(expectedResult);
				});

				test("fail", async () => {
					const result = decoder.decodeValue([true, 1]);

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					await expect(result).resolves.toStrictEqual(expectedResult);
				});
			});

			describe("decode string", () => {
				test("success", async () => {
					const result = decoder.decodeString('["foo","bar"]');

					const expectedResult = { ok: true, value: ["foo", "bar"] };

					await expect(result).resolves.toStrictEqual(expectedResult);
				});

				test("fail", async () => {
					const result = decoder.decodeString("[true,1]");

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					await expect(result).resolves.toStrictEqual(expectedResult);
				});
			});
		});
	});

	describe("at", () => {
		describe("sync", () => {
			const decoder = at(["foo", "bar"], string());

			describe("decode value", () => {
				test("success", () => {
					const result = decoder.decodeValue({ foo: { bar: "baz" } });

					const expectedResult = {
						ok: true,
						value: "baz",
					} as const;

					expect(result).toStrictEqual(expectedResult);
				});

				test("fail", () => {
					const result = decoder.decodeValue({ foo: { baz: "baz" } });

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					expect(result).toStrictEqual(expectedResult);
				});
			});

			describe("decode string", () => {
				test("success", () => {
					const result = decoder.decodeString('{"foo":{"bar":"baz"}}');

					const expectedResult = {
						ok: true,
						value: "baz",
					} as const;

					expect(result).toStrictEqual(expectedResult);
				});

				test("fail", () => {
					const result = decoder.decodeString('{"foo":{"baz":"baz"}}');

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					expect(result).toStrictEqual(expectedResult);
				});
			});
		});

		describe("async", () => {
			const decoder = at(
				["foo", "bar"],
				string().andThen((value) => {
					return new Promise<Decoder<string, never>>((resolve) =>
						resolve(succeed(value)),
					);
				}),
			);

			describe("decode value", () => {
				test("success", async () => {
					const result = decoder.decodeValue({ foo: { bar: "baz" } });

					const expectedResult = {
						ok: true,
						value: "baz",
					} as const;

					await expect(result).resolves.toStrictEqual(expectedResult);
				});

				test("fail", async () => {
					const result = decoder.decodeValue({ foo: { baz: "baz" } });

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					await expect(result).resolves.toStrictEqual(expectedResult);
				});
			});

			describe("decode string", () => {
				test("success", async () => {
					const result = decoder.decodeString('{"foo":{"bar":"baz"}}');

					const expectedResult = {
						ok: true,
						value: "baz",
					} as const;

					await expect(result).resolves.toStrictEqual(expectedResult);
				});

				test("fail", async () => {
					const result = decoder.decodeString('{"foo":{"baz":"baz"}}');

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					await expect(result).resolves.toStrictEqual(expectedResult);
				});
			});
		});
	});

	describe("boolean", () => {
		const decoder = boolean();

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
				const result = decoder.decodeString('"foo"');

				const expectedResult = {
					error: expect.any(DecodeError),
					ok: false,
				} as const;

				expect(result).toStrictEqual(expectedResult);
			});
		});
	});

	describe("constant", () => {
		describe("string", () => {
			const decoder = constant("foo");

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

		describe("null", () => {
			const decoder = constant(null);

			describe("decode value", () => {
				test("success", () => {
					const result = decoder.decodeValue(null);

					const expectedResult = { ok: true, value: null } as const;

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
					const result = decoder.decodeString("null");

					const expectedResult = { ok: true, value: null } as const;

					expect(result).toStrictEqual(expectedResult);
				});

				test("fail", () => {
					const result = decoder.decodeString('"foo"');

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					expect(result).toStrictEqual(expectedResult);
				});
			});
		});
	});

	describe("field", () => {
		describe("sync", () => {
			const decoder = field("foo", string());

			describe("decode value", () => {
				test("success", () => {
					const result = decoder.decodeValue({ foo: "foo" });

					const expectedResult = {
						ok: true,
						value: "foo",
					} as const;

					expect(result).toStrictEqual(expectedResult);
				});

				test("fail", () => {
					const result = decoder.decodeValue({ bar: "bar" });

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					expect(result).toStrictEqual(expectedResult);
				});
			});

			describe("decode string", () => {
				test("success", () => {
					const result = decoder.decodeString('{"foo":"foo"}');

					const expectedResult = {
						ok: true,
						value: "foo",
					} as const;

					expect(result).toStrictEqual(expectedResult);
				});

				test("fail", () => {
					const result = decoder.decodeString('{"bar":"bar"}');

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					expect(result).toStrictEqual(expectedResult);
				});
			});
		});

		describe("async", () => {
			const decoder = object({
				bar: int(),
				foo: string(),
			}).andThen((value) => {
				return new Promise<Decoder<typeof value, never>>((resolve) =>
					resolve(succeed(value)),
				);
			});

			describe("decode value", () => {
				test("success", async () => {
					const result = decoder.decodeValue({
						bar: 1,
						foo: "foo",
					});

					const expectedResult = {
						ok: true,
						value: { bar: 1, foo: "foo" },
					} as const;

					await expect(result).resolves.toStrictEqual(expectedResult);
				});

				test("fail", async () => {
					const result = decoder.decodeValue({
						bar: "1",
						foo: "foo",
					});

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					await expect(result).resolves.toStrictEqual(expectedResult);
				});
			});

			describe("decode string", () => {
				test("success", async () => {
					const result = decoder.decodeString('{"bar":1,"foo":"foo"}');

					const expectedResult = {
						ok: true,
						value: { bar: 1, foo: "foo" },
					} as const;

					await expect(result).resolves.toStrictEqual(expectedResult);
				});

				test("fail", async () => {
					const result = await decoder.decodeString('{"bar":"1","foo":"foo"}');

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					expect(result).toStrictEqual(expectedResult);
				});
			});
		});
	});

	describe("index", () => {
		describe("sync", () => {
			const decoder = index(1, string());

			describe("decode value", () => {
				test("success", () => {
					const result = decoder.decodeValue(["foo", "bar"]);

					const expectedResult = {
						ok: true,
						value: "bar",
					} as const;

					expect(result).toStrictEqual(expectedResult);
				});

				test("fail", () => {
					const result = decoder.decodeValue(["foo"]);

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					expect(result).toStrictEqual(expectedResult);
				});
			});

			describe("decode string", () => {
				test("success", () => {
					const result = decoder.decodeString('["foo","bar"]');

					const expectedResult = {
						ok: true,
						value: "bar",
					} as const;

					expect(result).toStrictEqual(expectedResult);
				});

				test("fail", () => {
					const result = decoder.decodeString('["foo"]');

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					expect(result).toStrictEqual(expectedResult);
				});
			});
		});

		describe("async", () => {
			const decoder = object({
				bar: int(),
				foo: string(),
			}).andThen((value) => {
				return new Promise<Decoder<typeof value, never>>((resolve) =>
					resolve(succeed(value)),
				);
			});

			describe("decode value", () => {
				test("success", async () => {
					const result = decoder.decodeValue({
						bar: 1,
						foo: "foo",
					});

					const expectedResult = {
						ok: true,
						value: { bar: 1, foo: "foo" },
					} as const;

					await expect(result).resolves.toStrictEqual(expectedResult);
				});

				test("fail", async () => {
					const result = decoder.decodeValue({
						bar: "1",
						foo: "foo",
					});

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					await expect(result).resolves.toStrictEqual(expectedResult);
				});
			});

			describe("decode string", () => {
				test("success", async () => {
					const result = decoder.decodeString('{"bar":1,"foo":"foo"}');

					const expectedResult = {
						ok: true,
						value: { bar: 1, foo: "foo" },
					} as const;

					await expect(result).resolves.toStrictEqual(expectedResult);
				});

				test("fail", async () => {
					const result = decoder.decodeString('{"bar":"1","foo":"foo"}');

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					await expect(result).resolves.toStrictEqual(expectedResult);
				});
			});
		});
	});

	describe("map", () => {
		describe("sync", () => {
			const decoder = map(
				(foo, bar) => ({ bar, foo }),
				field("foo", string()),
				field("bar", int()),
			);

			describe("decode value", () => {
				test("success", () => {
					const result = decoder.decodeValue({ bar: 1, foo: "foo" });

					const expectedResult = { ok: true, value: { bar: 1, foo: "foo" } };

					expect(result).toStrictEqual(expectedResult);
				});

				test("fail", () => {
					const result = decoder.decodeValue({ bar: "1", foo: "foo" });

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

					const expectedResult = { ok: true, value: { bar: 1, foo: "foo" } };

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

		describe("async", () => {
			describe("async decoder", () => {
				const decoder = map(
					(foo, bar) => ({ bar, foo }),
					field("foo", string()),
					field("bar", int()).andThen((value) => {
						return new Promise<Decoder<number, never>>((resolve) =>
							resolve(succeed(value)),
						);
					}),
				);

				describe("decode value", () => {
					test("success", async () => {
						const result = decoder.decodeValue({ bar: 1, foo: "foo" });

						const expectedResult = { ok: true, value: { bar: 1, foo: "foo" } };

						await expect(result).resolves.toStrictEqual(expectedResult);
					});

					test("fail", async () => {
						const result = decoder.decodeValue({ bar: "1", foo: "foo" });

						const expectedResult = {
							error: expect.any(DecodeError),
							ok: false,
						} as const;

						await expect(result).resolves.toStrictEqual(expectedResult);
					});
				});

				describe("decode string", () => {
					test("success", async () => {
						const result = decoder.decodeString('{"bar":1,"foo":"foo"}');

						const expectedResult = { ok: true, value: { bar: 1, foo: "foo" } };

						await expect(result).resolves.toStrictEqual(expectedResult);
					});

					test("fail", async () => {
						const result = decoder.decodeString('{"bar":"1","foo":"foo"}');

						const expectedResult = {
							error: expect.any(DecodeError),
							ok: false,
						} as const;

						await expect(result).resolves.toStrictEqual(expectedResult);
					});
				});
			});

			describe("async map function", () => {
				const decoder = map(
					(foo, bar) =>
						new Promise<{ bar: number; foo: string }>((resolve) =>
							resolve({ bar, foo }),
						),
					field("foo", string()),
					field("bar", int()),
				);

				describe("decode value", () => {
					test("success", async () => {
						const result = decoder.decodeValue({ bar: 1, foo: "foo" });

						const expectedResult = { ok: true, value: { bar: 1, foo: "foo" } };

						await expect(result).resolves.toStrictEqual(expectedResult);
					});

					test("fail", async () => {
						const result = decoder.decodeValue({ bar: "1", foo: "foo" });

						const expectedResult = {
							error: expect.any(DecodeError),
							ok: false,
						} as const;

						await expect(result).resolves.toStrictEqual(expectedResult);
					});
				});

				describe("decode string", () => {
					test("success", async () => {
						const result = await decoder.decodeString('{"bar":1,"foo":"foo"}');

						const expectedResult = { ok: true, value: { bar: 1, foo: "foo" } };

						expect(result).toStrictEqual(expectedResult);
					});

					test("fail", async () => {
						const result = await decoder.decodeString(
							'{"bar":"1","foo":"foo"}',
						);

						const expectedResult = {
							error: expect.any(DecodeError),
							ok: false,
						} as const;

						expect(result).toStrictEqual(expectedResult);
					});
				});
			});
		});
	});

	describe("nullable", () => {
		describe("sync", () => {
			const decoder = nullable(string());

			describe("decode value", () => {
				test("success", () => {
					const result = decoder.decodeValue("foo");

					const expectedResult = { ok: true, value: "foo" } as const;

					expect(result).toStrictEqual(expectedResult);
				});

				test("success with null", () => {
					const result = decoder.decodeValue(null);

					const expectedResult = { ok: true, value: null } as const;

					expect(result).toStrictEqual(expectedResult);
				});

				test("fail", () => {
					const result = decoder.decodeValue(1);

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

				test("success with null", () => {
					const result = decoder.decodeString("null");

					const expectedResult = { ok: true, value: null } as const;

					expect(result).toStrictEqual(expectedResult);
				});

				test("fail", () => {
					const result = decoder.decodeString("1");

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					expect(result).toStrictEqual(expectedResult);
				});
			});
		});

		describe("async", () => {
			const decoder = nullable(
				string().andThen((value) => {
					return new Promise<Decoder<string, never>>((resolve) =>
						resolve(succeed(value)),
					);
				}),
			);

			describe("decode value", () => {
				test("success", async () => {
					const result = decoder.decodeValue("foo");

					const expectedResult = { ok: true, value: "foo" } as const;

					await expect(result).resolves.toStrictEqual(expectedResult);
				});

				test("success with null", async () => {
					const result = decoder.decodeValue(null);

					const expectedResult = { ok: true, value: null } as const;

					await expect(result).resolves.toStrictEqual(expectedResult);
				});

				test("fail", async () => {
					const result = decoder.decodeValue(1);

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					await expect(result).resolves.toStrictEqual(expectedResult);
				});
			});

			describe("decode string", () => {
				test("success", async () => {
					const result = decoder.decodeString('"foo"');

					const expectedResult = { ok: true, value: "foo" } as const;

					await expect(result).resolves.toStrictEqual(expectedResult);
				});

				test("success with null", async () => {
					const result = decoder.decodeString("null");

					const expectedResult = { ok: true, value: null } as const;

					await expect(result).resolves.toStrictEqual(expectedResult);
				});

				test("fail", async () => {
					const result = decoder.decodeString("1");

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					await expect(result).resolves.toStrictEqual(expectedResult);
				});
			});
		});
	});

	describe("object", () => {
		describe("flattened object", () => {
			describe("sync", () => {
				const decoder = object({
					bar: int(),
					foo: string(),
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

			describe("async", () => {
				const decoder = object({
					bar: int(),
					foo: string(),
				}).andThen((value) => {
					return new Promise<Decoder<typeof value, never>>((resolve) =>
						resolve(succeed(value)),
					);
				});

				describe("decode value", () => {
					test("success", async () => {
						const result = decoder.decodeValue({
							bar: 1,
							foo: "foo",
						});

						const expectedResult = {
							ok: true,
							value: { bar: 1, foo: "foo" },
						} as const;

						await expect(result).resolves.toStrictEqual(expectedResult);
					});

					test("fail", async () => {
						const result = decoder.decodeValue({
							bar: "1",
							foo: "foo",
						});

						const expectedResult = {
							error: expect.any(DecodeError),
							ok: false,
						} as const;

						await expect(result).resolves.toStrictEqual(expectedResult);
					});
				});

				describe("decode string", () => {
					test("success", async () => {
						const result = decoder.decodeString('{"bar":1,"foo":"foo"}');

						const expectedResult = {
							ok: true,
							value: { bar: 1, foo: "foo" },
						} as const;

						await expect(result).resolves.toStrictEqual(expectedResult);
					});

					test("fail", async () => {
						const result = await decoder.decodeString(
							'{"bar":"1","foo":"foo"}',
						);

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
			describe("sync", () => {
				const decoder = object({
					bar: object({
						foo: string(),
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

			describe("async", () => {
				const decoder = object({
					bar: object({
						foo: string().andThen((value) => {
							return new Promise<Decoder<typeof value, never>>((resolve) =>
								resolve(succeed(value)),
							);
						}),
					}),
				});

				describe("decode value", () => {
					test("success", async () => {
						const result = decoder.decodeValue({
							bar: {
								foo: "foo",
							},
						});

						const expectedResult = {
							ok: true,
							value: { bar: { foo: "foo" } },
						} as const;

						await expect(result).resolves.toStrictEqual(expectedResult);
					});

					test("fail", async () => {
						const result = decoder.decodeValue({
							bar: "1",
							foo: "foo",
						});

						const expectedResult = {
							error: expect.any(DecodeError),
							ok: false,
						} as const;

						await expect(result).resolves.toStrictEqual(expectedResult);
					});
				});

				describe("decode string", () => {
					test("success", async () => {
						const result = decoder.decodeString('{"bar":{"foo":"foo"}}');

						const expectedResult = {
							ok: true,
							value: { bar: { foo: "foo" } },
						} as const;

						await expect(result).resolves.toStrictEqual(expectedResult);
					});

					test("fail", async () => {
						const result = decoder.decodeString('{"bar":"1","foo":"foo"}');

						const expectedResult = {
							error: expect.any(DecodeError),
							ok: false,
						} as const;

						await expect(result).resolves.toStrictEqual(expectedResult);
					});
				});
			});
		});
	});

	describe("oneOrMore", () => {
		describe("sync", () => {
			const decoder = oneOrMore(string());

			describe("decode value", () => {
				test("success", () => {
					const result = decoder.decodeValue(["foo", "bar"]);

					const expectedResult = { ok: true, value: ["foo", "bar"] };

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

				test("empty", () => {
					const result = decoder.decodeValue([]);

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					expect(result).toStrictEqual(expectedResult);
				});
			});

			describe("decode string", () => {
				test("success", () => {
					const result = decoder.decodeString('["foo","bar"]');

					const expectedResult = { ok: true, value: ["foo", "bar"] };

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

				test("empty", () => {
					const result = decoder.decodeString("[]");

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					expect(result).toStrictEqual(expectedResult);
				});
			});
		});

		describe("async", () => {
			const decoder = oneOrMore(
				string().andThen((value) => {
					return new Promise<Decoder<string, never>>((resolve) =>
						resolve(succeed(value)),
					);
				}),
			);

			describe("decode value", () => {
				test("success", async () => {
					const result = decoder.decodeValue(["foo", "bar"]);

					const expectedResult = { ok: true, value: ["foo", "bar"] };

					await expect(result).resolves.toStrictEqual(expectedResult);
				});

				test("fail", async () => {
					const result = decoder.decodeValue([true, 1]);

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					await expect(result).resolves.toStrictEqual(expectedResult);
				});

				test("empty", async () => {
					const result = decoder.decodeValue([]);

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					await expect(result).resolves.toStrictEqual(expectedResult);
				});
			});

			describe("decode string", () => {
				test("success", async () => {
					const result = decoder.decodeString('["foo","bar"]');

					const expectedResult = { ok: true, value: ["foo", "bar"] };

					await expect(result).resolves.toStrictEqual(expectedResult);
				});

				test("fail", async () => {
					const result = decoder.decodeString("[true,1]");

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					await expect(result).resolves.toStrictEqual(expectedResult);
				});

				test("empty", async () => {
					const result = decoder.decodeString("[]");

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					await expect(result).resolves.toStrictEqual(expectedResult);
				});
			});
		});
	});

	describe("record", () => {
		describe("sync", () => {
			const decoder = record(string());

			describe("decode value", () => {
				test("success", () => {
					const result = decoder.decodeValue({ bar: "bar", foo: "foo" });

					const expectedResult = {
						ok: true,
						value: { bar: "bar", foo: "foo" },
					};

					expect(result).toStrictEqual(expectedResult);
				});

				test("empty record", () => {
					const result = decoder.decodeValue({});

					expect(result).toStrictEqual({ ok: true, value: {} });
				});

				test("fail", () => {
					const result = decoder.decodeValue({ bar: 1, foo: "foo" });

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					expect(result).toStrictEqual(expectedResult);
				});
			});

			describe("decode string", () => {
				test("success", () => {
					const result = decoder.decodeString('{"bar":"bar","foo":"foo"}');

					const expectedResult = {
						ok: true,
						value: { bar: "bar", foo: "foo" },
					};

					expect(result).toStrictEqual(expectedResult);
				});

				test("fail", () => {
					const result = decoder.decodeString('{"bar":1,"foo":"foo"}');

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					expect(result).toStrictEqual(expectedResult);
				});
			});
		});

		describe("async", () => {
			const decoder = record(
				string().andThen((value) => {
					return new Promise<Decoder<string, never>>((resolve) =>
						resolve(succeed(value)),
					);
				}),
			);

			describe("decode value", () => {
				test("success", async () => {
					const result = decoder.decodeValue({ bar: "bar", foo: "foo" });

					const expectedResult = {
						ok: true,
						value: { bar: "bar", foo: "foo" },
					};

					await expect(result).resolves.toStrictEqual(expectedResult);
				});

				test("fail", async () => {
					const result = decoder.decodeValue({ bar: 1, foo: "foo" });

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					await expect(result).resolves.toStrictEqual(expectedResult);
				});
			});

			describe("decode string", () => {
				test("success", async () => {
					const result = decoder.decodeString('{"bar":"bar","foo":"foo"}');

					const expectedResult = {
						ok: true,
						value: { bar: "bar", foo: "foo" },
					};

					await expect(result).resolves.toStrictEqual(expectedResult);
				});

				test("fail", async () => {
					const result = decoder.decodeString('{"bar":1,"foo":"foo"}');

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					await expect(result).resolves.toStrictEqual(expectedResult);
				});
			});
		});
	});

	describe("string", () => {
		const decoder = string();

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
		describe("sync", () => {
			const decoder = tuple(string(), int());

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

		describe("async", () => {
			const decoder = tuple(
				string(),
				int().andThen((value) => {
					return new Promise<Decoder<number, never>>((resolve) =>
						resolve(succeed(value)),
					);
				}),
			);

			describe("decode value", () => {
				test("success", async () => {
					const result = decoder.decodeValue(["foo", 1]);

					const expectedResult = { ok: true, value: ["foo", 1] } satisfies {
						ok: true;
						value: ["foo", number];
					};

					await expect(result).resolves.toStrictEqual(expectedResult);
				});

				test("fail", async () => {
					const result = decoder.decodeValue([true, 1]);

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					await expect(result).resolves.toStrictEqual(expectedResult);
				});
			});

			describe("decode string", () => {
				test("success", async () => {
					const result = decoder.decodeString('["foo",1]');

					const expectedResult = { ok: true, value: ["foo", 1] } satisfies {
						ok: true;
						value: ["foo", number];
					};

					await expect(result).resolves.toStrictEqual(expectedResult);
				});

				test("fail", async () => {
					const result = decoder.decodeString("[true,1]");

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					await expect(result).resolves.toStrictEqual(expectedResult);
				});
			});
		});
	});

	describe("union", () => {
		describe("sync", () => {
			const decoder = union(string(), int());

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

		describe("async", () => {
			const decoder = union(
				string(),
				int().andThen((value) => {
					return new Promise<Decoder<number, never>>((resolve) =>
						resolve(succeed(value)),
					);
				}),
			);

			describe("decode value", () => {
				test("success", async () => {
					const result = decoder.decodeValue("foo");

					const expectedResult = { ok: true, value: "foo" } as const;

					await expect(result).resolves.toStrictEqual(expectedResult);
				});

				test("fail", async () => {
					const result = decoder.decodeValue(true);

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					await expect(result).resolves.toStrictEqual(expectedResult);
				});
			});

			describe("decode string", () => {
				test("success", async () => {
					const result = decoder.decodeString('"foo"');

					const expectedResult = { ok: true, value: "foo" } as const;

					await expect(result).resolves.toStrictEqual(expectedResult);
				});

				test("fail", async () => {
					const result = decoder.decodeString("true");

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					await expect(result).resolves.toStrictEqual(expectedResult);
				});
			});
		});
	});

	describe("decoder method", () => {
		describe("andThen", () => {
			describe("sync", () => {
				const decoder = float().andThen(() => int());

				describe("decode value", () => {
					test("success", () => {
						const result = decoder.decodeValue(1);

						const expectedResult = { ok: true, value: 1 } as const;

						expect(result).toStrictEqual(expectedResult);
					});

					test("fail", () => {
						const result = decoder.decodeValue(1.5);

						const expectedResult = {
							error: expect.any(DecodeError),
							ok: false,
						} as const;

						expect(result).toStrictEqual(expectedResult);
					});
				});

				describe("decode string", () => {
					test("success", () => {
						const result = decoder.decodeString("1");

						const expectedResult = { ok: true, value: 1 } as const;

						expect(result).toStrictEqual(expectedResult);
					});

					test("fail", () => {
						const result = decoder.decodeString("1.5");

						const expectedResult = {
							error: expect.any(DecodeError),
							ok: false,
						} as const;

						expect(result).toStrictEqual(expectedResult);
					});
				});
			});

			describe("async", () => {
				const decoder = float().andThen(
					() => new Promise<Decoder<number>>((resolve) => resolve(int())),
				);

				describe("decode value", () => {
					test("success", async () => {
						const result = await decoder.decodeValue(1);

						const expectedResult = { ok: true, value: 1 } as const;

						expect(result).toStrictEqual(expectedResult);
					});

					test("fail", async () => {
						const result = await decoder.decodeValue(1.5);

						const expectedResult = {
							error: expect.any(DecodeError),
							ok: false,
						} as const;

						expect(result).toStrictEqual(expectedResult);
					});
				});

				describe("decode string", () => {
					test("success", async () => {
						const result = await decoder.decodeString("1");

						const expectedResult = { ok: true, value: 1 } as const;

						expect(result).toStrictEqual(expectedResult);
					});

					test("fail", async () => {
						const result = await decoder.decodeString("1.5");

						const expectedResult = {
							error: expect.any(DecodeError),
							ok: false,
						} as const;

						expect(result).toStrictEqual(expectedResult);
					});
				});
			});
		});

		describe("map", () => {
			describe("sync", () => {
				const decoder = string().map((value) => Number(value));

				describe("decode value", () => {
					test("success", () => {
						const result = decoder.decodeValue("1");

						const expectedResult = { ok: true, value: 1 } as const;

						expect(result).toStrictEqual(expectedResult);
					});

					test("fail", () => {
						const result = decoder.decodeValue(1);

						const expectedResult = {
							error: expect.any(DecodeError),
							ok: false,
						} as const;

						expect(result).toStrictEqual(expectedResult);
					});
				});

				describe("decode string", () => {
					test("success", () => {
						const result = decoder.decodeString('"1"');

						const expectedResult = { ok: true, value: 1 } as const;

						expect(result).toStrictEqual(expectedResult);
					});

					test("fail", () => {
						const result = decoder.decodeString("1");

						const expectedResult = {
							error: expect.any(DecodeError),
							ok: false,
						} as const;

						expect(result).toStrictEqual(expectedResult);
					});
				});
			});

			describe("async", () => {
				const decoder = string().map(
					(value) => new Promise<number>((resolve) => resolve(Number(value))),
				);

				describe("decode value", () => {
					test("success", async () => {
						const result = decoder.decodeValue("1");

						const expectedResult = { ok: true, value: 1 } as const;

						await expect(result).resolves.toStrictEqual(expectedResult);
					});

					test("fail", async () => {
						const result = decoder.decodeValue(1);

						const expectedResult = {
							error: expect.any(DecodeError),
							ok: false,
						} as const;

						await expect(result).resolves.toStrictEqual(expectedResult);
					});
				});

				describe("decode string", () => {
					test("success", async () => {
						const result = await decoder.decodeString('"1"');

						const expectedResult = { ok: true, value: 1 } as const;

						expect(result).toStrictEqual(expectedResult);
					});

					test("fail", async () => {
						const result = await decoder.decodeString("1");

						const expectedResult = {
							error: expect.any(DecodeError),
							ok: false,
						} as const;

						expect(result).toStrictEqual(expectedResult);
					});
				});
			});
		});
	});
});
