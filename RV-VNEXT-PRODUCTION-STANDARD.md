# RychléVýpočty.cz V-next — Production Standard

**Revize:** 23. 8. 2026  
**Verze:** 2.3

Tento dokument je závazný výrobní checklist pro každý nový kalkulátor, tool, utilitu, tracker, lookup nebo datový produkt. Cílem není vyrábět více URL, ale každý nový asset posunout nad úroveň předchozí generace RychléVýpočty.cz.

## 1. Discovery / PRE-BUILD gate
- Nový asset musí řešit samostatný český user intent; neštěpit existující URL kvůli synonymu.
- Povinný cannibalization check proti registru a aktuálnímu repu.
- Musí být jasné, proč nový produkt existuje, proč právě teď a v čem bude lepší než současný SERP / naše portfolio.
- Metodika musí být matematicky nebo zdrojově ověřitelná; u legislativy, financí, dávek a dalších citlivých témat používat primární/autoritatativní zdroje.
- Pokud nevznikne skutečná produktová výhoda, URL se nestaví.

## 2. Pětisekundový UX test
První viewport musí bez oborové znalosti odpovědět: **Co tady spočítám? Co mám zadat? Co z výsledku plyne?**
- H1 pojmenovává problém lidsky, ne interním/technickým termínem.
- Primární CTA vede přímo do toolu.
- Výsledek je dominantní a interpretovaný běžnou češtinou.
- Technický/legal detail je až druhá vrstva.

### 2.1 Primary Intent + Plain Language Gate — povinné od 19. 8. 2026
- Před buildem napiš jednou běžnou větou: **„Uživatel přichází, protože chce …“** Pokud hlavní job nelze vysvětlit bez interního/slangového termínu, produkt není zamčený.
- První režim kalkulačky musí řešit **nejčastější a nejpřirozenější search intent URL**. Datový benchmark, audit nabídky, odborný compare nebo jiná chytrá sekundární vrstva nesmí vytlačit základní odpověď z prvního místa.
- První vrstva používá běžnou češtinu. Výrazy typu `benchmark`, `scope`, `delta`, `anchor`, `extrapolace`, `percentil`, `modelová obálka` apod. jsou v hero, hlavních vstupech a dominantním výsledku zakázané, pokud nejsou nezbytné; když nezbytné jsou, musí být okamžitě vysvětlené lidsky.
- **Simple front, rigorous back:** metodika může být odborně hluboká, ale uživatel se k první použitelné odpovědi nesmí prokousávat metodikou. Nejdřív odpověď, potom nuance a důkazy.
- Povinný QA test „cizí člověk“: přečti pouze hero → první vstupy → hlavní výsledek. Bez znalosti projektu musí být zřejmé **k čemu stránka je, co zadat a co číslo znamená**. Pokud je nutná znalost toho, jak jsme produkt navrhli, release = FAIL.
- Produktovou novinku hodnotit odděleně od primary intentu. „Je to chytřejší než konkurence“ není důvod změnit hlavní job URL. Chytrá sekundární funkce patří za základní odpověď, ne místo ní.

### 2.2 Navigation Hierarchy Gate — povinné od 19. 8. 2026
- Jedna stránka nesmí mít dvě konkurenční top-level navigace nad hlavním obsahem. Pokud hero nebo první viewport používá process/step rail, další anchor/tabs strip musí být jasně podřízený, nebo se nepoužije.
- Sekční navigace se přidává jen tehdy, když prokazatelně zrychluje orientaci. Nepřidávat ji jako dekorativní druhou lištu.
- Desktop gate = FAIL, pokud uživatel po prvním scrollu nepozná, která navigace je hlavní, nebo pokud navigační pás vizuálně konkuruje H1 / kalkulačce.
- U stránky s jednoduchým lineárním flow preferuj obyčejné sekce bez tabs.

