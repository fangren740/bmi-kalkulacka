# RV3 Page Studio — Jak počítáme

**Veřejná URL:** /jak-pocitame.html · **Izolované preview:** /rv3/studio/jak-pocitame.html  
**Stav:** DRAFT / design review + QA pending · **Datum práce:** 15. 11. 2026  
**Zařazení:** Trust / methodology · 207-url plan (R5). Produkce a původní soubor ZAMČENY.

## Baseline skutečně přečteného zdroje

Zdroj pravdy: \`jak-pocitame.html\` z repozitáře V3:
- title \`Jak počítáme | RychléVýpočty.cz\`
- canonical \`https://rychlevypocty.cz/jak-pocitame.html\`
- meta description \`Metodika výpočtů, práce se zdroji, referenčními roky, testy a limity kalkulaček.\`
- source JSON-LD (WebPage + BreadcrumbList, původní \`dateModified\` 2026-08-15); před produkčním release aktualizovat jen po skutečné editaci veřejné stránky.
- Obsah: přesný/modelový/orientační výsledek; platné období; primární zdroje; benchmark CSV; hraniční/ruční testy; změny sazeb a oprav.
- Starý layout \`rv-trust-v7.css\`, sidebar \`trust-nav\`, \`hero-panel\` a \`card\` nejsou designovou referencí a **nepřebírají se**.
- \`data-a-benchmarky.html\`: doložený dataset \`#dataset-sleva-objem\`, CSV \`/sleva-vs-potrebny-objem-prodeje-benchmark.csv\`, cena 1 000 Kč, variabilní náklad 600 Kč, sleva 10 %, potřebný objem +33,3 %. Jde o model fixního jednotkového nákladu a nezměněných fixních nákladů; poptávku nepředpovídá.

## Výsledná otázka uživatele

„Jak poznám, jestli mohu výpočtu věřit? A dokážu si na konkrétním příkladu ověřit, co se stane, když změním jeden údaj?“

**Odlišnost od O projektu:** O projektu vysvětluje, *proč* web existuje a kdo je za něj odpovědný. Jak počítáme ukazuje *jak* lze konkrétní výsledek vysvětlit a ověřit — krátký skutečný model, původní zdroj, testování a omezení.

## Design north star

Přímo načítat \`rv3/catalog-v2.css\` + \`rv3/catalog-v3-theme.css\`, skutečný \`shell-v2.mjs\` s původním \`logo-rv-v32.svg\`, katalogovou tmavou sans + zelenou kurzivní serif typografií, světlou/mint paletou a pečlivou lokální ilustrací (nikoliv další barevný trust-nav skin).

**Unikátní art direction této stránky:** originální \`rv3/assets/method-workbench.svg\` — zápisník, referenční list, modelový graf, tužka, kalkulačka a výrazná lupa. Významné drobné SVG symboly z již schválené rodiny \`rv3/assets/about-icons.svg\` se bezpečně sdílejí. Žádné externí fonty ani framework.

### Specifické sekce

1. **Hero:** výsledek není černá skříňka; 2 skutečné cesty (živá ukázka/ověřovací postup).
2. **Živý důkaz:** nezávislý malý model sleva–objem. 5 volitelných scénářů (0/5/10/15/20 %) s viditelnými změnami Kč, příspěvku na jednotku a požadovaného objemu. Výchozí SSR stav 10 % / +33,3 %, použitelný i bez JavaScriptu; všechny ovládací prvky mají \`aria-pressed\` a fokus, živá hodnota \`aria-live=polite\`.
3. **Pět ověřovacích bodů:** zdroj, vstupy, výpočet, hraniční testy, smysl/omezení — vlastní přesně zvolená ikonografie.
4. **Tři typy výsledků:** samostatné přehledné karty, žádný blanket guarantee.
5. **Zdroje, datum, CSV:** skutečné podklady a odkaz na knihovnu.
6. **Opravy a limity:** způsob nahlášení chyby bez slibu nepodložené reakční doby, redakční zásady a vhodné varování pro finanční/zdravotní rozhodnutí.
7. **Navazující CTA:** katalog V3 a již předělané O projektu.

## Implementace a testy

- \`rv3/engine/methodology.template.html\` — zcela nezávislý, přístupný statický HTML návrh, nepřebírá zdrojový \`main\`.
- \`rv3/engine/studio-methodology.mjs\` — striktní fail-closed validace původní source identity, důležitých faktických tvrzení a JSON-LD. Zpracuje vlastní statický template a sdílené header/footer.
- \`rv3/sitewide/methodology.css\` — mobilní a desktopový design odlišný od About, stále ve stejné brand rodině.
- \`rv3/sitewide/methodology-demo.js\` — čistá deterministická modelová funkce + malý DOM enhancer, žádná závislost; nesmí měnit produkční \`/kalkulacka-slevy.html\`.
- \`cloudflare/tests/studio-methodology.test.mjs\` — SEO/robots, fail-closed, ikonografie, důkazy a numerické scénáře; při změně zdroje nesmí potichu pokračovat.
- \`cloudflare/browser-qa/visual-review.json\` na této větvi míří pouze na \`/rv3/studio/jak-pocitame.html\`. Staré About QA zůstává zachované na předchozí vývojové větvi.
- Nikdo nesmí prohlásit šablonu za produkčně schválenou jen proto, že Cloudflare sestavil preview. Samostatný Browser Run 8+2 a skutečné screenshoty 390×844/1440×900 jsou schvalovací brány.

## Stage checklist

- [x] Source review včetně skutečného datasetu/CSV anchoru
- [x] Unikátní UX brief a výtvarná koncepce dle katalogu V3
- [x] Implementovaný statický návrh, vlastní SVG a JS model
- [x] Připravené regresní testy a fail-closed zdrojové kontroly
- [ ] Zelený Cloudflare build a immutable deployment pro konkrétní SHA
- [ ] Browser QA 390×844 a 1440×900, klikání na všechny scénáře, konzole, overflow, noindex, ikony a navigace
- [ ] Lighthouse výkon/A11y/SEO bez neověřených čísel
- [ ] **Vizuální a obsahové schválení vlastníkem**
- [ ] Produkční release pouze s výslovným souhlasem a zajištěným rollbackem
