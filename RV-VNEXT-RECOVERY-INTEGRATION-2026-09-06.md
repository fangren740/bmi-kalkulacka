# RychléVýpočty.cz V7 — APPROVED RECOVERY INTEGRATION

**Date:** 2026-09-06  
**Branch:** `recovery-approved-75-93-2026-09-06`  
**Base:** `main`  
**Status:** STAGING / PRE-MERGE  

## Purpose

This branch is the controlled integration gate for user-reviewed recovery builds. It exists to avoid a sequence of independent production deploys while preserving the rule that no local preview is promoted blindly.

## Approved recovery pages in this batch

| Seq | Production file | Approved recovery direction |
|---:|---|---|
| 75 | `kalkulacka-hrube-mzdy-z-ciste.html` | target gross-from-net salary / parity recovery |
| 76 | `naklady-zamestnavatele-kalkulacka.html` | position-cost / employer budget ledger |
| 77 | `dpp-dpc-kalkulacka.html` | DPP/DPČ dual-lane threshold crossing |
| 78 | `nemocenska-kalkulacka.html` | employer-to-state sickness handoff timeline |
| 79 | `ocr-kalkulacka.html` | 9/16-day care calendar |
| 80 | `materska-kalkulacka.html` | PPM income horizon / handoff |
| 81 | `rodicovsky-prispevek-kalkulacka.html` | parental-benefit payout calendar |
| 82 | `vyzivne-kalkulacka.html` | two-household / child-cost balance |
| 83 | `podpora-v-nezamestnanosti-kalkulacka.html` | month-by-month 80→50→40 support staircase |
| 84 | `duchodovy-vek-kalkulacka.html` | retirement passport / exact calendar milestone + FAQ |
| 89 | `kolik-stoji-prvni-rok-ditete-kalkulacka.html` | 12-month family lifecycle ledger |
| 90 | `kolik-me-stoji-pleny-kalkulacka.html` | procurement shelf / whole-package logistics |
| 91 | `kolik-stoji-umele-mleko-kalkulacka.html` | pantry depletion / purchase cadence |
| 92 | `pribirani-v-tehotenstvi-kalkulacka.html` | Trend Compass / 40-week contour |
| 93 | `cena-za-km-kalkulacka.html` | 1 KM cost anatomy |

## Explicitly not rebuilt in this batch

- #85–#88 are already cleared by the recovery audit / later user review.
- #94 `amortizace-auta-kalkulacka.html` is already approved as the Value Loss & Exit Guard version.
- No new sequence (#95+) starts before this recovery batch is integrated and production-gated.

## Productionization gate applied before staging

For every page in the batch:

- preview/internal title wording removed;
- canonical URL added/verified;
- `robots=index,follow,max-image-preview:large`;
- production title + description;
- Open Graph + Twitter metadata;
- canonical RV favicon/manifest references;
- BreadcrumbList + WebApplication structured data;
- FAQPage structured data only where matching visible FAQ exists;
- canonical `logo-rv-v32.svg?v=1` and inverse footer logo retained;
- no `.rvx-brand-stamp` / RV sticker box;
- no raw local-preview marker in customer UI.

## Local pre-merge QA

**Static / script:** PASS for all 15 pages.

- duplicate IDs: 0
- JS syntax errors: 0
- canonical missing/mismatched: 0
- preview wording in page title/body: 0

**Browser render gate:** 30/30 PASS (`1440px` + `390px` for every page).

- horizontal overflow: 0
- clipped visible input/select/button controls: 0
- runtime/page errors: 0

Calculator-specific regression benchmarks were already passed during each page's user-review build. Production integration must not alter their calculation functions.

## Merge / release gate

Before merge to `main`:

1. review final branch diff for all 15 production paths;
2. verify no accidental edits to #85–#88 or #94;
3. rerun representative desktop/mobile interaction scenarios;
4. verify customer copy + FAQ/schema parity;
5. merge once, not page-by-page.

After deployment to production:

1. HTTP/canonical/smoke check on every changed URL;
2. production console + interaction spot-check;
3. **PageSpeed Insights gate** on representative heavy/simple pages and any page that regresses;
4. Core Web Vitals / accessibility / SEO review;
5. mark integration complete only after production gate.

## Quality calibration lock

- #74 remains minimum product/UX quality floor.
- S-tier originality calibration uses the strongest real pages from #10–#35, especially #13, #15, #19, #21, #23 and #25.
- Stable macro journey is allowed; repeated visual grammar is not.
- Topic-native object, result grammar and post-result choreography must remain page-specific.
- FAQ is checked explicitly where natural same-intent follow-up questions exist.
- PageSpeed is a production release gate, not a substitute for local render QA.
