# RychléVýpočty.cz V7 — REVIEW_REQUIRED AUDIT

**Datum:** 2026-09-11  
**Scope:** všech 33 URL vedených v `RV_VNEXT_INVENTORY.json` jako `REVIEW_REQUIRED`  
**Nástroj:** live on-page crawl přes GSC Wizard + inventory snapshot  
**Cíl:** zjistit, zda je čeká rebuild, nebo rychlý KEEP/POLISH/promotion pass.

---

# EXECUTIVE RESULT

**Zásadní zjištění:** `REVIEW_REQUIRED` neznamená „thin / špatná / nutný rebuild“.

Audit všech 33 URL:

- **33/33** HTTP 200 a indexable,
- **0 critical SEO issues**,
- **0 high SEO issues**,
- pouze **3 medium issues**, všechny stejného typu: Organization schema bez `logo` na novějších stránkách,
- zbytek jsou low hygiene věci (title/meta length, image alt interpretation, 2× favicon absence),
- většina stránek je obsahově velmi bohatá: typicky cca **2 600–3 600 slov**.

**Praktický závěr:** finish sprint NESMÍ těchto 33 URL přestavět od nuly. Primární strategie je **KEEP + POLISH / PROMOTE**, s targeted mobile/UX/correctness/methodology review. Rebuild pouze tam, kde skutečný product/visual review prokáže problém.

---

# 1. CONTENT DEPTH SNAPSHOT

## Mzdy / práce

| URL | Words | Audit |
|---|---:|---|
| `cestovni-nahrady-kalkulacka.html` | 2613 | low hygiene only |
| `kalkulacka-hodinove-mzdy.html` | 3440 | clean |
| `mesicni-mzda-z-hodinove-sazby-kalkulacka.html` | 3042 | low title length only |
| `kalkulacka-odpracovanych-hodin.html` | 2850 | clean |
| `kalkulacka-dovolene.html` | 2790 | title/meta length |
| `kalkulacka-prescasu.html` | 2879 | clean |
| `odstupne-kalkulacka.html` | 3286 | clean |
| `nahrada-mzdy-za-dovolenou-kalkulacka.html` | 3286 | clean |

**Verdikt:** žádný content rebuild. Review mobile UX + correctness + legal methodology + brand/footer, pak promote/polish.

## Pronájem / investiční bydlení

| URL | Words | Audit |
|---|---:|---|
| `kalkulacka-cisteho-vynosu-z-pronajmu.html` | 3119 | long title |
| `kalkulacka-cashflow-z-pronajmu.html` | 2803 | title + image hygiene |
| `kalkulacka-mesicnich-nakladu-investicniho-bytu.html` | 3021 | long title |

**Verdikt:** content rich; verify intent separation + first-use UX, ne rebuild kvůli AdSense textu.

## Energie / domácnost

| URL | Words | Audit |
|---|---:|---|
| `spotreba-elektriny-kalkulacka.html` | 3482 | image hygiene |
| `naklady-na-vytapeni-kalkulacka.html` | 3490 | title/meta length |
| `porovnani-vytapeni-kalkulacka.html` | 3477 | long title |
| `navratnost-fotovoltaiky-kalkulacka.html` | 3516 | title + image hygiene |
| `spotreba-plynu-kalkulacka.html` | 2825 | title; favicon absent |
| `spotreba-vody-a-naklady-kalkulacka.html` | 2873 | title; favicon absent |
| `spotreba-klimatizace-kalkulacka.html` | 2828 | long title; 0 external source links requires method/source review |
| `led-uspora-elektriny-kalkulacka.html` | 3255 | long title |

**Verdikt:** velmi bohatý obsah. Největší riziko není thin content, ale UX density / source quality / stale parameters. Review + polish.

## Rodina / rozpočet

| URL | Words | Audit |
|---|---:|---|
| `kalkulacka-zivotnich-nakladu.html` | 2796 | clean |
| `kalkulacka-financni-rezervy.html` | 2789 | image hygiene |
| `kalkulacka-rozpoctu-domacnosti.html` | 2809 | title + image hygiene |

**Verdikt:** content rich; prioritize mobile simplicity + practical examples + no generic finance advice claims.

## Těhotenství / cyklus

| URL | Words | Audit |
|---|---:|---|
| `termin-porodu-kalkulacka.html` | 2800 | title/meta/image hygiene |
| `kdy-si-udelat-tehotensky-test.html` | 3011 | image hygiene |
| `ovulacni-kalkulacka.html` | 3450 | image hygiene |
| `menstruacni-kalendar.html` | 3053 | image hygiene |