### 2.3 Comparison Integrity Gate — povinné od 19. 8. 2026
- Jeden graf, tabulka nebo žebříček smí porovnávat jen položky se stejnou hlavní dimenzí a stejným významem. Zdroj, region, pevný modelový příklad a přepočtená sazba nejsou zaměnitelné kategorie.
- Každý srovnávaný řádek musí mít konzistentní identitu: **zdroj + region/segment + jednotka + rozsah**. Nelze vedle sebe popsat jeden řádek názvem webu, druhý krajem a třetí velikostí příkladu.
- Pevné veřejné realizace/modely drž odděleně od přepočtených pásem nebo sazeb, pokud nejde o totožný typ údaje.
- Pokud se zdroje liší rozsahem, ukaž rozdíl přímo u dat; neslévej je do jednoho „tržního průměru“ bez obhajitelné normalizace.
- Vizuální délka sloupce/range musí mít skutečnou společnou stupnici. Dekorativní procenta, která nevycházejí ze stejné osy, jsou FAIL.
- QA otázka: **„Porovnává každý řádek opravdu totéž?“** Pokud ne, rozdělit data do samostatných bloků nebo změnit vizualizaci.


### 2.5 Brand Lineage Gate — povinné od 21. 8. 2026
- Před návrhem znovu otevři `index.html`, `kalkulacky.html` a relevantní hub. Nepracuj pouze z poslední kalkulačky.
- Zapiš 3 vrstvy návrhu: **RV CORE / TOPIC GRAMMAR / PRODUCT PROOF**.
- Nová stránka musí zdědit funkční identitní prvky webu (brand field/rail, status/result language, plný footer, section signals apod.), ale nesmí kopírovat kompozici předchozí kalkulačky.
- Local-only CSS design bez viditelné návaznosti na index/katalog je visual gate FAIL, i když je samostatně hezký.
- Každé 2–3 hlavní sekce musí být patrná další identitní kotva; značka nesmí po hero „zmizet“.
- Benchmark sekce používá viditelné `RV DATA` označení.
- Povinné identity QA skóre je **13/16**, podle `RV-VNEXT-IDENTITY-AUDIT-2026-08-21.md`.

### 2.4 Social Icon Footer Gate — povinné od 19. 8. 2026
- Oficiální Facebook a Instagram se v brand footeru zobrazují primárně jako čisté rozpoznatelné ikony, nikoli jako samostatná viditelná slova „Facebook“ / „Instagram“.
- Ikonové odkazy musí mít `aria-label` s názvem sítě a projektu; samotná dekorativní SVG ikona je `aria-hidden`.
- Textový název sítě může zůstat pouze jako screen-reader fallback, tooltip nebo tam, kde ikona bez textu objektivně snižuje srozumitelnost.
- Ikony musí vizuálně sedět do footeru, mít bezpečný hit-area (preferovaně 40–44 px) a nesmí vyžadovat externí icon/font knihovnu.
- **Full Footer Gate:** významná kalkulačka standardně používá plnohodnotný RV footer: inverse logo + krátký brand claim + ikonové sociální odkazy + minimálně dvě smysluplné linkové skupiny (tematický cluster a informace) + page-specific disclaimer, pokud je relevantní + spodní copyright/metodika řádek. Minimalistický jednopásový footer je výjimka, ne default.
- Desktop footer musí mít čitelnou hierarchii a sociální ikony zarovnané k brand bloku; disclaimer nesmí být jedna extrémně dlouhá nepřehledná řádka.

## 3. Základní + pokročilý režim
- Dva režimy používat všude, kde pokročilá přesnost skutečně vyžaduje více vstupů.
- **Základní**: minimum údajů, bezpečné výchozí hodnoty/presety, nejrychlejší cesta k výsledku.
- **Pokročilý**: více kontroly, scénáře, detailní vstupy, transparentní předpoklady.
- Režimy se nesmí vynucovat u nástroje, kde by druhý režim byl jen kosmetická kopie.

## 4. Produktová vrstva
- Live výsledek tam, kde je to smysluplné; žádné zbytečné tlačítko „vypočítat“, pokud lze výpočet bezpečně přepočítávat ihned.
- Dominantní hlavní výsledek + rozpad + jedna věta „co to znamená“.
- Presety/scénáře, reset a jasné jednotky.
- Omezení a nejistoty viditelné v místě výsledku, ne schované pouze v patičce.
- Žádné sbírání osobních údajů, pokud není nezbytné.

