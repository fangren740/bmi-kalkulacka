# RV3 — sitewide execution plan / jediný realizační směr
**12. 11. 2026 · stav: zahájena realizace v izolované větvi `rv3/sitewide-wave1-20261112`**

## 1. Produktový závazek
RychléVýpočty.cz není kolekce libovolných formulářů. Je to **decision-first** nástroj: člověk hned pochopí, co má zadat, dostane správný výsledek, vysvětlení a bezpečný další krok. Každá stránka má být vizuálně příbuzná novému katalogu V3, ale současně má zachovat vlastní funkční tok. Schválený směr katalogu v [PR #66](https://github.com/fangren740/bmi-kalkulacka/pull/66) je **designová reference**, nikoli bez důkazu hotový globální engine.

**Nepřekročitelné:** nezměnit původní `logo-rv-v32.svg`, nepřepsat funkční numeriku, nepoškodit SEO obsah/URL/canonical, nezměnit `main`, DNS ani produkční hosting bez aktuálního samostatného schválení. Přenos Cloudflare preview → produkce není implicitní součást redesignu.

## 2. Rozsah / realita místo dojmu
Ověřený inventář v `docs/rv3/route-registry.json`: **207 root HTML stránek**. Z toho **135 katalogových kalkulaček**; dalších **72** zahrnuje **22 hubů, 8 trust/legal, 1 embed, 1 homepage a 40 původně neklasifikovaných**. Tři starší V3 piloty jsou již uvnitř těchto skupin, nikoli další tři URL. Z 40 jsou podle `ARCHETYPES_60.md` jednotlivě doložené 2 legacy landing/redirect, 1 standalone calculator, 2 guides; **35 stále UNKNOWN**. Neodvozovat stav indexace z počtu HTML souborů.

Pro každý `path` vznikne jeden záznam obsahující `kind, family, risk, oldCanonical, engineType, migrationWave, previewURL, tests, status, rollback`. `kind=UNKNOWN` neznamená automaticky kalkulačku. Výchozí režim všech neověřených URL je **passthrough**.

## 3. Design systém — jedna identita, různé typy produktů
- **Značka:** původní SVG logo beze změny, námořnická modrá jako textová kotva, kultivovaná zelená jako akce, světlá mint a teplá bílá jako plochy; žádný bílý štítek kolem loga. Součástí jsou barevné a typografické tokeny, designové stavy a rozhodnutí pro kontrast.
- **Foundation:** pevný content max-width, typografická škála, odstupy, rádiusy, stíny, viditelný focus, reduced motion, mobile touch-targets, grid od 390 do 1440 px.
- **Přenositelné prvky:** originální header/menu/footer, breadcrumbs, editorial hero, uživatelské případy, ilustrace kategorií, CTA, obsahové sekce, důvěryhodnost/zdroje, odkazy na související nástroje a stavy chyb/validace.
- **Kalkulačka:** formulář/začátek výsledku v prvním mobilním scrollu, vstupy přímo u relevantního popisu, výsledek s předpoklady a vysvětlením, případné varianty a srovnání. Nový vzhled nesmí překážet specialistické kalkulačce.
- **Obsah:** bez mechanických slovních kvót; nevynechávat metodiku, datové zdroje, legislativní výjimky, otázky uživatelů ani interní kontext. Rozcestníky se nebudou kopírovat jeden druhému.

**Strategie aktiv:** lokální malé SVG ilustrace z V3, vědomě používány u hubů; velké ilustrace jen tam, kde pomáhají rozhodnutí. Nenutit každou kalkulačku načíst grafiku celého katalogu.

## 4. Technická implementace — rozšířit P1, ne vytvořit druhý konkurenční engine
Stavíme na existujícím build-time statickém PoC `rv3/engine/renderer.mjs` a `rv3/engine/shell-v2.mjs`; žádný frontend SPA rewrite. Sdílený základ a **explicitní route adaptéry** podle archetypu: `hub`, `calculator-external`, `calculator-inline`, `guide`, `trust`, `embed`. V aktuálním prvním kole vygenerovat jen **nové preview URL** pod `/rv3/wave1/`, nikoliv přepis root.

Adapter deklaruje původní URL a pravidla; testy vyžadují nezměněné `<main>` v první bezpečné fázi, pořadí všech původních script bloků, canonical, původní title a skutečné linky. Header/footer nahradit již existujícím V3 shellem jen v preview; legacy navigace dočasně ukrytá pouze kvůli kompatibilitě, **není to konečné produkční řešení**. Další kolo musí vyřešit závislosti na původních DOM IDs a bezpečně odstranit skrytý shell.

## 5. Pořadí realizace / milníky

| Vlna | Co se skutečně vytvoří | Co odblokuje další vlnu |
|---|---|---|
| **W0 — nyní** | Lock loga, designové tokeny, migrační kontrakt, route seznam, build-time přenositelné styly, izolovaná větev | Cloudflare build PASS a dokumentované hranice |
| **W1 — 2 huby** | `finance-a-hypoteky.html` + `osvc-a-freelancing.html` v `/rv3/wave1/`, srozumitelný shared shell a cílený responsive skin; původní obsah/formuláře/scripts nedotčené | Skutečný screenshot 390/1440 + formulářové UI, konzole, keyboard, SEO invariants; bez toho žádné označení browser PASS |
| **W2 — katalog a huby** | Přenos konečného katalogu V3 na schválený engine a 4–6 nejdůležitějších hubů podle záměru; breadcrumbs/related paths a 135/135 linků | Katalog + huby mají jednotnou ergonomii a žádné mrtvé odkazy |
| **W3 — 3 různé nástroje** | Externí JS hypotéka, inline DPP/DPČ a jednoduchá procenta; testy přesných výpočtů a zachování DOM/SEO | Stejný systém zvládne 3 architektury, aniž mění numeriku |
| **W4 — priorita** | Čistá/hrubá mzda, dovolená, nemocenská, OSVČ a nejvyužívanější finance; typicky 5–10 URL/PR | Regresní scénáře, nezhoršené UX a obsah |
| **W5 — pokrytí 135** | Rodiny práce/finance/OSVČ → energie/domácnost → rodina/zdraví → stavba → auto → utility. Dávky 5–10 URL; risk 1–3 | Každá migrovaná URL má preview, regresi a rollback |
| **W6 — zbylých 72** | 22 hubů doplnit, zkontrolovat 35 UNKNOWN, guides, legal/trust, embed, odkazy i navázaný obsah; **nezaměnit za 72 kalkulaček** | 207/207 route manifest; obsahy a canonical ověřené |
| **W7 — release** | Před/po, preview QA, SEO/GSC baseline, performance, consent/analytics, rollback; malé schválené veřejné vlny | Výslovný souhlas vlastníka k release; ne automaticky |

Milníky jsou **závislosti a konkrétní dodávky**, ne fiktivní sliby dnů. Současně nejvýš dvě rozpracované implementační PR; první společný design vizuální směr = #66, nová integrační vlna má vlastní draft PR.

## 6. Testy — tři důkazové brány, nikoliv nekonečný audit
**G1 technická (automaticky v Cloudflare buildu):** chybějící cesta je hard-fail; počet URL, canonical, title/H1 intent, strukturovaná data, main a script hash pro zachovávané stránky, XSS escaping, originální logo, preview noindex. Výpočetní kalkulačky mají scénáře min/max, neplatné vstupy, zaokrouhlení, sazby/roky a očekávanou numeriku.

**G2 prohlížeč (skutečné měření, ne build):** screenshot 390 a 1440, scroll/overflow, menu a tlačítka, formulář + výsledek, klávesnice, kontrast, console/network, HTTP X-Robots-Tag. Pokud cloud/browser není dostupný, výstup je **NEOVĚŘENO**; náhled k rozhodnutí se nevydává za otestovaný release.

**G3 výkon/SEO/release:** cíle LCP ≤2,5 s, INP ≤200 ms, CLS ≤0,1 **jen jako cíle** do měření; žádná tvrzení o skóre bez Lighthouse/CrUX. Zachovat `.html` URL, canonical, interní odkazy, structured data, hodnotný text, original robots a CMP/Consent Mode/GA4/AdSense bez zdvojení. `noindex` se vztahuje pouze na preview. Google Search Console issue #50 poskytne skutečná indexační data, ne odhady.

**Závěrečná kontrola každé vlny:** jeden link na PR, jeden skutečný náhled, 2 screenshoty pokud dostupné, 1 tabulka PASS/FAIL/NEOVĚŘENO, konkrétní rollback. Žádný nekonečný cyklus dalších auditů bez dodaného produktu.

## 7. Rozhodnutí a řízení
- **Teď:** uživatel již dal zelenou *vizuálnímu směru a pokračování vývoje*, **nikoli produkčnímu merge**. Vyvíjet autonomně podle tohoto plánu.
- **První společná kontrola:** W1 ukázat oba huby ve stejném vizuálu a jejich chování. Uživatel schvaluje směr, nikoliv každý odstín.
- **Po W3:** jediné schválení bezpečné přenositelnosti na kalkulačky.
- **Před release:** samostatný explicitní souhlas s konkrétní dávkou a rollbackem; změna hostingu/DNS je zvlášť.

## 8. Co nepředstírat
Cloudflare deploy PASS ≠ browser 390/1440 PASS. Úplný HTML inventář ≠ 207 migrovaných URL. Tři PoC stránky ≠ hotový engine pro jakoukoli kalkulačku. Pět klasifikovaných ze 40 ≠ hotová typologie. Typografie/ilustrace z generovaného obrázku ≠ identická implementace. Veškeré hodnoty jsou v příslušném commitu ověřitelné.

## 9. Reference pro rozhodování
[PR #66 — referenční katalog](https://github.com/fangren740/bmi-kalkulacka/pull/66) · [issue #59 — control center](https://github.com/fangren740/bmi-kalkulacka/issues/59) · [#61 engine](https://github.com/fangren740/bmi-kalkulacka/issues/61) · [#62 huby](https://github.com/fangren740/bmi-kalkulacka/issues/62) · [#63 kalkulačky](https://github.com/fangren740/bmi-kalkulacka/issues/63) · [#64 SEO/release](https://github.com/fangren740/bmi-kalkulacka/issues/64) · [Google: redesign bez změn URL](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes) · [web.dev: Core Web Vitals](https://web.dev/articles/vitals).
