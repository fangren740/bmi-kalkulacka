# RV3 P1 — první funkční build-time engine PoC

**Stav: IMPLEMENTOVÁNO NA IZOLOVANÉ VĚTVI, BROWSER QA ČEKÁ.**

Větev: rv3/engine-poc (draft PR proti rv3/clean-slate). Nezasahuje do produkčního main, DNS ani původních root HTML.

## Co se opravdu generuje během Cloudflare preview buildu
- /rv3/poc/kalkulacky.html — katalog s inline CSS a JS.
- /rv3/poc/hypotecni-kalkulacka.html — kalkulačka s externím výpočtovým JS.
- /rv3/poc/dpp-dpc-kalkulacka.html — kalkulačka s inline výpočtovým JS.
- /rv3/poc/manifest.json — původní canonical, hash zachovaného main a skriptů.

Sdílený V3 header, menu a footer vznikají ve statickém HTML. Nevyžadují nový frontendový framework nebo runtime výměnu DOM. Veškerý main obsah, výpočetní JS a canonical se porovnávají na přesnou shodu se zdrojovou stránkou a při změně se build zastaví.

**POC kompromis:** Původní header/footer zůstává skrytý a inertní kvůli případné závislosti historického JS na jejich ID. Tato kompatibilitní vrstva je pouze pro experiment, před produkcí ji musí nahradit ověřené adaptéry. Samotný obsah kalkulačky zatím zůstává vizuálně původní. To dokazuje technickou integraci, ne dokončenou redesignovou migraci.

## Akceptace před schválením architektury
1. Ověřit Cloudflare build a odkazy na všechny 3 preview stránky.
2. V browseru otestovat katalog hledání a filtry; hypotéku a amortizaci; DPP/DPČ hraniční případy.
3. Screenshoty při 390 a 1440 px, console errors, focus, keyboard, scroll.
4. Zhodnotit zachování SEO obsahu a odkazy; potvrdit nebo upravit ADR-001.
5. Teprve poté plánovat bezpečnou migraci produkčních URL v dávkách 5–10.

Měřené PageSpeed ani browser PASS nejsou zatím doložené. Bez schválení uživatele neprovádět merge do main.

## Important correction — in-page fragment navigation
The first PoC inserted a global `<base href="/">`. Because the pages live under `/rv3/poc/`, this would send `#kalkulacka` or `#catalog-search` to the website root instead of the current page. **Fixed in the next build:** no `<base>` is used; every opt-in source must already use root-absolute or scheme URLs for assets/navigation. Unknown relative URLs make the generator fail rather than creating silently broken links. Automated tests validate every fragment target.

## 2026-11-11 — první plně generovaná katalogová stránka
Nově `/rv3/poc/studio-katalog.html`: **135 skutečně existujících URL** přehledně v 9 tematických skupinách. Kompletní odkazy jsou staticky v HTML (fungují i bez JS), klientský JavaScript (~2 kB) jen lokálně filtruje kategorie a české dotazy; nezaznamenává vyhledávání ani neposílá dotazy na server. Originální V3 grafika, responsive 390/1440 orientovaná CSS a klávesové hledání Ctrl/⌘+K.

Build generuje strukturu z `rv-tool-index.js`; každou cestu před sestavením ověřuje, detekuje duplicity a nebezpečný HTML vstup escapuje. Dočasné rozdělení kategorií závisí na známém pořadí indexu a je chráněno sentinel testy. Index změněný bez revize způsobí hard-fail, ne tiché pomíchání kategorií. **Katalog je vizuální PoC, ne schválená produkční migrace**. Výkon: HTML ~121,5 kB v UTF-8 před HTTP kompresí, CSS ~8,7 kB a JS ~2 kB. Není to Lighthouse/CrUX hodnota.

## Aktualizace katalogu V2 / oddělený redesign
Na této větvi vznikl **nový alternativní katalog** `/rv3/poc/katalog-v2.html`, nikoli oprava původní kartičkové koncepce. Konkrétní designová rozhodnutí, URL, výzkum, 135/135 mapování, QA evidence a následující schvalovací kroky jsou trvale zapsány v [CATALOG_RETHINK_2026.md](CATALOG_RETHINK_2026.md). Proti `rv3/clean-slate` se na této větvi synchronizují společné CONTROL_CENTER/HANDOFF/SESSION_LOG, aby nenastal konflikt s paralelní večerní prací. Tato poznámka zůstává v samostatném engine handoffu; master issue [#59](https://github.com/fangren740/bmi-kalkulacka/issues/59) a #62 mají odkazy.
