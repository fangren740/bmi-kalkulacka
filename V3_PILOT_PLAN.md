# RychléVýpočty V3 — CLEAN SLATE pilot
Status: **nový návrh, bez schválení a bez produkčního nasazení** (11. 11. 2026)

## Proč znovu od základu
Dosavadní `rv3/pilot` měl dvě designové iterace, ale zachoval stejné chování: marketingový hero, kalkulačka mzdy, mřížka generických kategorií. To nebyl radikální produktový restart. Nová větev `rv3/clean-slate` byla vytvořena izolovaně od předchozího pilotu **kvůli zachování cloudové preview infrastruktury a původního numerického jádra**, ale **všechny tři HTML stránky, jejich UI JS a CSS jsou napsány nově bez starých layout komponent**. Staré `rv3/site.css`, `rv3/site.js` a `rv3/salary-ui.js` jsou odstraněny pouze na této vývojové větvi.

## Co víme ze zdroje pravdy
- Převzatá schválená evidence z `fangren740/rychlenastroje:quality/e-accurate-tool-discovery/RV3_HANDOFF_2026-11-10.md`: 65/75 GSC kliknutí příplatková kalkulačka za období 1. 8.–7. 11. 2026. Mzdy/práce mají prokazatelný organický tah.
- Ochrana všech existujících `.html` adres, canonical, logo, původních nástrojů, zejména příplatků; žádné hromadné slučování ani přepis 199 URL.
- Výpočetní jádro `rv3/salary-engine.js` beze změny algoritmu ze `cista-mzda-vnext.js` produkčního main; numerické referenční scénáře chráněny testy.

## Nová informační architektura
1. **Homepage = otázka → vhodný nástroj.** Vyhledávání konkrétní potřeby; srozumitelný přepínač výplata/práce/bydlení/finance; ukázka reálného rozhodování formou porovnání dvou nabídek práce (rozdíl čisté mzdy měsíčně a za 12 měsíců), nikoli další kopie čisté mzdy.
2. **Mzdy a práce = situace → správný výpočet.** Výplata / směny / volno / změna zaměstnání, relevantní odkazy, prominentní a nijak nezměněné příplatky.
3. **Čistá mzda = nástroj → výsledek → vysvětlení.** Jen tři základní vstupy (hrubá mzda, děti, prohlášení), okamžitě velká čistá mzda s rozpisem. Bonusy/slevy/výjimky volitelné. Výpočtové jádro a UI izolované.

## Vizuální koncept
- Originální `logo-rv-v32.svg`, navy `#071a33`, modrá `#2397e3`, zelená `#52d657` a původní favicony.
- Redakční čitelnost, typografická hierarchie, kreslený „numerický panel“ s daty a lehký otázkový rozcestník. Žádný marketplace karet, stejné plakátové komponenty jako RychléNástroje ani všeobecné stock ilustrace.
- Sdílený lokální stylesheet `rv3/foundation.css`, malý JS `rv3/product-ui.js`, bez externích fontů, bez frameworku nebo serverového sběru mzdových dat.
- Mobile-first breakpointy 460/760/1010; responzivní zobrazení není zatím náhrada vizuálního browser testu.

## Integrovaná QA, co se nesmí zaměnit
- Cloudflare Worker preview přes stejnou izolovanou Git integraci, `html_handling: "none"`, `X-Robots-Tag: noindex`, žádná vlastní doména, žádný GitHub Actions build.
- `cloudflare/tests/v3-home.test.mjs`: zachované canonical/brand, funkční porovnání nabídek i invalid stav, scénáře salary form.
- `rv3/tests/salary-regression.test.js`: referenční hodnoty 2026. Build PASS = pouze build/test PASS; samostatně ověřit 390/1440 browser UX, dostupnost konkrétních kritických URL, skutečné HTTP hlavičky a přístupnost. Teprve potom produktové schválení.
- **Neprovádět merge, DNS ani prod deploy bez výslovného schválení.**
