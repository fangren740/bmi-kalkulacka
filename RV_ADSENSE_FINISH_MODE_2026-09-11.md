# RychléVýpočty.cz V7 — ADSENSE FINISH MODE

**Datum:** 2026-09-11  
**Status:** CURRENT / OPERATIONAL OVERRIDE do další žádosti o AdSense  
**Source of truth:** `fangren740/bmi-kalkulacka`, branch `main`  
**Výchozí HEAD při vytvoření:** `971267d8a7fe7d84bbd5d60f48b0fe512d43ca45`

> **Cíl tohoto režimu:** přestat ztrácet čas nekonečnými redesign smyčkami jednotlivých kalkulaček, dokončit V7 upgrade celého portfolia v konzistentní kvalitě, následně dočistit hlavní/hub/trust stránky a připravit celý web na nové AdSense review.

Tento dokument **nemění požadavek na kvalitu**. Mění způsob práce: kvalita musí být opakovatelná, rychlá a dokončitelná na celém webu. Dokud je tento režim aktivní, experimentální perfekcionismus na jedné URL nesmí blokovat dokončení portfolia.

---

## 0. PROČ TENTO LOCK EXISTUJE

AdSense odmítl web kvůli `Obsah nízké hodnoty`. Vlastní tracker už správně říká, že to máme chápat jako kvalitatativní feedback, ne jako jediný produktový cíl. Google současně při site review kontroluje celý web a oficiálně zdůrazňuje:

- unikátní a relevantní obsah, který dává důvod stránku navštívit,
- dostatek kvalitního textového obsahu a kompletní věty/odstavce,
- plně dokončený web, ne stránky ve stavu „under construction“,
- jasnou a snadnou navigaci,
- dobrou user experience.

Oficiální reference:
- https://support.google.com/adsense/answer/7299563
- https://support.google.com/adsense/answer/81904
- https://support.google.com/adsense/answer/48182
- https://support.google.com/adsense/answer/10008391

**Praktický závěr pro RychléVýpočty.cz:** nestačí mít funkční kalkulačku. Každá indexovatelná kalkulačka musí působit jako dokončený, originální, užitečný obsahový produkt — tool + vysvětlení + metodika + praktický kontext + interní propojení.

---

# 1. PRIORITA PROJEKTU — NEMĚNIT POŘADÍ

Do další AdSense žádosti platí toto pořadí:

1. **DOKONČIT ZBÝVAJÍCÍ V7 UPGRADY KALKULAČEK.**
2. **UDĚLAT CALCULATOR QUALITY SWEEP** — odstranit strohé/thin výjimky, technické chyby, chybějící metodiku/trust/footer/socials.
3. **HLAVNÍ A KATALOGOVÉ STRÁNKY** — homepage, katalog, category hubs.
4. **TRUST / EDITORIAL / CONTACT STRÁNKY** — O projektu, Jak počítáme / metodika, Data a benchmarky, Kontakt, privacy/cookies/terms a další sitewide trust prvky, které web skutečně používá.
5. **SITEWIDE SEO / TECH / INDEXING PASS** — broken links, sitemap, canonical, schema, titles/meta, alt, accessibility, indexability.
6. **PERFORMANCE / CWV / PAGESPEED PASS.**
7. **GSC kontrola crawlu/indexace hlavních změn.**
8. **NOVÁ ADSENSE ŽÁDOST.**

### Do dokončení bodu 1–6 je zakázáno

- vyrábět nové kalkulačky bez kritického strategického důvodu,
- několik dní ladit jednu už schválenou stránku jen kvůli subjektivnímu polish,
- redesignovat stránky označené DONE bez P0/P1 důvodu,
- otevírat nový globální redesign,
- feature creep,
- „jen pro zajímavost“ experimenty, které neposouvají AdSense readiness.

**Flagship experiment `kalkulacka-priplatku-za-smeny.html` se v tomto režimu zmrazuje na současné produkční verzi.** Další experimenty s ním pokračují až po dokončení AdSense finish sprintu, pokud nevznikne correctness / accessibility / policy problém.

