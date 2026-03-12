import { describe, expect, test } from "vitest";

import { DecodeError, type Decoder, katabami } from "../src/index.js";

describe("decoder", () => {
	describe("andMap", () => {
		describe("sync", () => {
			const decoder = katabami.string().andMap((value) => Number(value));

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
			const decoder = katabami
				.string()
				.andMap(
					(value) => new Promise<number>((resolve) => resolve(Number(value))),
				);

			describe("decode value", () => {
				test("success", async () => {
					const result = await decoder.decodeValue("1");

					const expectedResult = { ok: true, value: 1 } as const;

					expect(result).toStrictEqual(expectedResult);
				});

				test("fail", async () => {
					const result = await decoder.decodeValue(1);

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					expect(result).toStrictEqual(expectedResult);
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

	describe("andThen", () => {
		describe("sync", () => {
			const decoder = katabami.float().andThen(() => katabami.integer());

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
			const decoder = katabami
				.float()
				.andThen(
					() =>
						new Promise<Decoder<number>>((resolve) =>
							resolve(katabami.integer()),
						),
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

	describe("array", () => {
		describe("sync", () => {
			const decoder = katabami.array(katabami.string());

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
			const decoder = katabami.array(
				katabami.string().andThen((value) => {
					return new Promise<Decoder<string, never>>((resolve) =>
						resolve(katabami.succeed(value)),
					);
				}),
			);

			describe("decode value", () => {
				test("success", async () => {
					const result = await decoder.decodeValue(["foo", "bar"]);

					const expectedResult = { ok: true, value: ["foo", "bar"] };

					expect(result).toStrictEqual(expectedResult);
				});

				test("fail", async () => {
					const result = await decoder.decodeValue([true, 1]);

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					expect(result).toStrictEqual(expectedResult);
				});
			});

			describe("decode string", () => {
				test("success", async () => {
					const result = await decoder.decodeString('["foo","bar"]');

					const expectedResult = { ok: true, value: ["foo", "bar"] };

					expect(result).toStrictEqual(expectedResult);
				});

				test("fail", async () => {
					const result = await decoder.decodeString("[true,1]");

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					expect(result).toStrictEqual(expectedResult);
				});
			});
		});
	});

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
			describe("sync", () => {
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

			describe("async", () => {
				const decoder = katabami
					.object({
						bar: katabami.integer(),
						foo: katabami.string(),
					})
					.andThen((value) => {
						return new Promise<Decoder<typeof value, never>>((resolve) =>
							resolve(katabami.succeed(value)),
						);
					});

				describe("decode value", () => {
					test("success", async () => {
						const result = await decoder.decodeValue({
							bar: 1,
							foo: "foo",
						});

						const expectedResult = {
							ok: true,
							value: { bar: 1, foo: "foo" },
						} as const;

						expect(result).toStrictEqual(expectedResult);
					});

					test("fail", async () => {
						const result = await decoder.decodeValue({
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
					test("success", async () => {
						const result = await decoder.decodeString('{"bar":1,"foo":"foo"}');

						const expectedResult = {
							ok: true,
							value: { bar: 1, foo: "foo" },
						} as const;

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

		describe("nested object", () => {
			describe("sync", () => {
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

			describe("async", () => {
				const decoder = katabami.object({
					bar: katabami.object({
						foo: katabami.string().andThen((value) => {
							return new Promise<Decoder<typeof value, never>>((resolve) =>
								resolve(katabami.succeed(value)),
							);
						}),
					}),
				});

				describe("decode value", () => {
					test("success", async () => {
						const result = await decoder.decodeValue({
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

					test("fail", async () => {
						const result = await decoder.decodeValue({
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
					test("success", async () => {
						const result = await decoder.decodeString('{"bar":{"foo":"foo"}}');

						const expectedResult = {
							ok: true,
							value: { bar: { foo: "foo" } },
						} as const;

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
		describe("sync", () => {
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

		describe("async", () => {
			const decoder = katabami.tuple(
				katabami.string(),
				katabami.integer().andThen((value) => {
					return new Promise<Decoder<number, never>>((resolve) =>
						resolve(katabami.succeed(value)),
					);
				}),
			);

			describe("decode value", () => {
				test("success", async () => {
					const result = await decoder.decodeValue(["foo", 1]);

					const expectedResult = { ok: true, value: ["foo", 1] } satisfies {
						ok: true;
						value: ["foo", number];
					};

					expect(result).toStrictEqual(expectedResult);
				});

				test("fail", async () => {
					const result = await decoder.decodeValue([true, 1]);

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					expect(result).toStrictEqual(expectedResult);
				});
			});

			describe("decode string", () => {
				test("success", async () => {
					const result = await decoder.decodeString('["foo",1]');

					const expectedResult = { ok: true, value: ["foo", 1] } satisfies {
						ok: true;
						value: ["foo", number];
					};

					expect(result).toStrictEqual(expectedResult);
				});

				test("fail", async () => {
					const result = await decoder.decodeString("[true,1]");

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					expect(result).toStrictEqual(expectedResult);
				});
			});
		});
	});

	describe("union", () => {
		describe("sync", () => {
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

		describe("async", () => {
			const decoder = katabami.union(
				katabami.string(),
				katabami.integer().andThen((value) => {
					return new Promise<Decoder<number, never>>((resolve) =>
						resolve(katabami.succeed(value)),
					);
				}),
			);

			describe("decode value", () => {
				test("success", async () => {
					const result = await decoder.decodeValue("foo");

					const expectedResult = { ok: true, value: "foo" } as const;

					expect(result).toStrictEqual(expectedResult);
				});

				test("fail", async () => {
					const result = await decoder.decodeValue(true);

					const expectedResult = {
						error: expect.any(DecodeError),
						ok: false,
					} as const;

					expect(result).toStrictEqual(expectedResult);
				});
			});

			describe("decode string", () => {
				test("success", async () => {
					const result = await decoder.decodeString('"foo"');

					const expectedResult = { ok: true, value: "foo" } as const;

					expect(result).toStrictEqual(expectedResult);
				});

				test("fail", async () => {
					const result = await decoder.decodeString("true");

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
