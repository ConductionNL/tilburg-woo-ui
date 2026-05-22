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
    - **Keuze:** de knop fixen zodat hij wél werkt, of de knop helemaal verwijderen?
- **Secundaire navigatiebalk** onder de header (Home / Organisaties / Applicaties). Wij hebben deze balk; Acato niet.
    - **Keuze:** de secundaire navigatiebalk behouden, of verwijderen zodat de header er rustiger uitziet zoals bij Acato?
- **Extra "General"-kaart in het Onderwerpen-grid.** Wij tonen tussen de onderwerpen een extra kaart met de titel "General" die naar een vooraf gefilterde zoekopdracht leidt. Acato heeft deze kaart niet.
    - **Keuze:** de "General"-kaart als ingang houden, of weghalen omdat het Onderwerpen-grid daar al voor dient?
- **Achtergrondafbeelding van de hero.** Acato toont een Tilburgse stadsfoto als hero-achtergrond. Wij tonen geen afbeelding — alleen een donkerblauwe achtergrond.
    - **Keuze:** een achtergrondfoto configureren (zoals Acato), of de donkerblauwe achtergrond houden?
- **Kruimelpad (breadcrumbs).** Acato heeft een kruimelpad, maar dat is niet zichtbaar op de homepage — alleen op andere pagina's. Wij tonen het kruimelpad op alle pagina's.
    - **Keuze:** het kruimelpad op de homepage blijven tonen, of verbergen zoals Acato doet (omdat een kruimelpad op de landingspagina weinig toevoegt)?

---

## 2. Zoekpagina

**Waar:** `/zoeken` (ook bereikbaar via de homepage-hero, de zoeklink in de header en de footer).

### Screenshots (2026-05-22)

- Ons: ![onze zoekpagina](./images/image.png)
- Acato (Open Tilburg): ![acato zoekpagina](./images/2026-05-22-151339_hyprshot.png)

### PO walkthrough-aantekeningen (2026-05-22)

- **Resultaatkaarten.** Acato gebruikt één generieke kaart die niet werkt met onze datastructuur. Wij gebruiken specifieke kaarten per documenttype.
    - **Keuze:** onze documenttype-specifieke kaarten behouden, of overstappen op één generieke kaart zoals Acato (eenvoudiger, maar verliest contextuele informatie per type)?
- **Filters.** Acato filtert alleen op datum (`date-from` / `date-to`). Wij filteren op meerdere facetten (Type, Organisatietype, Geregistreerd door, Diensttype, etc.), maar hebben geen datumfilter.
    - **Keuze:** ons facet-filtersysteem houden zoals het is, vereenvoudigen naar Acato's datum-only aanpak, of de twee combineren door een datumfilter toe te voegen aan ons facetsysteem?

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
