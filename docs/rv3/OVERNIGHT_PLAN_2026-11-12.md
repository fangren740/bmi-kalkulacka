# RV3 — Noční vývojový plán / 11.–12. 11. 2026

**Režim:** autonomní vývojové roundy od večera 11. 11. do rána 12. 11. 2026 (Praha), konec nejpozději před 06:00. **NIKDY nepředstírat průběžný běh:** mezi plánovanými spuštěními žádná aktivita neběží. O výsledcích rozhoduje skutečný GitHub commit + build, ne počet spuštění.

## Source of truth
- [Hlavní issue #59](https://github.com/fangren740/bmi-kalkulacka/issues/59) · [Katalog #62](https://github.com/fangren740/bmi-kalkulacka/issues/62) · [Engine #61](https://github.com/fangren740/bmi-kalkulacka/issues/61).
- Větev `rv3/engine-poc` a [DRAFT PR #65](https://github.com/fangren740/bmi-kalkulacka/pull/65); base `rv3/clean-slate`.
- [Katalog V2 (jen preview)](https://rv3-engine-poc-rychlevypocty-v3-preview.maattinek.workers.dev/rv3/poc/katalog-v2.html), [starý V1](https://rv3-engine-poc-rychlevypocty-v3-preview.maattinek.workers.dev/rv3/poc/studio-katalog.html).
- Před každým kolem **načíst HEAD, PR, současný build a tento soubor**, plus `docs/rv3/CATALOG_RETHINK_2026.md`, `CONTROL_CENTER.md`, `HANDOFF.md`, `SESSION_LOG.md`. Respektovat souběžné úpravy; aktualizovat jen soubory bez konfliktu; pokud se změnil HEAD, znovu načíst a přepočítat.
- **Evidence každého kola**: append do `docs/rv3/NIGHT_RUN_LOG_2026-11-12.md`, uvést skutečný commit SHA, build (PASS/FAIL/PENDING), testy, zjištění, další konkrétní krok. Nepřepisovat staré zápisy.

## Přidělení priorit — roundy na sebe navazují podle výsledku, ne slepě podle hodin
1. **Katalog V2: test reálných úloh a relevance.** Časté dotazy „kolik dostanu čistého“, „hypotéka“, „příplatky“, „dovolená“, „pracák“, „superdávka“, překlepy, diakritika, prázdné výsledky; přístupnost keyboard, escape/focus, zobrazení 6 top výsledků. Opravit konkrétní chyby a posílit testy (ne style-only audit). Validovat odkazy 135/135.
2. **Mobil/desktop + PageSpeed evidence.** Pokusit se o skutečné 390/1440 browser testy, screenshoty, vizuální/sémantické chyby. Jestli browser/HTTP není dostupný, zapsat BLOCKED a provést poctivé alternativní testy zdrojového HTML/CSS/JS (včetně možností klávesnice, focus, nepřetékání). Žádné vymyšlené snímky ani Lighthouse skóre.
3. **SEO & výkon katalogu.** Self-canonical pro produkční URL, titulky, strukturovaná data, důležité existující interní odkazy, noindex *jen preview*, H1, search index, HTTP caching, velikosti zdrojů a mobile ergonomie. Novou veřejnou URL nepřidávat; `kalkulacky.html` nezasahovat bez schválení. Relevantní opravy do POC.
4. **Zlepšení společného V3 enginu.** Přesunout opakující se shell, tokens, navigaci a data do bezpečné architektury; ověřit 3 stávající PoC (katalog, hypotéka s externím JS, DPP/DPČ s inline JS). Zachovat přesně `<main>`, skripty, canonical, výpočty. Odstranit dočasný hidden legacy shim **jen pokud existují skutečné browser/numerické důkazy**; jinak explicitně označit OPEN.
5. **Další stránka až po QA katalogu.** Bez user schválení V2 nezavádět jiný definitivní design. Lze připravit technický adapter a vývojový prototyp hubu (např. `finance-a-hypoteky.html`) v izolovaném preview, pokud testy P1/P2 prošly; při nejasném UX investovat do kvality katalogu místo masového rozkopání 207 URL.
6. **Závěrečný quality/consistency round.** Ověřit README/registry/docs, stav #59/#61/#62 a draft PR #65. Provést regresní testy a aktualizovat handoff, včetně názvu následujícího úkolu a potřebných schválení.

## Tvrdé zákazové podmínky
- **Nikdy** nemergovat do `main`, nenasazovat `rychlevypocty.cz`, neměnit GitHub Pages, DNS/CNAME, ani publikovat novou produkční URL. Žádná autorizace k merge ani z tohoto nočního přání.
- **Nikdy** neměnit finanční či legislativní vzorce bez zdrojového ověření, numerických regresí a souhlasu. Chránit stránku příplatků za směny a Superdávku.
- Neobnovovat 135-card V1 jako cílovou architekturu; uživatel ji výslovně zamítl. Nepřidávat falešné recenze, skóre, „TOP“ nebo údajnou úspěšnou indexaci.
- Neprodlužovat proces o nekonečné audity; v každém kole **jedna konkrétní oprava nebo dokončený ověřený výsledek** (případně dokumentovaný skutečný blocker).
- Uživatel spí, **nevyžadovat jeho odpověď během noci**; schvalovací rozhodnutí explicitně přenést do ranního souhrnu.
- Každý automatizovaný běh má vlastní limit; neslibovat nepřetržitou práci mezi spuštěními. Nespouštět drahé GitHub Actions PR mimo potřebu. Cloudflare preview buildu ani CI nedůvěřovat bez ověřených výsledků.

## Předpokládaný ranní report (hotové dle důkazů)
**Změny a odkazy** (commit/PR/preview) · **testy PASS a faktické blokery** · **co čeká na mé potvrzení** (A architektura, B katalog, případně C migrační vlny) · **3 nejbližší technické kroky**. Neopakovat noční statusy; jedna krátká finální zpráva do 06:00.

## 20:54 CET — stav na začátku
- `main`: `2041e3eaefe15ac066ba1bf3b0bcd57d34125fb7` (live public)
- `rv3/clean-slate`: `1cf2796d1ba68ca29f4b5807f83de005ce7601e1`
- `rv3/engine-poc`: `29177431aca5961107d10543d389b71eee8962d9` před zápisem tohoto plánu; PR #65 DRAFT, mergeable.
- Starý V1 katalog zamítnut; nový V2 byl postaven jako zvláštní samostatná preview alternativa a Cloudflare build pro implementační HEAD prošel.
- Chybí nezávislé browser testy 390/1440, live HTTP, PageSpeed měření, vlastníkovo schválení. `main` nedotčen.
