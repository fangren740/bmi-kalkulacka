# Tapety V2 — product and visual redesign

Date: 2026-09-09. Pattern D. Verdict: NOT READY — BLOCKED BY BROWSER / VISUAL QA.

## Scope
Changed only kalkulacka-tapet.html, tapety.css, tapety-page.js presentation; new V2 review/evidence. Core unchanged byte-for-byte. Existing independent vectors and test scripts unchanged. No shared asset, other calculator, P0 item or Gold pilot changed. No merge or deployment.

## Current main and design study
Source: main 1323be76b65b59dd55563b1985257658ba2181f0. Reviewed source HTML/CSS of cista-mzda-kalkulacka.html + cista-mzda-vnext.css, kalkulacka-sadrokartonu.html + sadrokarton-vnext.css, kalkulacka-omitky.html + omitka-vnext.css, index.html, rekonstrukce.html, rv-brand-v32.css and original logo. These are source references, not browser screenshots or a measured ranking of visual quality.
Recognizable grammar: navy typography, blue actions, green decision accent, tight large headings, quiet pale canvas, material-specific explanation, stronger result hierarchy, original logo and navy footer. Retained the useful result/physical-material connection of plaster and drywall and strong answer of salary. Did not copy their large heroes, tiny supporting type, decorative stamps, or persistent two-panel form/report layouts. Gold 1.0 and available 1.1 correctness delta applied as in V1; no invented new pattern.

## Product workflow
One continuous workspace. Desktop inputs arranged across the top, answer and roll visualization below. Four basic dimensions; one checkbox reveals pattern settings. Common height with optional per-wall exception. Trim summary exposes defaults and opens editable fields. Openings and full methodology disclosed on demand. Result gives rolls, strips, cut lengths, cut total and leftovers. Each proportional bar shows individual strips, striped alignment allowance/waste, green leftovers; exact cuts expand per roll. Beyond six rolls, the rest are grouped in another disclosure. Print action opens all result details and restores state after printing.

Core model unchanged: integer mm, whole-width strips per wall, trim added once, patterned lengths rounded to whole repeat; modular progressive offset, optional full-repeat starting allowance; first-fit wall-order placement; no optimality claim, no area subtraction for openings. Full derivation and independent expected values: MODEL_AND_EXPECTED.md.

## Red-team fixes made
- Rejected the original permanent form/report split; moved result below input.
- Removed first-use pattern controls and moved optional text into disclosures.
- Replaced thin unlabeled bars with proportional individually separated strips and IDs, common legend and visible per-roll totals. Small segments remain visible proportionally; exact values live in detail.
- Stopped large jobs becoming 500 expanded roll protocols: six roll previews, remainder collapsed, all cuts collapsed.
- Error-summary links now open ancestor disclosures before focusing their invalid field.
- Print opens hidden cuts; afterprint restores disclosure states.
- Reset closes form disclosures and restores default no-pattern example.
- Mobile navigation has a native Menu disclosure, independent desktop navigation; no tiny desktop link row.
- Removed workspace clipping to avoid clipping keyboard focus.

## QA gate
| Check | Status | Evidence / limit |
|---|---|---|
| Correctness | PASS | 30 fixtures, 12 parser cases, 120 physical invariant scenarios |
| Core preservation | PASS | Byte equality against V1 |
| JS syntax | PASS | node --check |
| HTML labels, IDs, references, schema, canonical | PASS | Static source checks only |
| 1440 desktop, 1366×768 notebook | NOT TESTED | No compatible authorized browser preview for this static project |
| 768 tablet, 390×844, 320×740 | NOT TESTED | No screenshots; source media queries are not visual evidence |
| 1024, keyboard, add/remove, mode changes, reset, correction | NOT TESTED | Browser interaction gate outstanding |
| Screen reader, zoom, computed contrast, print layout | NOT TESTED | Static semantics do not establish these |
| Performance | PARTIAL | Asset gzip estimate and core Node timing only; no LCP/CLS/INP or DOM timing |

Browser context: previous file navigation received explicit security rejection and was not retried or bypassed. Sites environment guidance allows supervised agent preview only for compatible development-server projects; this buildless static repository is not one. Inline preview is supplied for user inspection, not counted as browser QA. No production or alternate browser workaround was used.

## Self-critique / remaining weaknesses
1. Visual composition and 20–30 second shop scenario have not been observed with a real user/browser.
2. Mobile still needs scrolling before purchase result; density must be judged at 320×740, not inferred from CSS.
3. Common height exceptions are two actions deep; acceptable for the basic case, needs testing with uneven rooms.
4. First-fit can buy more rolls than another cutting order; explicitly a recommended plan.
5. Very small bar segments cannot carry readable labels; exact cuts require disclosure.
6. Print, focus scrolling and assistive announcements remain runtime risks until browser QA passes.