## 5. RV V3.2 identita
Každá nová stránka musí být zjevně součástí RychléVýpočty.cz:
- skutečné logo a `/rv-brand-v32.css` + `/rv-brand-v32.js`,
- `rv-identity-hero`,
- `rv-brand-calculator` + category rail,
- `rv-brand-result`,
- `rv-brand-footer` + `rv-footer-process`,
- oficiální Facebook + Instagram v patičce,
- konzistentní navy / blue / green identita s tématickou sekundární barvou,
- vlastní 1200×630 OG vizuál pro významný nový produkt.

Identita nesmí přebít pochopení produktu. Přibližně 80 % vizuálu patří konkrétní stránce, 20 % společnému RV systému.

### 5.1 Hero identity / watermark rule — povinné od 18. 8. 2026
- Významný hero nesmí být bezdůvodně pouze text + sterilní/prázdná plocha. První viewport má obsahovat jemnou vizuální identitní nebo tematickou vrstvu.
- Použij alespoň jednu smysluplnou identity layer; u hlavních kalkulaček preferuj kombinaci:
  - **brand watermark/pattern** — fragment loga, RV šipka, diagonála, grid, linka nebo jiný jemný brand motiv;
  - **topic watermark** — motiv problému: vrstvy podlahy, tah barvy, rastr dlažby, kamenivo, timeline, dům, graf, kalendář apod.;
  - **product visual proof** — mini scénář, schéma nebo náhled výsledku, který vysvětluje user job.
- Může existovat malá knihovna opakovaně použitelných RV watermarků, ale stejný motiv se nesmí mechanicky kopírovat na všechny stránky. Společný brand prvek vždy doplň tematickou variací nebo odlišnou kompozicí.
- Watermark/pattern musí být low-contrast, nesmí soutěžit s H1/CTA ani zhoršit čitelnost, accessibility, responsive chování nebo Core Web Vitals.
- Preferuj CSS/SVG před těžkými bitmapami.
- Generický gradient bez rozpoznatelné brand/topic identity sám o sobě toto pravidlo nesplňuje.
- Hero visual gate = FAIL, pokud první viewport působí vizuálně nedodělaně, sterilně nebo zaměnitelně s desítkami jiných RV stránek.
- **Hero Collision Gate:** na desktopu 1280/1440 px musí být copy a tematický vizuál zřetelně oddělené. Text nesmí vizuálně narážet do panelu/ilustrace ani působit „naprcaně“. Pokud nejde o záměrný překryv kompozice, drž reálný volný prostor mezi bounding boxy typicky alespoň ~48 px a ověř ho screenshotem.
- **Signature blocks mimo hero:** minimálně dva hlavní bloky stránky musí mít vlastní tematickou vizuální gramatiku, která není jen další grid stejných cards. U technických témat preferuj material atlas, řez/schéma, system console, comparison rail, decision map nebo scénářovou vizualizaci.
- **Section rhythm:** nepovoluj více než dvě po sobě jdoucí sekce se stejnou kompozicí `headline + equal cards`. Změna barvy backgroundu sama o sobě se nepočítá jako nová vizuální gramatika.
- **Visual sameness review:** před releasem screenshotově porovnej produkt s předchozími 3 V-next buildy. Pokud je struktura zaměnitelná po výměně textu a barev, release FAIL.
- U kalkulaček s produktovými presety nabídnout bezpečný režim **Vlastní výrobek / technický list**, pokud lze výpočet provést z explicitních uživatelských parametrů bez domýšlení systému.
- Samotný low-opacity nápis/watermark není automaticky PASS. U významného produktu musí hero mít tematicky nativní vizuální logiku (např. řez, tok, mapa, časová osa, skladba, geometrie, produktový scénář), kterou nelze beze změny přenést na jiný intent.
- Před buildem explicitně napiš jednu větu: **„Proč tento hero vizuál patří právě tomuto produktu?“** Bez přesvědčivé odpovědi se hero nezamyká.

