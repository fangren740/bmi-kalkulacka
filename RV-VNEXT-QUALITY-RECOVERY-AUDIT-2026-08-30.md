# RychléVýpočty.cz V7 — V-next Quality Recovery Audit

**Audit date:** 2026-08-30  
**Scope:** V-next sequences #1–#94, with #11–#25 used as the golden calibration wave.  
**Purpose:** identify real product/visual quality regression without confusing technical QA, page length or the existence of a named archetype with actual page-level originality.

## Executive result

The user-reported quality drift is real, but it is **more concentrated than the first static triage suggested**.

- **CONFIRMED REPAIR:** 14 pages
- **Primary repair cluster A:** #75–#83 (9 pages)
- **Primary repair cluster B:** #89–#93 (5 pages)
- Pages previously suspected only because of static/template signals — including #27, #38, #53, #59 and #71 — were manually reopened in source and are **not placed in REPAIR**. They contain materially topic-native product objects and flows.
- #94 is excluded from repair: it went through a separate recovery loop, was visually approved and released after the quality problem had already surfaced.

The core defect is not weak arithmetic or missing content. It is **page-level composition reuse**: repeated hero structure, repeated calculator/result split and repeated lower-page rhythm wrapping otherwise decent topic-specific logic.

## Golden calibration: what #11–#25 did better

The golden wave repeatedly changed the visual/product grammar to match the user job, not just the name of a right-hand card:

- #11 Floor Order Architect — procurement / pack-and-roll logic
- #12 Thermal Layer Blueprint — physical insulation layers
- #13 Drywall Material Desk / Order Ticket — material takeoff and ordering
- #14 Foundation Block Course Planner — whole masonry courses
- #15 Plaster Finish Studio — thickness / bag planning
- #16 House Budget Atlas — architectural plan / budget map
- #17 Kitchen Budget Counter
- #18 Bathroom Price Mirror
- #19 Renovation X-Ray
- #20 Material Measure Board
- #21 Receipt Split — invoice / receipt arithmetic
- #22 Price Stack — margin vs markup
- #23 Break-even Crossing — zero-line
- #24 Billable Time Calendar
- #25 Invoice Runway

The important property is not visual complexity. It is that **the calculator, result and post-result sections continue the same topic-native metaphor introduced in the hero**.

## CONFIRMED REPAIR — cluster A: sequence #75–#83

These nine pages contain generally solid engines and methodology, but as a sequence they reuse the same page-level skeleton too aggressively:

`copy left + topic card right → CTA/trust → calculator heading/mode → form left + result right → repeated information blocks`

A different label such as Ladder, Stack, Relay, Window, Bridge or Runway does not by itself create a different product grammar when the surrounding composition stays the same.

| Seq | File | Current archetype | Recovery direction |
|---:|---|---|---|
| 75 | `kalkulacka-hrube-mzdy-z-ciste.html` | Net Target Resolver & Salary Ladder | Make the salary ladder / target solver the actual page structure; reduce generic form-result framing. |
| 76 | `naklady-zamestnavatele-kalkulacka.html` | Employment Cost Stack & Budget Rail | Recompose around an employment-cost ledger / company budget sheet rather than another hero card + result card. |
| 77 | `dpp-dpc-kalkulacka.html` | Agreement Threshold Map & Net Reward Rail | Turn DPP/DPČ thresholds into a true dual-lane threshold product with visible crossing behavior. |
| 78 | `nemocenska-kalkulacka.html` | Sickness Pay Relay & Day-Band Timeline | Build the experience around the 1–14 / 15+ handoff timeline; the relay must be the main canvas, not a proof card. |
| 79 | `ocr-kalkulacka.html` | Care Window & Benefit Envelope | Make the 9/16-day care window a calendar-native interaction and result surface. |
| 80 | `materska-kalkulacka.html` | PPM Income Bridge & Family Handoff | Use the 28/37-week income bridge and handoff date as the dominant page grammar. |
| 81 | `rodicovsky-prispevek-kalkulacka.html` | Parental Allowance Runway & Family Budget Dial | Recompose as a drawdown pool / month-by-month runway rather than the shared family-page shell. |
| 82 | `vyzivne-kalkulacka.html` | Family Balance & Care Split | Make care/income balance a genuine two-parent balance or split-flow interaction; preserve strong disclaimers and method. |
| 83 | `podpora-v-nezamestnanosti-kalkulacka.html` | Financial Runway & Support Step-Down | Promote the month-by-month 80→50→40 runway to the primary full-width result and decision surface. |

**Repair type:** mostly **DESIGN / PRODUCT RECOMPOSITION**, not calculation rewrite. Keep verified legal parameters, datasets and calculation engines unless a separate method audit finds a defect.

## CONFIRMED REPAIR — cluster B: sequence #89–#93

This cluster has stronger topic-specific objects than cluster A, but the surrounding shell became visibly repetitive. The source repeatedly returns to the same pale hero, large left H1, CTA/trust row, floating white proof surface, two-column form/result workspace and similar section styling.

