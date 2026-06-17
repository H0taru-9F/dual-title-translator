import {titleRenameProps} from "./titleRename";
import {Notice} from "obsidian";
import languageDetect from "./language-detect";
import deeplTranslate from "./deeplTranslate";
import {LangCode} from "./language-detect/types";

type textRenameProps = Omit<titleRenameProps, "setRenaming">;

export async function textRename({app, settings, saveSettings}:textRenameProps) {
	const editor = app.workspace.activeEditor?.editor
	if (!editor) return

	const separatorsArr:string[] = settings.historySeparators;
	const separator = settings.separator;

	const excludeCharsStr = separatorsArr
		.map(char => char.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'))
		.join('');

	const activeWrapper = settings.wrapperForText.find((wrapper: any) => wrapper.isActive === true);

	if (!activeWrapper) return;

	const brackets = { open: `\\${activeWrapper.open}`, close: `\\${activeWrapper.close}` };

	const regex = new RegExp(
		`${brackets.open}([^${excludeCharsStr}${brackets.close}]+)${brackets.close}`,
		'g'
	);

	const activeText = editor.getValue();

	const matches = [...activeText.matchAll(regex)]

	if (matches.length === 0) {
		new Notice('No text found to translate!');
		return;
	}

	const groupedByLang: Record<string, { sourceLang: LangCode | "AUTO", targetLang: LangCode, texts: string[], coords: any[] }> = {};

	for (const match of matches) {
		const text = match[1]

		const insertOffset =  (match.index ?? 0) + match[0].length - 1;
		const position = editor.offsetToPos(insertOffset);

		const detectedLanguage = languageDetect(text, settings.selectedLanguages);

		const pairKey = `${detectedLanguage.sourceLanguage}_${detectedLanguage.targetLanguage}`;

		if (!groupedByLang[pairKey]) {
			groupedByLang[pairKey] = {
				sourceLang: detectedLanguage.sourceLanguage,
				targetLang: detectedLanguage.targetLanguage,
				texts: [],
				coords: []
			};
		}

		groupedByLang[pairKey].texts.push(text);
		groupedByLang[pairKey].coords.push(position);

	}


	const MAX_ITEMS = 50;
	const batches = [];

	for (const [_, data] of Object.entries(groupedByLang)) {
		for (let i = 0; i < data.texts.length; i += MAX_ITEMS) {
			batches.push({
				sourceLanguage: data.sourceLang,
				targetLanguage: data.targetLang,
				texts: data.texts.slice(i, i + MAX_ITEMS),
				coords: data.coords.slice(i, i + MAX_ITEMS)
			});
		}
	}

	console.log(batches)

	for (let i = batches.length - 1; i >= 0; i--) {
		const batch = batches[i];

		try {
			const translatedData = await deeplTranslate({
				text: batch.texts,
				targetLang: batch.targetLanguage,
				sourceLang: batch.sourceLanguage,
				apiKey: settings.api
			});

			if(Array.isArray(translatedData)){

				for (let j = translatedData.length - 1; j >= 0; j--) {
					const translatedText = translatedData[j];
					const position = batch.coords[j];

					const textToInsert = ` ${separator} ${translatedText}`;

					editor.replaceRange(textToInsert, position);
				}
			}

		}catch (error){
			console.error(error)
			new Notice('Failed to translate!');
		}
	}

	if (separator && !settings.historySeparators.includes(separator)) {
		settings.historySeparators.push(separator);
		if (saveSettings) {
			await saveSettings();
		} else {
			console.warn("saveSettings not provided — historySeparators updated in memory only.");
		}
	}
}
