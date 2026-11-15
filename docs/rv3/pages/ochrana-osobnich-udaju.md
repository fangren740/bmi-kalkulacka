# RV3 Page Studio — Ochrana osobních údajů
**Stav 15. 11. 2026: DRAFT, vizuální kontrola pending, právní review BLOCKED.** Zdrojová produkční URL `/ochrana-osobnich-udaju.html` beze změny. Izolované preview `/rv3/studio/ochrana-osobnich-udaju.html`. Dílčí práce v PR #77.

## Redakční revize: méně je více
Po prvním preview byla provedena **redakční UX revize** na základě požadavku nezahlcovat stránky zbytečným textem:
- Odstraněna samostatná „mapa toku údajů“ se třemi opakovanými kartami. Její informace již stojí v právních oddílech.
- Odstraněn **URL inspector** včetně JS, tlačítek, doprovodných vysvětlení a CSS. Kontrola výskytu `?` nebo `#` v adrese byla technicky správná, ale nepřinášela významnou novou hodnotu oproti upozornění v původní právní sekci. Na stránce soukromí navíc zbytečně sváděla k vložení potenciálně citlivého odkazu.
- Odstraněn další nadbytečný závěrečný promo blok, opakující se trust odznaky a ilustrační štítek.
- H1 nyní jednoznačně jmenuje téma **Ochrana osobních údajů**. Jediná primární CTA vede rovnou na plné znění; sekundární odkaz na práva. Stručnější úvod, jedna ilustrace, sedm původních oddílů, navigace po právních tématech.
- Méně barevných/typografických dekorací, kratší CSS, menší obrázek a zejména kratší první obrazovka na mobilu.
- **Právní obsah nebyl škrtán ani přepisován.** Nepovažovat právně potřebný text za „vatu“.
- Browser test je potřeba zopakovat pro nový SHA; staré preview není aktuální.

## Skutečný právní zdroj — bez redakčních zásahů
- Ověřený git blob SHA originálu `ochrana-osobnich-udaju.html`: `74c09875753ba7eac387ec10b871b5fd04ffe845`.
- Renderer při buildu kontroluje tento Git blob fingerprint, canonical, title/description, původní PrivacyPolicy JSON-LD, 7 přesných sekcí, jejich pořadí i 17 odstavců. Každá sekce se do moderního layoutu vkládá jako **doslovný HTML fragment**.
- Jakákoli změna původního právního textu vyžaduje věcný audit a nové schválení, nikoli automatické přegenerování.
- Zpracování vlastníka, provozu kalkulaček, analytiky, e-mailu (Seznam.cz), hostingu (GitHub Pages), externích odkazů a práv GDPR zůstává kompletní v původní formulaci.

## Otevřené faktické otázky (blokují release)
1. **V3 Kontakt / PR #76** má HTML formulář pro sestavení `mailto:` bez serverového odesílání, ale původní soukromí tvrdí „web nemá kontaktní formulář“. Ve společném release pravdivě sjednotit popis všech relevantních veřejných stránek.
2. **Analytika, AdSense, CMP:** současné texty uvádějí, že nejsou aktivní. Plná síťová verifikace skutečných produkčních stránek a consent stavu dosud není doložena. Netvrdit, že je obsah aktuální, dokud není ověřen.
3. **Hosting:** originál popisuje produkční GitHub Pages, zatímco V3 preview používá Cloudflare Workers. Před jakoukoli migrací produkce vyřešit provozovatele, zpracovatele a informování.
4. **GDPR audit:** právní základy, retention, příjemci, mezinárodní přenosy a konkrétní faktický provoz. Žádné „certifikované GDPR“ bez podkladů.

## Součásti
- `rv3/engine/studio-privacy.mjs` — fail-closed factual identity + doslovné legální sekce.
- `rv3/engine/privacy.template.html` — ořezaná page-specific čtecí kompozice.
- `rv3/sitewide/privacy.css` — čistá typografie/čitelnost a mobilní navigace, bez nadbytečných sekcí.
- `rv3/assets/privacy-flow.svg` — vlastní brand ilustrace.
- `cloudflare/tests/studio-privacy.test.mjs` — aktualizované obsahové, právní, SEO, UX i fail-closed testy.
- `scripts/build-v3-engine-poc.mjs` — výstup do izolované preview cesty.
- `cloudflare/browser-qa/visual-review.json` — cíl na novou privacy stránku.

**Vydání pouze po**: Node/build PASS pro aktuální SHA, immutable Cloudflare preview, reálné Browser Run 390×844 a 1440×900 + screenshoty, kontrola všech právních sekcí/noindex/symbolů/anchorů, samostatné právní a majitelovo obsahově-vizuální schválení. Nic nemergovat do `main` bez pokynu.
