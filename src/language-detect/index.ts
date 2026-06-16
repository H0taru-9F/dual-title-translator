import detectLanguageHeuristic from "./detectLanguageHeuristic";
import {Script} from "./types";
import {LanguagesCode} from "../../main";
import {LANGUAGES} from "./constants";

function detectScript(text: string): Script {
	if (/[А-Яа-яЁёІіЇїЄєҐґ]/.test(text)) return 'cyrillic';
	if (/[A-Za-z]/.test(text)) return 'latin';
	return 'other';
}

export default function languageDetect(text:string, languages:LanguagesCode):LanguagesCode {
	if (languages.sourceLanguage == "AUTO") return {
		sourceLanguage:"AUTO",
		targetLanguage:languages.targetLanguage
	}

	const script = detectScript(text);

	const languagesByCode = [
		LANGUAGES[languages.sourceLanguage],
		LANGUAGES[languages.targetLanguage],
	];

	const matches = languagesByCode.filter(lang => lang.script === script);

	if (matches.length === 1){

		const to  = languagesByCode
			.find(lang => lang.script !== script)!.code
		const from = languagesByCode
			.find(lang => lang.script === script)!.code

		return {sourceLanguage:from, targetLanguage:to}
	}

	if (matches.length === 2) {
		const heuristicLang = detectLanguageHeuristic(text, script);
		const from = heuristicLang;

		const to = languagesByCode
			.find(lang => lang.code !== heuristicLang)?.code
			?? LANGUAGES[languages.targetLanguage].code

		return {sourceLanguage:from, targetLanguage:to};
	}

	return {
		sourceLanguage:"AUTO",
		targetLanguage:languages.targetLanguage
	}
}
