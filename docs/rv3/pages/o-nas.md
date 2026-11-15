# RV3 / O projektu — individuální design podle nové vizuální rodiny katalogu

**Cíl URL:** `/o-nas.html` · **náhled:** `/rv3/studio/o-nas.html` · **implementace:** [draft PR #70](https://github.com/fangren740/bmi-kalkulacka/pull/70) · **produkce:** ZAMČENÁ

## Vstupní návrhové rozhodnutí

Majitel zamítl první pokus jako přebarvenou legacy stránku a druhý jako samostatně vypadající web, který **neodpovídá novému katalogu**. Proto není „zcela od nuly“ dostatečné kritérium: nový návrh musí působit jako **stejná prémiová vizuální rodina jako katalog V3**, a přitom mít vlastní strukturu podle záměru čtenáře.

**Závazná reference:** [DESIGN_NORTH_STAR_CATALOG_V3.md](../DESIGN_NORTH_STAR_CATALOG_V3.md). Odkazuje přímo na [katalogový PR #66](https://github.com/fangren740/bmi-kalkulacka/pull/66), `rv3/catalog-v2.css`, `rv3/catalog-v3-theme.css`, `rv3/engine/shell-v2.mjs`, SVG ilustrace a skutečný browser QA sesterských stránek.

## Co přicházející návštěvník opravdu řeší

„Kdo za RychléVýpočty.cz stojí, proč tento projekt existuje, odkud se berou čísla a jaké mají limity?“ Po stránce má umět s důvěrou začít používat odpovídající kalkulačku nebo nahlásit nejasnost. Žádné vymyšlené týmy, odborná oprávnění, recenze či korporátní záštita.

## Třetí iterace — návrh současné větve

1. **Světelná katalogová hero scéna** a původní logo. Nadpis s totožnou **zelenou serifovou kurzivou** jako katalog, short copy, primární zelené CTA a jemná „proof“ řádka.
2. **Nová vlastní lokální ilustrace** `rv3/assets/about-story.svg`: ručně komponovaný detailní zápisník, ověřovací listy, kalkulačka a pero; stejný materiálový a barevný art direction jako katalogové `hero-desk.svg` a `category-*.svg`. Nevkládá vymyšlené finanční výsledky.
3. **Proč web vznikl:** otázky ze života a konkrétní užitek; bez generického nabubřelého úvodu.
4. **Tři principy:** významově dotažené kompaktní karty v katalogové rodině. Explicitní cesta zadání → podklady → vysvětlení.
5. **Upřímnost výsledků:** čitelný světlý panel pro přesný / modelový / orientační výpočet, bez dramatického obřího tmavého pruhu.
6. **Skutečný provozovatel:** přímý kontakt a ověřená fakta ze zdroje, v lidsky použitelné světlé kartu, bez vymyšlené fotografie.
7. **Tři konkrétní další cesty:** katalog, metodika, kontakt. Kratší než předchozí stránky, mobilní pořadí navržené zvlášť.

## Technický kontrakt

- **Z katalogu přímo načítá** `/rv3/catalog-v2.css` a `/rv3/catalog-v3-theme.css`, nikoliv jejich nápodobu; navíc pouze `/rv3/sitewide/about.css` pro specifický účel této jedné stránky.
- Hlavička/patička jsou doslova sdílené funkce `renderHeaderV2` / `renderFooterV2`; používají originální `logo-rv-v32.svg`.
- Nezpracovává původní HTML jako layout. Ze `/o-nas.html` validuje skutečnou identitu, původní title/description/canonical, viditelné FB/IG odkazy, email a JSON-LD; nemění root stránku ani ostatní kalkulace.
- HTML obsahuje jednu hlavní oblast, jediný H1, původní canonical a noindex na izolovaném preview. Žádné nové sledovací skripty, externí fonty, framework nebo falešný formulář.
- U tlačítek do katalogu se během preview používá `/rv3/poc/katalog-v2.html`; při budoucím explicitně schváleném produkčním nasazení vyžaduje přesměrování na `/kalkulacky.html`.

## Vizuální měřítko

**O projektu** a **katalog V3** musí obstát vedle sebe jako dvě stránky stejného produktu. Kvalita ilustrací a písma musí být stejná nebo vyšší než u katalogu, i když informační struktura a UX jsou jiné. Source testy ani build SUCCESS samy o sobě nejsou schválení designu.

- Referenční katalog: `/rv3/poc/katalog-v2.html`
- Nové O projektu: `/rv3/studio/o-nas.html`
- Do uživatelského review přiložit **reálné** mobilní 390×844 a desktop 1440×900 screenshoty (nenahrazovat renderovaným AI mockupem). Pokud nejsou k dispozici, přiznat NEOVĚŘENO.

## Stage checklist

- [x] Baseline z originálního HTML; ověřené URL, canonical, identita a metoda
- [x] Explicitní srovnání s referencí katalogu a dvěma zamítnutými verzemi
- [x] Nový obsahový strom, přímé katalogové styly, unikátní SVG ve stejné kresbě
- [x] Source regressions v `cloudflare/tests/studio-about.test.mjs`
- [x] Cloudflare Build + Deployment SUCCESS pro kódový commit `2542fc4` (viz Cloudflare bot v PR)
- [x] Reálné browser QA původní obsahové verze O projektu: 390×844 a 1440×900, snímky a navigace v PR #71 na SHA `d6a09d1` — **před aktuálním obsahovým kolem**
- [ ] Ověřit 8+2 browser QA, snímky a vizuální review **po aktuálních obsahových změnách**
- [ ] Lighthouse/PageSpeed na nové stránce
- [ ] **Vizuální schválení vlastníkem** (aktuálně `VISUAL_REVIEW_PENDING`)
- [ ] Produkční release jen s konkrétním výslovným souhlasem

## Obsahové kolo — důvěryhodnost, důkazy, konkrétnost (15. 11. 2026)

**Záměr:** Stránka O projektu má být čtivým vstupem do obsahu webu, nikoliv opakovaným sloganem. Cílem je konkrétní vysvětlení užitku a důvěryhodnosti s dohledatelnými podklady. Je to redakční úprava již zvoleného a technicky ověřovaného designu; ne další grafický restart.

### Zásadní úpravy textu
- Hero pojmenovává nezávislý projekt online kalkulaček a princip práce se vstupními údaji; neopakuje jen „číslo a souvislosti“.
- „Proč vznikl“ se opírá o srozumitelné otázky čisté mzdy a hypotéky. **Žádný neověřený osobní příběh zakladatele.**
- Postup tvorby ukazuje konkrétní smysl jednotek, zaokrouhlování, původních zdrojů, období platnosti, hraničních příkladů a modelových datasetů.
- Přibyl přímý důkazový odkaz na `/data-a-benchmarky.html`, kde existuje skutečná knihovna scénářů a CSV. Odkaz není tvrzení, že všechny kalkulačky jsou 100% ověřené.
- Odpovědný provozovatel a praktický, nikoliv marketingový popis použití AI/automa­tizace jako pracovního podkladu.
- Dvě stručné transparentní informace: soukromí běžných výpočtů **s důležitou výjimkou pro sdílené URL** a zásada nezávislosti výpočtů na případných reklamách.
- Návod k nahlášení chyby obsahuje URL, vstupní hodnoty a očekávaný výsledek, bez nepravdivé garance reakční lhůty.

### Evidenční zdroje (zdroj pravdy v tomto repu)
- `jak-pocitame.html` — původní podklady, období a hraniční příklady, CSV u vybraných výpočtů
- `data-a-benchmarky.html` — reálně existující přístupná knihovna datasetů (počet datasetů je proměnlivý, proto jej na About neuvádět)
- `redakcni-zasady.html` — transparentní zapojení AI, odpovědnost autora a postup oprav
- `ochrana-osobnich-udaju.html` — běžný výpočet v prohlížeči, localStorage a výjimka pro URL se stavem
- `reklama-a-spoluprace.html` — politika označování obchodního obsahu a oddělení obchodních vztahů od vzorců
- `kontakt.html` — skutečná adresa a návod, co poslat při zjištěné chybě
- `o-nas.html` — právní identita provozovatele a zachování canonical/title/JSON-LD

### Důležité release podmínky
- Source regresní testy v `cloudflare/tests/studio-about.test.mjs` byly rozšířeny tak, aby ověřily skutečné cílové stránky, přímé odkazy, transparentní tvrzení a responzivní layout.
- **Nová content verze = VISUAL_REVIEW_PENDING.** Zelený build a minulé screenshoty nepokrývají nově změněnou délku textů, která může ovlivnit rozvržení. Bez nového reálného Browser Run ji neoznačovat jako finální.
- Před produkčním schválením ověřit aktuální faktický stav financování a ochrany dat, opravit preview-only odkazy do katalogu a zaktualizovat `dateModified` v JSON-LD podle skutečného data změny veřejné stránky.
- `main`, DNS a GitHub Pages zůstávají bez změny.
