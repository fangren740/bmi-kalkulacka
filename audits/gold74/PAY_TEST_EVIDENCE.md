# #74 PAY test evidence

Candidate: `gold/74-cista-mzda-2026-09-08`
Pattern: B — Vysvětlený výpočet
Gold target: 1.1
Base main: `1323be76b65b59dd55563b1985257658ba2181f0`

## Mandatory numeric regression
- PAY-01–PAY-32: **32/32 PASS**, tolerance **0 Kč**.
- Calculation constants and payroll calculation core were intentionally unchanged by the candidate.
- PAY-12 / PAY-S01 boundary `45 000,49` returns **35 583 Kč**.

## Interaction / state acceptance
- PAY-I01–PAY-I05: **PASS** — invalid `0`, `-1`, empty, `abc`, and `100000001` invalidate the current result; stale net/hero/flow/scenario values are not presented as current.
- valid → invalid → correction: **PASS**.
- PAY-S01: **PASS** — `45 000,49` remains the canonical input through live input, blur and submit and keeps the same result **35 583 Kč**.
- More than two decimal places: **PASS (explicit validation)**; input is rejected instead of silently rounded.
- Reset / Enter / label association / first-use CTA focus: **PASS**.

## Responsive / browser evidence
GitHub Actions candidate browser run: `34233206624` — **PASS**.
- 320×740: PASS, no horizontal overflow / clipped controls / page errors
- 390×844: PASS, no horizontal overflow / clipped controls / page errors
- 768×900: PASS, no horizontal overflow / clipped controls / page errors
- 1024×900: PASS, no horizontal overflow / clipped controls / page errors
- 1366×768: PASS, no horizontal overflow / clipped controls / page errors
- 1440×900: PASS, no horizontal overflow / clipped controls / page errors

Lighthouse 13.4.1 candidate run:
- mobile accessibility: **100**
- mobile best practices: **100**
- desktop accessibility: **100**
- desktop best practices: **100**

RV Predeploy Audit run `34233206696`: **PASS**.

## Explicit NOT VERIFIED / NOT TESTED boundaries
- Health-minimum supplement with fractional-crown assessment remains **NOT VERIFIED** for the exact legal crown split. Candidate returns `unavailable` instead of asserting a result.
- Actual browser 200% zoom/reflow: **NOT TESTED** (headless viewport testing is not claimed as equivalent to browser zoom).
- Production deployment / live health: **NOT TESTED** because candidate is intentionally not merged to `main` before user visual approval.
- User visual gate: **PENDING**.

This evidence file is not by itself a GOLD PASS declaration. Final Gold status requires the remaining methodological/diff review, user visual gate and production release evidence.
