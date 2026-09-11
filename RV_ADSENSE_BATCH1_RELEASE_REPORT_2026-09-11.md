# RychléVýpočty.cz V7 — AdSense Finish Batch 1 Release Report

**Datum:** 2026-09-11  
**Branch:** `adsense-finish/batch-1`  
**Navazuje na:** `RV_ADSENSE_BATCH1_METHOD_AUDIT_2026-09-11.md`  
**Rozsah:** 6 high-opportunity / high-value calculator pages

## VERDIKT

**CANDIDATE PASS — READY TO MERGE, následně povinný production health + PSI/Lighthouse check.**

Tento report neprohlašuje field Core Web Vitals za PASS před produkčním nasazením. Potvrzuje, že Batch 1 prošel correctness, identity, trust, accessibility a responsive browser gate na kandidátní branchi a je připraven k produkčnímu ověření.

## Uzavřené stránky

| URL | Method risk | Method verdict | Identity / trust | Responsive browser | Release decision |
| --- | --- | --- | --- | --- | --- |
| `procenta-kalkulacka.html` | M0 | PASS | PASS | PASS | KEEP + POLISH → SHIP |
| `kalkulacka-celkove-ceny-vlastnictvi-auta.html` | M2 | PASS | PASS | PASS | KEEP + POLISH → SHIP |
| `kalkulacka-hodinove-mzdy.html` | M1/M3 context | PASS po opravě interpretace minima | PASS | PASS | KEEP + POLISH → SHIP |
| `kalkulacka-dovolene.html` | M3 | PASS | PASS | PASS | KEEP + POLISH → SHIP |
| `kalkulacka-prescasu.html` | M3 | PASS po opravě hranice kratší pracovní doby | PASS | PASS | KEEP + POLISH → SHIP |
| `cestovni-nahrady-kalkulacka.html` | M3 | PASS po opravě 2denního § 163(4) scénáře | PASS | PASS | KEEP + POLISH → SHIP |

## Co bylo skutečně opraveno

### Cestovní náhrady
- Opraven dvoudenní scénář: u pracovní cesty zasahující přesně do dvou kalendářních dnů se porovná oddělené a společné posouzení stravného a použije se varianta výhodnější pro zaměstnance.
- Zachována změna vyhláškové ceny motorové nafty od 1. 6. 2026.
- Přidán deterministický regression dataset `cestovni-nahrady-2026-regression.csv`.

### Hodinová mzda
- Hranice 134,40 Kč/h už není prezentována jako univerzální hodinové minimum bez kontextu.
- UI výslovně uvádí, že jde o referenci pro stanovenou týdenní pracovní dobu 40 h; zákonně kratší stanovené režimy vyžadují přepočet.

### Přesčasy
- Odstraněna zavádějící zkratka „jen hodiny nad rozvrženou pracovní dobu“.
- U kratší pracovní doby je nyní explicitně uvedeno, že samotné překročení sjednaného kratšího úvazku není automaticky prací přesčas.

## V7 / V3.2 finish lock

Na všech šesti stránkách je kandidátně vynuceno:
- canonical V3.2 logo `/logo-rv-v32.svg?v=1`,
- inverse footer logo `/logo-rv-v32-inverse.svg?v=1`,
- V3.2 brand CSS / favicon,
- topic-specific V7 watermark / identity field,
- metodický status s datem kontroly,
- konkrétní disclaimer tam, kde jej riziko tématu vyžaduje,
- přímé primární zdroje u právně citlivých stránek, kde byly potřeba doplnit,
- Facebook + Instagram ve footeru jako přístupné 44×44 ikonové odkazy,
- žádné staré logo assety na target HTML,
- mobile-first zákaz velkého floating overlay.

Na mobilu se skrývají mezilehlé anchor/fact stripy mezi hero a primárním nástrojem, aby byl zachován produktový tok **hero → kalkulačka → výsledek → depth**. Obsahové sekce samotné se nemažou.

## Automated gates

Workflow: `.github/workflows/adsense-finish-batch1.yml`

Poslední plný PASS run:
- run id: `34598603043`
- syntax check: PASS
- deterministic method / identity verifier: PASS (`BATCH1_VERIFY_PASS`)
- structural accessibility lint: PASS všech 6 URL
- Playwright responsive/runtime QA: PASS
- browser cases: **36/36** (6 URL × 6 viewportů)
- viewporty: **1440 / 1280 / 1024 / 768 / 390 / 320**
- horizontal overflow: **0** ve všech případech
- runtime / console errors: **0**
- FB + IG: 2/2 na každé stránce
- canonical header + inverse footer logo: PASS
- watermark: PASS
- contextual trust block: PASS
- mobile interstitial gate: PASS
- large fixed mobile overlay gate: PASS
- default result smoke: PASS všech 6 nástrojů

Visual evidence artifact:
- `adsense-finish-batch1-browser`
- artifact id `10263107597`
- obsahuje desktop + mobile full-page screenshot každé stránky a `summary.json`.

## Default smoke výsledky

- Procenta: `30`
- TCO auta: `900 000 Kč`
- Hodinová mzda: `238,10 Kč/h`
- Dovolená: `160 h`
- Přesčasy: `1 800 Kč`
- Cestovní náhrady: `1 682 Kč`

## Co zůstává až po merge

Po produkčním deployi povinně:
1. ověřit HTTP/canonical/indexability a funkčnost live URL,
2. zkontrolovat produkční render na mobilu a desktopu,
3. spustit PageSpeed Insights / Lighthouse Mobile + Desktop,
4. neprohlásit field CWV za PASS bez dostupných field dat,
5. pokud nevznikne actionable performance / UX regrese, uzavřít Batch 1 v trackeru a pokračovat Batch 2 bez redesign smyčky.
