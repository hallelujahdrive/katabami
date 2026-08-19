<p align="center">
  <picture>
    <source
      media="(prefers-color-scheme: dark)"
      srcset="../../assets/logo-dark.svg"
    />
    <source
      media="(prefers-color-scheme: light)"
      srcset="../../assets/logo-light.svg"
    />
    <img
      src="../../assets/logo-light.svg"
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

## Issues

Decode failures keep a nested issue tree you can read like the input:

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

## Plugin authors

`katabami/dev` exports `replaceSchema` to attach accepted-value constraints
(`format`, `pattern`, `minLength`, `minimum`, `maxItems`, …) without changing
decode behavior. It is not part of the main `katabami` entry.

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

`@katabami/json-schema` converts those fields when generating JSON Schema.

## Documentation

Full decoder list, `flattenIssues` / `unflattenIssues`,
`serializeDecodeResult` / `deserializeDecodeResult`, `unwrapDecodeResult`,
Standard Schema, JSON Schema, i18next usage, and `replaceSchema`:

https://github.com/hallelujahdrive/katabami

## License

Copyright (C) 2025-2026 hallelujahdrive.

Released under the [DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE](https://github.com/hallelujahdrive/katabami/blob/main/LICENSE)
(WTFPL Version 2).
