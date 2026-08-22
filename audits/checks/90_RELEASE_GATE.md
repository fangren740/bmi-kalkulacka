# 90 — RELEASE GATE

## Cíl
Každý audit uzavřít stejně, bez interpretace podle nálady nebo chatu.

## Povinný výstup

```text
PROFILE: HOTFIX / CALCULATOR_RELEASE / LEADER_PAGE_RELEASE / FULL_DEPLOY / PERIODIC_HEALTHCHECK
SOURCE: <zip / branch / commit>
SCOPE: <stručně>
P0: n
P1: n
P2: n
P3: n
STATIC GATE: PASS / FAIL / NOT RUN
RUNTIME GATE: PASS / FAIL / NOT RUN / NOT REQUIRED
VISUAL GATE: PASS / FAIL / NOT RUN / NOT REQUIRED
PERFORMANCE GATE: PASS / FAIL / NOT RUN / NOT REQUIRED
CONTENT/METHOD GATE: PASS / FAIL / NOT RUN / NOT REQUIRED
LIVE GATE: PASS / FAIL / NOT DEPLOYED / NOT REQUIRED
VERDICT: RELEASE / RELEASE WITH KNOWN P3 / BLOCKED
CHANGED FILES: <přesný seznam>
RESIDUAL RISKS: <žádné nebo konkrétní>
```

## Rozhodovací pravidla
- jakýkoli P0/P1 => `BLOCKED`, pokud není explicitní platná výjimka;
- povinný gate profilu `FAIL` => `BLOCKED`;
- povinný gate `NOT RUN` => `BLOCKED`, pokud profil výslovně nepovoluje odklad;
- pouze známé P3 => lze `RELEASE WITH KNOWN P3`;
- `PASS` nikdy neznamená „kontrolu jsme nepotřebovali“; použij `NOT REQUIRED`.

## Patch hygiene
Release report musí vždy uvést přesný seznam změněných souborů. U hotfixu musí být vysvětleno, proč byl každý soubor změněn.
