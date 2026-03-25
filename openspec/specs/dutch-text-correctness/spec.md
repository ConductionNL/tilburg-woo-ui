# Dutch Text Correctness Specification

## Purpose
Ensures all user-facing Dutch text in the tilburg-woo-ui frontend is free of spelling errors, grammatical mistakes, and inconsistencies. This applies to all hardcoded strings that are displayed to end users.

## ADDED Requirements

### Requirement: Constants files SHALL contain correctly spelled Dutch text
All string values in constants files (`labels.constants.js`, `titles.constants.js`, `breadcrumbs.constants.js`, `messages.constants.js`, `toasters.constants.js`, `roles.constants.js`, `risks.constants.js`) MUST be free of Dutch spelling and grammar errors.

#### Scenario: Label constants are correctly spelled
- GIVEN the file `src/constants/labels.constants.js`
- WHEN a reviewer reads each string value in the LABELS object
- THEN every Dutch word MUST be correctly spelled according to standard Dutch (Nederlands) orthography
- AND no grammatical errors SHALL be present in multi-word labels

#### Scenario: Title constants are correctly spelled
- GIVEN the file `src/constants/titles.constants.js`
- WHEN a reviewer reads each string value in the TITLES object
- THEN every Dutch word MUST be correctly spelled
- AND page titles MUST use consistent capitalization

#### Scenario: Breadcrumb constants are correctly spelled
- GIVEN the file `src/constants/breadcrumbs.constants.js`
- WHEN a reviewer reads each string value
- THEN every Dutch word MUST be correctly spelled
- AND navigation labels MUST be consistent with their corresponding page titles

#### Scenario: Message constants are correctly spelled
- GIVEN the file `src/constants/messages.constants.js`
- WHEN a reviewer reads each string value
- THEN every Dutch word MUST be correctly spelled
- AND sentences MUST be grammatically correct

#### Scenario: Toaster constants are correctly spelled
- GIVEN the file `src/constants/toasters.constants.js`
- WHEN a reviewer reads each string value
- THEN every Dutch word MUST be correctly spelled

#### Scenario: Role and risk constants are correctly spelled
- GIVEN the files `src/constants/roles.constants.js` and `src/constants/risks.constants.js`
- WHEN a reviewer reads each string value
- THEN every Dutch word MUST be correctly spelled

### Requirement: i18n translation files SHALL contain correctly spelled Dutch text
All Dutch translation strings in `src/assets/locales/translations.js` and `src/assets/locales/nl/translation.js` MUST be free of spelling and grammar errors.

#### Scenario: Master translations are correctly spelled
- GIVEN the file `src/assets/locales/translations.js`
- WHEN a reviewer reads each Dutch translation value
- THEN every Dutch word MUST be correctly spelled
- AND interpolation placeholders (e.g., `{{variable}}`) MUST NOT be altered

#### Scenario: Dutch locale mapping is correctly spelled
- GIVEN the file `src/assets/locales/nl/translation.js`
- WHEN a reviewer reads each Dutch string value
- THEN every Dutch word MUST be correctly spelled

### Requirement: Form utility text files SHALL contain correctly spelled Dutch text
All Dutch strings in form utility files (`views/ac-forms/*/utils/texts.utils.js`, `steps.utils.js`) MUST be free of spelling and grammar errors.

#### Scenario: Form page titles and descriptions are correctly spelled
- GIVEN any `texts.utils.js` file under `src/views/ac-forms/`
- WHEN a reviewer reads the return values of `getPageTitle()` and `getPageDescription()`
- THEN every Dutch word MUST be correctly spelled
- AND sentences MUST be grammatically correct

#### Scenario: Form step labels are correctly spelled
- GIVEN any `steps.utils.js` file under `src/views/ac-forms/`
- WHEN a reviewer reads each step label string
- THEN every Dutch word MUST be correctly spelled

### Requirement: Inline component strings SHALL contain correctly spelled Dutch text
All Dutch strings hardcoded in component and view files (JSX text, string literals for error messages, status labels, tooltips, placeholders, aria-labels) MUST be free of spelling and grammar errors.

#### Scenario: Error messages in views are correctly spelled
- GIVEN any `.js` file under `src/views/` or `src/components/`
- WHEN a reviewer identifies inline Dutch string literals displayed to users
- THEN every Dutch word MUST be correctly spelled
- AND sentences MUST be grammatically correct

#### Scenario: Aria-labels and accessibility text are correctly spelled
- GIVEN any `.js` file that contains Dutch `aria-label`, `title`, or `placeholder` attributes
- WHEN a reviewer reads these accessibility strings
- THEN every Dutch word MUST be correctly spelled

### Requirement: Text corrections MUST NOT alter functionality
Spelling corrections MUST only change the text content of strings, never the structure, keys, or logic of the code.

#### Scenario: Object keys remain unchanged
- GIVEN a spelling fix is applied to a constants file
- WHEN the fix modifies a string value
- THEN the object key or export name MUST remain identical to the original

#### Scenario: String interpolation is preserved
- GIVEN a string containing interpolation (e.g., `${variable}`, `{variable}`, `{{variable}}`)
- WHEN a spelling fix is applied to the surrounding text
- THEN all interpolation expressions MUST remain unchanged and functional

