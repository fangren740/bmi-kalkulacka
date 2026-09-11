# RychléVýpočty.cz V7 — CONTENT DEPTH + IDENTITY LOCK

**Datum:** 2026-09-11  
**Status:** CURRENT / HARD LOCK pro AdSense finish sprint  
**Source of truth:** `fangren740/bmi-kalkulacka`, branch `main`

> Tento dokument upřesňuje `RV_ADSENSE_FINISH_MODE_2026-09-11.md`. Kde by šlo finish mode vyložit jako word-count kvótu nebo jako povolení vizuálně strohých stránek, platí tento lock.

---

## 1. ŽÁDNÁ POVINNÁ WORD-COUNT KVÓTA

RychléVýpočty.cz **nemají žádné pravidlo typu 1000 / 1800 / 3000 slov na každé kalkulačce**.

Počet slov není KPI kvality a nesmí se optimalizovat mechanicky.

Obsahová hloubka se řídí pouze:

- složitostí tématu,
- množstvím přirozených následných otázek uživatele,
- rizikem chybné interpretace výsledku,
- potřebou metodiky / zdrojů / příkladů,
- skutečnou přidanou hodnotou po výsledku.

### Správný princip

**Jednoduché téma = kratší stránka může být úplně správně.**  
**Složitější téma = přirozeně hlubší obsah.**

Zakázané jsou oba extrémy:

- `tool-only shell`: formulář + výsledek + pár obecných vět,
- textové nafukování: dlouhý SEO filler, který neodpovídá user jobu.

### Content depth gate

Po výsledku musí stránka odpovědět na tolik důležitých same-intent otázek, kolik téma skutečně vyžaduje. Relevantní mohou být například:

- co výsledek znamená,
- jak se počítá,
- worked example,
- co výsledek nejvíc mění,
- srovnání variant,
- citlivost / hranice / scénáře,
- nejčastější chyba,
- praktický checklist,
- metodika a zdroje,
- FAQ,
- navazující kalkulačky.

**Ne každá stránka musí mít všechny tyto bloky.** Vznikají pouze tam, kde uživateli skutečně pomáhají.

---

## 2. STRÁNKA NESMÍ PŮSOBIT STROZE

I krátká utility kalkulačka musí působit jako dokončený produkt RychléVýpočty.cz, ne jako holý webový formulář.

Každá upgradovaná stránka musí mít:

1. jasný hero s okamžitě pochopitelným user jobem,
2. topic-native vizuální objekt nebo motiv,
3. tool hned po hero,
4. dominantní a interpretovaný výsledek,
5. alespoň jeden smysluplný post-result product/content moment, pokud ho téma unese,
6. metodiku / vysvětlení v rozsahu odpovídajícím tématu,
7. dokončený footer a interní navigaci.

Originalita nevzniká přehazováním layoutu. Vzniká přes **téma, vizuální metaforu, result grammar, grafiku, příklady a relevantní obsah**.

---

## 3. POVINNÁ V7 / V3.2 IDENTITA NA KAŽDÉ UPGRADOVANÉ STRÁNCE

Toto je hard gate. Bez těchto prvků není stránka hotová.

### Logo

- header: canonical `/logo-rv-v32.svg?v=1`,
- footer: canonical inverse `/logo-rv-v32-inverse.svg?v=1`,
- žádný starý wordmark,
- žádný textový/fallback fake logo,
- žádná vlastní varianta loga pro jednotlivou kalkulačku.

### Brand primitives

- používat aktuální V3.2 brand systém / společné RV primitives,
- navy / blue / green lineage musí být rozpoznatelná,
- typografie, linky, result language a section choreography musí působit jako jeden web.

### Vodoznak / visual field — POVINNÉ

Každá upgradovaná kalkulačka musí mít v hero **jemný V7/V3.2 visual field / watermark**, který jsme zavedli v nové vlně.

Pravidla:

