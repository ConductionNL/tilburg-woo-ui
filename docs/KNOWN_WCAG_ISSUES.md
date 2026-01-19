# Bekende WCAG issues <!-- omit from toc -->

Dit document houdt een lijst van bekende WCAG issues over de softwarecatalogus, samen met waar ze voor komen en commentaar over de issue vanuit de developers (@sudothijn).

## Table Of Contents <!-- omit from toc -->
- [Hoe vind je WCAG issues?](#hoe-vind-je-wcag-issues)
  - [Praktische werkwijze](#praktische-werkwijze)
  - [Belangrijke kanttekening](#belangrijke-kanttekening)
- [Wat voor WCAG levels bestaan er](#wat-voor-wcag-levels-bestaan-er)
  - [A (minimum):](#a-minimum)
  - [AA (praktische standaard):](#aa-praktische-standaard)
  - [AAA (hoogste niveau):](#aaa-hoogste-niveau)
  - [S (suggesties / best practices):](#s-suggesties--best-practices)
- [Bekende problemen](#bekende-problemen)
  - [Button missing a text alternative (A)](#button-missing-a-text-alternative-a)
  - [Link missing a text alternative (A)](#link-missing-a-text-alternative-a)
  - [Vector image missing a text alternative (A)](#vector-image-missing-a-text-alternative-a)
  - [Hidden element has focusable content (A)](#hidden-element-has-focusable-content-a)
  - [Headings are not structured (S)](#headings-are-not-structured-s)
  - [Improper use of preformatted text element (S)](#improper-use-of-preformatted-text-element-s)
  - [Content missing after heading (S)](#content-missing-after-heading-s)
  - [Color contrast does not meet minimum requirement (AA)](#color-contrast-does-not-meet-minimum-requirement-aa)
  - [Color contrast does not meet enhanced requirement (AAA)](#color-contrast-does-not-meet-enhanced-requirement-aaa)
  - [Line height is below minimum value (AAA)](#line-height-is-below-minimum-value-aaa)
  - [Interactive element does not meet enhanced size (AAA)](#interactive-element-does-not-meet-enhanced-size-aaa)


## Hoe vind je WCAG issues?

WCAG-issues kun je voor een groot deel opsporen met de **Siteimprove Accessibility Checker** (Chrome-extensie):
[Siteimprove Accessibility Checker](https://chromewebstore.google.com/detail/siteimprove-accessibility/djcglbmbegflehmbfleechkjhmedcopn)

Deze extensie scant de pagina die je open hebt en markeert toegankelijkheidsproblemen direct in de interface. Je krijgt per issue meestal:

* **Wat er misgaat** (bijv. onvoldoende contrast, ontbrekende labels, verkeerde heading-structuur)
* **Waar het probleem zit** (met highlight op het element in de pagina)
* **Waarom dit een probleem is** (impact op gebruikers, bv. screenreaders of toetsenbordgebruik)
* **Welke WCAG-criteria erbij horen** (zodat je het kunt herleiden naar A/AA/AAA)
* **Hoe je het oplost** (concrete suggesties of voorbeelden)

### Praktische werkwijze

1. Open de pagina die je wilt controleren in Chrome.
2. Start de Siteimprove-extensie en laat de scan draaien.
3. Loop de resultaten één voor één door en noteer:

   * het **WCAG-criterium**
   * de **locatie** (URL + component/sectie)
   * de **impact** (wie wordt geraakt en hoe)
   * een **voorstel voor fix** (wat moet er technisch/inhoudelijk veranderen)
4. Fix het issue en **scan opnieuw** om te controleren of het echt weg is.

### Belangrijke kanttekening

Automatische tools vinden vooral **technisch detecteerbare** problemen. Ze missen vaak issues die menselijke beoordeling vereisen, zoals:

* of alt-tekst **inhoudelijk klopt**
* of de focus-volgorde **logisch** is
* of foutmeldingen **begrijpelijk en bruikbaar** zijn
* of teksten en knoppen **duidelijk genoeg** zijn
* etc

Gebruik de extensie dus als snelle en consistente **eerste check**, maar combineer het met een korte handmatige controle (toetsenbordtest + screenreader/semantiekcheck) voor de belangrijkste flows.

Als je wilt, kan ik er ook nog een compact blokje “minimum handmatige checks in 5 minuten” onder zetten dat qua lengte matcht met je AA/AAA-stuk.


## Wat voor WCAG levels bestaan er

WCAG kent drie conformiteitsniveaus: **A**, **AA** en **AAA**. Elk niveau bouwt voort op het vorige: **AA** omvat dus óók alle eisen van **A**, en **AAA** omvat **A + AA + AAA**.

### A (minimum):
  Dit is het **minimale basisniveau**. Het gaat vooral om de meest fundamentele blokkades wegnemen, zodat mensen met een beperking je site überhaupt kunnen gebruiken. Denk aan basisregels rond bijvoorbeeld alternatieve tekst bij niet-tekstuele content, toetsenbordbediening en duidelijke structuur. Alleen niveau A halen betekent vaak: “bruikbaar, maar nog niet goed genoeg voor veel gebruikers en situaties.”

### AA (praktische standaard):
  Dit is het niveau waar je in de praktijk meestal op mikt. Het levert **veel toegankelijkheidswinst** op zonder dat je ontwerp of techniek onwerkbaar wordt. AA bevat eisen die je site voor een brede groep gebruikers daadwerkelijk prettig en betrouwbaar maken, bijvoorbeeld rond contrast, consistente navigatie, foutmeldingen bij formulieren en voldoende duidelijke interactie. In veel organisaties en wet- of beleidskaders is **AA** het niveau dat als doel of norm wordt gehanteerd.

### AAA (hoogste niveau):
  Dit is het **strengste** niveau en bevat extra eisen die nóg verder gaan dan AA. Het kan de toegankelijkheid voor specifieke groepen verder verbeteren, maar het is niet altijd realistisch om **alle** AAA-eisen overal op een site toe te passen—sommige criteria zijn context-afhankelijk of botsen met bepaalde content- of ontwerpkeuzes. Daarom wordt AAA meestal gebruikt als **selectieve ambitie**: je past onderdelen toe waar het haalbaar en nuttig is (bijvoorbeeld voor cruciale pagina’s, publieke dienstverlening, of specifieke doelgroepen), in plaats van het als harde eis voor de hele site.

### S (suggesties / best practices):
  **S** staat voor **Site accessibility best practices**: aanbevelingen die de toegankelijkheid en gebruiksvriendelijkheid verbeteren, **maar geen officiële WCAG-eis** zijn. Zie dit als “kwaliteit boven compliance”: het maakt de ervaring beter voor gebruikers (en vaak ook voor SEO, performance of UX), maar je kunt er niet formeel “WCAG-conform” mee scoren. S-meldingen zijn daarom ideaal als **optimalisaties** nadat de A/AA-issues zijn opgelost, of wanneer je extra toegankelijkheidswinst wilt pakken met relatief weinig risico.


## Bekende problemen

### Button missing a text alternative (A)
Deze regel vereist dat een knop altijd een **toegankelijke naam** heeft (bijv. via zichtbare tekst, `aria-label` of een ander tekstalternatief). Dit is belangrijk voor screenreadergebruikers, zodat zij begrijpen wat de knop doet. De tekst hoeft **niet zichtbaar** te zijn om aan deze eis te voldoen.

**Waar dit speelt:**
| Locatie | URL | Commentaar |
| ------- | --- | ---------- |
| *       | `/` | Er is één element dat hierop faalt: een **onzichtbare knop** links van de “Home”-knop in de **tweede navigatie**. We moeten bepalen of deze knop **weg kan** (als hij geen functie heeft) of een **tekstalternatief** toevoegen (als hij wel nodig is). Dit komt op **alle pagina’s** voor. |


### Link missing a text alternative (A)
Deze regel vereist dat een link altijd een **toegankelijke naam** heeft (bijv. via zichtbare tekst, `aria-label` of een ander tekstalternatief). Dit is belangrijk voor screenreadergebruikers, zodat zij begrijpen wat de knop doet. De tekst hoeft **niet zichtbaar** te zijn om aan deze eis te voldoen.

**Waar dit speelt:**
| Locatie | URL | Commentaar |
| ------- | --- | ---------- |
| Organisatie publicatiepagina | `/publicatie/2059fc2d-1a0e-45d9-89db-dea78a76ea6` | Dit issue ontstaat in de **description**. De inhoud hiervan wordt door **gebruikers aangeleverd** (markdown) en vervolgens door een 3rde partij viewer weergegeven. Daardoor hebben we hier **beperkte controle** over. |
| Dienst beheer details pagina | `/beheer/diensten/e0389b6e-f4a5-45da-b922-094bbb269f2d` | Dezelfde beredenering als de vorige |


### Vector image missing a text alternative (A)
Deze regel vereist dat een SVG een **toegankelijke naam** heeft, zodat de betekenis of functie ervan ook duidelijk is als de SVG niet (goed) wordt weergegeven. Dit is vooral belangrijk voor screenreadergebruikers, zodat zij begrijpen wat een knop of icoon doet. De tekst hoeft niet zichtbaar te zijn om aan deze eis te voldoen (bijv. via `aria-label`).

**Waar dit speelt:**
| Locatie | URL | Commentaar |
| ------- | --- | ---------- |
| Applicatie wizard | `/forms/applicatie?type=eigen` | Dit issue treedt op bij het beschrijvingsveld in stap 1. We kunnen dit niet direct oplossen, omdat dit veld wordt geleverd door een third-party package waar wij geen controle over hebben. |


### Hidden element has focusable content (A)
Deze regel vereist dat elementen met `aria-hidden="true"` **niet met het toetsenbord te focussen** zijn. Content die expliciet verborgen is voor assistieve technologie mag dus geen focus kunnen krijgen.

**Waar dit speelt:**
| Locatie | URL | Commentaar |
| ------- | --- | ---------- |
| zoek pagina | `/zoeken` | Dit is een **false positive** bij de filters op de zoeken-pagina. De Siteimprove-extensie herkent niet correct dat het bovenliggende (parent) element verborgen is, en meldt daardoor ten onrechte dat de content focusbaar is. |


### Headings are not structured (S)
Deze suggestie adviseert om **heading-niveaus niet over te slaan** (bijv. van `h2` direct naar `h4`). Een logische koppenhiërarchie helpt screenreaders om de pagina beter te “scannen” en ondersteunt daarnaast ook de begrijpelijkheid en vindbaarheid (SEO).

**Waar dit speelt:**
| Locatie | URL | Commentaar |
| ------- | --- | ---------- |
| * | N.v.t. | Ik heb ervoor gekozen dit te **negeren**: de toegankelijkheidswinst is beperkt en het kan het ontwerp/typografie ongewenst beïnvloeden op extreme manieren (bijv. grotere of extra kopstijlen). Ook geeft het vaak false positives. |


### Improper use of preformatted text element (S)
Deze melding geeft aan dat het `pre`-element mogelijk onjuist wordt gebruikt. `pre` is bedoeld voor **voorgeformatteerde tekst**, zoals **code** of **ASCII-art** (waar spaties en regeleindes exact behouden moeten blijven).

**Waar dit speelt:**
| Locatie | URL | Commentaar |
| ------- | --- | ---------- |
| Applicatie wizard | `/forms/applicatie?type=eigen` | Dit komt voor in de markdown-editor van het beschrijvingsveld. Dit is hier een **false positive**, omdat markdown (o.a. codeblokken) juist een valide reden is om `pre` te gebruiken. Daarnaast kunnen we dit niet direct aanpassen, omdat de editor uit een third-party package komt waar we geen controle over hebben. |


### Content missing after heading (S)
Dit is **slechts een suggestie** van de Siteimprove Accessibility Checker, geen harde fout. De melding gaat ervan uit dat er na elke kop direct “gewone” tekst moet volgen, maar dat uitgangspunt past vaak niet bij moderne pagina-opbouw (bijv. koppen die een sectie afbakenen, of gevolgd worden door componenten/kaarten/visuele blokken).

In **veel, en vaak zelfs de meeste gevallen** is dit daarom **geen toegankelijkheidsprobleem**. Het is vooral bedoeld als *signaal* om even te controleren of er per ongeluk een lege sectie is ontstaan. Als de kop bewust wordt gebruikt als label/scheiding en er geen extra inhoud hoort te staan, kun je deze melding doorgaans veilig negeren.

Ook kan dit een signaal zijn dat er een kop stuk binnen een kopstuk zit, e.g.
```html
<h4>
    <!-- geeft de waarschuwing "Content missing after heading" -->
    <h1>kopstuk</h1>
</h4>
```
Dit zou wel gefixed moeten worden.

**Waar dit speelt:**
| Locatie | URL | Commentaar |
| ------- | --- | ---------- |
| publicatiepagina | `/publicatie/[ID]` | Ik heb ervoor gekozen dit te negeren, omdat de Siteimprove-check **te weinig rekening houdt met de context van onze pagina-opbouw**. In deze situatie is de structuur **acceptabel**, en voegt deze melding weinig waarde toe. |


### Color contrast does not meet minimum requirement (AA)
Deze regel verwacht dat tekst een kleuren contrast van minimaal `4.5:1` (`3:1` voor grote tekst) heeft met de background.

**Waar dit speelt:**
| Locatie | URL    | Commentaar |
| ------- | ------ | ---------- |
| alle wizards | e.g. `/forms/applicatie?type=eigen` | De checker markeert dit bij de dropdowns als issue, maar dit is een false positive: het gemeten contrast voldoet zelfs aan **AAA**. |


### Color contrast does not meet enhanced requirement (AAA)
Deze regel verwacht dat tekst een kleuren contrast van minimaal `7:1` (`4.5:1` voor grote tekst) heeft met de background.

**Waar dit speelt:**
| Locatie | URL    | Commentaar |
| ------- | ------ | ---------- |
| *       | e.g. `/beheer` | Ik heb ervoor gekozen dit **niet te fixen**, omdat het aanpassen van de kleuren de huidige styling/branding sterk zou beïnvloeden. Bovendien is dit een **AAA-eis**; conform [AAA](#aaa-hoogste-niveau) is het doorgaans niet noodzakelijk om dit overal af te dwingen. |


### Line height is below minimum value (AAA)
Deze regel verwacht dat tekst in alinea’s een `line-height` heeft van minimaal `1.5` (`150%`).

In de meeste gevallen is dit zonder negatieve impact op de UI te verhogen. Als deze issue écht aanwezig is, moet het dus worden gefixt.

**Waar dit speelt:**
| Locatie | URL    | Commentaar |
| ------- | ------ | ---------- |
| *       | N.v.t. | De Siteimprove-extensie meldt dit op alle paragrafen, maar dit komt door een **bekende bug in de Siteimprove-extensie**. In onze styling staat de `line-height` al op `150%`, dus deze melding is een **false positive**. Dit verschijnt op **alle pagina’s**. |


### Interactive element does not meet enhanced size (AAA)
Deze regel verwacht dat klikbare elementen minimaal **44×44 px** zijn.

**Waar dit speelt:**
| Locatie | URL | Commentaar |
| ------- | --- | ---------- |
| *       | `/` | Dit betreft links in de **footer**. We gaan dit **niet aanpassen**, omdat 44 px hoogte te groot is voor footerlinks (huidige hoogte is ±19 px). Dit komt op **alle pagina’s** voor. |