## 6. Obsah / SEO vrstva — Content Sufficiency Gate
- **Žádná povinná slovní kvóta.** Délka je důsledek pokrytí user jobu, ne cíl. Krátká jednoduchá kalkulačka může být kompletní; odborný nástroj může potřebovat výrazně hlubší authority vrstvu.
- Před buildem vytvořit **CONTENT COVERAGE MATRIX** s položkami: výběr vstupu/produktu, interpretace výsledku, compare/delta, chyby/edge cases, metodická hranice, konkrétní scénáře, zdroje/data, next action. Každou označit relevantní / nerelevantní a relevantní body během QA zkontrolovat.
- U technického, finančního, právního, zdravotního nebo jinak odborného toolu musí být viditelný minimálně: kontext správného výběru, interpretace výsledku, metodická hranice, konkrétní scénář/compare, častá chyba/edge case a primární zdroje.
- Žádná vata kvůli počtu slov. Obsah musí rozšiřovat intent a podporovat reálné použití toolu.
- Tool zůstává nahoře; authority vrstva přichází po odpovědi a nesmí blokovat výpočet.
- Release gate FAIL, pokud uživatel po výpočtu musí okamžitě googlit zásadní otázku, která je přirozenou součástí stejného user jobu a mohla být bezpečně pokryta na stránce.

## 7. Autorita a zdroje
- Primární zdroje před sekundárními.
- Uvést datum kontroly metodiky a referenční rok/období.
- Jasně oddělit zákonná fakta, naše modelové předpoklady a uživatelské vstupy.
- Citlivý výsledek = přirozený disclaimer: orientační, nenahrazuje individuální odborné/úřední posouzení.

## 8. RV DATA / unikátní benchmark
Benchmark se přidává jen tehdy, když z metodiky vznikne **netriviální lidský insight**, který stojí za citaci.
- Typicky ~25 reprodukovatelných modelových scénářů, nikoli umělá tabulka pro SEO.
- První vrstva: lidská otázka a dominantní vizuální odpověď; technický termín až potom.
- Na stránce: RV DATA signature, hlavní finding, 3–5 reprezentativních scénářů, plain-language omezení, CTA na CSV + data hub.
- Root CSV + záznam v `rychlevypocty-datasets.json` + karta v `data-a-benchmarky.html` + Dataset/DataDownload schema v centrálním DataCatalogu.
- **Dataset identity lock — povinné od 23. 8. 2026:** při vzniku benchmarku zamkni současně `id`, CSV/contentUrl, `name`, `description`, methodology a význam datasetu. Každý page-level i katalogový `Dataset` JSON-LD musí mít neprázdné `name` a `description` dlouhé 50–5000 znaků; description musí významově odpovídat stejnému datasetu v manifestu/data hubu a nesmí být vymyšlené pouze pro crawler.
- Vždy označit jako **modelové/reprodukovatelné srovnání**, pokud nejde o skutečná observační data.
- Benchmark není povinný; slabý/triviální benchmark je horší než žádný.

## 9. Produkční integrace — žádná izolovaná URL
Nový indexovatelný produkt není hotový, dokud není zapojen do projektu:
- `calculators-registry.json` / relevantní registr,
- statický katalog `kalkulacky.html`,
- příslušný tematický hub,
- `sitemap.xml` + správný `lastmod`,
- relevantní related-tools odkazy,
- data hub + manifest, pokud má benchmark,
- homepage se mění jen při jasné produktové prioritě, ne automaticky.
- Fresh/HOLD URL se neupravují jen kvůli recipročnímu linku; preferovat hub/katalog/datovou knihovnu.