---

# 2. CO ŘÍKAJÍ NAŠE NEJLEPŠÍ / NEJDŮLEŽITĚJŠÍ STRÁNKY

## 2.1 Reálná Search Console priorita

GSC období `2026-03-01 → 2026-09-08`:

| URL | Kliky | Imprese | Poznámka |
|---|---:|---:|---|
| `kalkulacka-priplatku-za-smeny.html` | **152** | 564 | jednoznačně nejcennější současná landing page; během finish sprintu nerozbíjet |
| `naklady-na-provoz-auta-kalkulacka.html` | **21** | **662** | vysoká viditelnost / opportunity |
| homepage | 8 | 175 | klíčová pro celý site review |
| `cista-mzda-kalkulacka.html` | 4 | 463 | quality floor + vysoká opportunity |
| `kalkulacka-celkove-ceny-vlastnictvi-auta.html` | 2 | 42 | užitečný samostatný intent |
| `procenta-kalkulacka.html` | 2 | 76 | jednoduchý intent, ale obsahově hluboká stránka |
| `dph-kalkulacka.html` | 1 | 134 | S-tier reference |
| `vypocet-veku.html` | 1 | 89 | jednoduchý utility archetyp |
| `pracovni-dny-kalkulacka.html` | 1 | 69 | utility + metodický kontext |

**Důsledek:** teď nemáme optimalizovat portfolio podle „co se nám zrovna chce designovat“. Nejdřív dokončíme všechny kalkulačky na jednotný high-value standard; nejviditelnější stránky při tom chráníme před regresí.

## 2.2 Obsahová kalibrace z live top/reference stránek

Live on-page audit (2026-09-11, GSC Wizard) ukázal přibližně:

- Příplatky za směny: **1717 slov**
- Čistá mzda: **1762 slov**
- Hypotéka: **1663 slov**
- Náklady na provoz auta: **988 slov**
- Bod zvratu: **981 slov**
- DPH: **941 slov**
- Minimální fakturace OSVČ: **899 slov**
- Procenta: **2796 slov**

To **není word-count quota**. Je to důkaz, že silná kalkulačka projektu není pouze formulář + 2 krátké odstavce.

### Co z toho přenášet

- **#74 Čistá mzda:** completeness, metodika, důvěra, užitečná hloubka.
- **#21 DPH:** jednoduchost, rychlý tool, čistá struktura.
- **#23 Bod zvratu:** topic-native vizuál a interpretace výsledku.
- **#25 Minimální fakturace:** konkrétní user job, minimum zbytečností, praktický kontext.
- **Příplatky live:** time-first UX, metodika, benchmark/data, kontrola výplatnice; během sprintu chránit.
- **Náklady na provoz auta:** novější V7 layout a silný result, ale NESMÍ se stát šablonou pro všechny stránky.
- **Procenta:** důkaz, že jednoduchý nástroj může mít bohatý obsah; současně varování proti příliš fragmentované sekci/card spamu.

---

# 3. NOVÁ DEFINICE „DONE“ PRO DOKONČOVACÍ SPRINT

Kalkulačka je `DONE` pouze když projde všemi body níže. **Není nutné z ní dělat designový showcase. Je nutné, aby byla jasně hodnotná, originální, kompletní a použitelná.**

## A. Product / UX

- jedna věta: **„Uživatel přichází, protože chce …“**,
- první viewport okamžitě vysvětluje účel,
- default: **hero → rovnou kalkulačka**, bez marketingových karet mezi nimi,
- nejčastější výpočet vyžaduje jen nezbytné vstupy,
- sekundární vstupy = progressive disclosure,
- výsledek je okamžitě viditelný / blízko vstupům a vysvětlený,
- žádný mobilní floating panel, který zakrývá obsah,
- žádná UI volba jen proto, že ji „umíme“.

## B. Mobile-first hard rules

