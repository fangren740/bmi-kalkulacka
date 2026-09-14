# RychléVýpočty.cz V7 — Měsíční mzda Gold V4 release report

Datum: 14. 9. 2026
Cílová URL: `mesicni-mzda-z-hodinove-sazby-kalkulacka.html`
Verdikt před merge: PASS / USER APPROVED / SUPERIOR

## User approval

Uživatel schválil interaktivní Gold V4 live preview a požádal o finální kontrolu a nasazení.

## Preview → production parity

Produkční kandidát byl rekonstruován z přesně schválených HTML/CSS/JS dat. Rekonstrukční workflow ověřilo přesné SHA-256:

- HTML: `7f55e995ad52f6e20211696128a510a02786bf1bbc67a413f69fe73cc8ed6e7a`
- CSS: `802a230e65aec2f72d0cf040fa12ebd8d3b1dafd10688975a99d97054d7cb971`
- JS: `f05ee0e8333c87f752608cc6288b8a6715d20430ef026bd2188b581badc2eef9`

Reconstruction workflow run `34849387511`: SUCCESS.

## Static / structural QA

PASS:
- JavaScript syntax (`node --check`)
- exactly one H1
- no duplicate IDs
- canonical V3.2 header logo
- inverse V3.2 footer logo
- Facebook + Instagram
- required depth sections: methodology, paid hours, working-regime distinction, job-offer comparison, six-question checklist
- no legacy `logo-rychlevypocty.svg`

## Correctness / methodology

PASS:
- average monthly hours: `weeklyHours × 52 ÷ 12`
- base gross pay: hourly rate × paid base hours
- advanced overtime keeps base pay and premium separate
- invalid input clears stale result
- specific month and average-month modes remain distinct
- 2026 minimum hourly context is separated from individual part-time hours
- page-specific limitations/disclaimer present
- current primary MPSV / Labour Code sources linked in methodology

## No-regression review

Verdict: `SUPERIOR`.

Candidate preserves or improves the useful live-version topics while materially improving product craft, topic-native visual language, result interpretation, progressive disclosure and post-result decision aids.

## Production gate still required after merge

Release is not DONE until:
- GitHub Pages deployment succeeds
- RV Predeploy Audit passes
- RV Live Health passes
- production URL contains the approved Gold V4 build
- available Lighthouse/PageSpeed checks show no actionable regression

Field CWV is not claimed because project CrUX/GSC CWV integration is not configured.