- low-contrast, nesmí soutěžit s H1 ani tool CTA,
- preferovat CSS/SVG, žádná těžká bitmapa,
- bez CLS a bez overflow,
- musí být topic-specific nebo brand-specific,
- nesmí se mechanicky kopírovat stejný pattern na všechny stránky,
- má vizuálně propojit hero s kalkulačkou / výsledkem tam, kde to téma unese.

Příklady: technická mřížka, časová osa, kalendářní linky, účtenka, house/vehicle contour, grafická křivka, pracovní list, jemný RV linework, tematické osy nebo vrstvy.

**Prázdné bílé hero bez visual fieldu = FAIL.**

### Footer completeness

- plný tmavý footer,
- inverse logo,
- relevantní category/project odkazy,
- Facebook + Instagram,
- podpis / lineage `Zadat → Spočítat → Pochopit → Rozhodnout`, pokud odpovídá aktuálnímu production standardu,
- trust / methodology / contact odkazy podle globálního footer standardu.

---

## 4. UX A TYPOGRAFIE

- hero → rovnou kalkulačka; před tool nevkládat marketingové bloky bez silného důvodu,
- mobile first,
- žádné překážející floating result bary,
- secondary controls přes progressive disclosure,
- body copy nesmí být mikro; typicky 16–17 px nebo více podle kontextu,
- input/select v jednom řádku mají stejnou výšku a vertikální osu,
- výsledek musí být vizuálně dominantní,
- žádný dashboard/cockpit efekt u jednoduchého user jobu.

---

## 5. METHOD / TRUST JE PODLE RIZIKA, NE PODLE ŠABLONY

Metodika musí být tak hluboká, jak vyžaduje téma.

### Povinně silná metodika

U právních, finančních, daňových, zdravotních, pracovních, energetických a dalších proměnlivých témat:

- datum ověření / aktualizace,
- vzorec nebo rozhodovací logika,
- autoritativní zdroje,
- jasné hranice modelu,
- benchmark/regression data, pokud existují,
- stručný relevantní disclaimer.

### Jednoduché utility

U stabilního jednoduchého výpočtu může být metodika podstatně kratší, ale musí být jasné:

- co se počítá,
- jaký vzorec používáme,
- jak interpretovat výsledek,
- kde jsou hranice / zaokrouhlení, pokud jsou relevantní.

Metodika patří **po toolu / výsledku**, ne mezi hero a kalkulačku.

---

## 6. ADSENSE FINISH INTERPRETACE

Cílem finish sprintu není:

- narvat každou kalkulačku na 3000 slov,
- kopírovat jednu úspěšnou stránku 100×,
- dělat všechny stránky stejně dlouhé,
- maximalizovat počet sekcí.

Cílem je:

- žádná indexovatelná stránka nepůsobí jako thin/tool-only shell,
- každá stránka má hloubku odpovídající tématu,
- každá stránka je vizuálně součást RychléVýpočty.cz V7,
- každá stránka má nové logo + V3.2 identity + watermark/visual field,
- každá stránka je unikátní v topic treatmentu,
- celý web působí hotově, konzistentně a důvěryhodně.

---

## 7. BATCH REVIEW GATE

Při každém batchi před označením `DONE` explicitně zkontroluj:

- [ ] depth odpovídá tématu; žádný filler, žádný tool-only shell,
- [ ] canonical V3.2 logo v headeru,
- [ ] inverse logo ve footeru,
- [ ] V7/V3.2 watermark / visual field v hero,
- [ ] unikátní topic-native vizuál / treatment,
- [ ] tool přímo po hero,
- [ ] mobile-first flow,
- [ ] dominantní výsledek,
- [ ] metodika/trust v adekvátní hloubce,
- [ ] full footer + Facebook + Instagram,
- [ ] žádná stará identita / fake logo / starý footer,
- [ ] performance/CWV readiness není obětována vizuálu.

> **Mantra:** Hloubka podle tématu. Žádné word-count divadlo. Žádná strohost. Jeden brand, mnoho unikátních produktů.
