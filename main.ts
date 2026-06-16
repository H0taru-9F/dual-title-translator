import {App, Notice, Plugin, PluginSettingTab, Setting, TFile,} from 'obsidian';
import {titleRename} from "./src/titleRename";
import {LangCode} from "./src/language-detect/types";
import {LANGUAGES} from "./src/language-detect/constants";
import notTranslated from "./src/utils/notTranslated";
import {FolderSuggest} from "./src/utils/FolderSuggest";
import {textRename} from "./src/textRename";

export type LanguagesCode = {
	sourceLanguage: LangCode | "AUTO";
	targetLanguage: LangCode;
}

export interface DualTitleTranslatorSettings {
	api: string;
	separator: string;
	untranslatableNames: string[];
	historySeparators: string[];
	selectedLanguages: LanguagesCode;
	isAutoTitleTranslate:boolean;
}

const DEFAULT_SETTINGS: DualTitleTranslatorSettings = {
	api: "",
	separator : '⇋',
	untranslatableNames: [],
	historySeparators: [],
	selectedLanguages:{
		sourceLanguage: "AUTO",
		targetLanguage: "EN",
	},
	isAutoTitleTranslate: true,
}

export default class DualTitleTranslator extends Plugin {
	settings: DualTitleTranslatorSettings;
	isRenaming = false;

	async onload() {
		await this.loadSettings();

		this.registerEvent(
			this.app.vault.on('rename',async (file: TFile) => {
				if (!this.settings.isAutoTitleTranslate) return;
				if (this.isRenaming) return;
				if (file.extension === 'md') {
					if (file.path === this.app.workspace.getActiveFile()?.path) {
						const isInBlacklist = notTranslated({
							nameBlackList: this.settings.untranslatableNames,
							currentPath: this.app.workspace.getActiveFile()?.path ?? "/"
						})
						if (isInBlacklist)return;
						await titleRename({
							app:this.app,
							settings:this.settings,
							saveSettings: () => this.saveSettings(),
							setRenaming: (value) => this.isRenaming = value
						})
					}
				}
			})
		);

		this.addCommand({
			id: 'title-translate',
			name: 'Translate title',
			callback: async () => {
				if (this.isRenaming) return;
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile?.extension === 'md') {
					await titleRename({
						app:this.app,
						settings:this.settings,
						saveSettings: () => this.saveSettings(),
						setRenaming: (value) => this.isRenaming = value
					})
				} else {
					new Notice('Please select a markdown file to translate its title.');
				}
			}
		})

		this.addCommand({
			id: 'text-translate',
			name: 'Translate text',
			callback: async () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile?.extension === 'md') {
					await textRename({
						app:this.app,
						settings:this.settings,
						saveSettings: () => this.saveSettings()
					})
				} else {
					new Notice('Please select a markdown file to translate its text.');
				}
			}
		})

		this.addSettingTab(new DualTitleTranslatorSettingTab(this.app, this));

	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class DualTitleTranslatorSettingTab extends PluginSettingTab {
	plugin: DualTitleTranslator;

	constructor(app: App, plugin: DualTitleTranslator) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('API key')
			.addText(text => text
				.setPlaceholder('Enter your key')
				.setValue(this.plugin.settings.api)
				.onChange(async (value) => {
					this.plugin.settings.api = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Separator')
			.setDesc('Separator between file name and translated name')
			.addText(text => text
				.setPlaceholder('E.g. - ')
				.setValue(this.plugin.settings.separator)
				.onChange(async (value) => {
					if (!value.trim()) {
						new Notice('Separator cannot be empty. Please use at least one character.');
						text.setValue(this.plugin.settings.separator);
						return;
					}

					const invalidChars = /[<>:"/\\|?* ]/;
					if (invalidChars.test(value)) {
						new Notice('Invalid character in separator! The following characters are not allowed: < > : " / \\ | ? *');
						text.setValue(this.plugin.settings.separator);
						return;
					}
					this.plugin.settings.separator = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Select the main source language')
			.setDesc('From what language translate mostly')
			.addDropdown(dropdown => {
				[...Object.values(LANGUAGES), ...[{code:"AUTO", name:"Auto detect", script:"N/A"}]]
				.forEach((lang) => {
					dropdown.addOption(lang.code, lang.name);
				})

				dropdown
					.setValue(this.plugin.settings.selectedLanguages.sourceLanguage)
					.onChange(async (value) => {
						this.plugin.settings.selectedLanguages.sourceLanguage = value as LangCode;
						await this.plugin.saveSettings();
					});
			})

		new Setting(containerEl)
			.setName('Select the second language')
			.setDesc('To what language translate mostly')
			.addDropdown(dropdown => {
				Object.values(LANGUAGES).forEach((lang) => {
					dropdown.addOption(lang.code, lang.name);
				});

				dropdown
					.setValue(this.plugin.settings.selectedLanguages.targetLanguage)
					.onChange(async (value) => {
						this.plugin.settings.selectedLanguages.targetLanguage = value as LangCode;
						await this.plugin.saveSettings();
					});
			})

		new Setting(containerEl)
			.setName('History of used separators')
			.setDesc('Previously used separators for easy selection')
			.addDropdown(dropdown => {
				this.plugin.settings.historySeparators.forEach((sep) => {
					dropdown.addOption(sep, sep);
				})

				dropdown
					.setValue(this.plugin.settings.separator)
					.onChange(async (value) => {
						this.plugin.settings.separator = value;
						await this.plugin.saveSettings();
					});
			})
			.addButton(button => {
				button.setButtonText('Clear history');
				button.onClick(async () => {
					this.plugin.settings.historySeparators = [];
					await this.plugin.saveSettings();
					this.display();
				});
			});

		new Setting(containerEl)
			.setName('Auto translate titles')
			.setDesc('Automatically translate file names on rename')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.isAutoTitleTranslate)
				.onChange(async (value) => {
					this.plugin.settings.isAutoTitleTranslate = value;
					await this.plugin.saveSettings();
				}));

		let newFolderPath = "";
		new Setting(containerEl)
			.setName('Untranslatable folders')
			.setDesc('Exclude these folders from title translation')
			.addSearch(search => {
				search
					.setPlaceholder('Path/to/folder')
					.setValue(newFolderPath)
					.onChange(value => newFolderPath = value.trim());

				new FolderSuggest(this.app, search.inputEl);
			})
			.addExtraButton(button => {
				button.setIcon('circle-plus');
				button.setTooltip('Add folder');
				button.onClick(async () => {
					if (!newFolderPath) return

					if (this.plugin.settings.untranslatableNames.includes(newFolderPath)) {
						new Notice('This folder is already added');
						return;
					}

					this.plugin.settings.untranslatableNames.push(newFolderPath);
					await this.plugin.saveSettings();
					this.display();
				});
			})

		this.plugin.settings.untranslatableNames.forEach((path,index) => {
			new Setting(containerEl)
				.setHeading()
				.setName(path)
				.addExtraButton(button => {
					button.setIcon('trash');
					button.setTooltip('Delete this path');
					button.onClick(async () => {
						this.plugin.settings.untranslatableNames.splice(index, 1);
						await this.plugin.saveSettings();
						this.display();
					});
				})
		})
	}
}