## 10. Metadata / structured data
- unique title + meta description, canonical, robots.
- OG/Twitter metadata + dedicated OG u významných assetů.
- BreadcrumbList + WebApplication/SoftwareApplication podle typu produktu.
- Dataset schema centrálně v DataCatalogu tam, kde existuje RV DATA asset.
- **Každý `Dataset` objekt, včetně page-level Datasetu, musí mít při buildu neprázdné `name` a `description` v rozsahu 50–5000 znaků. Chybějící/krátké `description` = P1 / release FAIL.**
- Page-level Dataset musí používat stejnou dataset identitu a význam jako odpovídající záznam v `rychlevypocty-datasets.json` / `data-a-benchmarky.html`; nevytvářet separátní crawler-only popis.
- Všechny JSON-LD bloky musí projít parserem.
- Před vytvořením deploy ZIPu musí projít deterministický schema gate: `python .github/scripts/audit_static_site.py --root . --config audits/audit-config.json --check-js`. Pokud structured-data gate vrátí P0/P1, stránka není release candidate.
- Pokud Dataset schema používá `license`, musí odkazovat na skutečné a obsahově odpovídající licenční podmínky; nevkládat fiktivní licenci jen kvůli rich-result warningu.

## 11. Mobile / accessibility / speed
- Mobile-first QA minimálně **320/360/390 px** + desktop 1440 px. 320 px je povinný overflow smoke, protože min-content/grid chyby se mohou projevit až pod 360 px.
- Žádný horizontální overflow, překryv, useknutý výsledek nebo nečitelná tabulka.
- Keyboard focus, labely, ARIA tam, kde má význam, reduced-motion respekt.
- Bez zbytečných externích fontů, frameworků a runtime závislostí.
- Samostatné CSS/JS s cachebusterem při změně.
- **Hotfix Diff Containment Gate:** u technického hotfixe porovnej pre/post snapshot projektu. Změněny smějí být pouze zamýšlené soubory; výpočtový JS se nesmí změnit bez explicitního důvodu a fixture retestu.
- **OG Asset Existence Gate:** každý lokální `og:image` / `twitter:image` použitý novou nebo měněnou stránkou musí před ZIPem fyzicky existovat v root projektu a mít validní obrazový formát; neexistující social asset = FAIL.
- Preferovat SVG/CSS vizuály před těžkými dekorativními obrázky.
- PageSpeed/Core Web Vitals nesmí být vědomě obětovány designu.
- **Production PSI is authoritative:** lokální lint, screenshot ani browser smoke test nejsou náhradou za post-deploy PageSpeed/Lighthouse na skutečné produkční URL. Stránka se nesmí označit DONE, dokud není doložen produkční mobilní audit po nasazení aktuálního HTML/CSS/JS.
- Pro deterministické kategorie mířit na **Accessibility 100 / Best Practices 100 / SEO 100**. Performance má cíl 100 a nesmí mít známý akční fail; jednotlivý laboratorní výkyv výkonu se hodnotí podle konkrétní diagnostiky, ne slepě podle jednoho bodu.
- Pokud PageSpeed nabízí **Procházení agenty / Agentic browsing**, požaduj plný PASS dostupných auditů. Chybný accessibility tree, chybějící programmatic label nebo jiný agent accessibility fail = RELEASE_CANDIDATE.
- Každý `input`, `select` a `textarea` musí mít programmaticky rozpoznatelný název přes skutečný `<label>`, ancestor `<label>`, `aria-label` nebo validní `aria-labelledby`; placeholder není label. U nových kalkulaček přidávej také stabilní `name`, pokud to nemá objektivní nevýhodu.
- Povinný ARIA/widget audit: žádné nepovolené `aria-*`, chybějící required children/parents ani nekompletní custom tab/accordion semantics.
- Custom tabs musí mít `tablist → tab → tabpanel`, vazby `aria-controls/aria-labelledby`, roving `tabindex` a ovládání šipkami/Home/End.
- Kontrast: malý/běžný text minimálně WCAG AA 4.5:1; velký text minimálně 3:1. Muted helper text nesmí být zesvětlen pod limit jen kvůli estetice.
- Interaktivní prvky: RV interně preferuje 44×44 px; menší textový odkaz musí mít alespoň bezpečný hit-area/spacing a nesmí padat na Lighthouse target-size auditu.
- `aria-label` používat pouze na prvcích/rolích, které accessible name podporují; u generického `div` nejdřív zvolit správnou semantickou roli nebo label odstranit.
- Pokud je dostupný agent accessibility audit, accessibility tree nesmí mít strukturální fail.
- **Local AX preflight:** je-li lokálně dostupný Chromium/CDP, před release proveď accessibility-tree smoke všech změněných V-next URL a ověř, že interaktivní prvky (`button`, `link`, `textbox`, `combobox`, `checkbox`, `radio`, `tab`, `switch`, `spinbutton`, `slider`) nemají prázdný accessible name. Tento preflight je doplněk, nikoli náhrada produkčního PSI.
- **Component accessibility contract před buildem:** každý custom tab/radio/accordion/switch/combobox musí mít předem popsaný native/ARIA role model, fokus a keyboard ovládání. Pokud lze použít native HTML control, preferuj jej.
- **Executable lint:** před ZIPem spusť `python rv-vnext-a11y-lint.py <changed HTML...>` (nebo ekvivalent). PASS z lint gate je povinný, ale nenahrazuje produkční Lighthouse/PageSpeed.
- **Systemic regression sweep:** objeví-li se po deployi opakovatelná chyba na jedné V-next stránce, před další výrobou prohledej všechny dokončené V-next URL na stejný pattern. Opravu klasifikuj jako TECHNICAL/QA, neresetuj MAJOR HOLD, pokud se nemění intent/produkt. Současně aktualizuj linter/standard, aby se chyba neopakovala.
- `--all-vnext` nesmí používat zastaralý ručně psaný seznam. Musí primárně načíst aktuální `RV_VNEXT_PROGRESS.json` (`completedPages` + aktuální candidate), aby novější stránky nemohly z regression sweepu vypadnout.

