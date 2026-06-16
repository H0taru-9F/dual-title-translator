import {LangCode, Script} from "./types";

export default function detectLanguageHeuristic(text:string, script:Script):LangCode {
	if (script === 'latin') {
		if (/[äöüß]/.test(text)) return 'DE';
		if (/[éèêëàâçîôûùœ]/.test(text)) return 'FR';
		if (/[ąćęłńóśżź]/.test(text)) return 'PL';
		if (/[őű]/.test(text)) return 'HU';
		if (/[ăâîșț]/.test(text)) return 'RO';
		if (/[čďěňřšťůž]/.test(text)) return 'CS';
		if (/[ľĺŕ]/.test(text)) return 'SK';
		if (/[đšž]/.test(text)) return 'SL';
		if (/[õäöü]/.test(text)) return 'ET';
		if (/[ãõ]/.test(text)) return 'PT';
		if (/[ñáéíóú]/.test(text)) return 'ES';
		if (/[çğı]/.test(text)) return 'TR';
		if (/[åøæ]/.test(text)) return 'DA';
		if (/[åäö]/.test(text)) return 'SV';
		if (/[åæø]/.test(text)) return 'NB';
		if (/[äëïöü]/.test(text)) return 'NL';
		if (/[ėįųū]/.test(text)) return 'LT';
		if (/[āēīōū]/.test(text)) return 'LV';
		if (/[ăâêôơư]/.test(text)) return 'VI';
		if (/[a-z]/.test(text)) return 'EN';
	}
	else if (script === 'cyrillic') {
		if (/[іїєґ]/.test(text)) return 'UK';
		if (/[ъщ]/.test(text)) return 'BG';
	}
	else {
		if (/[一-龯]/.test(text)) return 'ZH';
		if (/[ぁ-ゔァ-ヴー々〆〤]/.test(text)) return 'JA';
		if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(text)) return 'KO';
		if (/[א-ת]/.test(text)) return 'HE';
		if (/[ء-ي]/.test(text)) return 'AR';
		if (/[ก-๙]/.test(text)) return 'TH';
		if (/[α-ω]/.test(text)) return 'EL';
	}

	return 'EN';
}
