import i18next from "i18next";
import { initKatabami, resources } from "../src";

void i18next.use(initKatabami).init({
	interpolation: {
		escapeValue: false,
	},
	resources: {
		en: {
			custom: {
				issue: {
					failedToDecode: "Failed to decode",
					unexpectedType: "Unexpected type",
				},
			},
			translation: resources.en,
		},
		ja: {
			custom: {
				issue: {
					failedToDecode: "カスタム:デコードに失敗しました。",
					unexpectedType: "カスタム:型が一致しませんでした。",
				},
			},
			translation: resources.ja,
		},
	},
});
