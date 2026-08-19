# @katabami/json-schema

JSON Schema generation for [Katabami](https://github.com/hallelujahdrive/katabami)
decoders. Also implements
[Standard JSON Schema](https://standardschema.dev/json-schema).

Converts a decoder (or `getSchema()` output) to JSON Schema. Targets:
`draft-2020-12` (default), `draft-07`, `openapi-3.0`.

## Install

```sh
pnpm add katabami @katabami/json-schema
# npm install katabami @katabami/json-schema
```

## Quick start

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

## Documentation

https://github.com/hallelujahdrive/katabami#json-schema

## License

Copyright (C) 2025-2026 hallelujahdrive.

Released under the [DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE](https://github.com/hallelujahdrive/katabami/blob/main/LICENSE)
(WTFPL Version 2).
