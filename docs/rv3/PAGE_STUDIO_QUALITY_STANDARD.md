# RV3 — závazný standard individuální stránky po schválení katalogu a O projektu

**15. 11. 2026 · Source of truth:** [DESIGN_NORTH_STAR_CATALOG_V3.md](DESIGN_NORTH_STAR_CATALOG_V3.md) + [PAGE_BY_PAGE_MASTERPLAN_2026-11-12.md](PAGE_BY_PAGE_MASTERPLAN_2026-11-12.md).

Majitel výslovně potvrdil, že nové stránky mají být minimálně na úrovni individuálního redesignu **O projektu** a ideálně ho překonat. Nejde jen o společnou barvu.

## Závazný dodatek zákaznické relevance (15. 11. 2026)

**Smyslem stránky je odpovědět návštěvníkovi, nikoli vykazovat množství práce na designu, SEO nebo právních textech.** Před prvním řádkem copy musí být jasné: kdo ji čte, co potřebuje rozhodnout a co na této stránce skutečně potřebuje vědět.

- **Žádná minimální délka textu:** historické „2 800 slov“ není cíl. Jednou vysvětlená věc se neopakuje v několika blokách, pokud nepřináší nový kontext.
- **Interní inventáře** (localStorage keys, SHA, CI, deployment, podrobné auditní nálezy) patří do GitHubu; veřejnost potřebuje účel, dopad a ovládání. Při právní povinnosti konkrétní údaj ovšem zůstává snadno dostupný.
- **Jedna funkce má jedno místo.** Hlášení chyb na Kontakt, kompletní metodika na Jak počítáme, právní informace na Soukromí/Cookies, představení na O projektu.
- **Zákonná transparentnost je důležitější než krátkost.** GDPR/ePrivacy a české povinnosti ověřovat z aktuální reálné implementace, žádná „certifikace“ z CI. Neověřený provozní údaj blokuje nasazení.
- Vizuálně příjemné **neznamená více sekcí**: ilustrace, karta i CTA musí návštěvníkovi pomáhat.

Komplexní zpětná revize a release brány: `docs/rv3/CUSTOMER_FIRST_LEGAL_EDITORIAL_AUDIT_2026-11-15.md`.

## Nevyjednatelné zásady

1. **Nejdříve role URL a skutečný zdroj.** Přímé přečtení stávajícího HTML/JS/SEO (a při potřebě dalších důkazů i navazujících datasetů). Výpočetní výsledky a právní údaje se nikdy nevymýšlejí. Původní HTML není návrhová šablona.
2. **Jednotný brand, vlastní vyprávění:** původní logo, fontový kontrast tmavý sans + zelený italic Georgia, světlo/mint, detailní vektorové objekty, smysluplné CTA a kompaktní karty. Pro *každou* stránku vlastní informační architektura; nekopírovat stejný hero, 3 boxy a patičku.
3. **Původní lokální SVG se smyslem:** přehledné ilustrace s materiálovým detailem, jemným stínem a občasným teplým akcentem, ikonky vysvětlují stav či krok. Když ikonka přidanou hodnotu nenese, raději ji nedávat. Opakované základní piktogramy se mohou sdílet, každá stránka má jedinečný hlavní obraz.
4. **Jeden živý užitečný moment** pokud to téma umožňuje (zvolený příklad, klikací navigace, skutečný model, reálný seznam s vyhledáním); žádné nefunkční ovládání ani efekty na úkor výkonu.
5. **Důkazy a přiznané limity:** zdroje, období, metodika, CSV, hranice a možná chyba ve vhodném rozsahu. Nenechat uživatele samotného s jediným číslem, ale nezahlcovat výklad SEO výplní.
6. **Mobil 390px jako produkt:** čitelný H1, smysluplné pořadí, dosažitelné CTA, interaktivní stavy, přístupnost, žádné horizontální přetečení.
7. **SEO/regresní integrita:** neměnit kanonické URL, schéma, základní navigaci nebo matematiku „kvůli designu“; preview separátní a noindex na HTML/HTTP.
8. **Gates:** source/Node testy → Cloudflare immutable preview → reálný Browser Run/screenshots → obsahové/vizuální hodnocení majitelem → až explicitně schválený release. Pokud Cloudflare Free 429, status \`DEFERRED_QUOTA — NOT VERIFIED\`, nikdy falešný PASS.
9. **Žádné automatické hromadné schvalování.** 207 URL = 207 jednotlivých produktových posouzení. Sdílené komponenty jsou prostředek, ne náhrada nápadu.

## Reference a přenosný postup

- **Katalog:** \`rv3/catalog-v2.css\`, \`rv3/catalog-v3-theme.css\`, \`rv3/engine/catalog-v2.mjs\`, \`rv3/assets/hero-desk.svg\`.
- **O projektu:** \`rv3/engine/studio-about.mjs\`, \`rv3/assets/about-story.svg\`, \`rv3/assets/about-icons.svg\`, \`rv3/sitewide/about.css\` + \`about-icons.css\`.
- **Jak počítáme:** \`rv3/engine/studio-methodology.mjs\`, \`methodology.template.html\`, \`rv3/assets/method-workbench.svg\`, \`rv3/sitewide/methodology.css\` + \`methodology-demo.js\`.

**Při každém Page Studio PR:** doložit přesný commit, immutable URL, screenshot mobil/desktop a konkrétní scénáře. Výtvarně srovnat s katalogem a předchozími schválenými stránkami, ale nenutit jejich sekce na nový účel.

**Stop bez návratu do production \`main\`**, dokud uživatel výslovně neschválí konkrétní release.