#### Scenario: Build succeeds after corrections
- GIVEN all spelling corrections have been applied
- WHEN the project is built with `yarn build:web`
- THEN the build MUST succeed without errors

### Requirement: Changes MUST be isolated in a feature branch
All spelling corrections MUST be committed to a dedicated feature branch, not directly to the main working branch.

#### Scenario: Feature branch is used
- GIVEN the developer starts the spelling audit
- WHEN they create the first commit
- THEN it MUST be on a branch named `feature/fix-dutch-spelling` or similar
- AND the branch MUST be created from the current working branch

#### Scenario: Primary branch is unaffected
- GIVEN spelling corrections are in progress
- WHEN a reviewer checks the main working branch
- THEN it MUST NOT contain any uncommitted spelling changes

## Current Implementation Status

### Implemented (files exist and contain Dutch text)
The following files exist and contain Dutch-language strings that are in scope for this spec:

**Constants files** (all present at `src/constants/`):
- `labels.constants.js` — LABELS object with ~60+ Dutch UI labels (e.g., "Sluiten", "Zoeken", "Resultaten", "Categorieën", "Publicatiedatum")
- `titles.constants.js` — Page titles in Dutch
- `breadcrumbs.constants.js` — Navigation breadcrumb labels in Dutch
- `messages.constants.js` — User-facing messages in Dutch
- `toasters.constants.js` — Toast notification messages in Dutch
- `roles.constants.js` — Role labels in Dutch
- `risks.constants.js` — Risk labels in Dutch

**i18n translation files** (all present at `src/assets/locales/`):
- `translations.js` — Master translation strings
- `nl/translation.js` — Dutch locale translation mapping
- `en/translation.js` — English locale (out of scope for this spec)

**Form utility text files** (present at `src/views/ac-forms/`):
- `ac-forms-applicatie/utils/texts.utils.js` — Form page titles/descriptions
- `ac-forms-product/utils/texts.utils.js` — Form page titles/descriptions
- `ac-forms-applicatie/utils/steps.utils.js` — Form step labels
- `ac-forms-product/utils/steps.utils.js` — Form step labels

**Inline component strings**: Dutch text is present throughout `src/views/` and `src/components/` in JSX text, aria-labels, placeholders, error messages, and tooltips.

### Not implemented
- **No automated Dutch spelling check exists.** There is no CI step, linter rule, or pre-commit hook that validates Dutch spelling.
- **No spelling audit has been performed.** The spec itself is a quality gate — the actual correction work has not been done yet.
- **No i18n extraction tooling.** Inline Dutch strings in components are not systematically extracted to constants/translation files, making them harder to audit.

## Standards & References

- **Woordenlijst Nederlandse Taal (Groene Boekje)**: The official Dutch spelling reference maintained by the Taalunie. Defines correct spelling for Dutch words.
- **Taalunie spelling rules**: The official orthographic rules for Dutch, including compound word rules, verb conjugation, and capitalization.
- **WCAG 2.1 Level AA (3.1.1 Language of Page, 3.1.2 Language of Parts)**: Requires correct language identification. While not directly about spelling, correct Dutch text supports accessibility.
- **NEN-ISO 639-1**: Language codes — `nl` for Dutch.
- **Government communication standards (Schrijfwijzer Rijksoverheid)**: Dutch government plain language guidelines. Relevant for government-facing applications.

## Specificity Assessment

### Sufficient for implementation
- The file locations are explicitly enumerated and all exist in the codebase.
- The non-functional requirement (MUST NOT alter functionality) is well-defined with specific scenarios for key preservation and interpolation safety.
- The build verification step (`yarn build:web`) provides a clear acceptance criterion.
- The feature branch requirement provides a safe rollback mechanism.

### Missing or ambiguous
- **No reference dictionary specified**: The spec says "standard Dutch orthography" but doesn't specify which dictionary or tool to use for verification (e.g., Hunspell nl_NL, OpenTaal, LanguageTool).
- **No severity classification**: Should the spec distinguish between typos, grammatical errors, and stylistic inconsistencies? All are currently treated equally.
- **Domain-specific terms**: Government/IT terms like "zaaktype", "zaaksysteem", "softwarecatalogus" may not be in standard dictionaries. The spec doesn't define how to handle domain jargon.
- **Scope of inline strings**: The spec says "any `.js` file under `src/views/` or `src/components/`" but doesn't quantify how many files this covers or how to systematically find all Dutch strings (vs. variable names, technical strings, etc.).
- **No ongoing prevention**: The spec focuses on a one-time audit. There is no requirement for preventing future spelling errors (e.g., a CI check, a spell-check pre-commit hook).
- **Capitalization rules**: The spec mentions "consistent capitalization" for titles but doesn't define the convention (Title Case? Sentence case? All lowercase?).

### Open questions
1. Should a Dutch spell-checking tool (e.g., LanguageTool, Hunspell with OpenTaal dictionary) be integrated into CI to prevent regressions?
2. How should domain-specific terms (zaaktype, softwarecatalogus, etc.) be handled — added to a custom dictionary, or excluded from checks?
3. What capitalization convention should page titles follow — Dutch convention (sentence case) or a specific house style?
4. Should English-language strings in the `en/translation.js` file also be audited, or is this strictly a Dutch-only spec?
5. Is there a maximum acceptable number of remaining issues after the initial audit, or must it be zero defects?