## Independent expected → actual (lengths in mm)
| Case | Expected | Actual | Status |
|---|---|---|---|
| T01 | `{"rolls": 2, "strips": 4, "lengths": [2580, 2580, 2580, 2580], "leftovers": [2260, 7420]}` | `{"state": "valid", "rolls": 2, "strips": 4, "lengths": [2580, 2580, 2580, 2580], "leftovers": [2260, 7420], "phases": [0, 0, 0, 0], "gaps": [0, 0, 0, 0], "repeatExtra": 0, "startAllowance": 0, "trimTotal": 320}` | PASS |
| T02 | `{"rolls": 1, "strips": 4, "lengths": [2500, 2500, 2500, 2500], "leftovers": [0]}` | `{"state": "valid", "rolls": 1, "strips": 4, "lengths": [2500, 2500, 2500, 2500], "leftovers": [0], "phases": [0, 0, 0, 0], "gaps": [0, 0, 0, 0], "repeatExtra": 0, "startAllowance": 0, "trimTotal": 0}` | PASS |
| T03 | `{"rolls": 2, "strips": 5, "leftovers": [0, 7500]}` | `{"state": "valid", "rolls": 2, "strips": 5, "lengths": [2500, 2500, 2500, 2500, 2500], "leftovers": [0, 7500], "phases": [0, 0, 0, 0, 0], "gaps": [0, 0, 0, 0, 0], "repeatExtra": 0, "startAllowance": 0, "trimTotal": 0}` | PASS |
| T04 | `{"rolls": 1, "strips": 3, "lengths": [3200, 3200, 3200], "leftovers": [400], "repeatExtra": 1860}` | `{"state": "valid", "rolls": 1, "strips": 3, "lengths": [3200, 3200, 3200], "leftovers": [400], "phases": [0, 0, 0], "gaps": [0, 0, 0], "repeatExtra": 1860, "startAllowance": 0, "trimTotal": 240}` | PASS |
| T05 | `{"rolls": 2, "strips": 4, "phases": [0, 320, 0, 320], "gaps": [0, 320, 0, 0], "leftovers": [80, 6800]}` | `{"state": "valid", "rolls": 2, "strips": 4, "lengths": [3200, 3200, 3200, 3200], "leftovers": [80, 6800], "phases": [0, 320, 0, 320], "gaps": [0, 320, 0, 0], "repeatExtra": 2480, "startAllowance": 0, "trimTotal": 320}` | PASS |
| T06 | `{"rolls": 2, "strips": 5, "lengths": [2500, 2500, 2500, 2000, 2000], "leftovers": [500, 8000]}` | `{"state": "valid", "rolls": 2, "strips": 5, "lengths": [2500, 2500, 2500, 2000, 2000], "leftovers": [500, 8000], "phases": [0, 0, 0, 0, 0], "gaps": [0, 0, 0, 0, 0], "repeatExtra": 0, "startAllowance": 0, "trimTotal": 0}` | PASS |
| T07 | `{"state": "unavailable"}` | `{"state": "unavailable"}` | PASS |
| T08 | `{"rolls": 1, "strips": 3, "lengths": [2551, 2551, 2551], "leftovers": [2397]}` | `{"state": "valid", "rolls": 1, "strips": 3, "lengths": [2551, 2551, 2551], "leftovers": [2397], "phases": [0, 0, 0], "gaps": [0, 0, 0], "repeatExtra": 0, "startAllowance": 0, "trimTotal": 150}` | PASS |
| T09 | `{"rolls": 1, "strips": 4, "lengths": [2500, 2500, 2500, 2500], "leftovers": [0], "trimTotal": 400}` | `{"state": "valid", "rolls": 1, "strips": 4, "lengths": [2500, 2500, 2500, 2500], "leftovers": [0], "phases": [0, 0, 0, 0], "gaps": [0, 0, 0, 0], "repeatExtra": 0, "startAllowance": 0, "trimTotal": 400}` | PASS |
| T10 | `{"rolls": 1, "strips": 4, "leftovers": [0]}` | `{"state": "valid", "rolls": 1, "strips": 4, "lengths": [2500, 2500, 2500, 2500], "leftovers": [0], "phases": [0, 0, 0, 0], "gaps": [0, 0, 0, 0], "repeatExtra": 0, "startAllowance": 0, "trimTotal": 0}` | PASS |

## Asset evidence

| Asset | Bytes | gzip bytes |
|---|---:|---:|
| kalkulacka-tapet.html | 16525 | 5787 |
| tapety.css | 15922 | 4049 |
| tapety-core.js | 7832 | 2942 |
| tapety-page.js | 16460 | 5747 |

No framework, font download, extra network request, or third-party library added. Inline preview embeds unchanged brand assets. Gzip figures are estimates, not HTTP measurements.
