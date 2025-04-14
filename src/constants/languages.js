// TODO: this might change depending on how Nextcloud handles languages
const LANGUAGES_CONSTANT = [
  { name: 'Afrikaans', code: 'AF-za' }, // Afrikaans
  { name: 'አማርኛ', code: 'AM-et' }, // Amharic
  { name: 'العربية', code: 'AR-ar' }, // Arabic
  { name: 'Azərbaycan', code: 'AZ-az' }, // Azerbaijani
  { name: 'Bahasa Indonesia', code: 'ID-id' }, // Indonesian
  { name: 'Bahasa Melayu', code: 'MS-my' }, // Malay
  { name: 'Беларуская', code: 'BE-by' }, // Belarusian
  { name: 'Български', code: 'BG-bg' }, // Bulgarian
  { name: 'Bosanski', code: 'BS-ba' }, // Bosnian
  { name: 'Brezhoneg', code: 'BR-fr' }, // Breton
  { name: 'Català', code: 'CA-es' }, // Catalan
  { name: 'Cebuano', code: 'CEB-ph' }, // Cebuano
  { name: 'Corsu', code: 'CO-fr' }, // Corsican
  { name: 'Cymraeg', code: 'CY-gb' }, // Welsh
  { name: 'Čeština', code: 'CS-cz' }, // Czech
  { name: 'Dansk', code: 'DA-dk' }, // Danish
  { name: 'Deutsch', code: 'DE-de' }, // German
  { name: 'Deutsch (Belgien)', code: 'DE-be' }, // German (Belgium)
  { name: 'Deutsch (Luxemburg)', code: 'DE-lu' }, // German (Luxembourg)
  { name: 'Deutsch (Österreich)', code: 'DE-at' }, // German (Austria)
  { name: 'Deutsch (Schweiz)', code: 'DE-ch' }, // German (Switzerland)
  { name: 'ދިވެހި', code: 'DIV-mv' }, // Divehi (Maldivian)
  { name: 'Eesti', code: 'ET-ee' }, // Estonian
  { name: 'Ελληνικά', code: 'EL-gr' }, // Greek
  { name: 'English (Ireland)', code: 'EN-ie' }, // English (Ireland)
  { name: 'English (Malta)', code: 'EN-mt' }, // English (Malta)
  { name: 'English (UK)', code: 'EN-gb' }, // English (Traditional)
  { name: 'English (US)', code: 'EN-us' }, // English (Simplified)
  { name: 'Español', code: 'ES-es' }, // Spanish
  { name: 'Euskara', code: 'EU-es' }, // Basque
  { name: 'فارسی', code: 'FA-ir' }, // Persian (Farsi)
  { name: 'Føroysk', code: 'FO-dk' }, // Faroese
  { name: 'Français', code: 'FR-fr' }, // French
  { name: 'Français (Belgique)', code: 'FR-be' }, // French (Belgium)
  { name: 'Français (Luxembourg)', code: 'FR-lu' }, // French (Luxembourg)
  { name: 'Français (Suisse)', code: 'FR-ch' }, // French (Switzerland)
  { name: 'Frysk', code: 'FY-nl' }, // Frisian
  { name: 'Furlan', code: 'FUR-it' }, // Friulian
  { name: 'Gaeilge', code: 'GA-gb' }, // Irish Gaelic
  { name: 'Gaeilge (Éire)', code: 'GA-ie' }, // Irish
  { name: 'Gàidhlig', code: 'GD-gb' }, // Scottish Gaelic
  { name: 'Galego', code: 'GL-es' }, // Galician
  { name: 'ગુજરાતી', code: 'GU-in' }, // Gujarati
  { name: 'Hrvatski', code: 'HR-hr' }, // Croatian
  { name: 'Հայերեն', code: 'HY-am' }, // Armenian
  { name: 'עברית', code: 'HE-il' }, // Hebrew
  { name: 'हिन्दी', code: 'HI-in' }, // Hindi
  { name: 'Íslenska', code: 'IS-is' }, // Icelandic
  { name: 'Italiano', code: 'IT-it' }, // Italian
  { name: 'Italiano (Svizzera)', code: 'IT-ch' }, // Italian (Switzerland)
  { name: '日本語', code: 'JA-jp' }, // Japanese
  { name: 'ქართული', code: 'KA-ge' }, // Georgian
  { name: 'ქართული', code: 'KK-kz' }, // Kazakh
  { name: 'Kalaallisut', code: 'KL-gl' }, // Greenlandic
  { name: 'Kaszëbsczi', code: 'CSB-pl' }, // Kashubian
  { name: 'ខ្មែរ', code: 'KM-kh' }, // Khmer
  { name: 'ಕನ್ನಡ', code: 'KN-in' }, // Kannada
  { name: '한국어', code: 'KO-kr' }, // Korean
  { name: 'कोंकणी', code: 'KOK-in' }, // Konkani
  { name: 'کوردی', code: 'KU-tr' }, // Kurdish
  { name: 'кыргызча', code: 'KY-kg' }, // Kyrgyz
  { name: 'Latviešu', code: 'LV-lv' }, // Latvian
  { name: 'Lëtzebuergesch', code: 'LB-lu' }, // Luxembourgish
  { name: 'Lietuvių', code: 'LT-lt' }, // Lithuanian
  { name: 'Македонски', code: 'MK-mk' }, // Macedonian
  { name: 'Magyar', code: 'HU-hu' }, // Hungarian
  { name: 'Magyar (România)', code: 'HU-ro' }, // Hungarian (Romania)
  { name: 'Malti', code: 'MT-mt' }, // Maltese
  { name: 'Meänkieli', code: 'FIT-se' }, // Tornedalen Finnish
  { name: 'മലയാളം', code: 'ML-in' }, // Malayalam
  { name: 'मराठी', code: 'MR-in' }, // Marathi
  { name: 'Mirandês', code: 'MWL-pt' }, // Mirandese
  { name: 'Nederlands', code: 'NL-nl' }, // Dutch
  { name: 'Nederlands (België)', code: 'NL-be' }, // Dutch (Belgium)
  { name: 'नेपाली', code: 'NE-np' }, // Nepali
  { name: 'Niederdeutsch', code: 'NDS-de' }, // Low German
  { name: 'Norsk Bokmål', code: 'NB-no' }, // Norwegian (Bokmål)
  { name: 'Norsk Nynorsk', code: 'NN-no' }, // Norwegian (Nynorsk)
  { name: 'Occitan', code: 'OC-fr' }, // Occitan
  { name: 'ଓଡ଼ିଆ', code: 'OR-in' }, // Odia (Oriya)
  { name: 'ਪੰਜਾਬੀ', code: 'PA-in' }, // Punjabi
  { name: 'پښتو', code: 'PS-af' }, // Pashto
  { name: 'Polski', code: 'PL-pl' }, // Polish
  { name: 'Português', code: 'PT-pt' }, // Portuguese
  { name: 'Română', code: 'RO-ro' }, // Romanian
  { name: 'Română (Moldova)', code: 'RO-md' }, // Romanian (Moldova)
  { name: 'Rumantsch', code: 'RM-ch' }, // Romansh
  { name: 'Русский', code: 'RU-ru' }, // Russian
  { name: 'Sámegiella', code: 'SE-no' }, // Northern Sami
  { name: 'संस्कृत', code: 'SA-in' }, // Sanskrit
  { name: 'Sardu', code: 'SC-it' }, // Sardinian
  { name: 'سنڌي', code: 'SD-in' }, // Sindhi
  { name: 'Serbian Latin', code: 'SR-latn-rs' }, // Serbian (Latin script)
  { name: 'Shqip', code: 'SQ-al' }, // Albanian
  { name: 'සිංහල', code: 'SI-lk' }, // Sinhala
  { name: 'Slovenčina', code: 'SK-sk' }, // Slovak
  { name: 'Slovenščina', code: 'SL-si' }, // Slovenian
  { name: 'Soomaali', code: 'SO-so' }, // Somali
  { name: 'Sorbisch', code: 'WEN-de' }, // Sorbian
  { name: 'Српски', code: 'SR-rs' }, // Serbian (Cyrillic script)
  { name: 'Suomi', code: 'FI-fi' }, // Finnish
  { name: 'Südtirol', code: 'DE-it' }, // South Tyrolean German
  { name: 'Svenska', code: 'SV-se' }, // Swedish
  { name: 'Svenska (Finland)', code: 'SV-fi' }, // Swedish (Finland)
  { name: 'Kiswahili', code: 'SW-ke' }, // Swahili
  { name: 'தமிழ்', code: 'TA-in' }, // Tamil
  { name: 'Татарча', code: 'TT-ru' }, // Tatar
  { name: 'తెలుగు', code: 'TE-in' }, // Telugu
  { name: 'Тоҷикӣ', code: 'TG-tj' }, // Tajik
  { name: 'ไทย', code: 'TH-th' }, // Thai
  { name: 'Tiếng Việt', code: 'VI-vn' }, // Vietnamese
  { name: 'ትግርኛ', code: 'TI-et' }, // Tigrinya
  { name: 'Türkçe', code: 'TR-tr' }, // Turkish
  { name: 'Українська', code: 'UK-ua' }, // Ukrainian
  { name: 'اردو', code: 'UR-pk' }, // Urdu
  { name: "O'zbek", code: 'UZ-uz' }, // Uzbek
  { name: 'Valencià', code: 'CA-va' }, // Valencian
  { name: '中文', code: 'ZH-cn' }, // Chinese (Simplified)
  { name: '中文 (繁體)', code: 'ZH-tw' }, // Chinese (Traditional)
  { name: 'isiZulu', code: 'ZU-za' }, // Zulu
];

export const LANGUAGES = LANGUAGES_CONSTANT;
