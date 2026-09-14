# RychléVýpočty.cz V7 — NO-REGRESSION RELEASE LOCK

Datum: 14. 9. 2026
Stav: ACTIVE / RELEASE-BLOCKING WORKFLOW RULE

## Základní pravidlo

**Na produkci se nesmí nahrát nový kandidát, který je v některé důležité oblasti horší než aktuální live verze stejné URL.**

Redesign není upgrade jen proto, že vypadá nověji. Nová verze musí zachovat nebo zlepšit reálnou hodnotu současné produkce a současně být jako celek prokazatelně lepší.

## Povinný baseline před každým upgradem

Před buildem jedné kalkulačky se aktuální produkční stránka bere jako povinný baseline. Musí se explicitně projít a zachytit její silné stránky, ne jen chyby.

Minimálně porovnat:
- correctness a výpočetní logiku,
- všechny užitečné funkce a režimy,
- obsahovou hloubku a praktické informace,
- metodiku, zdroje, disclaimery a trust,
- hlavní user jobs a přirozené follow-up otázky,
- desktop UX,
- mobile UX,
- accessibility,
- SEO metadata, schema, indexability a interní linky,
- brand/identity,
- performance / CWV rizika,
- informační hodnotu pro AdSense a uživatele.

## HARD GATE — kandidát nesmí regresovat

Kandidát může projít do user preview pouze tehdy, když:

1. **nemá známou P0/P1/P2 regresi proti live**, nebo je konkrétní trade-off výslovně schválen uživatelem;
2. zachovává všechny důležité užitečné funkce live verze, pokud nejsou nahrazeny lepším řešením;
3. zachovává všechny důležité same-intent informace live verze, pokud nejsou sloučeny nebo nahrazeny lepší a srozumitelnější formou;
4. neztrácí metodickou přesnost, zdroje, disclaimery, indexovatelnost, interní linky ani důležité SEO signály;
5. mobil není složitější, delší nebo hůře ovladatelný bez jasného přínosu;
6. design nezhoršuje PageSpeed/CWV bez konkrétního a schváleného důvodu;
7. jako celek je kandidát **materiálně lepší než live**, ne pouze jiný.

## Content preservation rule

Při redesignu se nesmí mechanicky mazat kvalitní text jen proto, že nový vizuál používá méně bloků.

Postup:
- z aktuální live stránky vytvořit seznam unikátních užitečných informací;
- každou informaci buď zachovat, zlepšit, spojit s jinou bez ztráty významu, nebo vědomě odstranit jako duplicitu / vatu;
- pokud nový kandidát ztratí důležitou praktickou otázku, příklad, hranici metody nebo vysvětlení, **candidate = FAIL**.

**Vizuálně silnější, ale obsahově slabší stránka není upgrade.**

## Feature preservation rule

Stejně platí pro funkce:
- režimy výpočtu,
- relevantní vstupy,
- edge-case ochrany,
- interpretaci výsledku,
- související odkazy,
- užitečné interaktivní prvky.

Funkci lze odstranit pouze tehdy, když:
- je pro user job zbytečná nebo chybná,
- nahrazuje ji lepší řešení,
- nebo jde o vědomé zjednodušení s doloženým UX přínosem.

## Povinný LIVE → CANDIDATE DELTA REVIEW

Před user preview musí vzniknout stručný interní delta review:

- Co live dělá dobře a kandidát to zachovává.
- Co kandidát zlepšuje.
- Co kandidát odstraňuje a proč.
- Zda existuje jakákoli známá regrese.
- Verdikt: `SUPERIOR / FAIL`.

Bez verdiktu **SUPERIOR** se kandidát uživateli neposílá jako připravený upgrade.

## Production gate

Po user approval se před deployem znovu ověří, že schválený kandidát je totožný s deploy buildem podle `RV_LIVE_PREVIEW_LOCK_2026-09-11.md`.

Po deployi se navíc porovná produkce s předchozí live verzí v:
- smoke/regression testech,
- mobile/desktop vizuálu,
- accessibility,
- Lighthouse/PageSpeed,
- live health.

Pokud produkční release prokazatelně zhorší důležitou oblast, release není DONE a musí se opravit nebo rollbacknout.

## Nadřazený princip

**Nová verze musí být minimálně stejně dobrá ve všech důležitých oblastech a jako celek zřetelně lepší.**

Designový refresh, který zahodí informační hodnotu, funkci, správnost nebo výkon současného live produktu, je RELEASE FAIL.
