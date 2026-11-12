> **AKTUÁLNÍ SMĚR 12. 11.:** tento roadmap snapshot je historický. Pro skutečnou práci používat [PAGE_BY_PAGE_MASTERPLAN_2026-11-12.md](PAGE_BY_PAGE_MASTERPLAN_2026-11-12.md) a [207-page tracker](PAGE_TRACKER_2026-11-12.json). Dávky 5–10 URL jsou pouze možné logistické release skupiny, **ne společný automatický redesign**. Homepage, katalog, situace, návody a o projektu/metodika/trust první. Každá kalkulačka samostatné UX a testy.

# RV3 Roadmap — krátkodobý, střednědobý, dlouhodobý plán

**Základní strategie:** jeden deterministický V3 UI systém, postupná migrace 207 HTML URL bez přepisování správných výpočtů. Všechna data/obsah/SEO se chrání. Nejde o harmonogram slibující přesná data bez znalosti kapacity; kroky určují pořadí a akceptaci.

## KRÁTKODOBĚ — P0/P1 (následující pracovní roundy)
1. **Inventář a klasifikace** [#60](https://github.com/fangren740/bmi-kalkulacka/issues/60): 207 URL, 135 katalogu, 72 ostatních; 40 zatím neklasifikováno. Označit hub, guide, tool, trust, embed, složitost, SEO riziko, integrovaný JS/CSS engine, stávající canonical.
2. **Rozbor 5 odlišných archetypů**: katalog `kalkulacky.html`, směnová `kalkulacka-priplatku-za-smeny.html` (externí JS), hypotéka (externí JS), DPP/DPČ (inline JS), superdávka (regulovaná) — bez změny výpočetní logiky.
3. **V3 engine POC** [#61](https://github.com/fangren740/bmi-kalkulacka/issues/61): build-time šablona/layout + route manifest + adaptéry; 1 hub, 1 externí JS nástroj, 1 inline JS nástroj. Navázat na současnou Cloudflare preview infrastrukturu.
4. **Produktové rozhodnutí A:** srovnávací screenshoty a konkrétní ukázky k schválení; až pak rozšířit engine.

**Stop:** když bude fungovat jen stylování bez zachování interakcí, SEO obsahu a výpočtů, nejdeme do širší migrační vlny.

## STŘEDNĚDOBĚ — P2 a první P3
5. **Katalog 135** [#62](https://github.com/fangren740/bmi-kalkulacka/issues/62): nový přehled podle uživatelského problému, skutečný filtr a search index, interní odkazy bez slepých URL.
6. **Tematické huby**: `finance-a-hypoteky.html`, `bydleni.html`, `osvc-a-freelancing.html`, `prace-a-mzda.html`, dále podle skutečného dopadu GSC. Každý hub má vlastní zaměření a fungující navigaci.
7. **Prioritní nástroje** [#63](https://github.com/fangren740/bmi-kalkulacka/issues/63): DPP/DPČ, dovolená, čistá↔hrubá mzda, hypotéka, procenta, nemocenská, přesčasy, směnový kalendář, OSVČ. **Příplatky** jako chráněný případ se samostatným souhlasem; **superdávka** se zvláštním právním ověřením.
8. **Schválení B/C:** realistické mobilní i desktopové screenshoty, regresní výpočty, skutečné Cloudflare preview a porovnání SEO obsahu.
9. Migrace 5–10 URL v jednom PR podle příbuznosti a rizika. Komplexní legislativní nástroje po 1–3 URL. Max **2 současně rozpracované implementační PR**.

## DLOUHODOBĚ — P3/P4
10. Zbylé nástroje řadit podle `route-registry.json` a ověřené priority (ne v abecedním pořadí): finance/bydlení → mzdy/práce → OSVČ/business → energie/domácnost → rodina/zdraví → auto → stavba → utility.
11. Obsahové návody, důvěryhodnost, právní a embed stránky zachovat a vizuálně sjednotit bez ztráty zdrojů a indexovaných pasáží.
12. **Před produkčním rolloutem** [#64](https://github.com/fangren740/bmi-kalkulacka/issues/64): 207 URL integrity, noindex pouze preview, kontrola GSC/canonical, sitemap, GA4/CMP/Consent/AdSense, reálný Lighthouse & screenshot, rollback, vlastníkovo D schválení.
13. Postupné veřejné publikace s monitoringem v GSC po 1/7/28 dnech a prioritizací podle důkazů. Nikdy nepřepsat celý web jednou nekontrolovanou migrací.

## Šest věcí, které nesmějí být ztraceny
- **Správnost výpočtů** a specializovaný UI pro daný problém.
- **Původní souvislý SEO obsah** a čitelné primární zdroje, ne kratší „tool-only shell“.
- **Stálé .html adresy, canonical, funkční interní odkazy, metadata**.
- **Původní logo/identita** + společný prémiový design systém.
- **Mobile-first ergonomie a výkon** měřený, ne deklarovaný.
- **Proces předání** mezi chaty (issue #59, registry, session log, PR stav).

## Praktický úspěch každé vlny
| Kritérium | Požadavek |
|---|---|
| Uživatelský přínos | První viewport jasně říká, co zadat a co znamená výsledek |
| QA | Cílené číselné regrese + neplatné vstupy + keyboard + 390/1440 |
| SEO | Původní URL, canonical, content intent, metadata, odkazy, důležité zdroje |
| Výkon | Reálně testovaný LCP/CLS/INP, bez zbytečného JS, CDN a layout shift |
| Proces | Jediný ucelený PR s náhledem; po schválení další vlna |
| Evidence | Aktualizace `route-registry.json`, `CONTROL_CENTER.md`, `SESSION_LOG.md` |
