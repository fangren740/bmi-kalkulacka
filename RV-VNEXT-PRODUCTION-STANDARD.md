# RychléVýpočty.cz V-next — Production Standard

**Revize:** 18. 8. 2026  
**Verze:** 1.4

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
- Všechny JSON-LD bloky musí projít parserem.
- Pokud Dataset schema používá `license`, musí odkazovat na skutečné a obsahově odpovídající licenční podmínky; nevkládat fiktivní licenci jen kvůli rich-result warningu.

## 11. Mobile / accessibility / speed
- Mobile-first QA minimálně 360/390 px + desktop 1440 px.
- Žádný horizontální overflow, překryv, useknutý výsledek nebo nečitelná tabulka.
- Keyboard focus, labely, ARIA tam, kde má význam, reduced-motion respekt.
- Bez zbytečných externích fontů, frameworků a runtime závislostí.
- Samostatné CSS/JS s cachebusterem při změně.
- Preferovat SVG/CSS vizuály před těžkými dekorativními obrázky.
- PageSpeed/Core Web Vitals nesmí být vědomě obětovány designu.
- Povinný ARIA/widget audit: žádné nepovolené `aria-*`, chybějící required children/parents ani nekompletní custom tab/accordion semantics.
- Custom tabs musí mít `tablist → tab → tabpanel`, vazby `aria-controls/aria-labelledby`, roving `tabindex` a ovládání šipkami/Home/End.
- Kontrast: malý/běžný text minimálně WCAG AA 4.5:1; velký text minimálně 3:1. Muted helper text nesmí být zesvětlen pod limit jen kvůli estetice.
- Interaktivní prvky: RV interně preferuje 44×44 px; menší textový odkaz musí mít alespoň bezpečný hit-area/spacing a nesmí padat na Lighthouse target-size auditu.
- `aria-label` používat pouze na prvcích/rolích, které accessible name podporují; u generického `div` nejdřív zvolit správnou semantickou roli nebo label odstranit.
- Pokud je dostupný agent accessibility audit, accessibility tree nesmí mít strukturální fail.
- **Component accessibility contract před buildem:** každý custom tab/radio/accordion/switch/combobox musí mít předem popsaný native/ARIA role model, fokus a keyboard ovládání. Pokud lze použít native HTML control, preferuj jej.
- **Executable lint:** před ZIPem spusť `python rv-vnext-a11y-lint.py <changed HTML...>` (nebo ekvivalent). PASS z lint gate je povinný, ale nenahrazuje produkční Lighthouse/PageSpeed.
- **Systemic regression sweep:** objeví-li se po deployi opakovatelná chyba na jedné V-next stránce, před další výrobou prohledej všechny dokončené V-next URL na stejný pattern. Opravu klasifikuj jako TECHNICAL/QA, neresetuj MAJOR HOLD, pokud se nemění intent/produkt. Současně aktualizuj linter/standard, aby se chyba neopakovala.

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
13. post-deploy mobilní PageSpeed/Lighthouse Accessibility: cíl **100**; automatický fail = RELEASE_CANDIDATE, ne DONE, pokud nejde o zdokumentovaný false positive,
14. agent accessibility tree bez strukturálního failu, pokud je audit dostupný,
15. `rv-vnext-a11y-lint.py` / ekvivalent PASS na všech změněných HTML a při systémové chybě také regression sweep již dokončených V-next URL,
16. change-only **FLAT ZIP**, bez podsložek.

## 13. Po nasazení
- Nový produkt označit jako významnou/MAJOR změnu portfolia a nechat ho měřit.
- Needitovat jej znovu bez chyby nebo nového dostatečného signálu.
- Výrobní linka pokračuje na **další jeden produkt**, ne na paralelní sérii.

## Zlaté pravidlo
**Každý nový tool musí být buď produktově, datově, metodicky nebo UX o krok dál než předchozí generace. Pokud jen kopíruje existující šablonu, není připravený k výrobě.**
