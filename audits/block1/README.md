# Blok 1 — produkční důkazy a první opravná dávka

Datum: 7. 9. 2026. Produkční main při auditu: `47dd2f001e97bbaa9357185ab2abb32a2f081ba9`.

## Výsledek

**První opravná dávka: candidate QA PASS pro 8 stránek. Celý blok 1 zůstává OPEN.** Žádná kalkulačka nebyla povýšena z RELEASE_CANDIDATE na DONE a neproběhl merge ani deployment.

### Produkční baseline všech 49 RC

[98 reportů Lighthouse 13.4.1 mobile/desktop](https://github.com/fangren740/bmi-kalkulacka/actions/runs/34094678911) a [živý browser průchod](https://github.com/fangren740/bmi-kalkulacka/actions/runs/34094844093):

- Desktop Performance 100 u všech 49; mobile 96–100 (36 stránek má 99).
- Best Practices a SEO 100 u všech 49 na obou zařízeních.
- Accessibility: 48 stránek s nedostatečným kontrastem, 8 s target-size, 2 s label-content-name-mismatch. Kategorie se překrývají. Pouze #45 má Accessibility 100 již v baseline.
- 196 browser kontrol při 320/360/390/1440 px; žádné zachycené pageerror. Pět URL přetékalo při 320 px (#62, #64, #68, #69, #70).
- Posuvný měsíční kalendář #62 byl v původním smoke testu navíc chybně klasifikován jako sada oříznutých ovladačů. Opravený runner rozlišuje obsah v posuvném kontejneru uvnitř viewportu od přetékání dokumentu.

Důkazy jsou v `production-baseline-2026-09-07.json` a sedmi souborech `production-results-*.json`. Úspěšné dokončení sběru v CI není produktový PASS. Přesné HTML hashe se při různých způsobech načtení liší; nejde o potvrzení totožnosti nasazeného HTML. Browser zaznamenal také Cloudflare email-decode a hashe prostředků. Tuto delivery vrstvu jsme neměnili.

## Opravené URL

| # | Kalkulačka | Oprava | Candidate A11y / BP mobile i desktop |
|---|---|---|---|
| 26 | Fakturace na čistý příjem OSVČ | Kontrast pomocných textů a nadpisu tmavé metodiky | 100 / 100 |
| 27 | Daňová kalkulačka OSVČ | Kontrast výsledků a metodiky | 100 / 100 |
| 28 | Vedlejší OSVČ | Kontrast a klikací plocha zdrojů | 100 / 100 |
| 62 | Směnový kalendář | Kontrast všech typů směn, názvy tlačítek, zalamování patičky | 100 / 100 |
| 64 | Číslo týdne | Kontrast, názvy týdnů 01–09, zalamování patičky | 100 / 100 |
| 68 | Jednotková cena | Kontrast, zalamování patičky | 100 / 100 |
| 69 | Trojčlenka | Kontrast, zalamování patičky | 100 / 100 |
| 70 | Průměr | Kontrast, zalamování patičky | 100 / 100 |

Sedm stránek prošlo v [běhu 34119805874](https://github.com/fangren740/bmi-kalkulacka/actions/runs/34119805874) na `a331f14`. Tento běh jako celek správně selhal kvůli #62. Po opravě prošel #62 v [běhu 34120390506](https://github.com/fangren740/bmi-kalkulacka/actions/runs/34120390506) na `f3ed2d4`; ostatních sedm produktových stránek se mezi těmito revizemi neměnilo. Evidence: `candidate-seven-pages.json`, `candidate-shift-final.json`.

Všech osm prošlo kontrolou 320/360/390/1440 px bez přetékání dokumentu, nepřístupně oříznutých ovladačů a pageerror. Proběhla vizuální kontrola screenshotů upravených prvků na mobilu a desktopu. U #62 navíc prošlo přepnutí všech pěti vestavěných cyklů, kontrast popisků fází alespoň 4,5:1 a výběr dne přes posuvný kalendář při 320 px.

Výpočetní pravidla, parametry, SEO metadata a indexace se neměnily. Změny JS se omezují na přístupné názvy a mezery mezi texty kalendářových tlačítek. Opravy stylů zůstávají v existujících souborech, bez nového klientského JS a bez zásahu do sdíleného brand CSS. Cachebustery změněných prostředků byly aktualizovány.

Candidate audit měří Accessibility a Best Practices; produkční baseline Performance/SEO není měřením budoucího nasazení opravené verze. Nejde o úplný WCAG, právní ani matematický audit všech 49 kalkulaček.

## Navazující práce

1. Po vizuálním PASS této dávky pokračovat zbylými business stránkami #29–38 (zvláště klikací plochy #30, #33–37).
2. Dokončit kontrast u ostatních RC a target-size #44; v evidenci zůstává 41 dalších RC, z toho 40 s kontrastním nálezem.
3. Doložit dosud chybějící uživatelský vizuální gate #37, #38, #42 a #46. Neresetovat MAJOR/HOLD kvůli těmto technickým opravám.
4. Před DONE provést po výslovně schváleném deployi odpovídající live retest, kontrolu verze a vyhodnocení výkonu. Pouhý místní PASS nestačí.

PR #4 je postaven nad dosud nemergovaným PR #3. Žádný z těchto PR nemergovat ani nenasazovat bez výslovného souhlasu vlastníka.