## 12. Release QA gate
Před ZIPem musí projít:
1. numerické fixtures a hraniční případy,
2. JS syntax / runtime console,
3. duplicate IDs,
4. HTML interní odkazy na existující/root nové soubory,
5. JSON/JSON-LD/CSV/XML validita,
6. canonical + indexability + sitemap + registry + hub + katalog,
7. desktop/mobile screenshot a vizuální kontrola,
8. **hero identity + distinctiveness gate** — první viewport má smysluplnou brand/topic identity layer nebo product visual proof; samotný generický watermark nestačí,
9. **content sufficiency gate** — relevantní body CONTENT COVERAGE MATRIX jsou skutečně pokryté a stránka má odpovídající authority floor,
10. horizontal overflow 0,
11. žádná nechtěná změna HOLD URL nebo sdíleného výpočtového jádra,
12. automatická accessibility QA: ARIA role/attributes/required children, keyboard widget model, kontrast a touch targety bez známého failu,
13. **post-deploy production PageSpeed/Lighthouse evidence**: skutečná produkční URL po nasazení; Accessibility / Best Practices / SEO bez automatického failu a cíl 100; bez tohoto důkazu status zůstává RELEASE_CANDIDATE,
14. pokud je dostupné **Procházení agenty / Agentic browsing**, požaduj plný PASS; accessibility tree bez strukturálního failu a všechny interaktivní prvky s programmatic name,
15. `rv-vnext-a11y-lint.py` / ekvivalent PASS na všech změněných HTML; `--all-vnext` musí číst aktuální progress JSON a při systémové chybě proběhne regression sweep již dokončených V-next URL před další výrobou,
16. **RV static release gate PASS:** `python .github/scripts/audit_static_site.py --root . --config audits/audit-config.json --check-js`; žádný nevyjmutý P0/P1, zejména žádný Dataset bez validního `description`,
17. change-only **FLAT ZIP**, bez podsložek.

## 13. Po nasazení
- Nový produkt označit jako významnou/MAJOR změnu portfolia a nechat ho měřit.
- Needitovat jej znovu bez chyby nebo nového dostatečného signálu.
- Výrobní linka pokračuje na **další jeden produkt**, ne na paralelní sérii.

## Zlaté pravidlo
**Každý nový tool musí být buď produktově, datově, metodicky nebo UX o krok dál než předchozí generace. Pokud jen kopíruje existující šablonu, není připravený k výrobě.**


### 2.6 Quiet Luxury Gate — povinné od 21. 8. 2026

RychléVýpočty.cz má působit **luxusně, ale jednoduše luxusně**. Brand recognition nevzniká počtem dekorací, ale konzistencí, hierarchií, typografií, spacingem a několika přesnými signály.