**Verdikt:** content rich. Health-adjacent quality gate = source freshness, uncertainty language, no pseudo-medical certainty, mobile simplicity.

## Auto / matematika

| URL | Words | Audit |
|---|---:|---|
| `kalkulacka-celkove-ceny-vlastnictvi-auta.html` | 3613 | title length |
| `spotreba-paliva-kalkulacka.html` | 3130 | meta length |
| `procenta-kalkulacka.html` | 2796 | image hygiene |
| `prevodnik-jednotek.html` | 2887 | title length |

**Verdikt:** content rich. TCO musí zůstat intentově oddělené od provozních nákladů. Procenta/prevodník nepřestavovat kvůli obsahu; řešit UX fragmentation jen pokud skutečně překáží.

## Recent / special

| URL | Words | Audit |
|---|---:|---|
| `kalkulacka-tapet.html` | **663** | Organization schema missing logo + image hygiene |
| `sklon-a-spad-kalkulacka.html` | **822** | Organization schema missing logo + image hygiene |
| `rosny-bod-kalkulacka.html` | **711** | Organization schema missing logo + title length |

`sklon-a-spad` a `rosny-bod` mají recent release commits v `main`, takže inventory status je metadata drift, ne důkaz nedokončeného buildu.

`kalkulacka-tapet` je jediný skutečně zřetelný content-depth outlier v review queue. Neznamená to automaticky problém; před promotion ale musí projít samostatný content/value review a případně dostat užitečnou depth bez filleru.

---

# 2. SITEWIDE HYGIENE ZJIŠTĚNÍ

## A. Structured data

Systemický fix:
- všechny Organization objekty mají používat canonical logo URL,
- nekopírovat nekompletní Organization schema na nové kalkulačky.

Aktuálně medium issue na:
- `kalkulacka-tapet.html`
- `sklon-a-spad-kalkulacka.html`
- `rosny-bod-kalkulacka.html`

## B. Titles / meta

Řada stránek má title 61–85 znaků nebo meta >160.

**Nedělat mechanické zkracování všech URL.** Upravit pouze tam, kde lze zachovat intent a zvýšit čitelnost/SERP clarity.

Největší title outlier:
- `kalkulacka-cisteho-vynosu-z-pronajmu.html` — 85 znaků.

## C. Images / alt

Crawler hlásí u řady stránek 2/2 images missing alt. V mnoha případech jde pravděpodobně o brand/dekorativní images s `alt=""`.

**Neopravovat mechanicky vyplněním keyword altu.**
- dekorativní = `alt=""` je správně,
- informační image = smysluplný alt.

## D. Favicon

Crawler nenalezl favicon na:
- `spotreba-plynu-kalkulacka.html`
- `spotreba-vody-a-naklady-kalkulacka.html`

Opravit v hygiene batchi.

---

# 3. CO TO MĚNÍ V PLÁNU

Původní riziko bylo: „máme 33 neupgradovaných kalkulaček a musíme je překopat“.

**Reálný stav:** velká část těchto stránek už je obsahově vyspělá a technicky indexovatelná. Proto:

1. **neudělat 33 redesignů,**
2. udělat rychlý product/mobile/correctness review po batchech,
3. promotion nebo targeted polish,
4. soustředit čas na skutečné outliery + 50 RELEASE_CANDIDATE promotion sweep,
5. pak okamžitě sitewide homepage/hubs/trust pass.

Toto dramaticky zkracuje cestu k AdSense readiness bez snižování kvality.

---

# 4. NOVÝ BATCH DECISION GATE

Pro každou z těchto 33 URL už NEŘEŠÍME otázku „má dost textu?“ jako default.

Review je pouze:

1. Je primary user job jasný do 5 sekund?
2. Hero → tool bez překážek?
3. Je mobile first-use jednoduchý?
4. Je výsledek dominantní a interpretovaný?
5. Je calculation correct / benchmarked?
6. Je metodika/source freshness dostatečná?
7. Je page topic-native a ne generická?
8. Footer/socials/brand kompletní?
9. 320–1440 bez overflow/runtime?
10. SEO hygiene / schema / canonical / links PASS?

**8–10 PASS + žádný P0/P1 = PROMOTE TO DONE.**

Fail jednoho konkrétního bodu = KEEP + POLISH.

REBUILD až když selže samotná product architecture, ne jen kosmetika.
