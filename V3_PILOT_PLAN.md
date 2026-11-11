# RychléVýpočty V3 — pilot (10. 11. 2026)
Status: **izolovaná vývojová větev; není schváleno pro merge/deploy**.

## Ověřený základ
- Výchozí produkční `main`: `2041e3eaefe15ac066ba1bf3b0bcd57d34125fb7`.
- Tři existující URL se mění pouze v této větvi: `index.html`, `mzdy-a-prace.html`, `cista-mzda-kalkulacka.html`.
- Ostatní kalkulačky, zvlášť `kalkulacka-priplatku-za-smeny.html`, jsou read-only.
- Původní salary engine: `cista-mzda-vnext.js` z ověřeného `main`; výpočetní funkce a konfigurace v `rv3/salary-engine.js` jsou převzaty beze změny vzorců. Původní soubor zůstává.
- Nedotýkáme se DNS, sitemap.xml, robots.txt, Analytics/Consent ani dalších HTML.
- Pozor na otevřený samostatný PR pro čistou mzdu (#74); bez nekontrolovaného přebírání neintegrovaných změn.

## Architektura / strategie
- Statické HTML + lokální CSS systém `rv3/site.css` + malý JS; Cloudflare Worker preview. V3 zachovává původní logo `logo-rv-v32.svg`, paletu navy/modrá/zelená a favicon, ale zavádí vlastní interaktivní rozhodovací plochu místo generické hero šablony.
- `rv3/salary-engine.js` je čistý numerický výpočet bez DOM; `rv3/salary-ui.js` jen mapování formuláře, validace a renderování. Homepage používá stejné jádro.
- Mobile-first, minimální závislosti, běží na GitHub Pages. Bez build frameworku, externích fontů či povinných cookies pro výpočet.
- Původní URL a self-canonical pro mzdy/práci a čistou mzdu zůstávají. V produkčním kandidátovi je index,follow; **review dokument má noindex,nofollow a je oddělený**.
- Navigace po pracovních situacích; katalog a nepilotní stránky nadále odkazují na funkční současný web.
- Výsledek před detailní metodikou; pokročilá nastavení volitelná, s invalid-state guardem a čitelným rozpisem.

## QA bez GitHub Actions
- Zlaté numerické scénáře: `rv3/tests/salary-regression.test.js`. Spuštění nezávisle na Actions příkazem `node rv3/tests/salary-regression.test.js`; uživatel nic neinstaluje.
- Náhledy nyní zajišťují Cloudflare Workers Static Assets s automatickými PR preview na 390 / 1440 px; samostatný zastaralý HTML reviewer byl odstraněn.
- Browser E2E/Lighthouse/a11y a finální zákonné přehodnocení sazeb před merge jsou **povinné otevřené kroky**, nikoli implicitní PASS při vytvoření HTML.
- Stávající produkční funkčnost směn chránit numerickými regresními testy před případnou budoucí migrací.

## Schvalování
1. Otevřít živé Cloudflare preview `https://rv3-pilot-rychlevypocty-v3-preview.maattinek.workers.dev/`, projít 390/1440 px a reálné mzdové scénáře.
2. Opravit uživatelské připomínky v `rv3/pilot`.
3. Teprve po samostatném schválení + browser QA zvážit merge tří URL. Žádné plošné změny dalších cca 196 URL.
