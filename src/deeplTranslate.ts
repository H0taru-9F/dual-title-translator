import {request} from "obsidian";
import {LangCode} from "./language-detect/types";

type deeplTranslateProps = {
	text: string | string[];
	targetLang: LangCode;
	sourceLang: LangCode | "AUTO";
	apiKey: string;
}

export default async function deeplTranslate({text, targetLang, sourceLang, apiKey}:deeplTranslateProps): Promise<string | string[]>{
	const body = new URLSearchParams();

	if (Array.isArray(text)) {
		text.forEach(t => body.append('text', t));
	} else {
		body.append('text', text);
	}

	body.append('target_lang', targetLang);
	if (sourceLang !== "AUTO" ) {
		body.append('source_lang', sourceLang);
	}

	try {
		const response = await request({
			url: 'https://api-free.deepl.com/v2/translate',
			method: 'POST',
			headers: {
				Authorization: `DeepL-Auth-Key ${apiKey}`,
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: body.toString(),
		});

		const json = JSON.parse(response);

		if (Array.isArray(text)) {
			return json.translations.map((t: any) => t.text);
		}
		return json.translations[0].text;
	} catch (error) {
		console.error('Error during translation:', error);
		throw error; // Re-throw the error for further handling
	}

}
