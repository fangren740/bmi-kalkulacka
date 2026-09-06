# RychléVýpočty.cz V7 — V-next Recovery Closure — 2026-09-06

## Decision

**RECOVERY WAVE CLOSED.** The 15-page recovery scope (#75–#84 and #89–#93) is accepted on live production. This closure is a QA/status decision; it does not reset MAJOR HOLD dates.

Production fix commit: `a0f67159c8ba624cc3a577b1dbce03d349cecff1`.

## Production evidence

Two independent live Lighthouse matrices were run after deployment, each covering **15 URLs × mobile/desktop = 30 rows**:

- primary post-fix run: `34056090232`
- independent repeat: `34056090152`

Both post-fix matrices returned **Accessibility 100, Best Practices 100 and SEO 100 on every tested row**.

### Aggregate before → post-fix primary

| Metric | Before | Post-fix primary |
|---|---:|---:|
| Mobile Performance avg | 93.9 | 95.3 |
| Desktop Performance avg | 99.3 | 99.9 |
| Accessibility floor | 96 | 100 |
| Best Practices floor | 96 | 100 |
| SEO floor | 100 | 100 |
| Mobile LCP avg | 2180 ms | 2133 ms |
| Mobile TBT avg | 141 ms | 93 ms |

## Confirmed recovery wins

- **#83 Podpora v nezaměstnanosti:** mobile Performance **82 → 96** in the primary post-fix run and **97** in the repeat; TBT **643 → 120 → 0 ms**.
- **#92 Přibírání v těhotenství:** mobile Performance **75 → 95** in the primary post-fix run and **89** in the repeat; TBT **813 → 96 / 339 ms**. The repeat confirms meaningful improvement but also material lab variance.
- Common contrast defects were removed across the recovery set: Accessibility moved from a uniform 96 baseline to 100 everywhere.
- #75 mobile Best Practices defect was removed; Best Practices is now 100 across both post-fix matrices.

## Performance variance / #84 exception

#84 `duchodovy-vek-kalkulacka.html` produced mobile scores **86 and 85** in the two production runs. The primary audit attributed roughly **437 ms of 440 ms TBT** to the Cloudflare Web Analytics beacon. The repeat showed mixed page/runner and Cloudflare long-task variance.

This is recorded as an **edge / third-party / runner variance exception**, not as a reason for another visual or product rebuild. The page remains DONE because there is no known calculation, interaction, responsive or accessibility defect. Re-open performance work only if repeated controlled tests or production field CWV reveal a persistent actionable regression.

#93 also demonstrated the same lab-noise class: mobile **88 vs 98** on the same deployed production, with Cloudflare blocking around **234 ms vs 0 ms**.

## Closure rule

`PREVIEW PASS` was not treated as DONE. Closure happened only after production deployment, live smoke verification and production Lighthouse evidence.

No further recovery redesign wave is open. Next work returns to **HOLD / measurement / growth prioritization** under the existing 14/28-day major-change protection rules.
