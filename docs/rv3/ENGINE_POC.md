# RV3 P1 — první funkční build-time engine PoC

**Stav: IMPLEMENTOVÁNO NA IZOLOVANÉ VĚTVI, BROWSER QA ČEKÁ.**

Větev: rv3/engine-poc (draft PR proti rv3/clean-slate). Nezasahuje do produkčního main, DNS ani původních root HTML.

## Co se opravdu generuje během Cloudflare preview buildu
- /rv3/poc/kalkulacky.html — katalog s inline CSS a JS.
- /rv3/poc/hypotecni-kalkulacka.html — kalkulačka s externím výpočtovým JS.
- /rv3/poc/dpp-dpc-kalkulacka.html — kalkulačka s inline výpočtovým JS.
- /rv3/poc/manifest.json — původní canonical, hash zachovaného main a skriptů.

Sdílený V3 header, menu a footer vznikají ve statickém HTML. Nevyžadují nový frontendový framework nebo runtime výměnu DOM. Veškerý main obsah, výpočetní JS a canonical se porovnávají na přesnou shodu se zdrojovou stránkou a při změně se build zastaví.

**POC kompromis:** Původní header/footer zůstává skrytý a inertní kvůli případné závislosti historického JS na jejich ID. Tato kompatibilitní vrstva je pouze pro experiment, před produkcí ji musí nahradit ověřené adaptéry. Samotný obsah kalkulačky zatím zůstává vizuálně původní. To dokazuje technickou integraci, ne dokončenou redesignovou migraci.

## Akceptace před schválením architektury
1. Ověřit Cloudflare build a odkazy na všechny 3 preview stránky.
2. V browseru otestovat katalog hledání a filtry; hypotéku a amortizaci; DPP/DPČ hraniční případy.
3. Screenshoty při 390 a 1440 px, console errors, focus, keyboard, scroll.
4. Zhodnotit zachování SEO obsahu a odkazy; potvrdit nebo upravit ADR-001.
5. Teprve poté plánovat bezpečnou migraci produkčních URL v dávkách 5–10.

Měřené PageSpeed ani browser PASS nejsou zatím doložené. Bez schválení uživatele neprovádět merge do main.
