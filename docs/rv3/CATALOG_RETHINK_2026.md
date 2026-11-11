# RV3 — katalog od začátku: rozhodnutí, výzkum a implementace (11. 11. 2026)

**Stav:** NOVÁ ALTERNATIVA V2 POSTAVENA, BUILD PASS, DESIGN/PROHLÍŽEČ DOSUD NESCHVÁLEN. Samostatná větev `rv3/engine-poc`, draft [PR #65](https://github.com/fangren740/bmi-kalkulacka/pull/65). Produkce `main` nedotčena.

## Proč byl katalog V1 odmítnut
Původní Studio katalog předvedl **135 plochých karet, 9 vodorovných filtrů a dlouhý seznam**. To uživatele nutí věnovat čas procházení katalogu, místo aby zjistil správný výpočet. Grafická individualita nerovná se dobrá orientace. Neopravovat V1 novými barvami nebo efekty: jeho informační architektura je nedostatečná.

## Benchmark a principy (zdroje)
- [NN/g – Information Scent](https://www.nngroup.com/articles/information-scent/): lidé se orientují podle jasných názvů a kontextu odpovídajícího skutečnému záměru. Namísto žargonu nabídnout otázky „Kolik dostanu čistého?“.
- [Baymard – Mobile Category Navigation](https://baymard.com/research-articles/main-navigation-product-categories): význam kategorie musí být na mobilu čitelný a snadno dohledatelný. Nezavírat všechno za nerozlišitelnou položku „Více“.
- [Baymard – E-commerce Search Research](https://baymard.com/research/ecommerce-search): relevance a ovládání výsledků jsou klíčové; UX vyhledávání není jen samotná logika textového filtru.
- [Omni Calculator](https://www.omnicalculator.com/): přístup k nástrojům kombinací hledání a tematických oblastí; nepřebíráme jeho grafiku ani informační hustotu.
- [Peníze.cz – Kalkulačky](https://www.penize.cz/kalkulacky): česká jazyková orientace na konkrétní případy a krátké popisy, ale nikoliv nekonečný feed při prvním otevření.
- [Netguru – web design trends 2026](https://www.netguru.com/blog/modern-web-design-trends): vizuální trendy používat jen tehdy, pokud nezvyšují LCP/INP/CLS a nepřekáží přístupnosti. V tomto projektu jednoduchá statická sazba vítězí nad maximalistickým bento katalogem.

**Nejde o kopii konkurenčního webu ani o prokázaný uživatelský test.** Zdroje jsou inspirace pro hypotézy, které musí potvrdit reálné použití.

## Nový design V2 – od uživatelského záměru, ne od inventáře
1. **První obrazovka:** jediná otázka „Co dnes potřebujete spočítat?“, výrazné české vyhledávání a šest přímých situací (čistá mzda, hypotéka, příplatky, dovolená, rekonstrukce, DPP/DPČ).
2. **Hledání na místě:** relevance místo prostého „obsahuje“; diakritika, české varianty, synonymní dotazy (pracák, výplata, neschopenka), max. šest okamžitých výsledků, volba „další“; Enter / šipky / Escape / Ctrl+K. Nic se neposílá přes síť ani neukládá.
3. **Osm vysvětlených oblastí** (práce, finance, podnikání, domácnost, rodina, stavba, auto, rychlé výpočty). Všechny jsou ve výchozím stavu **zavřené**; uživatel rozbalí jen svou oblast.
4. **V rámci oblasti** maximálně pět redakčně vybraných doporučených vstupů, poté další nástroje schované za druhým nativním `details`. Žádný nepřehledný 135-card grid.
5. **135/135 reálných adres** zůstává v statickém HTML, přístupných bez JS, s originálními názvy, popisy a přesnými URL. Typologie explicitně v `rv3/engine/catalog-v2.taxonomy.json`, nikoli počítáním pozic v seznamu.
6. **Brand**: původní SVG logo, navy + tlumená zelená, systémová typografie, užitečné mezery a jeden jasný tmavý footer. Žádné dva stejné světle zelené bloky pod sebou.

## Technické provedení (pouze experimentální URL)
- `rv3/engine/shell-v2.mjs`: sdílený build-time header/footer.
- `rv3/engine/catalog-v2.mjs`: SSR statického HTML a přesně 135 nástrojů s důslednou validací a escapováním.
- `rv3/engine/catalog-v2.taxonomy.json`: stabilní přiřazení všech cest do 8 oblastí + redakční výběr.
- `rv3/catalog-v2.css`: nový responsive vzhled, žádné externí fonty, typové breakpointy.
- `rv3/catalog-v2-search-core.mjs`: pure Czech relevance funkce sdílené pro prohlížeč a Node testy.
- `rv3/catalog-v2-ui.mjs`: pouze progressive enhancement, originální odkazy fungují i bez klientského JavaScriptu.
- `cloudflare/tests/v3-catalog-v2.test.mjs`: HTML navigace, počet nástrojů, 8 kategorií, search relevance, bezpečnost dat, keyboard a size budget.
- `scripts/build-v3-engine-poc.mjs`: generuje **/rv3/poc/katalog-v2.html** vedle původního **/rv3/poc/studio-katalog.html** pro A/B posouzení, BEZ úpravy root URL.

## Pravdivé ověření
- ✅ Skutečný Cloudflare Workers build + deployment pro commit `4d3b8d02` SUCCESS. Test předtím odhalil problém relevance: obecné „čistá mzda“ a „hypotéka“ vracely jiné specializované nástroje na 1. místě. Skórování bylo opraveno a nová kontrola přidaná; build nyní PASS.
- ✅ 135 nástrojů, 8 přístupných kategorií, 6 přímých cest; HTML ~114,8 KB nekomprimované, CSS ~15,3 KB, JS rozhraní ~4,1 KB + search core ~1,6 KB. Nejedná se o skutečná data přenosu / Lighthouse.
- ✅ Předcházející Studio návrh zůstává nedotčený.
- ⚠️ Skutečný **HTTP load, screenshoty 390/1440, klávesnicový test v browseru a Lighthouse/CrUX** neověřeny. Cloudflare build != skutečný browser QA.
- ⚠️ Cloudflare workers preview doména je odvozená z existujícího branch hostu; pokud nefunguje, použít Cloudflare build detail ke zjištění skutečného aliasu. Neoznačovat odkaz za externě otestovaný.

## Náhledy ke srovnání
- **V2 — návrh založený na potřebě:** https://rv3-engine-poc-rychlevypocty-v3-preview.maattinek.workers.dev/rv3/poc/katalog-v2.html
- **V1 — starý 135-card katalog:** https://rv3-engine-poc-rychlevypocty-v3-preview.maattinek.workers.dev/rv3/poc/studio-katalog.html
- **[PR #65](https://github.com/fangren740/bmi-kalkulacka/pull/65)**.

## Schvalovací brána
Vlastník nejprve prohlédne V2 na PC a mobilu. Další práce má odstranit konkrétní vizuální nebo navigační chyby, doplnit browser QA, ověřit reálné hlavní úkoly a až pak označit katalog jako **READY FOR APPROVAL**. Bez výslovného souhlasu žádný merge / production / DNS změna.
