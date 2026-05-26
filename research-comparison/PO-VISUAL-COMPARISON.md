# PO Vergelijking — Ons vs Acato

> **TL;DR — niet rebasen op Acato's laatste versie.** Wij hebben in de praktijk alles wat zij hebben (en meer), terwijl hun app niet volledig werkt. Een rebase levert geen winst op en kost werkende functionaliteit.

**Voor:** Product Owner — Conduction (tilburg-woo-ui).
**Vergelijkt:** onze versie van de Tilburg WOO-portaal tegen Acato's originele versie.
**Scope:** wat een gebruiker *ziet, doet en ervaart* — zowel visueel (layout, teksten, plek van knoppen) als functioneel (wat werkt, wat niet, wat ontbreekt, wat extra is). Vanuit het perspectief van de eindgebruiker, niet-technisch.
**Buiten scope:** interne refactors, dataflow, store-architectuur, codestijl, API-shapes.

---

## Inhoudsopgave

1. [Homepage](#1-homepage)
2. [Zoekpagina (filters, sortering, paginering)](#2-zoekpagina)
3. [Publicatiepagina](#3-publicatiepagina)
4. [Beheeromgeving (alleen wij)](#4-beheeromgeving-alleen-wij)
5. [Onderwerpen-, over-ons- en andere contentpagina's](#5-onderwerpen--over-ons--en-andere-contentpaginas)

---

## 1. Homepage

**Waar:** `/` (de landingspagina).

### Screenshots (2026-05-22)

- Ons: ![onze homepage](./images/screencapture-localhost-3000-2026-05-22-14_48_02.png)
- Acato: ![acato homepage](./images/screencapture-localhost-3001-2026-05-22-14_49_47.png)

### PO walkthrough-aantekeningen (2026-05-22)

- **"Begrippenlijst"-knop**, rechtsonder in het scherm. Wij hebben deze knop; Acato niet. De knop werkt momenteel niet — klikken doet niets.
    - **Besluit (PO + tech lead):** behouden, maar de knop moet wel gefixt worden zodat hij de drawer ook echt opent.
- **Secundaire navigatiebalk** onder de header (Home / Organisaties / Applicaties), zichtbaar op de homepage. Wij hebben deze balk; Acato niet.
    - **Besluit (PO + tech lead):** behouden — geen wijziging.
- **"General"-kaart op de homepage.** Visueel **identiek** bij ons en bij Acato: hetzelfde kaart-component (icoon links, titel, korte tekst, link met pijltje onderaan), in een grid van drie kolommen. Het blok komt bij ons en bij Acato echter uit **verschillende databronnen met een ander doel**:
    - **Ons blok = "Onderwerpen" (themadossiers).** Dynamisch gevuld vanuit de themes-bron in OpenCatalogi. Elke kaart linkt naar de URL die de backend voor dat thema meegeeft — die kan naar een eigen pagina wijzen, naar een externe website, of naar iets anders. Geeft de backend géén URL mee, dan bouwt onze code automatisch een gefilterde zoekopdracht op het thema-id (`/zoeken?themes=<id>`) als terugval. Dat we nu maar één kaart ("General") zien, is omdat de bron op dit moment maar één thema teruggeeft — niet omdat de kaart als unieke ingang is bedoeld. Er hoort een rij thema-kaarten te staan.
    - **Acato's blok = "Welke documenten vind je hier binnenkort?" (documentsoorten).** Gevuld vanuit een aparte categories-bron. Elke kaart vertegenwoordigt een type WOO-document (raadsstuk, bestuursstuk, convenant, organisatie, woo-verzoek, etc.) en linkt naar wat de backend meegeeft — op hun live site zijn dat (deels) doorlinks naar volledig andere websites. Geen terugval-zoekopdracht; ontbreekt de URL, dan is de link leeg.
    - **Bewuste keuze van Acato, niet per ongeluk.** In Acato's broncode staat het oude themes-blok nog gewoon — maar uitgecommentarieerd. Ze hebben actief besloten om het themadossiers-concept te vervangen door dit documentsoorten-blok, niet om themes simpelweg "weg te laten". Voor de keuze hieronder relevant: optie 2 betekent Acato's afslag volgen; optie 1 betekent vasthouden aan het concept dat zij hebben verlaten.
    - **Keuze:** drie richtingen mogelijk:
        1. **Ons concept houden** — themadossiers — en zorgen dat de themes-bron meer thema's teruggeeft.
        2. **Naar Acato's concept overstappen** — kaarten als overzicht van documentsoorten met handmatig ingestelde links.
        3. **Beide concepten samenvoegen** — twee sectie-blokken naast elkaar op de homepage (eerst onderwerpen, dan documentsoorten of andersom).
- **"Uitgelicht"-sectie (3 nieuwste/uitgelichte publicaties).** Acato toont onder de hero een blok met drie publicatiekaarten — uitgelichte publicaties (handmatig gevlagd in de backend), aangevuld met de meest recente als er geen of niet genoeg gevlagde zijn. Wij tonen dit blok **niet**. Belangrijk om te weten: dit is iets dat **Acato ná de fork heeft afgemaakt**. Bij ons bestaat alleen het lege omhulsel dat al vóór de splitsing in de codebase stond; zij hebben het na de splitsing alsnog werkend gemaakt. We zijn dus geen feature kwijtgeraakt — zij hebben er één bijgebouwd.
    - Hoe het bij Acato wordt gevuld: een redacteur zet in de backend een `featured`-vinkje op een publicatie. Die publicaties verschijnen automatisch in dit blok (max. 3, nieuwste eerst). Geen vinkjes? Dan vult Acato aan met de drie meest recente publicaties. Géén publicaties in de backend? Dan verdwijnt het blok zonder melding — er is geen lege-staat-tegel.
    - Bij ons: het blok bestaat alleen als technische ruïne — er is een leeg `AcFeatured`-component in onze code dat nergens wordt aangeroepen en geen data ontvangt. Er is ook geen data-ophaalmechanisme voor "uitgelichte publicaties" in onze store; we hebben dus niets om dit blok mee te vullen, ook niet als we het zouden inschakelen.
    - **Keuze:** de Uitgelicht-sectie alsnog activeren (vereist een redactionele beslissing over welke publicaties als "uitgelicht" gelden + technisch werk), of het blok niet tonen?
- **"Welkom / Over"-sectie onderaan de homepage.** Onder de andere blokken staat een sectie met een titel (per tenant verschillend, geheel uit het CMS), een paragraaf tekst, een link, en een afbeelding ernaast. Visueel grotendeels gelijk, maar:
    - **Acato heeft een extra alinea voor een lijst/opsomming** tussen de hoofdtekst en de link. Dat is een tweede tekstveld dat de redacteur kan invullen — bijvoorbeeld een bullet-achtige opsomming van punten waar de website over gaat. Wij hebben dit veld helemaal niet; redacteuren kunnen bij ons dus alleen de hoofdparagraaf vullen.
    - **Acato zet deze sectie op een blauwe achtergrond** voor visuele scheiding van de rest van de pagina. Bij ons staat het op de standaard (witte) achtergrond.
    - **Wij verbergen de sectie automatisch** als de redacteur titel of hoofdtekst leeg laat (graceful fallback). Acato rendert 'm altijd, ook al staat-ie helemaal leeg.
    - **Keuze:** willen we het lijst-veld erbij (extra tekstveld voor de redacteur, vereist CMS-aanpassing), de blauwe achtergrond overnemen, en/of het altijd-renderen-pad volgen?

---

## 2. Zoekpagina

**Waar:** `/zoeken` (ook bereikbaar via de homepage-hero, de zoeklink in de header en de footer).

### Screenshots (2026-05-22)

- Ons: ![onze zoekpagina](./images/image.png)
- Acato (Open Tilburg): ![acato zoekpagina](./images/2026-05-22-151339_hyprshot.png)

### PO walkthrough-aantekeningen (2026-05-22)

- **Resultaatkaarten.** Voor elk zoekresultaat een kaart in de lijst. Hier verschilt het kaart-component zelf, niet noodzakelijk de inhoud:
    - **Bij ons:** zes verschillende kaart-varianten, ingezet afhankelijk van het type publicatie. Een organisatie, applicatie, module of product krijgt één variant (met logo, type-label, organisatie-naam); een moduleversie krijgt een variant met versie-status en datums; een dienst, contactpersoon, gebruik en koppeling hebben elk hun eigen variant met type-specifieke velden (statusbadge, foto + contactgegevens, gerelateerde componenten, etc.). Voor alle andere documenttypes valt het terug op één generieke kaart (titel, samenvatting, thema's, type-label).
    - **Bij Acato:** één generieke kaart voor *alle* resultaten — titel, samenvatting, datum en type-label. Geen type-condities in de kaart. Hun datacontract is uniform genoeg om dat aan te kunnen; ze hebben geen reden gehad om type-eigenheden in te bouwen.
    - **Belangrijk:** "één kaart" hoeft technisch geen informatieverlies te betekenen. Eén configureerbare kaart kán per-type-onderdelen behouden via condities of via in-/uit-te-schakelen props — bijvoorbeeld een blok "Geschikt voor:" dat alleen bij applicaties verschijnt, of een extra dienst-type-label dat alleen bij diensten getoond wordt. Het verschil tussen onze huidige zes kaarten en één rijke generieke kaart zit dan in *hoe* het type-gedrag wordt georganiseerd (zes losse componenten vs. één component met conditionals), niet in *wat* zichtbaar is voor de gebruiker.
    - **Keuze:** drie richtingen:
        1. **Onze type-specifieke kaarten behouden** — zes losse componenten, elk vrij om eigen layout-keuzes te maken. Makkelijker per-type uit te breiden, lastiger om visuele consistentie te bewaken over kaart-typen heen.
        2. **Eén configureerbare kaart bouwen waar alle huidige inhoud in past** — type-specifieke blokken via condities/props in dezelfde component. Geen informatieverlies; alle huidige velden (logo, status, contactgegevens, "Geschikt voor:", dienst-type, etc.) blijven mogelijk. Refactor-werk, maar levert daarna één plek waar visuele consistentie wordt bepaald.
        3. **Overstap op Acato's huidige minimale generieke kaart** — alleen titel/samenvatting/datum/type. Wél informatieverlies (logo's, statusbadges, datum-onderaan-patronen, contactvelden vervallen). Alleen aan te bevelen als de PO bewust kiest voor uniformiteit boven type-eigenheden.
    - Let op: de softwarecatalogus-branch (`softwarecatalogus-performance`) leunt nu actief op de type-specifieke kaarten. Optie 2 of 3 vereist coördinatie met die branch.
- **Filters in de zijbalk.** Visueel zit op beide zijden een filters-paneel; wat erin staat verschilt fundamenteel:
    - **Bij ons:** alle filters worden **dynamisch opgebouwd** door wat de backend op dat moment teruggeeft — Type, Organisatietype, Geregistreerd door, Diensttype, en wat er verder maar in de zoekresultaten zit, verschijnt automatisch als filter. Voegt de backend een nieuw filter toe, dan staat het zonder code-wijziging op de pagina. Daarbij toont onze versie ook een "actieve filters"-rij bovenaan (chips met X-knopjes per actief filter) en een "alles wissen"-knop. Categorieën en thema's komen bij ons al via dit facet-systeem mee.
    - **Bij Acato:** drie vaste filters in een hardcoded volgorde — een datumfilter (van/tot), een categorieën-filter, en een thema's-filter. Geen dynamische facet-laag, geen actieve-filter-chips, geen wis-alles-knop. Nieuwe filters toevoegen vereist code-wijziging.
    - **Het verschil dat ertoe doet:** ons facet-systeem dekt al wat Acato met hun hardcoded categorieën/thema's-filters doet (gewoon via een ander mechanisme). Het enige wat wij niet hebben is **een datumfilter**. Een datumcomponent staat wel in onze codebase maar wordt niet op de zoekpagina getoond. Belangrijk: ons datumfilter spreekt de backend op een andere manier aan dan Acato's datumfilter dat doet — als we ons datumcomponent zouden activeren is het onzeker of de backend onze variant herkent. Tech lead moet dit kort verifiëren.
    - **Keuze:** twee richtingen:
        1. **Status quo houden** — facetten dynamisch + actieve-filter-chips + alles-wissen, géén datumfilter.
        2. **Datumfilter toevoegen** — onze bestaande date-component naast de facetten renderen, ofwel als losse rij boven of onder het facet-paneel. Vereist eerst de hierboven genoemde backend-verificatie. Geen impact op de bestaande facet-laag.
- **Auto-zoeken tijdens het typen.** Hoe de zoekbalk reageert:
    - **Bij ons:** zodra de gebruiker iets in de zoekbalk tikt, gaat 300 milliseconden na de laatste toetsaanslag automatisch een nieuwe zoekopdracht weg. De resultaten lijst werkt zichzelf live bij; gebruiker hoeft niet op de zoek-knop te drukken.
    - **Bij Acato:** geen auto-zoeken. De zoekopdracht wordt pas verstuurd als de gebruiker op de zoek-knop klikt of op Enter drukt.
    - **Effect op de gebruiker:** ons gedrag voelt sneller en directer, maar genereert meer backend-aanvragen (één per typ-pauze). Bij Acato heeft de gebruiker meer controle — hij kiest wanneer hij zoekt — maar de ervaring is minder vlot.
    - **Keuze:** auto-zoeken houden (met een mogelijke optie om de debounce-tijd te tunen), of terug naar submit-only zoals Acato?
- **Toegankelijkheid / skip-link.** Een "skip link" is een toetsenbordlink voor screenreader-gebruikers waarmee je in één Tab-druk navigatie en filters overslaat en direct naar de hoofdinhoud van de pagina springt. Beide repos hebben er één, maar opgesteld vanuit verschillende invalshoeken:
    - **Bij ons:** een globale skip-link bovenaan op élke pagina ("Direct naar de inhoud"), die springt naar het begin van de hoofdinhoud — op de zoekpagina landt de gebruiker tussen de broodkruimels en de zoekbalk in, dus nog niet bij de resultaten.
    - **Bij Acato:** een pagina-specifieke skip-link alléén op de zoekpagina ("Ga direct naar zoekresultaten"), die springt naar de eerste resultatenkaart in plaats van naar het begin van de pagina-inhoud. Geen globale skip-link op andere pagina's.
    - **Twee bekende problemen met onze skip-link** (geen keuze, dit zijn bugs):
        1. *Navigeert per ongeluk naar de homepage.* Door een configuratie-quirk in de HTML van de app brengt onze skip-link de gebruiker terug naar de homepage in plaats van naar de hoofdinhoud van de huidige pagina. De fix is klein (paar regels code), maar moet nog gemaakt en gemerged worden.
        2. *Werkt niet met de spatiebalk.* De skip-link ziet er visueel uit als een knop (rechthoek met achtergrondkleur en padding), maar reageert alleen op Enter, niet op de spatiebalk. Dat is een mismatch met hoe gebruikers en hulptechnologie een knop verwachten te kunnen activeren. Strict genomen niet een WCAG-overtreding — ARIA-conventies wel: iets wat eruitziet als een knop hoort zich ook zo te gedragen (zowel Enter als spatie). Acato heeft hetzelfde probleem omdat het dezelfde onderliggende componenten-bibliotheek gebruikt.
    - **Geen PO-keuze nodig** — beide problemen zijn pure bugs aan onze kant (en deels aan Acato's kant). De fixes zitten op tech-lead-niveau.

---

## 3. Publicatiepagina

**Waar:** de pagina waar je op landt na het klikken op een zoekresultaat.

### Screenshots (2026-05-22)

- Ons: ![onze publicatiepagina](./images/screencapture-localhost-3000-publicatie-019c0f04-2d18-5000-abdc-fb514ba4e45e-2026-05-22-15_36_43.png)
- Acato: ![acato publicatiepagina](./images/screencapture-localhost-3001-publicatie-019c0f04-2d18-5000-abdc-fb514ba4e45e-2026-05-22-15_37_38.png)

### PO walkthrough-aantekeningen (2026-05-22)

- **Generieke vs. specifieke pagina.** Acato's pagina is generiek; de onze is specifiek per documenttype.
    - **Keuze:** de documenttype-specifieke layouts behouden (elke type krijgt een eigen presentatie), of overstappen op één generieke layout zoals Acato (alle pagina's zien er hetzelfde uit, ongeacht het documenttype)?
- **"Begrippenlijst"-knop in de samenvatting.** Acato heeft die knop toegevoegd aan de samenvattingskaart, net zoals wij hem hebben rechtsonder in het scherm (zie aantekening in §1 Homepage).
    - **Keuze:** de "Begrippenlijst"-knop op zijn huidige plek (rechtsonder) houden, verplaatsen naar de samenvattingskaart zoals Acato, of beide plekken behouden?
