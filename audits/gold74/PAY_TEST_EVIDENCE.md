# #74 PAY test evidence

Candidate: `gold/74-cista-mzda-2026-09-08`

## Mandatory numeric regression
- PAY-01–PAY-32: expected 32/32 PASS, tolerance 0 Kč. Calculation constants/core intentionally unchanged by candidate.

## Interaction / state acceptance
- PAY-I01–PAY-I05: old result must be invalidated for invalid gross input and restored only after correction.
- PAY-S01: `45 000,49` must keep the same canonical value through input, blur and submit; no silent integer rounding.

## Explicit NOT VERIFIED boundary
- Health-minimum supplement with fractional-crown assessment remains outside verified legal-rounding scope. Candidate returns an unavailable state instead of asserting a result.

This evidence file is not a PASS declaration. Browser, responsive, a11y, SEO, performance, diff review and user visual gate remain required.
