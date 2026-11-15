# RV3 Page Studio — Cookies a lokální úložiště

**V3 preview:** \`/rv3/studio/cookies.html\`. **Veřejná URL:** \`/cookies.html\` (produkce beze změn).  
**Branch:** \`rv3/studio-cookies-20261115\`, stacked na Privacy PR #77, DRAFT / factual review blocked.  
**Zadání:** obsah, ikony a vzhled v úrovni katalogu V3, přitom žádná výplň ani dekorativní „testery“.

## Zdroj faktů / záměrně zachované podklady

Původní dokument \`cookies.html\` přímo z GitHubu: **Git blob \`68e9ba2b0db21a80dfdb5a7dc3443e17394eb56f\`**. Současný source v produkci má:
- SEO title: \`Cookies a lokální úložiště | RychléVýpočty.cz\`
- canonical: \`https://rychlevypocty.cz/cookies.html\`
- meta description: \`Přehled lokálního ukládání a URL parametrů používaných na RychléVýpočty.cz, včetně přesných spouštěčů a možností odstranění.\`
- JSON-LD \`WebPage + BreadcrumbList\`; source \`dateModified=2026-08-04\`, nesmí být vydáváno za aktualizaci dnešního data.
- **Pět tematických sekcí přesně v původním znění** (přehled cookies/localStorage/URL, tvrzení o analytice, tabulka uložišť, postup mazání, sdílení URL). Design mění pořadí pouze ve prospěch čtenáře: rozlišení pojmů → devět klíčů → jak smazat → sdílení → analytika.
- **Devět přímých source klíčů a 54 úplných datových buněk**: \`rv_catalog_favorites_v1\`, \`rv_catalog_recent_v1\`, \`rv-name-calendar-favourites-v1\`, \`rv-vacation-planner-v1\`, \`rv-shift-calendar-v1\`, \`rv-workdays-v2\`, \`rv_ac_calculator_v3\`, \`rv-rough-build-v4\`, \`rv-storage-preferences-v1\`. U každé položky 6 informací: klíč, účel, spouštěč, výslovná volba, uchování a odstranění.
- **Nepodložená aktuálnost není důkaz:** source tvrdí, že GA4/AdSense a reklamní technologie na veřejných stránkách nejsou aktivní. Tyto věty zůstaly doslovně převzaty jako historický obsah zdroje; přímo **před nimi** je ve V3 preview jasně viditelné upozornění, že aktuální stav vyžaduje ověření. GitHub code search na produkční \`main\` poskytl omezené výřezy některých klíčů; nelze považovat za úplný audit všech JS souborů nebo runtime provozu.
- Neprovádělo se automatické mazání lokálního úložiště; taková funkce by byla riskantní a pro designovou stránku nesmyslná.

## Individuální produktový koncept

**Otázka návštěvníka:** „Co se může uložit, jakou akcí to vznikne a kde to smažu?“ Tato odpověď má být snadno dostupná bez čtení generických marketingových bloků.

1. **Krátký hero** s původním logem, autorskou ilustrací \`rv3/assets/storage-drawer.svg\`: otevřený prohlížeč a zásuvka s kartami „9 položek“, skutečný symbol smazání, žádné generické padlock opakování Privacy.
2. **Navigace na přesné informace**, přímý CTA na tabulku a smazání.
3. **Pojmy** cookies vs localStorage vs URL se všemi původními důležitými limity.
4. **Devět podrobných položek**: na desktopu technicky uspořádaná 6sloupcová tabulka, na mobilu 390px jednotlivé úplné karty z původního HTML \`data-label\`. Žádný horizontální scroll celé stránky ani vypouštění sloupců.
5. **Smazání a rizika sdílení**: stručné a konkrétní původní instrukce v sousedících sekcích na desktopu, za sebou na mobilu.
6. **Měření a reklama**: původní text doslova, ale viditelně \`PENDING FACTUAL AUDIT\`; žádný nepravdivý nový slib.
7. Související \`Ochrana osobních údajů\` a \`Kontakt\` jsou jen dvě užitečné navigační položky. **Nejsou** přidané žádné interaktivní ovladače, náhodné moduly, zbytečný JS nebo duplicitní sekce.

## Source-lock a testy

- Renderer \`rv3/engine/studio-cookies.mjs\` kontroluje Git blob SHA původního dokumentu, přesný source title/description/canonical/index, JSON-LD, všech 5 původních oddílů, 9 přesných storage klíčů a 54 \`td\` buněk.
- \`rv3/engine/cookies.template.html\` má vlastní layout a všude používá **doslovné HTML fragmenty** zdrojového obsahu. Nemění data, retention ani právní tvrzení. Preview robots \`noindex,nofollow,noarchive\`.
- \`rv3/sitewide/cookies.css\`, \`rv3/assets/storage-drawer.svg\`; stejné dvě katalogové značkové CSS a shared shell. Bez frameworku.
- \`cloudflare/tests/studio-cookies.test.mjs\`: 8 specifických regresních bloků pro source fidelity, SEO, úplné tabulkové informace, navigaci, faktická upozornění, mobilní UX, ikonografii a fail-closed.
- Build \`scripts/build-v3-engine-poc.mjs\` vytváří jedinou izolovanou \`/rv3/studio/cookies.html\`.
- \`cloudflare/browser-qa/visual-review.json\` má jako jediný target novou cookies stránku.

## Factual + technical release blockers

- [ ] Prověřit, zda všech 9 klíčů, přesné spouštěče, preference a mazání stále odpovídají produkčnímu JS/runtime; source tabulka sama nestačí.
- [ ] Síťovým auditem ověřit skutečný produkční stav GA4/AdSense/CMP (před/po souhlasu, skripty a cookies) a aktualizovat text \`cookies.html\` i \`ochrana-osobnich-udaju.html\` koordinovaně podle důkazů.
- [ ] Prověřit stav po případné migraci hostingu GitHub Pages → Cloudflare.
- [ ] Node suite / Cloudflare build SUCCESS na přesné SHA, immutable preview URL.
- [ ] Reálné Browser Run 8+2, mobil 390×844/desktop 1440×900: 9 úplných záznamů (včetně všech polí), overflow 0px, typografie, kontextové ikony/SVG, zdrojové právní texty, noindex, interní odkazy a konzole.
- [ ] Vizuální/obsahové schválení majitelem a případně právní revize. Produkční \`main\`/DNS bez změn.

**Pravidlo po redakční revizi:** Funkce nebo sekce musí řešit skutečnou potřebu uživatele; barevné dekorace nejsou účel. Právní zdroj se při designovém kole potichu nemění.
