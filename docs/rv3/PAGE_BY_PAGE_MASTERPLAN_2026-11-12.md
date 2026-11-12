# RV3 — MASTERPLAN: 207 stránek po jedné, žádná pásová výroba
**Vydáno 12. 11. 2026 | Nadřazený plán: tento soubor | Stav: BUILD/PR DEVELOPMENT ONLY, produkce zamčená**

**Rozhodnutí vlastníka (12. 11.):** cílem není „jednotná grafika všech kalkulaček“. Cílem je **nejlépe zpracovaný český web pro výpočty**, v němž **každá jednotlivá stránka** projde kvalitním produktovým designem, implementací a důkazním QA. Homepage, všechny huby, About, metodika, pravidla, kontakt, privacy a kalkulačky jsou rovnocenné části produktu. Společný engine/komponenty zajišťují kontinuitu, nikoliv sériové generování stejného obsahu a vzhledu. **Kvalita před kvantitou; nikdy nenasazovat na produkci bez výslovného schválení.**

## 0. Princip: společná výbava, originální stránky

### SDÍLET („design language“)
- **Beze změny:** původní `/logo-rv-v32.svg`, původní značka a rozpoznatelná identita; žádný náhradní textový wordmark.
- Design tokeny: námořnická modrá jako text a důvěra, kultivovaná zelená pro aktivní rozhodnutí, teplé bílé / mint povrchy; systém typografie, kontrastu, mřížek, rozestupů, rádiusů, stínů.
- Komponenty: header, mobilní menu, breadcrumbs, lokální vyhledávání, CTA, accessible vstupy, stavy chyb, výsledkový panel, dokumentace metodiky, související odkazy, trust footer.
- Kontrakty: HTML render před JS; stabilní URL `.html`, canonical, JSON-LD, consent, interní propojení, kontrolní / rollback pravidla. Nezavádět nový frontend framework bez důkazu přínosu.

### NAVRHNOUT PRO KAŽDOU URL ZVLÁŠŤ („produktové studio“)
- Kdo na ni přichází, s jakou *jednou hlavní otázkou* a co má na konci umět rozhodnout.
- UX flow, hierarchie, vstupy/výsledky, prázdné/chybové stavy; mobile-first design včetně dlouhého textu a klávesnice.
- Jedinečný hero/ilustrace a mikrocopy *jen když nesou informaci*. Nepřelévat dekorace z katalogu na každou stránku.
- Konkrétní odborné zdroje, pravidla, období a hraniční situace; bez umělého natahování textu či vycpávkových FAQ.
- Jedna stránka = jeden schvalovatelný finální výsledek; interních iterací kolik bude potřeba, ne mechanické jedno QA na konec velké dávky.

## 1. Inventář, počty a pravdivé statusy

Podklad: `docs/rv3/route-registry.json` a živé GitHub soubory. **207 root .html** = **135 katalogových nástrojů + 22 hubů + 8 trust/legal + 1 homepage + 1 embed + 40 původně unclassified**; 3 dřívější piloty jsou *uvnitř* těchto počtů. Ze 40 je staticky prohlédnutých 5 a **35 stále UNKNOWN** — automatická klasifikace dle jména je zakázána.

**Úplný strojově čitelný tracker:** [PAGE_TRACKER_2026-11-12.json](PAGE_TRACKER_2026-11-12.json), jeden záznam pro **každou ze 207 URL**. Počáteční `NOT_STARTED` je pravda: starší PoC/stylované stránky neznamenají hotový individuálně schválený redesign.

### P0: orientace na celém webu — ČTYŘI svébytné produkty
| URL | Pro koho a proč | Jádro individuálního návrhu |
|---|---|---|
| `/index.html` | První návštěvník často nezná název kalkulačky | **Úvodní produkt**: hlavní otázka, inteligentní rozcestí, 3–5 scénářů, jasná důvěryhodnost výsledků, rychlý přístup; žádný duplicitní full-katalog |
| `/kalkulacky.html` | Člověk již ví, že chce kalkulačku, hledá správnou | **Prémiový katalog V3** podle směru draft PR #66: české hledání + 6 rychlých cest + 8 přehledných oblastí + 135/135 skutečných URL |
| `/situace.html` | Člověk řeší životní problém, nikoliv vzorec | **Navigace podle situací** a navazujících kroků; obsahově jiná než katalog i homepage |
| `/navody.html` | Člověk chce nejprve pochopit a následně spočítat | **Redakční knihovna** s kolekcemi, jak poznat relevantní návod a jak navazuje na nástroj |

