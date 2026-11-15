# RV3 Page Studio — Redakční zásady

**Veřejná URL:** \`/redakcni-zasady.html\` · **Preview:** \`/rv3/studio/redakcni-zasady.html\`  
**Stav:** DRAFT / VISUAL_REVIEW_PENDING · **Datum:** 15. 11. 2026  
**R5 / trust:** zpracovávat po \`O projektu\` a \`Jak počítáme\`. Původní veřejná URL, \`main\`, DNS a produkční hosting jsou zamčené.

## Přečtený zdroj (jediný zdroj pravdy pro fakta)

Soubor \`redakcni-zasady.html\`:
- SEO title \`Redakční zásady | RychléVýpočty.cz\`, canonical \`https://rychlevypocty.cz/redakcni-zasady.html\`, description \`Jak RychléVýpočty.cz vybírají témata, ověřují zdroje, používají automatizaci a opravují chyby.\`
- Zdrojový JSON-LD WebPage / BreadcrumbList má \`dateModified: 2026-08-04\`; neprohlašovat za nově aktualizované veřejné datum před skutečným produkčním vydáním.
- **Redakční pravidla skutečně existují**: výběr užitečné otázky, primární pravidla a doba platnosti, AI jako pracovní podklad, finální odpovědnost skutečného provozovatele Martin Šilinger, kontaktní e-mail \`rychlevypocty@seznam.cz\`, popis postupu po hlášení chyby.
- Související skutečné zdroje v repozitáři: \`jak-pocitame.html\`, \`data-a-benchmarky.html\`, \`o-nas.html\`, \`reklama-a-spoluprace.html\`, \`kontakt.html\`, \`ochrana-osobnich-udaju.html\`.
- Starý \`rv-trust-v7.css\`, generický \`hero-panel\`, \`trust-nav\` sidebar ani \`card\` nepřebírat do nového layoutu.

## Individuální redakční koncept

**Otázka návštěvníka:** „Kdo vybírá témata, čemu se dá věřit, kde se do tvorby zapojuje AI a co se stane, když narazím na chybu?“

**Jiná role než ostatní stránky:** \`O projektu\` odpovídá **kdo/proč**; \`Jak počítáme\` odpovídá **odkud vzorec a jak se ověřuje**. \`Redakční zásady\` odpovídají **jak volíme témata, ověřujeme zveřejňovaná tvrzení a přijímáme opravy**.

### Vizuální koncept

- Věrná identita katalogu V3, odlišný vlastní editorial layout. Sdílený \`renderHeaderV2\` / \`renderFooterV2\`, původní logo \`/logo-rv-v32.svg\` a oba zdrojové katalogové CSS.
- Originální autorská ilustrace \`rv3/assets/editorial-desk.svg\`: kontrolní redakční list, dokument s primárními zdroji, poznámka „AI = pracovní podklad“, kontrolní zaškrtnutí a pero. Nezaměnitelná s kalkulačkovým stolkem metodiky nebo About ilustrací.
- Přirozeně sdílené drobné piktogramy \`rv3/assets/about-icons.svg\` pro „zdroj / zadání / kontrola / souvislosti / zpětná vazba“, bez knihoven a emoji.
- Layout rytmus: úvodní ilustrace → důraz na význam tématu a „editorial paper sheet“ → tři zdrojové oblasti → upřímné AI schéma → praktická kontaktní část → související trust stránky.
- Zelená serif kurzíva na navy titulcích, teplá bílá, mint, decentní žlutý akcent; žádný blanket generický grid karet pro celou stránku.

### Obsah

1. **Hero — důvěra začíná dobrou otázkou.** Uživatelská hodnota, nikoli počet nových kalkulaček.
2. **Výběr témat** s čtyřmi důležitými otázkami: pro koho, vstupy, vzorec, omezení. Není to slib 100% ručně otestovaných 207 URL.
3. **Ověřování zdrojů:** původní právní/úřední a zdravotní podklady, referenční rok a změna sazeb/limitů.
4. **AI:** upřímné rozlišení mezi použitím jako pracovní pomůcky a konečnou odpovědností provozovatele, bez fiktivního odborného týmu.
5. **Opravy:** formát konkrétního hlášení s možností připravit e-mail.
6. **Transparentnost:** samostatné odkazy do \`O projektu\`, \`Jak počítáme\`, \`Data a benchmarky\`, reklamní politiky a soukromí. Neopakovat právní dokumentaci.

### Funkční mini-produkt: nahlášení chyby

\`rv3/sitewide/editorial-report.js\` implementuje **user-triggered mailto composer**:
- 4 skutečné typy podnětů, názvem/odkazem na stránku a popisem.
- Předvyplní jen mailto subject/body na \`rychlevypocty@seznam.cz\`; user odeslání ve svém klientovi sám potvrdí.
- Neprovádí fetch, ukládání, backend ani automatické odeslání. Bez JavaScriptu má návštěvník přímý mailto odkaz.
- Nevyžaduje citlivé osobní údaje. Text výslovně doporučuje je neuvádět.
- Testy zahrnují odmítnutí chybějícího a příliš dlouhého zadání, žádný mailto před stiskem tlačítka, kódování parametrů i fallback.

## Dodávané soubory

- \`rv3/engine/studio-editorial.mjs\` — striktní fail-closed zdrojová identita a factual provenance včetně vlastníka.
- \`rv3/engine/editorial.template.html\` — jedinečná SSR HTML kompozice, původní source \`main\` nepřepisovat a neimportovat.
- \`rv3/sitewide/editorial.css\` — page-specific desktop/mobil, focus, reduced motion.
- \`rv3/sitewide/editorial-report.js\` — užitečný JS mailto composer, bez API volání.
- \`rv3/assets/editorial-desk.svg\` — původní lokální ilustrace.
- \`cloudflare/tests/studio-editorial.test.mjs\` — přesné regrese obsahu, SEO, UI, mailto.
- \`scripts/build-v3-engine-poc.mjs\` integruje oddělený výstup v \`/rv3/studio/redakcni-zasady.html\`.
- \`cloudflare/browser-qa/visual-review.json\` explicitně cílí na novou redakční stránku; 8 baseline + 2 visual případy jsou nadále nutné.

## Stage checklist

- [x] Přečten skutečný zdroj a související pravidla, provozovatel a kontaktní cesta
- [x] Zvolen vlastní úkol a vizuální směr jednotlivé stránky
- [x] Připraveno statické HTML, originální ilustrace, CSS a funkční mailto
- [x] Připraveny konkrétní regresní testy
- [ ] Vlastní Node CI pro aktuální commit PASS
- [ ] Cloudflare Build / Deployment Success s přesným immutable SHA
- [ ] Skutečné Browser Run 390×844 / 1440×900, interní odkazy, konzole, mobile overflow, SVG, noindex
- [ ] Reálný test formuláře v browseru, bez automatického odesílání e-mailu
- [ ] Obsahové a vizuální schválení vlastníkem
- [ ] Produkční release pouze na výslovné zadání s rollbackem
