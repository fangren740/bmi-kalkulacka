# RV3 design north star — schválený směr katalogu kalkulaček

**Datum:** 15. 11. 2026  
**Stav:** ZÁVAZNÝ VIZUÁLNÍ REFERENČNÍ SMĚR pro nový web; konkrétní jiné stránky dál podléhají uživatelovu vizuálnímu schválení.  
**Rozhodnutí:** Majitel opakovaně zdůraznil, že nový katalog je předobrazem celého V3 a opakovaně odmítl odlišně působící redesign O projektu. **Barevný soulad není dostatečný.**

## Přesně identifikovaný referenční artefakt (NE obecný popis)

1. **Katalog — hlavní živý zdroj HTML a chování:** `rv3/engine/catalog-v2.mjs`, preview `/rv3/poc/katalog-v2.html`
2. **Vizuální vrstva nového katalogu:** `rv3/catalog-v3-theme.css` + `rv3/catalog-v2.css`
3. **Ilustrace a jejich skutečný art direction:** `rv3/assets/hero-desk.svg` a `rv3/assets/category-*.svg`
4. **Navigace/brand, původní logo:** `rv3/engine/shell-v2.mjs`, původní `/logo-rv-v32.svg`
5. **Referenční schvalovaný návrh a historie:** [draft PR #66](https://github.com/fangren740/bmi-kalkulacka/pull/66), později [QA PR #69](https://github.com/fangren740/bmi-kalkulacka/pull/69); [reálné browser QA 390/1440 v důkazech PR #69](https://rv3-browser-qa.maattinek.workers.dev/proof/fb147f87-9a97-44cb-8b5e-7d40d190927d) (důkaz dočasný, 7 dní)
6. **Původní pochválený vizuální mockup:** není v těchto zdrojových souborech jednoznačně identifikovaný jako samostatný definitivní obrazový artefakt. **Nezaměňovat implementovaný katalog automaticky za 100% věrnou realizaci původního mockupu**; majitel upozornil, že implementace původně nebyla stejně propracovaná.

## Co tvoří skutečný V3 vizuální rukopis (ověřeno ve zdrojovém CSS)

- **Typografie:** výrazný, zhuštěný tmavý sans-serif titulek, ale kontrastní zelená **kurzivní SERIF část**. `rv3/catalog-v2.css`: `.rv3d-discovery h1 em` a `.rv3d-domains-head h2 em` používají `font-family:Georgia,"Times New Roman",serif; font-style:italic; font-weight:400`. Tento kontrast byl v O projektu **zcela vynechán** (o projektu má `font-style:normal`) a je jeden z hlavních důvodů, proč vypadá jako jiný design.
- **Barvy a světlo:** navy `#0d2e42` / `#102c3e`, aktivní zelená `#0b8746` / `#07823e`, plochy `#f8fbf5`, `#f0f9ee`, `#d1f1d5`, jemné stíny `#144f4112` a zelené přechody. **Light-first** s účelným kontrastem, ne několik masivních tmavých kapitol.
- **Ilustrace:** skutečné pečlivě nakreslené lokální SVG objekty s hloubkou/stíny, plastickými komponenty, teplými detaily a rozpoznatelnými předměty; původní katalogové `hero-desk.svg` ukazuje kalkulačku, zápisník, šálek a rostlinu. **Jeden generický CSS diagram v boxu není výtvarný ekvivalent.** Každá stránka může mít vlastní unikátní scénu, ale ve stejné kreslené úrovni.
- **Rozvržení:** výrazná, ale věcná úvodní oblast + současně viditelná jasná uživatelská akce; krátké, významově jasné texty, detailně vyřešené řádky/karty s nízkou výškou a decentními stíny. Z katalogu sdílet vizuální jazyk, nikoli kopírovat 8 kategorií tam, kde nesouvisejí.
- **Interakce:** zaoblené, přirozeně použitelné prvky; katalogový hledací prvek je vysoký 66px s jasným zeleným aktivním tlačítkem. Pro stránky bez vyhledávání použít stejně dotažené CTA a vysvětlující komponenty, ale nevymýšlet inertní prvky.
- **Jednotný shell:** skutečné logo, spacing a navigace; samostatné převzetí headeru/footeru ani podobných `#0b8746` barev **nestačí** ke konzistentnímu brandu.

## Konkrétní rozpor se současným draft PR #70 — O projektu

| Referenční katalog V3 | O projektu ve verzi `fc56d0b` | Verdikt |
|---|---|---|
| Kurzivní zelený serif v nadpisech | `.rv3a-page :is(h1,h2) em{font-style:normal}` | **NESOULAD** |
| Původní logo + detailní lokální ilustrace předmětů | logo ano, ale hlavní vizuál tvoří generické HTML/CSS karty | **NESOULAD** |
| Lehký, vzdušný výraz a světlo/mint | přehnaně výrazná velká tmavá kapitola + příliš velké titulky | **NESOULAD** |
| Krátké, konkrétní rozhodovací cesty | několik rozsáhlých obecných editorial bloků | **NEVYVÁŽENÁ HUSTOTA** |
| Charakteristická kresba, detaily, mikrointerakce a kompaktní komponenty | generické panely a jednoduchý „R/V“ monogram ve stránce | **NESOULAD** |
| Sdílený systém, odlišný účel každé stránky | shared header/footer, ale většina nových prvků designově odlišná | **NESTAČÍ** |

Toto srovnání je založeno na konkrétním GitHub HTML/CSS. Vizuální dojem je nutno teprve potvrdit **reálnými 390×844 a 1440×900 screenshoty ve stejném prohlížeči**.

## Povinný postup pro KAŽDOU další stránku V3

1. Otevřít skutečnou implementaci katalogu (včetně `catalog-v2.css`, `catalog-v3-theme.css`, SVG, `shell-v2.mjs`) a **porovnat skutečné screenshoty 390/1440** před prvním návrhem.
2. Dát 1 konkrétní stránce vlastní účel a kvalitní originální koncept; stejný brand, stejná úroveň grafického řemesla, **nikoliv univerzální šablona**.
3. **Dva explicitní review body:** (a) vizuální příslušnost ke katalogové rodině, (b) unikátní UX záměru stránky. Zdrojové testy a browser PASS samy design neschvalují.
4. Náhled a screenshoty nového návrhu vedle katalogu, v mobilu i PC, předložit majiteli. **Jeho vizuální schválení je gate**, bez něj jen draft.
5. Dokumentovat konkrétní výtky a opravy v PR a `docs/rv3/pages/<slug>.md`; při opakovaném nesouladu nepokračovat na jiné stránky.
6. Neměnit produkční `main`, hosting či DNS bez samostatného explicitního povolení.

## Stav

- **Katalog V3 = zdroj pravdy.**
- **O projektu PR #70 = vizuálně ZAMÍTNUTO / NEPŘIPRAVENO K SCHVÁLENÍ**; nový směr se musí navrhnout podle existujícího katalogového visual benchmarku, ne další izolovanou rukou.
- Zdrojový design není přenos pouhou barvou a logem. Všechny další stránky jsou stejně důležité jako katalog, ale mají vlastní produktový příběh.