- mobile flow: `hero copy → topic visual → inputs → result → depth → methodology → footer`,
- base body copy typicky **min. 16–17 px**; zákaz mikrotextového webu,
- formulářové prvky vizuálně konzistentní, typicky 52–56 px vysoké,
- input/select v jednom grid row mají stejnou výšku a osu,
- žádný horizontální scroll,
- žádné fixed/sticky prvky přes obsah bez zásadního důvodu,
- desktop funkce nesmí z mobilu dělat cockpit.

## C. Každá stránka musí být unikátní — ale efektivně

Každá kalkulačka musí mít **vlastní topic-native identitu**, minimálně:

1. **unikátní hero objekt / ilustraci / datový motiv**, který vysvětluje problém,
2. **unikátní result grammar** podle tématu (např. rozpad, timeline, crossing, účtenka, kalendář, plán, srovnání),
3. alespoň **2 same-intent depth momenty** zvolenými podle tématu,
4. obsah napsaný pro konkrétní kalkulačku, ne jen přehozené názvy v šabloně.

Neznamená to pokaždé nový layout od nuly. Makro UX může být stabilní; originalita je v objektu, výsledku, vizualizaci, příkladech a obsahu.

## D. Obsah / AdSense value gate

Po výsledku musí stránka odpovědět na přirozené otázky uživatele. Typicky vyber jen relevantní bloky:

- co výsledek znamená,
- jak se počítá,
- worked example,
- co výsledek nejvíc mění,
- nejčastější chyba při použití,
- srovnání variant,
- hranice / citlivost / scénář,
- praktický checklist,
- metodika a zdroje,
- FAQ,
- relevantní další kalkulačky.

### Obsahová hustota

- významná finanční/právní/stavební kalkulačka často přirozeně skončí kolem **900–1800+ slov** užitečného textu,
- jednoduchá utility stránka může být kratší, ale nesmí působit jako prázdný tool shell; orientačně často **500–1000+ slov**, pokud téma nabízí smysluplný kontext,
- **žádné vycpávání kvůli počtu slov**,
- celé odstavce a skutečná vysvětlení mají přednost před 20 mikro-kartami,
- pokud stránka po výsledku neodpovídá na žádnou další užitečnou otázku, je pravděpodobně příliš strohá.

## E. Method / trust gate

U proměnlivých, právních, finančních, zdravotních, daňových, pracovních, energetických a podobných témat:

- viditelné `Ověřeno / aktualizováno k …`,
- lidsky napsaná metodika,
- vzorec nebo rozhodovací logika,
- primární / autoritativní zdroje,
- benchmark/regression data, pokud existují,
- jasné hranice kalkulačky,
- stručný disclaimer podle tématu.

Metodika patří **po hlavním výpočtu**, ne mezi hero a tool.

## F. Brand / completeness

Povinné:

- canonical V3.2 logo,
- inverse logo ve footeru,
- RV navy / blue / green lineage,
- plný footer,
- **Facebook + Instagram ve footeru**,
- relevantní category/project odkazy,
- žádný starý nebo falešný wordmark,
- žádné interní názvy typu `engine`, `lab`, `solver`, `runway`, atd. v customer copy.

## G. SEO / discoverability gate

- 1× H1,
- self canonical,
- kvalitní title/meta podle intentu, ne mechanické přetahování keywordů,
- BreadcrumbList + vhodné application/dataset schema,
- pokud Organization schema používáme, zahrnout korektní `logo`,
- smysluplný alt tam, kde image nese obsah; dekorativní obrázek `alt=""`,
- relevantní interní odkazy na hub + sousední tools,
- žádná orphan stránka,
- žádné broken odkazy / placeholdery / test texty.

### Známý sitewide hygiene backlog z top-page auditu

Při sweepu opravit systematicky, ne po jedné stránce:

- některé Organization schema objekty postrádají `logo`,
- některé title/meta jsou zbytečně dlouhé,
- u některých stránek jsou image alt hlášení — rozlišit dekorativní `alt=""` vs. skutečně chybějící popis.

## H. Performance / CWV readiness

Před deployem:

- žádné zbytečné frameworky,
- preferovat CSS/SVG nad bitmapami,
- explicitní rozměry médií,
- žádný layout shift při výsledku,
- žádné blokující třetí strany bez důvodu,
- minimalizovat duplicitu CSS/JS,
- runtime bez errorů.

