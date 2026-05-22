# Tech Lead — Technische impact van de PO-keuzes

> **Companion bij** [PO-VISUAL-COMPARISON.md](./PO-VISUAL-COMPARISON.md).
> Voor elke **Keuze** in dat document staat hier wat er technisch achter zit: de architecturale impact, de afhankelijkheden, en de risico's of dingen die alleen op tech-lead-niveau gewogen kunnen worden.
>
> **Voor:** Tech lead — Conduction (tilburg-woo-ui).
> **Doel:** zorgen dat de tech lead per PO-keuze begrijpt wat 'm raakt, wat eraan vast hangt, en waar de beslissing groter is dan ze op het PO-niveau lijkt.
> **Niet in dit document:** implementatiestappen, gedetailleerde diff-instructies, line-by-line analyse. Zie de openwoo-research voor diepe code-vergelijking.

---

## Inhoudsopgave

- [Tech Lead — Technische impact van de PO-keuzes](#tech-lead--technische-impact-van-de-po-keuzes)
  - [Inhoudsopgave](#inhoudsopgave)
  - [1. Homepage](#1-homepage)
    - [1.1 Begrippenlijst-knop](#11-begrippenlijst-knop)
    - [1.2 Secundaire navigatiebalk](#12-secundaire-navigatiebalk)
    - [1.3 General-kaart](#13-general-kaart)
  - [2. Zoekpagina](#2-zoekpagina)
    - [2.1 Resultaatkaarten](#21-resultaatkaarten)
    - [2.2 Filters](#22-filters)
  - [3. Publicatiepagina](#3-publicatiepagina)
    - [3.1 Generieke vs. specifieke pagina](#31-generieke-vs-specifieke-pagina)
    - [3.2 Plek van Begrippenlijst-knop](#32-plek-van-begrippenlijst-knop)
  - [Samenvatting voor de tech lead](#samenvatting-voor-de-tech-lead)

---

## 1. Homepage

### 1.1 Begrippenlijst-knop

**Technisch concept:** dit is een front-end UI-bug. De knop bestaat, de glossary-data wordt opgehaald (de render-conditie van de knop checkt al dat `glossary.is_warmed_up && glossary.all_terms.length > 0` — anders zou de knop niet eens zichtbaar zijn). Wat niet werkt is de drawer-opening: de click-handler roept de store-action aan, maar de drawer komt niet naar voren. Dat is staatsbeheer of een ref-koppeling tussen de glossary-store en het `<dialog>`-element van de drawer.

**Trade-off:**
- **Fixen.** Eén van twee dingen: de store-action wijzigt de drawer-staat niet correct, of de drawer-component reageert niet op de staatswijziging.
- **Verwijderen.** Breder dan alleen de knop weghalen. De glossary-feature heeft drie surfaces: (1) de floating button + drawer, (2) een term-highlight-wrapper die op home- en publicatiepagina's woorden binnen de tekst markeert, en (3) een glossary-store + API-call die op elke app-start een warmup doet. Verwijderen betekent kiezen wat van die drie weg moet. Verwijder je alleen de knop, dan blijft de warmup-roundtrip onnodig in de boot-pad. Verwijder je alles, dan verlies je ook de in-page highlights — vraag PO of dat de bedoeling is.

**Wat de tech lead extra moet weten:**
- **Bevolen aanpak:** even debuggen vóór een verwijder-beslissing. De kans is groot dat fixen goedkoper is dan de discussie over wat-allemaal-eruit-mag.

---

### 1.2 Secundaire navigatiebalk

**Technisch concept:** de balk is een tweede menu-zone in de header die gevuld wordt door menu-items uit de CMS (menu-positie 2). Het is geen statische `<nav>` met gehardcodeerde links — beheerders kunnen zonder code-deploy items toevoegen of weghalen.

De PO-keuze betreft alleen de **homepage-zichtbaarheid**: op andere pagina's blijft de balk hoe dan ook staan.

**Trade-off:**
- **Behouden.** De balk staat op elke pagina, ook de homepage.
- **Verbergen op homepage.** Render-conditie toevoegen die de balk weglaat als `isHomePage` (dezelfde flag die de header al gebruikt voor het kruimelpad). Op alle andere pagina's blijft de balk werken.

**Wat de tech lead extra moet weten:**
- Niet de héle balk slopen. De render-blok zelf blijft staan, alleen de mount-conditie wordt strenger. Dat betekent ook dat beheerders positie-2-items kunnen blijven beheren en die items blijven werken — alleen niet meer op `/`.

---

### 1.3 General-kaart

**Technisch concept:** wat op de homepage als "kaart" verschijnt, is **geen hardcoded UI-element maar een data-entry**. De homepage rendert een grid-component over `all_themes` uit de themes-store; momenteel zit daar één thema in (de "General"-entry), dus rendert het grid één kaart.

**Trade-off:**
- **Houden.**
- **Weghalen.** Geen UI-werk — een leeg `all_themes`-grid rendert vanzelf niets. De actie zit aan de data-kant: uit de productie-CMS (beheer-actie), uit de `mock_themes`-fallback die via een feature-flag aanstaat in lokale builds (env-config), of via de thema-API (back-end-actie).

**Wat de tech lead extra moet weten:**
- **Eerste stap is bron-verificatie.** Welke bron levert dit thema? Pas dan kan een richting bepaald worden (CMS, env-config, back-end). Een UI-filter inbouwen om de data te verbergen is technische schuld voor wat een content-keuze is. Niet doen tenzij de bron echt niet aangepast kan worden.

---

## 2. Zoekpagina

### 2.1 Resultaatkaarten

**Technisch concept:** de keuze raakt twee dingen tegelijk — data én layout.

Acato's generieke kaart werkt bij hen omdat hun data uniform is. Bij ons kan de data van een resultaat **van alles zijn** — elk documenttype heeft een andere structuur, andere velden. Eén kaart bouwen die daar zinnig mee om kan gaan is mogelijk maar lastig: je moet per veldtype regelen wat zichtbaar is, in welke volgorde, en wat te doen als een veld ontbreekt.

Daarbovenop hebben onze type-specifieke kaarten elk hun eigen layout-trucjes: bij de ene staat een datum onderaan, bij de andere een aantal of een statusbadge, weer een andere toont een icoon-set. Die kleine layout-eigenheden voegen waarde toe — ze maken in één oogopslag duidelijk wat voor type document je voor je hebt. Bij genericiseren raak je die kwijt, ook als de data-kant netjes opgelost is.

**Trade-off:**
- **Behouden (per type een eigen kaart).** Elk type houdt zijn eigen layout en metadata. Belangrijk voor de softwarecatalogus — daar draait een branch (`softwarecatalogus-performance`) die hierop steunt.
- **Vervangen door één uniforme kaart.** Eén component die met willekeurige data overweg kan en de beschikbare velden netjes uitstalt. Geen informatieverlies, wel verlies van de type-specifieke layout-eigenheden (datum onderaan, aantal-badge, icoon-set, etc).

**Wat de tech lead extra moet weten:**
- **Blokkeer "vervangen"-paden tot de softwarecatalogus-branch gemerged of geannuleerd is.** Tussentijds genericiseren vernietigt werk in flight en levert merge-conflicten.
- Belangrijk om bij PO de twee kosten apart te benoemen: niet alleen "minder herkenbaar per type", maar ook "kleine layout-features per type vervallen". Het is geen pure styling-keuze.

---

### 2.2 Filters

**Technisch concept:** onze filter-UI wordt **dynamisch opgebouwd** uit wat de back-end op dit moment aan filters aanlevert — welke filters je ziet hangt af van de zoekopdracht en wat OpenCatalogi terugstuurt, niet van een vaste lijst in onze code. Acato heeft enkel twee vaste datum-velden (date-from / date-to), hardcoded in hun formulier.

Een datum-control naast ons facet-paneel hangen is een opzichzelfstaande **toevoeging**, niet een herbouw van het filtersysteem — dat is goed om los te houden van de bredere "behouden / vervangen / combineren"-keuze hieronder.

**Trade-off:**
- **Facetten houden (status quo).** Geen datumfilter — onveranderd.
- **Vervangen door datum-only.** Functioneel een forse achteruitgang. Niet aanbevolen.
- **Hybride: datumfilter erbij.** Twee paden: (a) de bestaande date-component los naast het facet-paneel renderen — UI-only, triviaal, of (b) een date-bucket-renderer in het facet-systeem hangen, vergelijkbaar met wat er al voor andere bucket-types staat — heeft back-end-afhankelijkheid die los geverifieerd moet worden.

**Wat de tech lead extra moet weten:**
- Er staat een **openstaande verificatievraag** uit de openwoo-research over wat de OpenCatalogi-back-end precies als datum-parameter accepteert (`published[after/before]` zoals wij sturen, of `@self.published[gte/lte]`). Dat kan een **stille bug** zijn: ons huidige datum-component werkt op het zoek-eindpunt, maar of het backend-side iets uithaalt is niet zeker. Snel runtime-checken — een paar minuten werk dat los van de PO-keuze sowieso opgelost moet worden.
- De facet-laag heeft bekende technische schuld (zware debug-logging, lodash-full-import). Niet meenemen in deze PO-keuze; dat is een aparte cleanup-pass.

---

## 3. Publicatiepagina

### 3.1 Generieke vs. specifieke pagina

**Technisch concept:** dit is dezelfde architecturale spanning als bij de resultaatkaart (2.1), maar dan met meer types en grotere views. Acato heeft één publicatie-layout omdat hun datacontract uniform is. Wij hebben **dertien layouts** (default, softwarecatalogus, organisation, product, module, moduleversie, koppeling, dienst, gebruik, contactperson, woo-verzoek, formulier — plus een ongebruikt `default-old`), omdat we dertien semantisch verschillende documenttypes serveren met elk hun eigen kenmerken: contactenpaginas met privacy-conform-tonen, module-pagina's met versie-tabs en gerelateerde-content-blokken, gebruik-pagina's met compliance-status, organisation-pagina's met logo + contactpersonen, etc.

De default-view leunt al op een schema-driven render (`formatBySchema`, `sortPropertiesByOrder`). De type-specifieke views bestaan omdat schema-driven render alléén niet voldoende is voor die rijke layouts.

**Trade-off:**
- **Behouden.** Dertien parallelle views die meegroeien als schema's wijzigen — dat is de onderhoudskost.
- **Genericiseren naar één view.** Niet als kopieer-werk uit te voeren: type-specifieke features (versie-tabs, contact-grids, compliance-blokken) moeten ofwel in default opgenomen worden (default wordt onhoudbaar) ofwel gesloopt (PO-impact, en mogelijk klant-impact).
- **Incrementele convergentie.** Per type bekijken of het schema-gestuurd afgehandeld kan worden, beginnen bij de simpelste (formulier, woo-verzoek). Geen big-bang, continue verbetering. **Tech-lead-favoriet** als de PO-onderliggende zorg "te veel inconsistentie tussen pagina's" is.

**Wat de tech lead extra moet weten:**
- **Bug gevonden tijdens analyse:** de top-level publication-view heeft een dode glossary-highlight-wrapper. Een switch-statement returned al voordat de wrapper bereikt wordt, dus in-page term-highlights werken momenteel **niet** op publicatiepagina's. Onafhankelijk van deze PO-keuze op te lossen, en raakt direct aan Keuze 9 hieronder (zonder die wrapper kan een Begrippenlijst-knop in de samenvattingskaart geen contextuele "Deze pagina"-tab vullen).
- `ac-publication-default-old.js` ligt onaangeroerd in de map. Vermoedelijk dode code. Los opruimen.
- Acato's "generiek" werkt mede omdat ze veel minder content-types hebben. Onze schaal-factor 13× is geen detail; het is **de reden** dat we hier zijn.

---

### 3.2 Plek van Begrippenlijst-knop

**Technisch concept:** dit is een UI-plaatsingskeuze die afhangt van Keuze 1 (Begrippenlijst-knop fixen of weghalen). Als 1 = weghalen, vervalt 3.2.

Als de feature blijft, gaat het hier puur over plaatsing. Onze huidige floating-button hangt globaal in de App-shell, zichtbaar op elke publieke pagina. Verplaatsen naar de samenvattingskaart vereist dat er een **gedeelde samenvattingskaart-component** is — die is er niet in dezelfde vorm. Elk van de dertien publication-views heeft zijn eigen header/samenvattings-blok. "Naar de samenvatting verplaatsen" betekent dus óf 13× toevoegen, óf eerst een gedeelde samenvattings-component extracten (dat is een refactor los van deze PO-keuze).

**Trade-off:**
- **Rechtsonder houden.** Geen wijziging.
- **Naar samenvattingskaart verplaatsen.** Feitelijk een **vóór-refactor van de publication-views** als je het netjes wilt — er is geen gedeelde samenvattings-component om in te haken.
- **Beide plekken.** Alleen toevoegen, niets weghalen. Risico: UX-dupliek (dezelfde actie op twee plekken). Vraag PO of dat acceptabel is — sommige design-systemen vinden dat oké, andere niet.

**Wat de tech lead extra moet weten:**
- Eerst de **dode-wrapper-bug uit 3.1** oplossen voordat hier werk in gaat. Anders bouw je een knop op een plek waar de glossary-context op de publicatiepagina sowieso niet werkt.

---

## Samenvatting voor de tech lead

**Drie dingen die los van PO-keuzes opgelost mogen worden:**
1. De Begrippenlijst-knop-bug debuggen (Keuze 1.1). Verandert het karakter van die keuze van een PO-discussie in een verholpen bug.
2. De dode `ConGlossaryHighlight`-wrapper op de publication-view (Keuze 3.1, raakt 3.2). Repareert in-page glossary-highlights.
3. Verifiëren of het datum-filter URL-formaat dat we genereren daadwerkelijk iets uithaalt op de back-end (Keuze 2.2 achtergrond). Runtime-check, eventueel een stille bug.

**Twee keuzes met merge-risico tegen werk in flight:**
- Keuze 2.1 (resultaatkaarten genericiseren) en Keuze 3.1 (publicatiepagina genericiseren). **Blokkeren** zolang de softwarecatalogus-branch nog leeft.

**Eén keuze die geen code-werk vereist:**
- Keuze 1.3 ("General"-kaart). Data-/CMS-/config-actie, geen frontend-change.
