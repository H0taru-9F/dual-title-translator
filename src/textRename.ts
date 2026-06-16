import {titleRenameProps} from "./titleRename";
import {Notice} from "obsidian";
import languageDetect from "./language-detect";

type textRenameProps = Omit<titleRenameProps, "setRenaming">;



export async function textRename({app, settings, saveSettings}:textRenameProps) {
	const editor = app.workspace.activeEditor?.editor
	if (!editor) return

	const separatorsArr:string[] = settings.historySeparators;
	const separator = settings.separator;

	const excludeCharsStr = separatorsArr
		.map(char => char.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'))
		.join('');

	const brackets = { open: '\\(', close: '\\)' };

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

	const MAX_ITEMS = 50;
	const batches = [];


	for (let i = 0; i < matches.length; i += MAX_ITEMS) {
		const chunk = matches.slice(i, i + MAX_ITEMS);

		const textBatch = chunk.map(match => match[1]);
		const coordinateBatch = chunk.map(match => editor.offsetToPos(match.index ?? 0));
		const languageBatch = chunk.map(match => languageDetect(match[1],settings.selectedLanguages));

		batches.push({
			texts: textBatch,
			coords: coordinateBatch,
			languages: languageBatch
		});

	}

	// for (const batch of batches) {

	console.log(batches)

	if (separator && !settings.historySeparators.includes(separator)) {
		settings.historySeparators.push(separator);
		if (saveSettings) {
			await saveSettings();
		} else {
			console.warn("saveSettings not provided — historySeparators updated in memory only.");
		}
	}
}
