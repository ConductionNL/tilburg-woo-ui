# Tech Lead — Technische impact van de PO-keuzes <!-- omit in toc -->

> **Companion bij** [PO-VISUAL-COMPARISON.md](./PO-VISUAL-COMPARISON.md).
> Voor elke **Keuze** in dat document staat hier wat er technisch achter zit: de architecturale impact, de afhankelijkheden, en de risico's of dingen die alleen op tech-lead-niveau gewogen kunnen worden.
>
> **Voor:** Tech lead — Conduction (tilburg-woo-ui).
> **Doel:** zorgen dat de tech lead per PO-keuze begrijpt wat 'm raakt, wat eraan vast hangt, en waar de beslissing groter is dan ze op het PO-niveau lijkt.
> **Niet in dit document:** implementatiestappen, gedetailleerde diff-instructies, line-by-line analyse. Zie de openwoo-research voor diepe code-vergelijking.

---

## Inhoudsopgave <!-- omit in toc -->

- [1. Homepage](#1-homepage)
  - [1.1 Begrippenlijst-knop](#11-begrippenlijst-knop)
  - [1.2 Secundaire navigatiebalk](#12-secundaire-navigatiebalk)
  - [1.3 General-kaart](#13-general-kaart)
  - [1.4 Uitgelicht-blok](#14-uitgelicht-blok)
  - [1.5 Welkom/Over-sectie (AcAbout)](#15-welkomover-sectie-acabout)
- [2. Zoekpagina](#2-zoekpagina)
  - [2.1 Resultaatkaarten](#21-resultaatkaarten)
  - [2.2 Filters](#22-filters)
  - [2.3 Auto-zoek tijdens typen](#23-auto-zoek-tijdens-typen)
  - [2.4 Toegankelijkheid: skip-link en DOM-volgorde](#24-toegankelijkheid-skip-link-en-dom-volgorde)
- [3. Publicatiepagina](#3-publicatiepagina)
  - [3.1 Layout per documenttype → richting één generieke layout](#31-layout-per-documenttype--richting-één-generieke-layout)
  - [3.2 Deel-modal ("Deel deze pagina")](#32-deel-modal-deel-deze-pagina)
  - [3.3 Dode `ConGlossaryHighlight`-wrapper op de publication-router](#33-dode-conglossaryhighlight-wrapper-op-de-publication-router)
- [Samenvatting voor de tech lead](#samenvatting-voor-de-tech-lead)

---

## 1. Homepage

### 1.1 Begrippenlijst-knop

**PO-besluit:** behouden, knop fixen. Geen trade-off meer — dit is committed werk.

**Technisch concept:** dit is een front-end UI-bug. De knop bestaat, de glossary-data wordt opgehaald (de render-conditie van de knop checkt al dat `glossary.is_warmed_up && glossary.all_terms.length > 0` — anders zou de knop niet eens zichtbaar zijn). Wat niet werkt is de drawer-opening: de click-handler roept de store-action aan, maar de drawer komt niet naar voren. Vermoedelijk staatsbeheer of een ref-koppeling tussen de glossary-store en het `<dialog>`-element van de drawer.

**Wat de tech lead extra moet weten:**
- Begin bij debuggen van twee kandidaat-paden: (a) de store-action zet de drawer-open-staat niet correct, of (b) de drawer-component reageert niet op de staatswijziging.
- De andere twee glossary-surfaces (in-page term-highlight-wrapper en de boot-warmup) zijn met dit besluit bevestigd als blijvende features — niet meer onder discussie.

---

### 1.2 Secundaire navigatiebalk

**PO-besluit:** behouden. Geen frontend-werk. Items worden via CMS (menu-positie 2) beheerd.

---

### 1.3 General-kaart

**Historische context:** dit verschil is post-fork ontstaan, en bewust. Acato's home-source bevat het oude themes-blok nog letterlijk — als uitgecommentarieerd codeblok inclusief `fetchThemes`-aanroep. Ze hebben dus actief het themadossiers-concept verlaten en vervangen door hun categories-blok. Wij zijn op het themes-pad gebleven. Geen toevallige divergentie maar een tegenovergestelde redactionele richting op een gedeelde uitgangsbasis.

**Technisch concept:** **beide repos** tonen op deze plek dezelfde `AcCardCategory`-component in een drie-koloms grid — dus UI-laag is identiek. Wat verschilt is de **bron** en het **datacontract** dat het blok vult.

**Twee verschillende endpoints, twee verschillende contracten.** Hieronder per zijde alleen de velden die echt iets uithalen op de kaart-render. Onbenutte velden (die wel in de store-mapping zitten maar nergens worden gelezen) staan apart vermeld als technische schuld.

**Acato — `/api/public/categories`** (wrapper: `{ data: [ ...items ] }`):

| Veld | Type | Effect op de kaart |
|------|------|--------------------|
| `icon` | string | Sleutel naar een vaste iconenset (`bestuursstuk`, `raadsstuk`, `woo-verzoek`, `convenant`, `organisatie`, `bereikbaarheidsgegevens`). Geen match = geen icoon. |
| `title` | string | Heading (h3). |
| `content` | HTML | Body — gesanitized en op de `summary`-prop gezet. |
| `url` | string | Bestemming van de link — kan intern (`/iets`) of extern (`https://anderewebsite.com/...`) zijn. De backend bepaalt waar de kaart heen wijst; geen hardcoded URL's in de codebase. Ontbreekt `url`, dan rendert er nog steeds een link-wrapper maar zonder href (lichte UI-glitch bij Acato). |
| `link` | string | Label van de link. |
| `is_external` | boolean | Wordt door de kaart-component aan `AcLink` als prop meegegeven, maar `AcLink` honoreert die prop niet (zie technische schuld hieronder). Het beïnvloedt dus alleen het **icoon** (pink external vs. arrow), niet het navigatiegedrag. |

Niet-effectief in Acato: een `image`-prop wordt door de kaart geaccepteerd en aan `AcCard` doorgegeven, maar de categories-store mapt nooit een `image`-veld → effectief altijd undefined.

**Ons — `/opencatalogi/api/themes`** (wrapper: `{ results: [ ...items ] }`):

| Veld | Type | Effect op de kaart |
|------|------|--------------------|
| `id` | string/UUID | Drijft de auto-fallback-URL als er geen eigen `url` is: `/zoeken?themes=<id>`. Acato gebruikt dit veld helemaal niet. |
| `title` | string | Heading (h3) **én** sorteersleutel (alfabetisch, na `sort`). |
| `summary` of `description` | string | Body — `summary` heeft voorrang, anders `description`. Wat in `content` staat komt **niet** op de kaart terecht (zie technische schuld hieronder). |
| `url` | string | Bestemming — intern of extern, wat de backend ook meegeeft. Ontbreekt `url`, dan bouwt de homepage een fallback-URL `/zoeken?themes=<id>` (vereist `id`). |
| `link` | string | Linklabel; ontbreekt-ie, fallback `"Bekijk documenten"`. |
| `isExternal` | boolean | Switcht naar het externe render-pad: een plain `<a href="..." target="_blank" rel="noopener noreferrer">`. Werkelijk extern gedrag, niet alleen een icoon-switch. |
| `sort` | number | Sorteervolgorde, lager eerst. Tie-break alfabetisch op `title`. Geen `sort` = belandt achteraan (default 999). |
| `icon` | string | Zelfde iconenset als Acato. |

Niet-effectief in ons:
- **`paragraph`** wordt in de store gemapt (`theme.content || theme.description`), maar `AcCardCategory` leest dit veld niet. Dode mapping.
- **`content`** voedt alleen de dode `paragraph`-mapping. Een thema waarvan alleen `content` is ingevuld (en niet `summary`/`description`) toont **geen body op de kaart**. Te repareren door `summary` in de store ook `theme.content` als fallback te geven, of de store-mapping op te schonen.
- **`image`** wordt door de kaart-component gedestructureerd maar niet gebruikt in de JSX. Dood prop-signature.

**Code-verschil in hoe externe URL's worden gerenderd** (los van het datacontract):

| | Externe URL wordt gerenderd als |
|---|---|
| **Ons** | Plain `<a href="..." target="_blank" rel="noopener noreferrer">`. Opent in nieuw tabblad, met de juiste `rel`-attributen tegen tab-napping. |
| **Acato** | `<AcLink to={url} external>`, wat onder de motorkap `react-router-dom`'s `<Link to>` is. Twee problemen: (1) `<Link>` is bedoeld voor **interne SPA-navigatie**, niet voor absolute URL's — bij moderne react-router-versies vangt-ie absolute URL's nog op als full-page navigation, maar het is een misbruik van het component (en kwetsbaar voor toekomstige router-upgrades). (2) Het `external`-prop dat de kaart meegeeft, wordt door `AcLink` niet uitgelezen; het komt als onbekend attribuut op het `<Link>` terecht. Resultaat: externe links openen waarschijnlijk in **hetzelfde tabblad** en missen `rel="noopener noreferrer"`. |

**Aanbeveling:** als we ooit de Acato-categorieën-laag adopteren, moet `AcLink` eerst gefixt worden zodat het `external`-prop daadwerkelijk een `<a target="_blank" rel="noopener noreferrer">` rendert. Anders erven we hun bug. Eigenlijk is dit een aparte schoonmaakactie op zich — `AcLink` is een veelgebruikt component en het impliciet vertrouwen op react-router's gedrag bij absolute URL's is een latente bug waar de hele app op leunt.

**De zeven echte verschillen tussen de contracten:**
1. **Wrapper:** Acato `{ data: [...] }` vs. ons `{ results: [...] }`.
2. **`id`-afhankelijkheid:** bij ons load-bearing voor de link-fallback, bij Acato volledig genegeerd.
3. **Body-veld:** Acato single field (`content`). Wij accepteren `summary` of `description`, met `content` als dode optie (zie technische schuld).
4. **Linkgedrag zonder URL:** Acato rendert lege link-wrapper. Wij bouwen automatisch een zoek-URL op `id`.
5. **Labelgedrag zonder label:** Acato rendert leeg. Wij vallen terug op een vast label uit `LABELS`.
6. **Sortering:** Acato in API-volgorde. Wij hebben een expliciete `sort`-sleutel en alfabetische tie-break.
7. **Naamgeving:** Acato snake_case (`is_external`), wij camelCase (`isExternal`).

**Twee modellen, twee bedoelingen:**
- **Acato** modelleert een **vaste lijst documentsoorten** met handmatig per item ingestelde landingspagina's. De content-eigenaar bouwt elke link zelf.
- **Wij** modelleren **redactionele dossiers/onderwerpen** die automatisch een gefilterde zoekopdracht openen op basis van `id`. De link wordt door het systeem afgeleid.

**Wat de tech lead extra moet weten:**
- **De "we tonen één General-kaart"-observatie is geen UI-issue maar een data-issue.** De themes-bron geeft op dit moment één item terug — er hoort een rij thema's te staan. Bron-verificatie eerst (productie-CMS / `mock_themes` feature-flag in lokale builds / back-end thema-API), niet UI-filter.
- **Als PO kiest voor optie 1 (ons concept houden):** alleen content/CMS-actie. Geen frontend-werk.
- **Als PO kiest voor optie 2 (overstap naar Acato-model):** datacontract verandert (snake_case, geen `id`-afhankelijkheid, geen URL-fallback). Vereist een aparte categories-endpoint **of** schema-aanpassing van het bestaande themes-endpoint plus aanpassing van de store-mapping. Niet triviaal; raakt ook de auto-search-flow elders in de app waar `themes: [id]` als filter wordt gebruikt.
- **Als PO kiest voor optie 3 (beide blokken naast elkaar):** twee parallelle data-bronnen op de homepage. Eenvoudig in te bouwen (twee `AcSection`-blokken, beide vullen al naar `AcCardCategory`), maar verdubbelt operationele eigenaarschap — beheerders moeten zowel themes als een categories-tabel onderhouden.
- **Onafhankelijke opschoonpunten** (los van PO-keuze):
    - Onze dode `paragraph`- en `content`-mappings in `themes.store.js`.
    - Het dode `image`-prop in onze `AcCardCategory`.
    - Acato's edge-case waar een link-wrapper rendert zonder href als `url` ontbreekt (niet onze code, maar relevant als we hun model overnemen).

---

### 1.4 Uitgelicht-blok

**Historische context:** dit is een feature die **Acato post-fork heeft afgebouwd**. De lege `AcFeatured`-shell in onze codebase is leftover scaffolding van vóór de splitsing — beide repos erfden 'm als incomplete stub. Acato heeft daarna de store-action, de getters, de skeleton-state en de home-koppeling toegevoegd; wij niet. Het verschil is dus geen regressie aan onze kant maar voortgang aan hún kant op een gedeelde startbasis.

**Technisch concept:** Acato heeft een werkende "Uitgelicht"-sectie op de homepage met drie publicatiekaarten + skeleton-loaders. Wij niet — bij ons is **alles wat nodig is grotendeels afwezig of dood code**:

| Onderdeel | Acato | Ons |
|-----------|-------|-----|
| Sectie-component (`AcFeatured`) | Aanwezig + gekoppeld | Aanwezig maar **dood** — rendert drie lege `<AcSearchResult />` zonder data, niet geïmporteerd door enige view, geen skeleton-state |
| Store-action `fetchLatestPublications` | Aanwezig (publications.store) | **Afwezig** |
| Store-getter `latest_publications` / `is_loading_latest` | Aanwezig | **Afwezig** |
| Aanroep vanuit `ac-home.js` | `fetchLatestPublications(3)` in `useEffect` | Afwezig |
| Render-aanroep in `ac-home.js` | `{latest_publications?.length > 0 && <AcFeatured .../>}` | Afwezig |

**Hoe Acato het vult (de data-laag):**
1. Twee parallelle calls naar de publications-search-endpoint:
    - Featured-query: `{ _limit: 100, _order: { date: 'desc' }, featured: true }`
    - Recent-query: `{ _limit: 100, _order: { date: 'desc' } }`
2. Selectielogica:
    - ≥3 publicaties met `featured: true` → de 3 nieuwste daarvan.
    - 1–2 featured → die + aanvullen met meest recente non-featured tot 3 items.
    - 0 featured → fallback naar de 3 meest recente.
3. Renderconditie in `ac-home.js`: `latest_publications?.length > 0 && <AcFeatured .../>`. Lege lijst → geen blok, geen lege-staat, geen melding.

**Waarom je het in Acato's eigen build mogelijk niet ziet:** als de dev-backend geen publicaties heeft (of de search-call faalt — Acato vangt errors stilletjes af met `setLatestItems([])`), valt het blok eruit zonder enige UI-aanwijzing. Geen toggle, geen feature-flag — het hangt puur aan het bestaan van publicaties in de bron. Quick test: `curl` de search-endpoint van je Acato-backend en kijk of er überhaupt items terugkomen.

**Wat de tech lead extra moet weten:**
- **Activeren is wel werk maar geen architectuur-verandering.** Concreet:
    1. `fetchLatestPublications` + `latest_items`-observable + `latest_publications`-getter + `is_loading_latest`-getter overnemen uit Acato's publications-store (of een vereenvoudigde versie zonder de featured-fallback als ons backend geen `featured`-flag kent).
    2. Onze lege `ac-featured.js` vervangen door Acato's versie (skeleton-states + `hideCategory`/`hideEllipses`-props die bij Acato op de homepage-`AcSearchResult` gezet worden).
    3. Drie regels toevoegen aan `ac-home.js`: het fetch-aanroep in `useEffect`, het uitlezen van de getters, en de render-conditie.
- **Vereiste backend-controle:** ondersteunt onze OpenCatalogi-backend een `featured`-query-parameter op `publications.search`? Zo nee, dan vervalt de featured-tak en wordt het effectief "drie meest recente". Eerst verifiëren.
- **Onze huidige `AcFeatured` is broncode-ballast.** Drie lege `<AcSearchResult />` die geen toestand kunnen weergeven. Wordt nergens geïmporteerd. Mag los van deze keuze opgeschoond worden — of, beter, in één klap vervangen door de werkende variant uit Acato als de PO besluit het blok te activeren.
- **PO-vraag eerst beantwoord krijgen:** willen we redactionele controle (`featured`-vinkje per publicatie) of altijd-automatisch "drie meest recente"? Dat bepaalt of we de full Acato-logica overnemen of een vereenvoudigde versie.

---

### 1.5 Welkom/Over-sectie (AcAbout)

**Technisch concept:** beide repos renderen onder de andere homepage-blokken een `AcAbout`-component (className `ac-about`) met dezelfde structuur: heading, paragraaf, link, afbeelding. Maar de component is **post-fork divergerend uitgebreid bij Acato**: zij hebben een extra paragraaf-veld toegevoegd en de styling aangepast; wij niet. De CMS-content-mapping in `ac-home.js` verschilt daardoor ook qua veldenset én qua indices.

**Verschillen in de component zelf:**

| | Ons (`AcAbout`) | Acato (`AcAbout`) |
|---|---|---|
| Props | `title`, `content`, `link`, `image` | `title`, `content`, **`list`**, `link`, `image` |
| Sectie-styling | `<AcSection ... spacing>` (default achtergrond) | `<AcSection ... spacing blue>` (blauwe achtergrond) |
| Extra paragraaf | — | Tweede `<Paragraph>{list}</Paragraph>` tussen `content` en `link` |

**Verschillen in hoe `ac-home.js` 'm aanroept:**

| | Ons | Acato |
|---|---|---|
| CMS-content-indices | `contents[3]` titel, `contents[4]` content, `contents[5]` link, `contents[6]` image | `contents[0]` titel, `contents[1]` content, **`contents[2]` list**, `contents[3]` link, `contents[4]` image |
| Render-conditie | Skip de hele sectie als `title` of `content` leeg — best-practice guard | Altijd renderen, ook bij lege velden |
| Aantal CMS-velden verwacht | 4 (op een totaal van 7 contents-indices op de home; 0–2 worden door de hero gebruikt) | 5 (op een totaal van 5; alle indices voor `AcAbout`) |

**De `list`-prop is het meest substantiële verschil.** Het is een tweede tekstveld waar redacteuren een opsomming/lijst-paragraaf in kwijt kunnen. In Acato's component wordt het simpelweg als platte `<Paragraph>`-tekst gerenderd (geen `<ul>`-element), dus het is geen echte gestructureerde lijst — meer een tweede tekstblok dat naast de hoofdtekst staat. Maar het geeft redacteuren wel een tweede inhouds-slot dat wij niet hebben.

**Wat de tech lead extra moet weten:**
- **Adoptie van `list` raakt drie lagen tegelijk:**
    1. `AcAbout`-component: extra prop + render-regel toevoegen.
    2. `ac-home.js`: extra `contents[X]`-uitlees-regel + doorgeven aan de component.
    3. **CMS (OpenCatalogi pages-back-end):** de redacteur moet ergens dat extra veld kunnen invullen. De home-page-content is een geordende lijst van blokken (`contents[0..n]`); een extra blok toevoegen aan de home-pagina-template vereist een **content-actie**, geen schema-migratie. Wel: bestaande home-pagina-instances die de redacteur al heeft ingevuld, missen dat zesde blok — moet aangevuld worden voor het verschijnt.
- **Indices-shift heeft directe impact:** Acato's indices `[0..4]` voor `AcAbout` werken alleen omdat zij geen `hero-title`-veld via CMS hebben (zie 1.4-context — hun hero-titel staat hardcoded in de code). Wij gebruiken `contents[0]` voor de hero-titel én contents[1..2] voor andere homepage-velden, en `AcAbout` begint bij `contents[3]`. Als we Acato's structuur overnemen, moet onze hele home-content-mapping op de schop, óf we behouden onze offset en voegen alleen het `list`-veld toe op `contents[5]` (waarmee `link` naar `[6]` en `image` naar `[7]` schuift — geordende-lijst-migratie nodig).
- **Best-practice-render-guard niet kwijtraken.** Onze `if (!title || !content) return null` is geen detail; het voorkomt dat de sectie als lege blauwe (of witte) bak verschijnt bij lege CMS-content. Bij overname van Acato's component die guard expliciet behouden.
- **Blauwe achtergrond is een design-keuze, geen technisch verschil.** Eén prop toevoegen aan `<AcSection>`. Wel: de blauwe achtergrond ergens anders al gebruikt? Visuele consistentie checken voordat we 'm hier ook toepassen.

---

## 2. Zoekpagina

### 2.1 Resultaatkaarten

**Technisch concept:** zes type-specifieke kaart-componenten + een generieke fallback aan onze kant; één generieke kaart aan Acato's kant. De keuze raakt dus tegelijk **data-laag** (welke velden moeten op de kaart) én **render-laag** (welke component pakken we per resultaat).

**Onze switch** in `views/ac-search/ac-search.js` schakelt op `publication['@self'].schema.slug` en kiest een component:

| `schema.slug` | Component | Karakteristieke velden op de kaart |
|---|---|---|
| `product`, `module`, `organisatie` | `ConCardOrganisationApplication` | logo, type-label, organisatie-naam, referentie-componenten, `created`-datum |
| `moduleversie` | `ConCardModuleVersie` | versie, status, datum-in-ontwikkeling / in-gebruik / einde-ondersteuning / teruggetrokken, moduleUuid |
| `dienst` | `ConCardDienst` | category, aanbieder, status, type, `created` |
| `contactpersoon` | `ConCardContactpersoon` | voor-/tussen-/achternaam, functie, foto, e-mail, telefoon, organisatie |
| `gebruik` | `ConCardGebruik` | product, module, organisatie, referentie-componenten, status |
| `koppeling` | `ConCardKoppeling` | category, themes, navigateTo='publication' |
| anders | `AcSearchResult` (generiek) | titel, samenvatting, themes, type-label |

**Acato's variant** is één `<AcSearchResult {...publication} />`-aanroep voor alle resultaten — geen switch, geen schema-check. Werkt bij hen omdat hun datacontract uniform is en ze geen reden hebben gehad om type-eigenheden te modelleren.

**"Eén kaart" ≠ "informatie-armere kaart".** Een generieke component kan alle huidige inhoud blijven dragen via conditionele blokken of opt-in-props — bijvoorbeeld `{schema.slug === 'applicatie' && <GeschiktVoorBlock ... />}`, of een prop `showServiceTypeLabel` die alleen bij `dienst` op `true` staat. Het verschil tussen onze huidige zes kaarten en één rijke generieke kaart is dan een **organisatie-keuze**: zes losse componenten met elk hun eigen JSX, of één component met type-condities/props. Beide kunnen dezelfde uiteindelijke UI produceren.

**Trade-off:**
- **N losse kaarten houden (huidige aanpak).** Elke kaart is een vrijstaande component. Voordeel: geen interferentie tussen typen, makkelijk per-type uit te breiden. Nadeel: visuele consistentie tussen kaart-typen moet handmatig bewaakt worden; dezelfde wijziging (bv. plaats van de datum) moet in zes plekken doorgevoerd worden.
- **Eén configureerbare generieke kaart met type-condities/props.** Eén component die via `schema.slug` (of expliciete props) bepaalt welke optionele blokken renderen. Voordeel: één plek voor visuele consistentie en gedeelde features. Nadeel: refactor-werk, en de component zelf wordt complexer (meer condities); risico op een god-component als er steeds nieuwe type-eigenheden bij komen.
- **Acato's huidige minimale kaart overnemen.** Eén component zónder type-condities — alleen titel/samenvatting/datum/type. Dit *is* wel informatieverlies (logo, status, foto, "Geschikt voor:", versie-status etc. vervallen). Alleen aan te bevelen als de PO bewust kiest voor uniformiteit.

**Wat de tech lead extra moet weten:**
- **Blokkeer kaart-refactoring tot de softwarecatalogus-branch gemerged of geannuleerd is.** Tussentijdse herstructurering vernietigt werk in flight en levert merge-conflicten — los van of we naar één configureerbare kaart gaan of bij N blijven.
- **De huidige live dataset (performance-accept) emitteert effectief drie typen: applicatie, dienst, organisatie.** Het type-verschil tussen die drie is klein: alle drie hebben icon + titel + "Aangeboden door" + samenvatting + labels; applicatie krijgt een extra "Geschikt voor:"-blok vóór de labels; dienst krijgt een extra label voor dienst-type ná datum + publicatie-type. Dat zijn twee condities — niet zes parallelle kaarten — en suggereert dat optie 2 (één configureerbare kaart) op de huidige content-set met beperkte conditional-logica realistisch is. Onze zes-kaarten-switch dekt typen die in de live data nu niet allemaal voorkomen.
- Onze kaart-keuze is **afhankelijk van een rijk datacontract** dat ons backend levert. Zie 2.5 hieronder — de publication-request stuurt `_extend: '_schema,_register,_names'` en de store roept `enrichPublications` aan om UUIDs naar objecten te resolven. Zonder die enrichment kunnen de meeste type-eigenheden niet weergegeven worden, ongeacht of we één of zes kaarten gebruiken. De infrastructuur achter de data blijft hetzelfde tussen optie 1 en optie 2.

---

### 2.2 Filters

**Technisch concept:** twee structureel verschillende architecturen, niet een gradueel verschil in welke filters er staan.

**Ons systeem** (`molecules/con-facets-filters/con-facets-filters.js`, ~920 regels):
- Onafhankelijke `fetchFacets()`-call op elke URL-wijziging, met `_facets: 'extend'` en `_limit: 0`.
- Bouwt filter-groepen on-the-fly uit `response.facets` + `response.facetable`-metadata. Backend bepaalt welke filters renderen.
- Resolveert UUID's automatisch naar leesbare labels (lazy lookup tegen de object-store).
- Heeft "synthetische buckets" voor actieve filters met telling 0 (zodat een gekozen waarde niet uit de UI verdwijnt zodra je 'm aanvinkt).
- Bevat een **facet-zoekveld** waarmee de gebruiker kan filteren *binnen* een facet-groep met veel waardes.
- Toont actieve filters als chips bovenaan (`ConActiveFilters`) met een "wis alles"-knop.

**Acato's systeem** (`molecules/ac-search-filters/ac-search-filters.js`, ~140 regels):
- Drie hardcoded filter-componenten in vaste volgorde: `<AcSearchDate />` (altijd), `<AcSearchCategories />` (alleen als `all_categories.length > 0`), `<AcSearchThemes />` (alleen als `all_themes.length > 0`).
- Categorieën en thema's komen mee uit de zoekresponse-aggregations, niet uit een aparte facets-call. Eén roundtrip in plaats van twee.
- Geen actieve-filter-chips, geen wis-alles, geen UUID-resolving, geen synthetische buckets, geen facet-zoekveld.

**Datum-filter: code-vergelijking (twee verschillen tegelijk):**

| | Param-vorm | Sleutel-naam |
|---|---|---|
| **Ons** (`store.setQueryDate` → URL) | `?published[after]=…&published[before]=…` (flat) | `after` / `before` |
| **Acato** | `?@self[published][gte]=…&@self[published][lte]=…` (genest onder `@self`) | `gte` / `lte` |

Acato heeft de OpenCatalogi-backend zelf geschreven; hun param-vorm is daarmee waarschijnlijk wat de backend echt accepteert. **Onze param-vorm is hoogstwaarschijnlijk een stille bug:** ons date-component bestaat (`components/ac-search-date/`), zit niet in onze filters-molecule, en als iemand 'm activeert zal de backend de waarden waarschijnlijk niet honoreren. Runtime-verificatie nodig: één request naar het zoek-eindpunt met `published[after]=2020-01-01` en kijken of het filter daadwerkelijk effect heeft.

**Twee opties (vervangen is geen optie):** ons facet-systeem dekt al wat Acato met hun hardcoded categorieën/thema's-filters doet. Het enige gat is **het datumfilter**. "Vervangen door Acato's drie filters" zou een strikte downgrade zijn (Type, Organisatietype, Geregistreerd door, Diensttype en alle facet-gedreven groepen zouden vervallen) en is daarom niet in de keuze-lijst opgenomen.

- **Status quo houden.** Geen datumfilter — onveranderd.
- **Datumfilter toevoegen naast facetten.** Twee paden:
    1. **Acato's `@self[published][gte/lte]`-vorm overnemen** in onze `setQueryDate`. Triviale aanpassing in `stores/publications.store.js` en in `components/ac-search-date/ac-search-date.js` (lees-kant). Wel: nieuwe URL-vorm betekent dat bestaande gedeelde zoek-URL's met datumparameters niet meer werken (geen back-compat-shim nodig — er waren waarschijnlijk geen dergelijke URL's in productie omdat het filter niet zichtbaar was). Het bestaande `AcSearchDate`-component los naast `<ConFacetsFilters />` renderen in `ac-search-filters.js` — UI-only, paar regels.
    2. **Een date-bucket toevoegen aan de facet-laag.** Vereist een nieuw bucket-type in `ConFacetsFilters`. Groter werk; alleen relevant als de backend datum als facet teruggeeft.

**Wat de tech lead extra moet weten:**
- Bekende technische schuld in onze publications-store: **75 console-statements** in `publications.store.js` (vs. 0 in Acato), waaronder `console.group`/`console.info`-paren rond `setQueryDate`, `fetchPublications`, `fetchFacets`, enrichment-flow. Niet in de PO-keuze meenemen; aparte cleanup-pass.
- **AbortController-pad alleen aan onze kant.** We cancelen stale requests bij snelle filter-wijzigingen (~21 referenties in de store). Acato heeft dit niet — bij hen kunnen requests out-of-order terugkomen. Bij eventuele migratie naar Acato's eenvoudigere fetch-laag verliezen we deze race-condition-bescherming.
- **Twee fetch-passes vs. één.** Onze view roept op elke URL-wijziging zowel `fetchPublications()` als `fetchFacets()` aan (parallel). Acato roept eenmalig `fetchAggregations()` aan op mount, en alleen `fetchPublications()` op URL-wijziging — aggregations gelden voor hen voor de hele sessie. Op een grote dataset is onze tweede call zwaarder dan strikt nodig (we vragen facets opnieuw op voor élke zoekopdracht, inclusief paginering).

---

### 2.3 Auto-zoek tijdens typen

**Technisch concept:** wij hebben een debounced auto-submit op de zoekbalk (`ac-search-box.js`); Acato niet.

**Bij ons** (`components/ac-search-box/ac-search-box.js:32-68`):
- 300 ms debounce na laatste toetsaanslag.
- Eerste render-guard (`isFirstRender`) voorkomt zoeken op mount.
- Defensive check: alleen submitten als `searchQuery !== defaultValue`, om opnieuw zoeken te voorkomen wanneer de component met URL-parameters initialiseert.
- Cleanup van de timeout bij unmount.
- Optionele `disableAutoSearch`-prop om het gedrag uit te schakelen waar nodig (in de homepage-hero bijvoorbeeld).

**Bij Acato** (`ac-search-box.js:24-40`): pure form-submit. Geen `useEffect`, geen timer, geen refs. Bevestigt pas op klik op de zoek-knop of op Enter.

**Wat de tech lead extra moet weten:**
- **Backend-belasting per typende gebruiker is hoger bij ons.** Bij een zoekterm van 8 tekens, langzaam getypt, kunnen er 7-8 requests vertrekken. Op snelle typers blijft het bij 1 (debounce vangt af). Voor productie geen probleem zolang het zoek-endpoint snel is en niet rate-limited. Bij langzamere backends (development of staging) kan auto-search merkbaar minder responsief voelen dan submit-only — paradoxaal, maar je ziet de oude resultaten zichtbaar verversen.
- **`disableAutoSearch=true`** wordt nu alleen door de homepage-hero gebruikt (om te voorkomen dat de homepage de pagina-overgang doet voor de gebruiker klaar is met typen). Als de PO besluit auto-search uit te zetten op de zoekpagina, hoeft het component zelf niet aangepast te worden — alleen `disableAutoSearch` op de juiste plek meegeven.
- **De 300 ms-waarde** komt uit een eerdere tune-down van 750 ms (zie comment op regel 60). Heel langzaam typende gebruikers kunnen daarmee onbedoeld een request triggeren halverwege hun zoekterm. Geen actie nodig, wel goed om te weten bij future-feedback.

---

### 2.4 Toegankelijkheid: skip-link en DOM-volgorde

**Technisch concept:** beide repos hebben een SkipLink — maar in verschillende scope, met verschillende targets, en ónze versie heeft twee concrete bugs die fixed moeten worden.

**De twee implementaties naast elkaar:**

| | Plek | Target | Label | Render |
|---|---|---|---|---|
| **Ons** ([`ac-header.js:208`](../src/components/ac-header/ac-header.js#L208)) | Globaal in `AcHeader` — op elke pagina | `#main` → `<main id='main'>` in `App.web.js:253` (wrapt alles onder de header) | "Direct naar de inhoud" | `<p><a class="utrecht-skip-link utrecht-skip-link--visible-on-focus">` via `@utrecht/component-library-react` |
| **Acato** ([`views/ac-search/ac-search.js:149`](../../tilburg-woo-ui_acato/src/views/ac-search/ac-search.js#L149)) | Alleen in de zoekpagina-view | `#search-results` → de resultaten-`<AcFlex>` | "Ga direct naar zoekresultaten" | Zelfde `<SkipLink>`-component |

Op de zoekpagina landt ónze skip-link tussen de broodkruimels en de blauwe zoekbalk-kaart (vóór filters en resultaten); Acato's bij de eerste resultatenkaart. Twee verschillende design-intenties — globaal skip-to-main vs. page-specific skip-to-results.

**Bug #1 — `<base href="/">` breekt fragment-only hrefs.** In [`public/index.html:64`](../public/index.html#L64) staat `<base href="/" />`. Per HTML-spec resolven fragment-only hrefs (`<a href="#main">`) tegen de base-URL i.p.v. tegen het huidige document. Op `/zoeken` resolvet `<a href="#main">` dus naar `/#main` → React Router triggert een navigatie naar de homepage met `#main` als hash. Gebruiker landt op homepage, niet op de hoofdinhoud van de huidige pagina.

**Voorgestelde fix voor bug #1:**

```js
// Was (ac-header.js:208):
<SkipLink id='skip-link' href='#main'>

// Wordt:
<SkipLink id='skip-link' href={`${location.pathname}${location.search}#main`}>
```

`useLocation` is al geïmporteerd en `location` is al gedestructureerd in dezelfde component — geen nieuwe imports. Effect:
- `${location.pathname}` maakt het pad absoluut → `<base>`-resolutie is een no-op.
- `${location.search}` behoudt de query-string → React Router ziet pathname en search ongewijzigd, dus alleen hash verandert, geen remount, geen verlies van filters/zoekopdracht.
- Op `/zoeken?_search=foo&_page=2` rendert de href als `/zoeken?_search=foo&_page=2#main`.

**Reikwijdte van bug #1:** dit raakt **elke** fragment-only `<a href="#...">` in onze app, niet alleen deze SkipLink. Acato heeft dezelfde `<base>`-tag ([`tilburg-woo-ui_acato/public/index.html:60`](../../tilburg-woo-ui_acato/public/index.html#L60)) en heeft de workaround ook toegepast in hun zoekpagina-SkipLink (`href={`${location.pathname}#search-results`}`), maar zónder `location.search` — dus zij hebben een mini-regressie waar wij die niet hebben.

**Aparte schoonmaakactie (los van deze fix):** de `<base href="/">` is in moderne React-SPA's meestal cargo-cult — interne navigatie loopt via `<Link to="/...">` (absoluut), externe links zijn volledige URL's, assets worden via de bundler ingeladen. Weghalen zou bug #1 in één klap oplossen voor alle fragment-links. Risico: CMS-geleverde HTML of relatieve `<img>`/`<a>`-references zonder leading slash zouden anders resolven. Niet bundelen met de SkipLink-fix; aparte PR met smoke-test.

**Bug #2 — spatiebalk activeert de skip-link niet (ARIA-mismatch, niet WCAG).** De `<SkipLink>` uit `@utrecht/component-library-react` rendert een platte `<a>` ([`index.mjs:2659-2671`](../node_modules/@utrecht/component-library-react/dist/css-module/index.mjs#L2659)). Browser-default voor `<a>`: alleen Enter activeert, spatie niet (dat is button-gedrag).

Strict gezien is dit **geen WCAG-overtreding** — een anchor is een legitiem semantic element voor een skip-link en WCAG geeft geen voorschrift voor spatie-activatie op anchors. De pijn zit in **ARIA-conventies**: onze SkipLink is gestyled als een knop (rechthoek met achtergrondkleur, padding, hover-state), en hulptechnologie + ervaren toetsenbordgebruikers verwachten dat iets dat eruitziet als een knop ook met zowel Enter als spatie te activeren is. De semantische rol (anchor) en de visuele rol (button) komen niet overeen.

**Fix-opties voor bug #2** (van licht naar zwaar):

1. **`role="button"` + `onKeyDown`-handler.** Houdt het anchor-element maar geeft het ARIA-button-semantiek + bijbehorend keyboard-gedrag:
   ```js
   const handleKeyDown = (e) => {
     if (e.key === ' ') {
       e.preventDefault(); // voorkomt scrollen-met-spatie
       e.currentTarget.click();
     }
   };

   <SkipLink
     id='skip-link'
     role='button'
     href={`${location.pathname}${location.search}#main`}
     onKeyDown={handleKeyDown}
   >
   ```
   Minimale wijziging; behoudt URL-update via href; lost de ARIA-mismatch op (visuele knop = ARIA-knop).
2. **Vervang door `<button>` met handmatige `scrollIntoView` + focus.** Schoner semantisch model — element is écht een knop, met natuurlijke keyboard-ondersteuning. Verliest URL-update (geen hash in URL) en vereist meer code (focus-management op het target-element).
3. **Visueel terug naar link-style.** Geen achtergrondkleur, geen padding — pure tekstlink. Dan past de anchor-semantiek wel bij wat de gebruiker ziet en is spatie-activatie niet verwacht. Vereist design-akkoord.

Aanbeveling: optie 1. Eén handler-regel + één role-attribute.

**Reikwijdte van bug #2:** zit in de upstream-componenten-bibliotheek, dus elke `<SkipLink>` in onze app (en in Acato's app) heeft dit. Onze app heeft er momenteel maar één, dus een lokale wrapper of een handler-prop op het ene call-site is voldoende. Als we ooit upstream willen bijdragen, is dat een aparte issue richting `@utrecht/component-library-react`.

---

## 3. Publicatiepagina

### 3.1 Layout per documenttype → richting één generieke layout

**PO-richting:** committed naar één generieke (schema-gedreven) layout op termijn. Niet als big-bang; per type bekijkend of het schema-gestuurd afgehandeld kan worden.

**Technisch concept:** dezelfde architecturale spanning als bij de resultaatkaart (2.1), maar met meer types en grotere views. Acato heeft één publicatie-layout omdat hun datacontract uniform is. Wij hebben **dertien layouts** — default (schema-gedreven), softwarecatalogus, organisation, product, module, moduleversie, koppeling, dienst, gebruik, contactperson, woo-verzoek, formulier, plus de ongebruikte `default-old`/`default1` orphans — omdat we semantisch verschillende documenttypes serveren met elk hun eigen rijke features (versie-tabs, contact-grids, compliance-blokken, standards-tabel, etc.).

**Dispatch** ([`views/ac-publication/ac-publication.js:160-198`](../src/views/ac-publication/ac-publication.js#L160-L198)). Twee-laags switch:
1. Eerst `get_single?.catalog?.title === 'Softwarecatalogus'` → softwarecatalogus-view.
2. Anders schakelt op `publicationType.title` (Softwarecatalogus, Formulier, Woo-verzoek/besluit) en valt terug op `@self.schema.slug.toLowerCase()` voor de overige typen (organisatie, suite, module, moduleversie, koppeling, gebruik, dienst, contactpersoon). Geen match → `AcPublicationDefault` (schema-gedreven generic layout).

De default-view leunt al op een schema-driven render (`formatBySchema`, `sortPropertiesByOrder`). De type-specifieke views bestaan omdat schema-driven alléén niet voldoende is voor die rijke layouts.

**Convergentiepad (geen big-bang):**
- Per type bekijken of het schema-gestuurd afgehandeld kan worden, beginnen bij de simpelste (formulier, woo-verzoek). Continue verbetering.
- Type-specifieke features die *niet* schema-gedreven kunnen (versie-tabs, contact-grids, compliance-blokken, standards-tabel) ofwel opnemen in default ofwel slopen na PO-overleg per geval.
- Volledige convergentie blijft afhankelijk van wat de softwarecatalogus-branch nodig heeft — die leunt actief op de type-specifieke views. **Coördinatie met die branch is voorwaarde**; tussentijdse big-bang-refactor levert merge-conflicten en verloren werk.

**Wat de tech lead extra moet weten:**
- **`ac-publication-default-old.js` is dode code.** Ligt onaangeroerd in de map. Los opruimen.
- **`ac-publication-default1.js` is ook dode code** — orphan default-view die nergens vanuit de router wordt aangeroepen, met dependencies op verouderde mock-data (`MOCK_CONCEPTS`). Idem opruimen.
- **Twee related-tabs-implementaties coëxisteren.** [`con-related-tabs.js`](../src/molecules/con-related-tabs/con-related-tabs.js) (~613 regels, ouder) en `con-related-tabs-new.js` (~439 regels, current). De softwarecatalogus-variant gebruikt de oude; de overige type-specifieke views gebruiken `new`. Consolideren naar één is onafhankelijke schoonmaakactie, los van convergentie.
- **Acato's "generiek" werkt mede omdat ze veel minder content-types hebben.** Onze schaal-factor 13× is geen detail; het is **de reden** dat we hier zijn.
- **Niet beginnen vóór 3.3 is opgelost.** De dode wrapper-bug (zie 3.3) staat op precies de plek waar convergentie-werk eindigt — een `return` aan het eind van de router. Eerst die router-flow opschonen, dan pas type-specifieke views consolideren.

---

### 3.2 Deel-modal ("Deel deze pagina")

**PO-keuze (open):** modal alsnog inbouwen of geen deel-knop op publicatiepagina's?

**Technisch concept:** een feature die **Acato post-fork heeft afgebouwd**. De CSS voor de copy-button-animatie zit in onze gedeelde stylesheet (`ac-publication.scss`) — meegenomen bij de fork als scaffolding-rest — maar de UI is nooit aangesloten. Activeren is dus geen ontwerp-werk, alleen wiring.

**Hoe Acato het rendert** ([`tilburg-woo-ui_acato/src/views/ac-publication/ac-publication.js:399-445`](../../tilburg-woo-ui_acato/src/views/ac-publication/ac-publication.js#L399-L445)):
- Knop "Deel deze pagina" net na de hoofd-content.
- Klik opent `<AcModal>` met titel "Dit delen" (via `LABELS.SHARE_MODAL`).
- Modal-inhoud: paragraaf "Kopieer de link naar uw klembord…" + read-only `<Textbox>` met `${window.location.origin}/publicatie/${get_single?.id}` + primary-action kopiëer-knop.
- Klik op kopiëer-knop: `navigator.clipboard.writeText(url)` in try/catch, zet `copyStatus` op `'copied'` of `'error'`, auto-reset na 5s.
- Visuele feedback: check-icoon + particle-burst-animatie (CSS in `ac-publication.scss`).
- A11y: `<div role='status' aria-live='polite'>` kondigt "De link is gekopieerd…" of foutmelding aan voor schermlezers.

**Bij ons** ([`tilburg-woo-ui/src/views/ac-publication/`](../src/views/ac-publication/)):
- Geen deel-knop in enige variant.
- CSS-regels voor `.copy-button` + particle-animatie staan wel in `ac-publication.scss` — meegekomen bij de fork, niet aangeroepen door enig component. **Dode CSS.**
- Geen store-state of methode voor "deel deze pagina". Inbouwen is from-scratch, niet uitbreiden.

**Wat de tech lead extra moet weten:**
- **Adoptie is enkele uren werk.** Knop + modal-component overnemen uit Acato's `ac-publication.js`, lokale state voor `copyStatus`, `navigator.clipboard` met fallback (clipboard-API werkt alleen op https/localhost — voor http-omgevingen `document.execCommand('copy')` als backup). Geen wijzigingen aan de store nodig.
- **In welke type-specifieke views verschijnt de knop?** Als de PO ja zegt: per variant overnemen of in een gedeelde "footer-actions"-component extraheren die alle varianten kunnen renderen. Tweede is netter maar vereist een mini-refactor van de dertien views — overweeg dit te bundelen met de convergentie van 3.1.
- **De CSS-regels gaan ervan uit dat er een `.particles` + `.particles-inner` div in de markup zit.** Die divs renderen wij niet. Bij activatie: Acato's markup-structuur volgen, anders is de animatie alsnog dood.
- **Onafhankelijke schoonmaakactie:** als de PO "skip" zegt, **alsnog de dode CSS opruimen** uit `ac-publication.scss`.

---

### 3.3 Dode `ConGlossaryHighlight`-wrapper op de publication-router

**PO-keuze:** geen. Dit is een bug, niet een feature-decision. Direct aan deze tech-keuze-lijst toegevoegd omdat ze blokkeert wat op andere pagina's wel werkt.

**Technisch concept:** de router in [`views/ac-publication/ac-publication.js:160-205`](../src/views/ac-publication/ac-publication.js#L160-L205) heeft een glossary-highlight-wrapper aan het eind staan die nooit wordt bereikt. Daardoor worden begrippen in de paginatekst niet gemarkeerd — een feature die wel werkt op de homepage en op content-pagina's werkt op publicatiepagina's dus stil niet.

**Reproductie:**

```js
if (get_single?.catalog?.title === 'Softwarecatalogus') {
  return <AcPublicationSoftwarecatalogus />;
} else {
  switch (...) {
    case 'Softwarecatalogus': return <AcPublicationSoftwarecatalogus />;
    // ... 12 andere returns ...
    default:
      // ... per slug returns ...
      return <AcPublicationDefault schema={schema} />;
  }
};

return (
  <ConGlossaryHighlight as='div'>
    {renderPublicationView()}   // <-- ReferenceError als ooit bereikt
  </ConGlossaryHighlight>
);
```

Elke tak van de if/else en switch heeft een eigen `return`. Het component exit altijd voordat regel 201 wordt geraakt. Twee bugs tegelijk:
1. **Onbereikbare wrapper** — de hele `<ConGlossaryHighlight>`-regel is dode code.
2. **Niet-bestaande functie-aanroep** — `renderPublicationView()` is nergens gedeclareerd. Áls het pad ooit bereikt werd, zou het een `ReferenceError` gooien. Bewijs dat het pad inderdaad onbereikbaar is — anders zou de pagina al lang crashen.

**Voorgestelde fix:** de logica refactoren naar één `return` aan het eind via een lokale variabele:

```js
let view;
if (get_single?.catalog?.title === 'Softwarecatalogus') {
  view = <AcPublicationSoftwarecatalogus />;
} else {
  const publicationType = get_single?.['@self']?.schema?.slug?.toLowerCase();
  switch (get_single?.publicationType?.title) {
    case 'Softwarecatalogus': view = <AcPublicationSoftwarecatalogus />; break;
    // ... etc ...
    default:
      if (publicationType === 'organisatie') view = <AcPublicationOrganisation />;
      else if (publicationType === 'suite') view = <AcPublicationProduct />;
      // ... etc ...
      else view = <AcPublicationDefault schema={schema} />;
  }
}

return (
  <ConGlossaryHighlight as='div'>
    {view}
  </ConGlossaryHighlight>
);
```

**Alternatief** (niet aanbevolen): de wrapper *binnen* elke type-specifieke view zelf zetten. Schaalt slechter (13× toevoegen, makkelijk om er één te vergeten bij een nieuwe variant) en wijkt af van hoe het op andere pagina-types werkt.

**Wat de tech lead extra moet weten:**
- **Geen Acato-feature.** Acato heeft geen inline-markering, alleen een drawer-lijst met begrippen. Onze inline-markering is een eigen post-fork uitbreiding die op andere pagina-types (home, content) wél werkt — dit is een lokale regressie op de publicatie-router.
- **Test-pad na fix:** open een publicatie waarvan de tekst minstens één bekend begrip uit de glossary-store bevat; bevestig dat het begrip gemarkeerd is in de tekst en dat klikken de drawer opent met dat begrip uitgeklapt.
- **Volgorde t.o.v. 3.1.** Eerst de router-flow opschonen via deze fix (één return, geen onbereikbare code, geen onbekende functie-aanroep). Pas dan convergentie van de dertien type-specifieke views aanpakken — anders refactor je dezelfde router-code twee keer.
- **Volgorde t.o.v. Keuze 1.1 (Begrippenlijst-knop op homepage).** Die fix raakt het *openen* van de drawer; deze 3.3-fix raakt het *vullen* van de "Deze pagina"-context. Twee verschillende bugs in twee verschillende lagen — beide moeten gefixt worden voor de glossary end-to-end werkt vanaf een publicatiepagina. Niet afhankelijk maar wel complementair.

---

## Samenvatting voor de tech lead

**Committed werkitems (PO heeft besloten — geen keuze meer):**
1. **Begrippenlijst-knop fixen** (Keuze 1.1). Drawer opent niet bij klik; debug-traject store-action vs. drawer-mount.
2. **Secundaire navigatiebalk** blijft op alle pagina's (Keuze 1.2). Niets te doen.
3. **Convergentie van publication-views richting één generieke (schema-gedreven) layout** (3.1). Incrementeel, per type. Voorwaarde: softwarecatalogus-branch eerst gemerged of afgerond + 3.3 eerst opgelost.
4. **Dode `ConGlossaryHighlight`-wrapper op de publication-router fixen** (3.3). Router-flow naar één `return` refactoren; raakt ook de niet-bestaande `renderPublicationView()`-aanroep.

**Eén keuze met merge-risico tegen werk in flight:**
- Keuze 2.1 (resultaatkaarten genericiseren). **Blokkeren** zolang de softwarecatalogus-branch nog leeft. Convergentie van publication-views (3.1) heeft hetzelfde merge-risico maar is al committed — coördineer met de branch-houder.

**Drie nog-open keuzes met een datacontract-component (homepage):**
- Keuze 1.3 ("General"-kaart). Beide repos delen de UI-component, verschillen zitten in endpoint + datacontract + bedoeling (themadossiers vs. documentsoorten). Bron-verificatie van de huidige one-thema-situatie is in elk geval eerste stap; optie 2 of 3 vereist contract- en/of CMS-werk.
- Keuze 1.4 (Uitgelicht-blok). Wij missen de hele data-laag (`fetchLatestPublications` + getters) en hebben een dode UI-shell. PO moet eerst beslissen: redactionele `featured`-vlag of altijd-automatisch laatste-N. Daarna: store-action overnemen + lege `AcFeatured` vervangen + drie regels in `ac-home.js`. Verifieer of onze publications-backend een `featured`-filter accepteert.
- Keuze 1.5 (Welkom/Over-sectie). Vooral: ontbreekt bij ons het extra `list`-tekstveld dat Acato post-fork heeft toegevoegd. Adoptie raakt drie lagen (component, home-uitlees, CMS-content-index). Plus secundair: blauwe achtergrond + onze conditional-render-guard behouden.

**Twee nog-open keuzes op de zoekpagina:**
- Keuze 2.2 (filters). Ons facet-systeem dekt al wat Acato met hardcoded categorieën/thema's-filters doet — het enige gat is een datumfilter. PO-keuze: status quo of datumfilter erbij. Vervangen door Acato's filters is geen optie (downgrade) en is uit de keuze-lijst gehouden. Toevoegen vereist URL-param-fix omdat onze datumkeys (`published[after/before]`) waarschijnlijk niet door de backend worden herkend; Acato stuurt `@self[published][gte/lte]`. **Runtime-verifiëren los van de PO-keuze.**
- Keuze 2.3 (auto-zoek). Behouden (sneller maar meer backend-calls) of submit-only (zoals Acato). `disableAutoSearch`-prop al aanwezig — overstap is configuratie, geen herbouw.

**Twee bugs op de zoekpagina (geen PO-keuze, gewoon fixen):**
- 2.4 bug #1: skip-link navigeert per ongeluk naar homepage door `<base href="/">`-quirk. Voorgestelde fix is één regel in `ac-header.js:208`: `href={`${location.pathname}${location.search}#main`}`. Raakt ook alle andere fragment-only `<a href="#...">` in de app — overweeg `<base>`-tag weghalen in aparte PR.
- 2.4 bug #2: skip-link werkt niet met spatiebalk — niet een WCAG-overtreding maar wel een ARIA-mismatch (gestyled als knop, gerendered als anchor). Fix: `role='button'` + `onKeyDown`-handler op de SkipLink die op spatie `e.preventDefault()` doet en `click()` aanroept. Acato heeft dezelfde bug — zit upstream in `@utrecht/component-library-react`.

**Eén nog-open keuze op de publicatiepagina:**
- Keuze 3.2 (Deel-modal). Adoptie ~paar uur werk; modal-markup uit Acato overnemen, copy-handler met `navigator.clipboard`, dode CSS-animatie wordt dan werkelijk gebruikt. Geen merge-risico met de softwarecatalogus-branch. Side-effect: als PO "skip" zegt, alsnog de dode CSS opruimen.

**Onafhankelijke opschoonpunten gevonden tijdens analyse (los van PO-keuzes):**
- `ac-publication-default-old.js` is vermoedelijk dode code.
- `ac-publication-default1.js` is ook dode code — orphan default-view die nergens vanuit de router wordt aangeroepen, met `MOCK_CONCEPTS`-dependency.
- Twee related-tabs-implementaties in publicatie-views (`con-related-tabs.js` ~613 regels vs. `con-related-tabs-new.js` ~439 regels). Softwarecatalogus gebruikt de oude; de overige type-specifieke views de nieuwe. Consolideren naar één.
- Onze `ac-featured.js` is dode code zolang Keuze 1.4 nog niet "activeren" is — rendert drie lege `<AcSearchResult />`, wordt nergens geïmporteerd. Mag los gesloopt worden óf in één klap vervangen als 1.4 vooruit gaat.
- `paragraph`- en `content`-mappings in `themes.store.js` zijn dood (worden door `AcCardCategory` niet gelezen).
- `image`-prop in `AcCardCategory` is dood (gedestructureerd, niet gebruikt in JSX).
- **75 console-statements** in `publications.store.js` (vs. 0 in Acato), waaronder een `console.group`/`console.info`-paar rond `setQueryDate`. Maakt devtools-output op de zoekpagina onleesbaar. Aparte cleanup-pass.
- **Datumfilter URL-formaat verifiëren back-end-side.** Onze code stuurt `published[after/before]`, Acato stuurt `@self[published][gte/lte]`. Latente bug onafhankelijk van Keuze 2.2 — runtime-check kost minuten.
- **`AcLink` mist een echte external-modus.** Het component gebruikt `react-router-dom`'s `<Link>` voor álle URL's, ook absolute externe URL's. Dat is een misbruik van `<Link>` (die alleen voor interne SPA-navigatie bedoeld is) en levert externe links zonder `target="_blank"` of `rel="noopener noreferrer"`. Onze homepage-kaart omzeilt dit door bij `isExternal` direct een plain `<a>` te renderen — maar elders in de codebase waar `AcLink` voor externe URL's wordt gebruikt is dit een latente bug. Aanrader: `AcLink` zelf de external-tak laten dragen. Voorwaarde als we Acato's categorieën-model overnemen.
- Dode copy-button-CSS in `ac-publication.scss` (`.copy-button`, `.particles`, `.particles-inner`) — meegekomen bij de fork, niet aangeroepen. Opruimen als Keuze 3.2 "skip" wordt, behouden als 3.2 "inbouwen" wordt.