Po deployi:

- Lighthouse / PSI mobile + desktop,
- cílit na stávající vysoký RV performance standard,
- actionable performance regrese = není DONE.

Pozn.: CrUX field data aktuálně nelze automaticky číst přes GSC Wizard, protože není nakonfigurovaný CrUX API key. Lab/PSI gate proto musí zůstat součástí release procesu; field CWV se kontroluje dostupným nástrojem / Search Console po nasazení.

---

# 4. QA MINIMUM — RYCHLÉ, ALE NEKOMPROMISNÍ

Každá změněná kalkulačka:

1. JS syntax/runtime PASS.
2. Existující benchmark/regression dataset PASS; pokud výpočet nemá dataset a je netriviální, vytvořit malou deterministickou sadu.
3. Stale-state / invalid input test.
4. Widths: **1440, 1280, 1120, 1024, 768, 390, 320**.
5. 0 horizontal overflow.
6. 0 runtime errors.
7. Keyboard/focus/labels/44px touch target basics.
8. Výsledek neblokuje obsah na mobilu.
9. Canonical/logo/footer/socials/sources check.
10. Customer copy scan.

### Preview pravidlo pro rychlost

- **Flagship / nový archetyp / high-risk correctness:** individuální human preview.
- **Rutinní kalkulačka používající již schválený UX pattern:** může jít v **batchi 3–6 stránek**; human review je batch-level s reprezentativním desktop/mobile preview a seznamem změn.
- Pokud batch review odhalí systémový problém, opravit systémově celý batch.

Tímto se ruší praktika, kdy se u každé běžné kalkulačky vede několikadenní designová debata.

---

# 5. STOP-LOSS PRAVIDLA — ABYCHOM SE UŽ NEMOTALI V KRUHU

1. **DONE stránku nerebuildovat**, pokud nemá P0 correctness, P1 UX/mobile, policy/trust nebo závažný SEO/performance problém.
2. Routine calculator má **1 hlavní build pass + 1 polish/QA pass**. Třetí redesign pass vyžaduje konkrétní blocker, ne pocit „umíme víc“.
3. Pokud současná stránka splňuje nový gate, **KEEP + POLISH**, ne REBUILD.
4. Pokud nový návrh není jednoznačně lepší než live, **live zůstává** a sprint pokračuje další URL.
5. Žádné experimentální feature navíc během finish mode.
6. Žádné nové design systémy; využít V3.2 primitives a již schválené patterns.
7. Bugy nalezené na více stránkách řešit **systemic batch fixem**.
8. Čas se investuje do **coverage celého webu**, ne do nekonečného 5% polish jedné URL.

---

# 6. PRIORITIZACE ZBÝVAJÍCÍCH KALKULAČEK

Pořadí se určí skóre:

**Priority = 40 % GSC opportunity + 25 % thin/value risk + 20 % topic/business relevance + 15 % implementation leverage**

Prakticky:

### P0 — dokončit nejdřív
- indexovatelné kalkulačky s vyššími impressions / clicks,
- stránky s evidentně starým enginem / slabým mobile UX,
- thin/tool-only stránky,
- finanční/právní/zdravotní stránky bez viditelné metodiky nebo zdrojů,
- stránky s P0 correctness chybou.

### P1
- běžné indexovatelné kalkulačky s jasným samostatným intentem,
- stránky, které jsou funkční, ale obsahově nebo vizuálně pod quality floor.

### P2
- nízkotraffic jednoduché utilities, které už jsou funkční a indexovatelné; stačí KEEP + polish, pokud projdou gate.

### Neřešit teď
- nové URL,
- duplicity bez jasného samostatného intentu,
- designové experimenty na DONE stránkách.

---

# 7. DOPORUČENÝ BATCH WORKFLOW

Pro každý batch 3–6 kalkulaček:

## STEP 1 — RECOVERY (maximálně rychle)
- načíst aktuální `main`, registry, inventory/progress,
- otevřít skutečné HTML batch stránek,
- otevřít 2 relevantní reference (`#74` + 1–2 topic refs),
- zkontrolovat existující JS/data/benchmark.

