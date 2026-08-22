<p align="center">
  <picture>
    <source
      media="(prefers-color-scheme: dark)"
      srcset="./assets/logo-dark.svg"
    />
    <source
      media="(prefers-color-scheme: light)"
      srcset="./assets/logo-light.svg"
    />
    <img
      src="./assets/logo-light.svg"
      alt="Katabami"
      width="300"
    />
  </picture>
</p>

[![CI](https://github.com/hallelujahdrive/katabami/actions/workflows/ci.yml/badge.svg)](https://github.com/hallelujahdrive/katabami/actions/workflows/ci.yml)

Katabami is a TypeScript JSON decoding library.

Compose small decoders into a larger one, then turn unknown JSON into a typed
`Result`. Failures keep a nested issue tree, so you can report errors at the
same shape as the input. Decoders also implement
[Standard Schema](https://standardschema.dev/).

## Motivation

Katabami follows [elm/json](https://package.elm-lang.org/packages/elm/json/latest/):
a small set of type-level decoders, composed into larger ones. There is no
constraint DSL (`min`, `email`, `regex`, and so on). The primitive building
blocks are the types themselves (`string`, `int`, `object`, `union`, …).

The job is to take serialized data from a boundary (HTTP, storage, a worker)
and recover typed values on this side. That is decoding, not validation.

A validator asks whether a value is acceptable and usually leaves it as
`unknown` or the same runtime shape. A decoder answers a different question:
given untyped input, can it be turned into this type? Success yields a value
the type system can trust; failure yields issues that explain why it could
not.

Katabami is a decoder library.

## Features

- **A minimal type DSL, in the spirit of elm/json.** The combinators are the
  types themselves (`string`, `int`, `object`, `union`, …). You compose those
  into the shape you want to recover. There is no separate constraint language.
- **Types flow both ways.** `k.Infer` reads the decoded type off a
  decoder. The same combinators also take a generic, so you can start from a
  type and build a decoder that must match it.

```ts
import * as k from "katabami";

const fromDecoder = k.object({
	age: k.int(),
	name: k.string(),
});

type User = k.Infer<typeof fromDecoder>;
// { age: number; name: string }

const fromType = k.object<User>({
	age: k.int(),
	name: k.string(),
});
```

- **Async and sync compose the same way.** A decoder that returns a `Promise`
  (`map`, `andThen`, `lazy`) nests inside `object`, `array`, and the rest
  exactly like a synchronous one. Decoding still goes through `decodeValue` /
  `decodeString`; the result is a `Promise` only when the decoder is async.
- **Issues follow the value’s structure.** Decode failures are not a flat list
  first. `issues` is a nested object you can read like the input:
  `issues.user?.address?.zip`. `getIssueMessage` pulls the message off any
  node.

```ts
import * as k from "katabami";

const decoder = k.object({
	user: k.object({
		age: k.int(),
		name: k.string(),
	}),
});

const result = decoder.decodeValue({ user: { age: "20", name: "Ada" } });

if (!result.ok) {
	k.getIssueMessage(result.issues.user?.age)?.format();
	// "Expected number, but received string."
}
```

- **[Standard Schema](https://standardschema.dev/) compatible.** Every decoder
  implements Standard Schema v1 (`vendor: "katabami"`), so it works with any
  Standard Schema consumer.

## Packages

This repository is a pnpm workspace:

| Package | Description |
| --- | --- |
| [`katabami`](packages/katabami) | Core decoders, issues, and Standard Schema |
| [`@katabami/json-schema`](packages/json-schema) | JSON Schema generation and Standard JSON Schema |
| [`@katabami/i18next`](packages/i18next) | i18next message formatting (`en` / `ja`) |

## Install

```sh
pnpm add katabami
# npm install katabami
```

Optional integrations:

```sh
pnpm add @katabami/json-schema
pnpm add @katabami/i18next i18next
```

## Quick start

```ts
import * as k from "katabami";

const user = k.object({
	age: k.int(),
	name: k.string(),
	tags: k.optional(k.array(k.string())),
});

type User = k.Infer<typeof user>;
// { age: number; name: string; tags: string[] | undefined }

const result = user.decodeValue({ age: 20, name: "Ada" });

if (result.ok) {
	console.log(result.value.name);
} else {
	console.log(k.getIssueMessage(result.issues)?.format());
}
```

`decodeString` parses JSON first, then decodes:

```ts
user.decodeString('{"age":20,"name":"Ada"}');
```

## Decoders

### Primitives

| Decoder | Accepts |
| --- | --- |
| `string()` | `string` |
| `boolean()` | `boolean` |
| `int()` | integers (`Number.isInteger`) |
| `number()` | any `number` |
| `constant(value)` | a literal (`string`, `number`, `boolean`, or `null`) |
| `value()` | anything (typed as `unknown` by default) |
| `succeed(value)` | anything; always returns `value` |
| `failed()` | nothing; always fails |

### Structure

```ts
import * as k from "katabami";

k.array(k.string());
k.oneOrMore(k.string()); // [string, ...string[]]
k.tuple(k.string(), k.int());
k.record(k.string(), k.int()); // Record<string, number>
k.union(k.string(), k.int());
k.nullable(k.string()); // string | null
k.optional(k.string()); // string | undefined (null/undefined → undefined)
```

`object` strips missing/`undefined` properties and keeps `null`:

```ts
import * as k from "katabami";

const decoder = k.object({
	name: k.string(),
	nickname: k.optional(k.string()),
});

decoder.decodeValue({ name: "Ada" });
// { ok: true, value: { name: "Ada" } }
```

### Extraction

Read a nested field without decoding the whole object:

```ts
import * as k from "katabami";

k.field("name", k.string());
k.at(["person", "name"], k.string());
k.index(0, k.int());
```

`at(["person", "name"], string())` is the same as
`field("person", field("name", string()))`.

### Combining values

`map` runs several decoders against the **same** input, then combines the
results. `.map()` on a decoder transforms an already decoded value.

```ts
import * as k from "katabami";

const pair = k.map(
	(foo, bar) => ({ bar, foo }),
	k.field("foo", k.string()),
	k.field("bar", k.int()),
);

pair.decodeValue({ bar: 1, foo: "x" });
// { ok: true, value: { bar: 1, foo: "x" } }
```

`lazy` defers decoder construction (useful for recursive types):

```ts
import * as k from "katabami";

type Node = { children: Node[]; name: string };

const node: k.Decoder<Node> = k.lazy(() =>
	k.object({
		children: k.array(node),
		name: k.string(),
	}),
);
```

## Results and issues

`decodeValue` / `decodeString` return a `Result`:

```ts
type Result<T, I> =
	| { ok: true; value: T }
	| { ok: false; issues: I };
```

Issues are a nested object (or array for unions) that follows the input shape.
`getIssueMessage` reads the message attached to a node:

```ts
import * as k from "katabami";

const decoder = k.object({
	foo: k.object({
		bar: k.string(),
	}),
});

const result = decoder.decodeValue({ foo: { bar: 1 } });

if (!result.ok) {
	k.getIssueMessage(result.issues)?.format();
	// "One or more object properties failed validation."
	k.getIssueMessage(result.issues.foo?.bar)?.format();
	// "Expected string, but received number."
}
```

`unwrapDecodeResult` returns the value, or throws `DecodeError`.
The second argument can be a message string or a formatter; omitted, the
error message is `"Failed to decode"`.

```ts
const value = k.unwrapDecodeResult(
	decoder.decodeValue({ foo: { bar: "ok" } }),
);
```

`flattenIssues` turns that tree into Standard Schema `{ message, path }[]`.
Pass a formatter as the second argument to format messages while flattening.
The flattened list keeps the source issues type, so `unflattenIssues` can
rebuild typed paths without a generic. Messages stay pre-formatted.

```ts
import * as k from "katabami";

const decoder = k.object({
	foo: k.object({
		bar: k.string(),
	}),
});

const result = decoder.decodeValue({ foo: { bar: 1 } });

if (!result.ok) {
	const flattened = k.flattenIssues(result.issues);
	// [
	//   { message: "One or more object properties failed validation.", path: undefined },
	//   { message: "One or more object properties failed validation.", path: ["foo"] },
	//   { message: "Expected string, but received number.", path: ["foo", "bar"] },
	// ]

	const restored = k.unflattenIssues(flattened);
	k.getIssueMessage(restored)?.format();
	// "One or more object properties failed validation."
	k.getIssueMessage(restored.foo?.bar)?.format();
	// "Expected string, but received number."
	k.getIssueMessage(restored.foo?.bar)?.message;
	// already a formatted string
}
```

`serializeDecodeResult` / `deserializeDecodeResult` apply that to a whole `Result`.
Success is passed through; failure issues are flattened so the value is JSON-safe.
After `JSON.parse`, pass `typeof decoder` to restore typed paths.

```ts
import * as k from "katabami";

const decoder = k.object({
	foo: k.object({
		bar: k.string(),
	}),
});

const result = decoder.decodeValue({ foo: { bar: 1 } });
const serialized = k.serializeDecodeResult(result);
const parsed = JSON.parse(JSON.stringify(serialized));
const restored = k.deserializeDecodeResult<typeof decoder>(parsed);

if (!restored.ok) {
	k.getIssueMessage(restored.issues.foo?.bar)?.format();
	// "Expected string, but received number."
}
```

`unflattenIssues` also accepts Standard Schema `PathSegment` objects (`{ key }`):

```ts
import * as k from "katabami";

const restored = k.unflattenIssues([
	{ message: "root failed", path: undefined },
	{ message: "nested failed", path: [{ key: "foo" }] },
]);

k.getIssueMessage(restored.foo)?.format();
// "nested failed"
```

Custom issues use `createIssues`:

```ts
import * as k from "katabami";

const decoder = k.string().catch(() => ({
	issues: k.createIssues("custom", "Custom issue"),
	ok: false,
}));
```

`catch` can also recover by returning `{ ok: true, value }`.

## Decoder methods

| Method | Purpose |
| --- | --- |
| `decodeValue(value)` | Decode an unknown value |
| `decodeString(json)` | `JSON.parse`, then decode |
| `map(fn)` | Transform a successful value |
| `andThen(fn)` | Continue with another decoder |
| `catch(fn)` | Recover or remap issues |
| `getSchema()` | Accepted-value schema for plugins |

```ts
import * as k from "katabami";

const port = katabami
	.string()
	.map(Number)
	.andThen((n) => (Number.isInteger(n) ? k.succeed(n) : k.failed()));
```

## Async decoding

If `map`, `andThen`, or `lazy` returns a `Promise`, the decoder becomes async:
`decodeValue` / `decodeString` return `Promise<Result<...>>`.

```ts
import * as k from "katabami";

const decoder = k.string().map(async (id) => fetchUser(id));

const result = await decoder.decodeValue("42");
```

## Standard Schema

Every decoder implements Standard Schema v1 (`vendor: "katabami"`):

```ts
import * as k from "katabami";

const user = k.object({
	age: k.int(),
	name: k.string(),
});

const result = user["~standard"].validate({ age: 20, name: "Ada" });

if (result.issues) {
	console.log(result.issues);
} else {
	console.log(result.value);
}
```

Pass a custom formatter through `libraryOptions`:

```ts
import * as k from "katabami";

const user = k.object({
	age: k.int(),
	name: k.string(),
});

user["~standard"].validate(input, {
	libraryOptions: { formatter },
});
```

## JSON Schema

`@katabami/json-schema` converts a decoder (or `getSchema()` output) to JSON
Schema. Targets: `draft-2020-12` (default), `draft-07`, `openapi-3.0`.
`toStandardJsonSchema` implements
[Standard JSON Schema](https://standardschema.dev/json-schema).

```ts
import * as k from "katabami";
import { toJsonSchema, toStandardJsonSchema } from "@katabami/json-schema";

const decoder = k.object({
	age: k.int(),
	name: k.optional(k.string()),
});

toJsonSchema(decoder);
// {
//   $schema: "https://json-schema.org/draft/2020-12/schema",
//   type: "object",
//   properties: { age: { type: "integer" }, name: { type: ["string", "null"] } },
//   required: ["age"]
// }

toJsonSchema(decoder, { target: "draft-07" });
toStandardJsonSchema(decoder)["~standard"].jsonSchema.input({
	target: "openapi-3.0",
});
```

Async `getSchema()` is not supported by `toJsonSchema`. Resolve the schema
first, then convert.

`DecoderSchema` from `getSchema()` describes accepted **input**. `map` /
`andThen` do not change that shape. Optional constraint fields (`format`,
`pattern`, `minLength`, `minimum`, `maxItems`, …) are converted automatically.

## Plugin authors

`katabami/dev` exports `replaceSchema` to attach accepted-value constraints
without changing decode behavior. It is not part of the main `katabami` entry.

```ts
import * as k from "katabami";
import { replaceSchema } from "katabami/dev";

export const date = () =>
	replaceSchema(
		k.string().andThen((value) => {
			const parsed = new Date(value);
			return Number.isNaN(parsed.getTime())
				? k.failed()
				: k.succeed(parsed);
		}),
		{ format: "date-time", kind: "string" },
	);
```

## i18next

`@katabami/i18next` ships English and Japanese resources. Register
`initKatabami` with i18next.

```ts
import i18next from "i18next";
import * as k from "katabami";
import { createFormatter, initKatabami, resources } from "@katabami/i18next";

await i18next.use(initKatabami).init({
	interpolation: { escapeValue: false },
	lng: "ja",
	resources: {
		en: { translation: resources.en },
		ja: { translation: resources.ja },
	},
});

const format = createFormatter(i18next.t);
const result = k.string().decodeValue(1);

if (!result.ok) {
	k.getIssueMessage(result.issues)?.format(format);
	// 文字列が期待されましたが、数値でした。

	const flattened = k.flattenIssues(result.issues, format);
	// [{ message: "文字列が期待されましたが、数値でした。", path: undefined }]

	const restored = k.unflattenIssues(flattened);
	k.getIssueMessage(restored)?.format();
	// 文字列が期待されましたが、数値でした。
}
```

## Development

Tooling is managed with [devbox](https://www.jetify.com/devbox). From the
repository root:

```sh
devbox run -- pnpm install
devbox run -- pnpm test -- --run
devbox run -- pnpm test:typecheck -- --run
devbox run -- pnpm build
devbox run -- pnpm check
```

## Release

Bump every workspace package, commit, and tag:

```sh
devbox run -- pnpm release -- patch
devbox run -- pnpm release -- minor
devbox run -- pnpm release -- prerelease --preid beta
devbox run -- pnpm release -- 0.1.0 --push
```

`--push` also pushes the commit and tag. A `v*` tag triggers GitHub Actions
to publish [Release Drafter](https://github.com/release-drafter/release-drafter)
notes and the npm packages. Merges to `main` keep the next draft release up to
date.

## License

Copyright (C) 2025-2026 hallelujahdrive.

Released under the [DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE](LICENSE)
(WTFPL Version 2). See [wtfpl.net](http://www.wtfpl.net/) for the license
home page.
