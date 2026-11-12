# RV3 Page Studio — Homepage — jedinečná vstupní zkušenost
**URL:** `/index.html` · **stav:** SOURCE REVIEW + INDIVIDUAL BRIEF, **ne** hotový redesign · **12. 11. 2026**

## Zjištěný stav zdroje (GitHub 12. 11. 2026)
- Title: **Online kalkulačky pro mzdu, práci, finance a bydlení | RychléVýpočty.cz**.
- H1: **Život přináší otázky. My výsledky.**
- Hlavní interakce **porovnání dvou pracovních nabídek** podle hrubé/čisté mzdy, ovládaná `rv3/salary-engine.js` + `rv3/product-ui.js`.
- Lokální vyhledávání (135 nástrojů), 4 situace a rychlé odkazy, informace o metodice a trust. Zatím skutečný V3 pilot; **NE schválený finální homepage design**.
- Canonical: `https://rychlevypocty.cz/` (pozor — homepage je root, ne `/index.html`). Dvě CSS/JS vrstvy nelze slepě přepsat; jeden styl `rv3/foundation.css` obsahuje cca 51 kB a řadu legacy selektorů. Platnost obsahových/SEO tvrzení ještě neověřená.

## Uživatel a jeho 3 rozhodnutí
1. Přichází bez znalosti názvu kalkulačky: **„Co právě řeším?“** → relevantní kalkulačka / scénář.
2. Chce důkaz, že výpočet opravdu pomůže: **„Kolik by mi zůstalo, kdybych změnil práci?“** → živá karta dvou mezd, vysvětlené předpoklady, snadný přechod na celý výpočet.
3. Potřebuje věřit výsledku: **„Podle čeho se počítá a jak aktuální je vzorec?“** → metodika a zdroje na dosah jednoho kliku.

## Jedinečný design, ne převedení katalogu
- Hero: současná silná věta může zůstat, ale kompozice musí být **redakčně čistá**, s opravdovým vyhledáváním a ukázkou *konkrétního rozhodnutí* vpravo. Vyhledávání nesmí být jen ozdoba, „HLEDAT“ musí mít jasné chování.
- Výsledková karta je **hlavní ilustrace celé stránky**: interaktivní údaje a srovnávací vizualizace, ne dekorativní stock art. Výsledek uvádí období a předpoklady.
- Dole tři jasné cesty (orientace podle potřeby, oblíbené kalkulačky, návody); nepřevzít katalogových osm kategorií 1:1.
- Trust panel jako krátký **„Jak víme, že čísla sedí“**, směřující na metodiku a redakční zásady; bez vycpávky a falešných certifikátů.
- Footer: odstranit viditelný bílý nalepený podklad kolem originálního loga (původní `rv3/foundation.css` má `.rv3-footer-brand>a{background:#fff...}`). **Logo SVG zůstane byte-for-byte stejné**; zvolit správné barevné pozadí a přirozené umístění.
- Mobile first: v 390 px musí být H1, vyhledávání a cesta ke konkrétnímu výpočtu okamžitě dosažitelné; board nesmí utopit první důležité akce daleko pod fold; při 1440 px skutečné dvousloupcové rozložení.

## Funkční a SEO ochrana
- Srovnání 42 000 Kč vs 52 000 Kč není „předpokládaný správný výsledek“; regresní test odvodit z existující numeriky a aktuálních zdrojů, vyzkoušet hranice, záporné/nesmyslné hodnoty, kopírování.
- zachovat existující script order, DOM ids `offer-before`, `offer-after`, `offer-difference`, `tool-search`, `tool-results`, `data-intent`.
- H1 jeden, title/canonical stejné, validní OG/JSON-LD, 135 katalogových navigací a interní kontext.
- G1 Node, G2 skutečné viewporty 390/1440 + keyboard + console, G3 Lighthouse/PSI a změny oproti baseline. Build alone = NOT BROWSER PASS.

## Následující závazná implementace
Samostatná preview URL **`/rv3/wave1/index.html`**. První bezpečný build preserves source main/scripts. Pak specifický návrh/úprava vrstvy a samostatná integrace; preview nevydávat za konečnou homepage dokud chybí reálný browser QA a uživatelská kontrola.


## Stage checklist
- [x] Předběžná analýza skutečného HTML v GitHubu
- [x] Účel a individuální návrhový brief
- [ ] Ověřené SEO/GSC/baseline metadata a aktuální primární zdroje
- [ ] Design na 390 / 1440 px + interakce
- [ ] Implementovaný izolovaný preview
- [ ] Node/integrita/číselné regresní testy
- [ ] Skutečné browser screenshoty a Lighthouse
- [ ] Vizuální a věcné schválení vlastníkem
- [ ] Produkční release s výslovným souhlasem

## 12. 11. 2026 18:00 — druhé zdrojové kolo: ověřený UX rozpor
- Živý zdroj `/index.html` obsahuje `span.search-keystroke` s textem **HLEDAT ↗** uvnitř vyhledávacího pole, nikoliv skutečné tlačítko. Jde o vizuální affordanci, která může uživateli slibovat klikací akci, ale element není focusovatelný ani aktivovatelný. **SOURCE REVIEW PASS**, nikoliv browser FAIL: reálné chování vyhledávání v prohlížeči zatím nebylo ověřeno.
- V samostatném homepage návrhu změnit affordanci na pravdivý popisek nebo skutečný `<button type="button">` s ověřenou funkcí, klávesnicí a chybovými stavy. Bez změny source root či výpočtového JS. Neprovádět naslepo, protože `product-ui.js` řídí dynamické výsledky a musí být prověřen celý focus flow.
- Důkaz: GitHub `index.html` na větvi `rv3/sitewide-wave1-20261112`, současné `rv3/product-ui.js` a homepage brief. Cloudflare build, viewporty 390/1440, Lighthouse a číselná E2E **NEOVĚŘENO**; poslední HEAD před tímto kolem `e8bd97d`. Tento blok je věcný audit a evidence, **nikoliv vydávaný za hotovou implementaci**.