## STEP 2 — CLASSIFY
Každou URL označit:
- `KEEP + POLISH`
- `REBUILD`
- `MERGE/RETIRE` pouze pokud intent objektivně neobhájíme.

## STEP 3 — PRODUCT LOCK
Pro každou URL jen krátký zápis:
- user job,
- essential inputs,
- dominant result,
- unique visual object,
- 2–4 depth questions,
- method/source risk.

## STEP 4 — BUILD
- nechat stabilní V3.2 makro UX,
- hero → tool,
- unique topic treatment,
- meaningful content,
- method/trust,
- full footer/socials.

## STEP 5 — QA BATCH
- calculation/regression,
- all widths,
- accessibility basics,
- SEO/static checks,
- screenshots / live preview reprezentantů.

## STEP 6 — DEPLOY BATCH
- branch → PR → CI → merge,
- live health,
- PSI/lighthouse podle release workflow,
- update progress/inventory/registry/sitemap/search index.

Pak **okamžitě další batch**.

---

# 8. AŽ BUDOU KALKULAČKY HOTOVÉ — SITE REVIEW SPRINT

## 8.1 Homepage
Musí během prvního viewportu vysvětlit:
- co RychléVýpočty.cz jsou,
- proč jim věřit,
- jak rychle najít správný nástroj,
- že nejde o anonymní generator toolů.

Doplnit/ověřit:
- silný brand/product proposition,
- přehled kategorií,
- vybrané ověřené kalkulačky,
- metodika/data/trust odkazy,
- aktuální obsah bez filleru.

## 8.2 `kalkulacky.html`
- skutečný navigační katalog, ne link farm,
- category grouping + stručné vysvětlení,
- search/filter UX,
- žádné mrtvé / duplicitní / nekvalitní položky.

## 8.3 Category hubs
Každý hub:
- vlastní intro a user intent,
- ručně kurátorované hlavní kalkulačky,
- helpful contextual text,
- relevantní návody/data,
- ne jen grid odkazů.

## 8.4 Trust / contact / editorial
Prověřit a podle potřeby doplnit:
- O projektu / kdo web tvoří a proč,
- Kontakt,
- Jak počítáme / metodika,
- Data a benchmarky,
- zásady aktualizace a zdrojování,
- privacy / cookies / terms / disclaimer podle skutečné implementace,
- globální dostupnost těchto stránek z footeru.

Cíl: reviewer i uživatel má během pár kliknutí jasně vidět **kdo web provozuje, jak vznikají výpočty, odkud jsou data a jak nás kontaktovat**.

---

# 9. ADSENSE PRE-REVIEW GATE

Novou žádost neposílat, dokud:

- portfolio upgrade nemá známé otevřené P0/P1 stránky,
- top + náhodný sample kalkulaček není thin/tool-only,
- homepage/katalog/hubs/trust/contact jsou hotové,
- sitemap obsahuje pouze smysluplné indexovatelné URL,
- nejsou broken links / placeholdery / rozpracované stránky,
- on-page audit nemá high/critical problémy,
- sitewide schema hygiene je opravená,
- mobile UX je bez překryvů a overflow,
- PageSpeed/performance nemá actionable regresi,
- klíčové změny jsou crawlable a viditelné v GSC.

Poté:
1. finální sitewide audit,
2. snapshot GSC/indexing/performance,
3. žádost o nové AdSense review,
4. během review **žádný velký redesign**.

---

# 10. EXECUTION MANTRA

> **Finish > fiddle. Value > card count. Unique > templated. Clear > clever. Mobile first. Tool first. Method visible. Whole site matters.**

Největší riziko už není, že jedna kalkulačka nebude absolutně perfektní. Největší riziko je, že budeme týdny leštit jednotlivé URL a celý web zůstane pro site review nehotový nebo nerovnoměrný.

**Tento finish mode zůstává aktivní do explicitního odemčení uživatelem po dokončení AdSense readiness sprintu.**
