
import { App, TFolder, AbstractInputSuggest } from "obsidian";

export class FolderSuggest extends AbstractInputSuggest<TFolder> {
	constructor(app: App, private inputEl: HTMLInputElement) {
		super(app, inputEl);
	}

	getSuggestions(query: string): TFolder[] {
		const lower = query.toLowerCase();

		return this.app.vault.getAllLoadedFiles()
			.filter((file): file is TFolder =>
				file instanceof TFolder &&
				file.path.toLowerCase().includes(lower)
			);
	}

	renderSuggestion(folder: TFolder, el: HTMLElement) {
		el.createDiv({ text: folder.path });
	}

	selectSuggestion(folder: TFolder) {
		this.inputEl.value = folder.path;
		this.inputEl.trigger("input");
		this.close();
	}
}