### P0: důvěra a poctivý provoz — stránky nesmějí přijít až po kalkulačkách
| URL | Nezaměnitelná role | Speciální kontrola |
|---|---|---|
| `/o-nas.html` | Skutečný autor/provozovatel, motivace projektu, kompetence, co web umí/neumí | Fakta o provozovateli; nevymýšlet tým, odborné tituly ani recenze |
| `/jak-pocitame.html` | Jak ověřujeme zdroje, vstupy, zaokrouhlení a data aktualizace | Konkrétní metodické příklady, CSV/benchmarks; auditovatelnost |
| `/redakcni-zasady.html` | Nezávislost, AI, transparentnost, opravy a aktualizační politika | Pravdivost procesů, kontakt pro opravy, bez falešné garance revizí |
| `/kontakt.html` | Nahlášení chyby, zpětná vazba, návrh kalkulačky | Funkční kontaktní cesta, žádný falešný odesílací formulář |
| `/ochrana-osobnich-udaju.html` | Reálný popis osobních údajů | Ověřit CMP/GA4 a hosting; v aktuálním textu je „Google Analytics nyní není aktivní“ — **ověřit skutečný stav před editací**, ne automaticky měnit |
| `/cookies.html` | Reálné souhlasy/cookies | Pozor na aktuální CMP, opt-in, souhlas a právní správnost |
| `/podminky-pouziti.html` | Limity orientačních výpočtů a odpovědnost | Bez prohlášení, která by neoprávněně slibovala právní/finanční jistotu |
| `/reklama-a-spoluprace.html` | Jasné oddělení monetizace a redakce | Výslovně ověřit aktuální AdSense/affiliate skutečnost |

### P1: všech 22 tematických hubů — každému vlastní záměr
**Priority řazené dle návaznosti a zaměření, NE podle možností hromadné migrace**:

1. `mzdy-a-prace.html` — pracovní situace a výplata; navázat na pilot, ne ignorovat již dobrou práci.
2. `finance-a-hypoteky.html` — financování bydlení, orientační mini-simulátor; zachovat výpočet.
3. `bydleni.html` — reálné náklady bydlení a rozhodování mezi variantami.
4. `osvc-a-freelancing.html` — cesta od práce k faktuře a čistému příjmu; původní příběhová ilustrace.
5. `energie-a-domacnost.html` — spotřeba, energie, orientace v úspoře.
6. `rekonstrukce.html` — kalkulace rozpočtu, rezerva, kontrola nákladů.
7. `rodina-a-rozpocet.html` — výdaje rodiny a rozhodovací situace.
8. `auto-a-provoz.html` — TCO auta: provoz a pořizovací náklady.
9. `domaci-rozpocet.html` — měsíční cash-flow, rezervy.
10. `business-a-cenotvorba.html` — marže, minimální cena, bod zvratu.
11. `data-a-benchmarky.html` — důkazy, původ dat a benchmarky.
12. `matematika-a-prevody.html` — rychlé jednoduché utility bez obtěžování.
13. `pronajem-a-investicni-bydleni.html` — výnos a riziko pronájmu.
14. `dane-a-rocni-zuctovani.html` — daňová rozhodnutí zaměstnance.
15. `datum-a-cas.html` — datumové a časové výpočty.
16. `dalsi-prakticke-nastroje.html` — užitečné cesty, ne „odpadní koš“.
17. `stavba-domu.html` — stavební rozpočet a plánování.
18. `tehotenstvi-cyklus-plodnost.html` — citlivý zdravotní kontext, opatrná formulace.
19. `prace-a-mzda.html` — předem ověřit odlišnost od `mzdy-a-prace.html`; rozhodnutí o kanonikalizaci pouze podle důkazů.
20. `kalkulacky.html` — referenční katalog, vlastní velký produkt.
21. `situace.html` — hlavní navigace podle situace, nikoliv duplikát katalogu.
22. `navody.html` — guide hub, nikoliv duplikát katalogu.

**Poznámka:** katalog, situace a návody figurují v 22 hubech a záměrně se realizují **dříve v P0**, nepřipočítávat je znovu k počtu 207.

### P2: každá ze 135 kalkulaček samostatně
**NIKOLI migrace 20 kalkulaček jedním stylem.** Nejdřív pět vzorových, ale každou vyvinout a schválit samostatně:
- `cista-mzda-kalkulacka.html` — existující pilot: výsledek + odvody + účinnost pravidel + metodika. Zvážit využití hotového návrhu, ne nepřehledný restart.
- `hypotecni-kalkulacka.html` — existující externí JS, amortizace, vstupy sazby/fixace, hraniční úvěr.
- `dpp-dpc-kalkulacka.html` — inline logika, roky/hranice odvodů, pořadí scriptů a DOM ID.
- `procenta-kalkulacka.html` (ověřit, zda existuje přesná URL v registry před volbou) — jednoduchý nástroj jako test nejrychlejšího UI.
- `kalkulacka-priplatku-za-smeny.html` — **chráněná kalkulačka**, až po regresích přes půlnoc/pauzy/typy příplatků.

