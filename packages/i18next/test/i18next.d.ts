import "i18next";
import type en from "../src/resources/en.json";

declare module "i18next" {
	interface CustomTypeOptions {
		resources: {
			custom: {
				issue: {
					unexpectedType: string;
				};
			};
			translation: typeof en;
		};
	}
}