### Hard rules
- **Jedna dominantní brand kotva na viewport.** Nekombinovat současně stamp + page code + vertikální rail + watermark + grid + cut-corner, pokud to nemá jasný funkční důvod.
- Hero standardně používá pouze: shared header/logo, jeden jemný RV signál (např. tri-color rail/line), tématický product proof a čistou typografii.
- `RV CORE` je primárně **systém**, ne ornament: navy/blue/green rodina, čisté radiusy, důsledný spacing, result/status language, RV DATA a plný footer.
- Dekorace mají rozpočet: **max. 2 nefukční vizuální vrstvy v hero**, z toho pouze jedna může být výrazná.
- Pokud odstranění dekorace zlepší čitelnost a produkt neztratí identitu, dekorace se odstraní.
- Preferovat **quiet confidence**: hodně vzduchu, přesné alignmenty, jeden silný vizuální proof, žádný „dashboard cosplay“.
- Hero nesmí připomínat interní dashboard, design-system demo ani konferenční slide.
- Product proof má být výraznější než brand ornament. Uživatel má nejprve pochopit výpočet, až potom vnímat design.
- Na mobilu se brand vrstvy dále redukují; priorita je H1 → payoff → CTA → výsledek.

### Anti-overdesign gate
Visual gate = FAIL, pokud:
- hero obsahuje 3+ konkurenční identity prvky;
- je v prvním viewportu více malých štítků/kódů než skutečných informací;
- více než jeden blok používá cut-corner / grid / rail jen kvůli vzhledu;
- stránka působí „víc navržená než užitečná“.

Cíl: **Apple-like restraint, ne sterilita; prémiová přesnost, ne vizuální exhibice.**


## 2026-08-21 — Identity Continuity correction: Quiet Luxury ≠ generic microsite

Poslední vizuální audit ukázal druhý extrém: po omezení dekorací některé V-next kalkulačky zůstaly sice čisté, ale působily jako kvalitní generická microsite. To je stejně nežádoucí jako overdesign.

### Povinné minimum shared RV identity
Každá významná kalkulačka musí ve finálním DOM/CSS skutečně použít, ne pouze deklarovat, alespoň tyto funkční vrstvy:
1. **Hero lineage:** shared `rv-identity-hero` nebo kvalitativně rovnocenný RV brand field + tematický product proof.
2. **Value moment:** shared result language (`rv-brand-result`, RV rail/status/result caption nebo ekvivalent) v calculator/result zóně.
3. **Mid-page continuity:** alespoň jedna funkční RV kotva mimo hero a footer — typicky RV DATA, scope comparison, method flow nebo decision route.
4. **Footer lineage:** tmavý footer vždy používá inverse logo asset + RV 4-step signature `Zadat → Spočítat → Pochopit → Rozhodnout` u hlavních V-next produktů.

### Anti-generic gate
Před release povinně zkontroluj 4 screenshoty: **hero / calculator+result / data-or-method / footer**. U každého polož otázku: „Kdybych odstranil logo, poznám podle produktu, typografie, railů, result language a kompozice, že jde o RychléVýpočty.cz?“ Pokud jsou 2 nebo více oblastí zaměnitelné s generickým SaaS/fintech template, visual gate = FAIL.

### Restraint balance
- Quiet Luxury omezuje **dekorace**, nikoli **identitu**.
- Shared brand primitive má přednost před novým lokálním ornamentem.
- Max. jedna dominantní identity vrstva v jednom viewportu, ale identita se musí opakovat funkčně napříč stránkou.
- `logo-rv-v32.svg` patří na světlý povrch; `logo-rv-v32-inverse.svg` na tmavý footer. Tohle je release-blocking kontrola.
- Produktový proof musí zůstat hlavní hvězdou; brand system ho rámuje, ne překrývá.

### Procesní změna
BUILD LOCK nově obsahuje explicitní řádek `Shared RV primitives to be used:` s konkrétními CSS/HTML třídami nebo komponentami. Obecná formulace „bude tam identita“ nestačí.