`superdavka-kalkulacka.html` = zvlášť regulativně citlivá, do fáze s ověřenou legislativou a kompletními číselnými testy; nikdy neupravovat normativy čistě kvůli designu.

Pak **po jedné URL** z rodin mzdy/práce, finance, OSVČ, domácnost/energie, rodina/zdraví, stavba, auto a utility. Základní prvky lze sdílet, ale design, form flow, copy, scénáře a výstup hodnotit **vždy individuálně**. Způsob seskupení PR lze technicky upravit, ale nikdo nesmí prohlásit za schválených 10 stránek po otestování jedné.

### P3: 40 původně UNKNOWN, guides, embed a legacy
Před návrhem každé URL určit faktickou roli: průvodce, samostatná kalkulačka, staré přesměrování, landing, legal, embed. **35 zbývá individuálně prohlédnout**. Nepřesouvat obsah nebo canonical bez GSC/HTML důkazů. Trust a návody se budou řešit průběžně, ne až jako poslední „ostatní stránky“.

## 2. Vývojová disciplína: jednotlivá URL = vývojový produkt

Každá URL v `PAGE_TRACKER_2026-11-12.json` má unikátní datovou kartu a vznikne soubor `docs/rv3/pages/<slug>.md` s:
1. **Baseline evidence:** existující stránka, title/canonical/H1, GSC/GA4 kde přístupné, hlavní záměr, formuláře, JS/CSS, zdroje, kritické interní odkazy; screenshot *jen pokud reálně získán*.
2. **Research & benchmark:** co má návštěvník rozhodnout; 2–3 relevantní vzory UX a vlastní odlišující koncept; bez bezduchého kopírování a bez plošných ilustrací.
3. **Page design brief:** konkrétní hero, informační architektura, oddělení výpočtu vs metodiky, mobile UX, klíčové chybové stavy; **per-page unikátní vizuální příběh**.
4. **Implementace:** samostatný page-specific HTML/CSS/JS nebo bezpečný adaptér na sdílený build-time shell; předepsané URL a title/canonical nedotčené, bez runtime přepisování celého DOM.
5. **Numeric/source tests:** golden cases, min/max, nesmyslné vstupy, zaokrouhlení, roky a výjimky. Současné motory se mění jen při zdůvodněném výpočetním požadavku.
6. **Real browser QA:** screenshot 390/1440, skutečný formulář/klávesnice, focus/overflow, console errors, broken assets, žádná duplicitní navigace.
7. **SEO/Analytics/Performance:** title/H1/canonical/schema/robots/internal links/content; CMP a consent; Lighthouse mobile/desktop a podle dostupnosti CrUX/GSC; před/po baseline, bez umělých čísel.
8. **Peer/self review + vlastník:** nejdřív moje 2–3 interní quality roundy, teprve potom jeden preview link se stručným rozhodnutím. Po zamítnutí designu nezahlazovat nedostatky malou retuší; stránky přebudovat cíleně.

### Brány a metriky
- **S0 — BRIEF:** konkrétní uživatel, vlastní hodnota, aktuální fakta.
- **S1 — DESIGN:** návrh konkrétní URL, mobil a desktop, bez vykopírované homepage.
- **S2 — PREVIEW BUILT:** Cloudflare build & deploy konkrétní SHA (výslovně oddělené).
- **S3 — FUNCTIONAL QA:** výpočty, odkazy, keyboard, 390/1440 a reálná UI evidence.
- **S4 — QUALITY QA:** čitelnost, A11y, výsledková ergonomie, SEO a PageSpeed; opakovat dokud není skutečně hotovo.
- **S5 — OWNER APPROVAL:** vlastník schválí konkrétní stránku / kompletní směr, nic automaticky.
- **S6 — RELEASE:** pouze po explicitním souhlasu s přesným rolloutem, verzovaným návratem a post-release monitoringem.

**Cíle (NE naměřené výsledky):** pro CWV na 75. percentilu LCP ≤2,5 s, INP ≤200 ms, CLS ≤0,1. Interní Lighthouse Performance mobile ≥90, Accessibility ≥95, SEO ≥95 jako ambiciózní kvalitativní cíle, nikoliv proklamace či jediný release gate. Měřit skutečné vstupní zařízení, mobilní připojení, cache a dlouhé kalkulační úkoly; přítomnost starých souborů = důvod měřit, nikoliv bezmyšlenkovitě mazat.

