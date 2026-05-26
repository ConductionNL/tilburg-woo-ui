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
    - [1.4 Uitgelicht-blok](#14-uitgelicht-blok)
    - [1.5 Welkom/Over-sectie (AcAbout)](#15-welkomover-sectie-acabout)
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

**Technisch concept:** Keuze 1.1 is nu "behouden + fixen", dus de feature blijft. Hier gaat het puur over plaatsing. Onze huidige floating-button hangt globaal in de App-shell, zichtbaar op elke publieke pagina. Verplaatsen naar de samenvattingskaart vereist dat er een **gedeelde samenvattingskaart-component** is — die is er niet in dezelfde vorm. Elk van de dertien publication-views heeft zijn eigen header/samenvattings-blok. "Naar de samenvatting verplaatsen" betekent dus óf 13× toevoegen, óf eerst een gedeelde samenvattings-component extracten (dat is een refactor los van deze PO-keuze).

**Trade-off:**
- **Rechtsonder houden.** Geen wijziging.
- **Naar samenvattingskaart verplaatsen.** Feitelijk een **vóór-refactor van de publication-views** als je het netjes wilt — er is geen gedeelde samenvattings-component om in te haken.
- **Beide plekken.** Alleen toevoegen, niets weghalen. Risico: UX-dupliek (dezelfde actie op twee plekken). Vraag PO of dat acceptabel is — sommige design-systemen vinden dat oké, andere niet.

**Wat de tech lead extra moet weten:**
- Eerst de **dode-wrapper-bug uit 3.1** oplossen voordat hier werk in gaat. Anders bouw je een knop op een plek waar de glossary-context op de publicatiepagina sowieso niet werkt.

---

## Samenvatting voor de tech lead

**Drie committed werkitems (PO heeft besloten — geen keuze meer):**
1. **Begrippenlijst-knop fixen** (Keuze 1.1). Drawer opent niet bij klik; debug-traject store-action vs. drawer-mount.
2. **Secundaire navigatiebalk** blijft op alle pagina's (Keuze 1.2). Niets te doen.
3. Daarnaast los oppakken: de dode `ConGlossaryHighlight`-wrapper op de publication-view (Keuze 3.1, raakt 3.2) en verifiëren of het datum-filter URL-formaat (Keuze 2.2 achtergrond) daadwerkelijk iets uithaalt back-end-side.

**Twee keuzes met merge-risico tegen werk in flight:**
- Keuze 2.1 (resultaatkaarten genericiseren) en Keuze 3.1 (publicatiepagina genericiseren). **Blokkeren** zolang de softwarecatalogus-branch nog leeft.

**Drie nog-open keuzes met een datacontract-component:**
- Keuze 1.3 ("General"-kaart). Beide repos delen de UI-component, verschillen zitten in endpoint + datacontract + bedoeling (themadossiers vs. documentsoorten). Bron-verificatie van de huidige one-thema-situatie is in elk geval eerste stap; optie 2 of 3 vereist contract- en/of CMS-werk.
- Keuze 1.4 (Uitgelicht-blok). Wij missen de hele data-laag (`fetchLatestPublications` + getters) en hebben een dode UI-shell. PO moet eerst beslissen: redactionele `featured`-vlag of altijd-automatisch laatste-N. Daarna: store-action overnemen + lege `AcFeatured` vervangen + drie regels in `ac-home.js`. Verifieer of onze publications-backend een `featured`-filter accepteert.
- Keuze 1.5 (Welkom/Over-sectie). Vooral: ontbreekt bij ons het extra `list`-tekstveld dat Acato post-fork heeft toegevoegd. Adoptie raakt drie lagen (component, home-uitlees, CMS-content-index). Plus secundair: blauwe achtergrond + onze conditional-render-guard behouden.

**Onafhankelijke opschoonpunten gevonden tijdens analyse (los van PO-keuzes):**
- `ac-publication-default-old.js` is vermoedelijk dode code.
- Onze `ac-featured.js` is dode code zolang Keuze 1.4 nog niet "activeren" is — rendert drie lege `<AcSearchResult />`, wordt nergens geïmporteerd. Mag los gesloopt worden óf in één klap vervangen als 1.4 vooruit gaat.
- `paragraph`- en `content`-mappings in `themes.store.js` zijn dood (worden door `AcCardCategory` niet gelezen).
- `image`-prop in `AcCardCategory` is dood (gedestructureerd, niet gebruikt in JSX).
- **`AcLink` mist een echte external-modus.** Het component gebruikt `react-router-dom`'s `<Link>` voor álle URL's, ook absolute externe URL's. Dat is een misbruik van `<Link>` (die alleen voor interne SPA-navigatie bedoeld is) en levert externe links zonder `target="_blank"` of `rel="noopener noreferrer"`. Onze homepage-kaart omzeilt dit door bij `isExternal` direct een plain `<a>` te renderen — maar elders in de codebase waar `AcLink` voor externe URL's wordt gebruikt is dit een latente bug. Aanrader: `AcLink` zelf de external-tak laten dragen. Voorwaarde als we Acato's categorieën-model overnemen.
