import type { MessageResources } from "katabami";
import en from "./en.json" with { type: "json" };
import ja from "./ja.json" with { type: "json" };

/**
 * katabami resources
 */
export const resources = {
	en,
	ja,
} as const satisfies Record<string, MessageResources>;