| Seq | File | Current archetype | Recovery direction |
|---:|---|---|---|
| 89 | `kolik-stoji-prvni-rok-ditete-kalkulacka.html` | 12-Month Baby Cash-Flow Planner | Make the 12-month cash-flow calendar / lifecycle ledger the page itself, not a proof panel beside copy. |
| 90 | `kolik-me-stoji-pleny-kalkulacka.html` | Pack Runway | Recompose as a procurement shelf / order ticket with whole-pack logistics as the dominant interaction. |
| 91 | `kolik-stoji-umele-mleko-kalkulacka.html` | Tin Runway | Must stop being the visual twin of #90; use pantry/tin depletion and purchase cadence as a different product grammar. |
| 92 | `pribirani-v-tehotenstvi-kalkulacka.html` | Trend Compass | Keep the medically cautious model, but make the week/BMI trend compass the main experience rather than another proof-card + dark-result shell. |
| 93 | `cena-za-km-kalkulacka.html` | Route Cost Stack | Replace the repeated route-card shell with the stronger **1 KM / cost anatomy** direction already prototyped locally; keep this URL and sequence #93. |

#90 and #91 are the clearest clone pair: the two source files share the same macro structure and differ mainly in the physical pack/tin object and labels. Under the new Page-level Originality Gate this pairing is a retroactive FAIL.

## Pages explicitly cleared from the first over-broad triage

The following pages were reopened in actual source and are **not REPAIR candidates on current evidence**:

- #27 `osvc-danova-kalkulacka.html` — real annual tax/social/health statement and tax-ledger flow.
- #38 `kalkulacka-provize.html` — real Commission Ladder with progressive vs retroactive semantics.
- #53 `nabijeni-elektromobilu-kalkulacka.html` — battery session board, SoC window and station→vehicle power path.
- #59 `pracovni-dny-kalkulacka.html` — Workday Board, week strip, holiday logic and three distinct calendar jobs.
- #71 `kalkulacka-slozeneho-uroku.html` — Growth Stack, own-money vs growth split and time-based growth model.
- #74 `cista-mzda-kalkulacka.html` — full-width Payroll Rail breaks the later #75–#83 hero-card pattern.
- #85 `exekucni-srazky-kalkulacka.html` — Paycheck Safe-Zone / salary split remains topic-native and was user-approved.
- #86 `zivotni-minimum-kalkulacka.html` — October change lanes and household composition are native to the job.
- #87 `superdavka-kalkulacka.html` — four-component Benefit Stack is a real product object, not only a renamed KPI card.
- #88 `kolik-me-stoji-dite-kalkulacka.html` — Family Cost Fingerprint / Lifecycle Runway passed the later user review.
- #94 `amortizace-auta-kalkulacka.html` — rebuilt after the drift was explicitly called out; approved Value Loss & Exit Guard version.

This does not mean these pages can never be improved. It means **there is no evidence strong enough to justify a recovery rebuild now**.

## Recovery lock for work after #94

1. **No new V-next production release** may bypass `RV-VNEXT-QUALITY-RECOVERY-2026-08-30.md`.
2. The locally approved-looking `spotreba-paliva-kalkulacka.html` candidate created after #94 must be re-reviewed against the golden wave before release. The user's later global feedback about copy-like composition invalidates any automatic assumption that the prior “fajn, dále” is sufficient for production.
3. The local page called “#96 cena za km” is **not a new sequence**. `cena-za-km-kalkulacka.html` is already #93 DONE. That local concept may be used only as a **#93 recovery redesign**.
4. New sequence numbering resumes only after checking `RV_VNEXT_PROGRESS.json` and URL uniqueness.
5. During recovery, calculations and verified source logic are preserved unless an independent method defect is found. The target is quality recovery, not gratuitous churn.

## Repair priority

### Wave R1 — most visible clone risk
1. #90 / #91 together — break the direct twin relationship.
2. #75 / #76 / #77 — break the payroll-family shell before touching the rest of the employment cluster.
3. #89 / #92 / #93 — recompose the late consumer/auto wave using their native timeline/trend/1-km objects.

### Wave R2 — complete the employment/family cluster
4. #78 / #79 / #80 / #81 / #82 / #83.

The order is chosen by **clone risk and expected quality gain**, not sequence number alone.

## Definition of recovery PASS

A repaired page is not complete until all are true:

- primary calculation/method remains verified,
- page-level originality passes against #11–#25 and the last 4 completed/repaired pages,
- hero, calculator, result and post-result grammar are documented before build,
- at least 2 topic-native product moments exist outside hero,
- at least 1 major composition is not a card grid,
- 1440 desktop and 390 mobile screenshots are visually reviewed before user preview,
- 0 horizontal overflow, 0 runtime/page errors, 0 duplicate IDs,
- user preview is not a broken or intermediate state.

## Bottom line

**Confirmed weak/recovery-required pages after sequences #1–#94: 14.**

This is approximately **15% of the upgraded portfolio**. The defect is concentrated enough to repair systematically without reopening the entire V-next program, but large enough that continuing with the old shell would compound the problem.