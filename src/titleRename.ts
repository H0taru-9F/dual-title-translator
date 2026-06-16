import {App, Notice, TFile} from "obsidian";
import {DualTitleTranslatorSettings} from "../main";
import deeplTranslate from "./deeplTranslate";
import languageDetect from "./language-detect";

export type titleRenameProps = {
	app: App;
	settings: DualTitleTranslatorSettings;
	saveSettings?: () => Promise<void>;
	setRenaming: (value: boolean) => void;
}

async function renameFile (
	app:App,
	activeFile:TFile|null,
	name:string,
	setRenaming: (value: boolean) => void
) {
	if (activeFile && activeFile.parent){
		try {
			setRenaming(true);
			await app.fileManager.renameFile(activeFile, `${activeFile.parent.path}/${name}`);
		} catch (error) {
			console.error('Error renaming file:', error);
			new Notice('Error renaming file: ' + (error?.message || 'Unknown error'));
		} finally {
			setRenaming(false);
		}

	}
}

export async function titleRename({app, settings, saveSettings, setRenaming}:titleRenameProps) {

	const separatorsArr:string[] = settings.historySeparators;
	const separator = settings.separator;

	const activeFile = app.workspace.getActiveFile();

	const hasKnownSeparator = separatorsArr.some(sep => activeFile?.basename.includes(sep));

	if (!hasKnownSeparator) {
		if (activeFile && activeFile.parent) {

			const fileName = `${activeFile.basename}`;

			const langCode = languageDetect(fileName, settings.selectedLanguages);

			const translatedName = await deeplTranslate({
				text: fileName,
				targetLang: langCode.targetLanguage,
				sourceLang: langCode.sourceLanguage,
				apiKey: settings.api
			});

			const extension = `.${activeFile.extension}`
			const TranslatedName = `${fileName} ${separator} ${translatedName}${extension}`;

			await renameFile(
				app,
				activeFile,
				TranslatedName,
				setRenaming
			);

			if (separator && !settings.historySeparators.includes(separator)) {
				settings.historySeparators.push(separator);
				if (saveSettings) {
					await saveSettings();
				} else {
					console.warn("saveSettings not provided — historySeparators updated in memory only.");
				}
			}
		}else {
			new Notice('Something is wrong!');
		}

	}else {
		new Notice('File already has a separator!');
		return;
	}

}