### SEO & právní ochrana
- Stejné `.html` cesty, canonical, jazyk, title, OG, metadata, interní odkazy, hloubka originálního obsahu, datované právní zdroje, JSON-LD bez falešných ratingů.
- Náhled má **meta robots + HTTP X-Robots-Tag: noindex** a není v produkční sitemapě; root `main` indexace se nemění.
- Consent Mode, cookie CMP, Analytics a monetizace se ověřují podle skutečného kódu a používání. `o-nas.html` smí uvádět jen doložené informace o provozovateli.
- Před jakýmkoliv release srovnat GSC (#50) 1/7/28 dní a vyhodnotit dopad, přičemž reálná Google-selected canonical vyžaduje GSC Inspection.

## 3. Opravené pořadí navazující na předchozí experiment

**Stávající [PR #66](https://github.com/fangren740/bmi-kalkulacka/pull/66):** katalog jako **referenční vizuální směr**, ne prohlášení že engine je hotový.

**Stávající [PR #67](https://github.com/fangren740/bmi-kalkulacka/pull/67):** **technický adapter PROOF** pro `finance-a-hypoteky` a `osvc-a-freelancing`: existující `<main>`, scripts a canonical zachovány, plus nový skin. To zatím **neznamená prémiové jednotlivě navržené huby**. Obě stránky mají stav `NEOVĚŘENO/IN_DESIGN` do skutečného QA. Nenasazovat.

**NOVÁ PRIORITA:** homepage je první celoproduktový samostatně navržený produkt, potom katalog/situace/návody a důvěryhodnost `o-nas`/metodika. Teprve pak pokračovat v jednotlivých hub projektech a jednotlivých kalkulačkách. **Neznamená to zastavit bezpečné technické opravy současných experimentů**, ale nedělat z nich falešně „hotové stránky“.

| Realizační blok | Co konkrétně dodáme | Schvalování |
|---|---|---|
| R0 — platforma/trackování | 207 karet, identity lock, design tokeny, page brief šablona, CI link/SEO/baseline | interní |
| R1 — **homepage** | Nový detailní návrh homepage ve stejné prémiové úrovni jako katalog; vlastní hero/journeys/trust | první **vizuální i funkční** review |
| R2 — **katalog** | Stávající V3 prohloubit a ověřit 135/135 URL, české hledání a mobile | vlastní review |
| R3 — **situace** | Navigace podle záměrů a rozhodovacích kroků, nepřebarvený katalog | vlastní review |
| R4 — **návody** | Obsahové kolekce, expertiza, editorial a CTA na výpočet | vlastní review |
| R5 — **důvěra** | O projektu → Jak počítáme → Redakční zásady → Kontakt; jedna stránka po jedné | stránky zvlášť, věcné revize |
| R6 — **huby** | Mzdy → finance → bydlení → OSVČ atd., každý jako samostatný produkt | jeden hub po druhém |
| R7 — **kalkulačky** | Nejdřív pilot čista mzda / hypotéka / DPP-DPČ jako samostatné práce, pak další podle reálného významu a rizika | výpočtové QA pro každou |
| R8 — **guides, legal, embeds** | Systémově zkontrolované všechny zbývající URL, obsah i návaznosti | specifické trust/SEO review |
| R9 — **release waves** | Po odsouhlasení celé stránky nebo malé související sady postupné publikace, monitoring, rollback | **explicitní souhlas pro každé produkční nasazení** |

Neurčovat fiktivní termíny ani normu „20 stránek za den“. Čas na stránku určuje komplexita a kvalita. Mezi dlouhými fázemi souběžně řadit P0 právních a trust stránek, protože jsou součástí produktu, ne dekorace.

## 4. Priority pro dnešní autonomní práci 12. 11.
1. Uzamknout tento nový režim v master souborech/issue #59 a vytvořit tracking **všech 207 URL**.
2. Vytvořit **samostatný podrobný homepage brief** na základě skutečného `index.html`: jaké je primární rozhodnutí a jak elegantně navést uživatele na kalkulačku a zpět.
3. Získat první cílený proof pro homepage ve vývojovém preview (bez přepisu root), ověřit Cloudflare build a přiznat všechna neověření.
4. Připravit stručné samostatné briefy pro `o-nas.html` a `jak-pocitame.html`: historie a odpovědnost vs ověřitelná metodika.
5. Zapsat skutečné commity/PR/QA do logu; **ve 20:00 jeden souhrnný report** včetně 2–4 rozhodnutí, kde skutečně potřebujeme vlastníka.

## 5. Technická evidence a reference
- [route registry](route-registry.json) · [page tracker](PAGE_TRACKER_2026-11-12.json) · [master issue #59](https://github.com/fangren740/bmi-kalkulacka/issues/59)
- [Google: helpful people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Google: SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Google: Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals)
- [PR #66 katalog](https://github.com/fangren740/bmi-kalkulacka/pull/66) · [PR #67 engine/hubs experiment](https://github.com/fangren740/bmi-kalkulacka/pull/67)
