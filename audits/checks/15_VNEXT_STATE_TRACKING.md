# 15 — V-NEXT STATE / TRACKING INTEGRITY

## Účel

Zabránit stavu, kdy je V-next kalkulačka reálně přestavěná v HTML, ale chybí v `RV_VNEXT_PROGRESS.json`, nebo naopak tracker tvrdí stav, který neodpovídá kódu.

## Povinný deterministický gate

```bash
python rv-vnext-progress-audit.py --root .
```

Gate je read-only. Musí proběhnout před `rv-vnext-a11y-lint.py --all-vnext` a před release ZIPem.

## Co kontroluje

- `RV_VNEXT_PROGRESS.json` existuje a je validní JSON;
- `completedPages`, `inProgressPages` a `currentCandidate` se nepřekrývají;
- dokončené záznamy mají explicitní, unikátní a souvislé `sequence`;
- povinná metadata (`status`, `majorChangeDate`, `qaStatus`, `archetype`, `researchVerifiedAt`, `benchmarkDataset`, `notes`) jsou přítomná;
- každý trackovaný HTML soubor existuje;
- každý trackovaný HTML soubor obsahuje technický marker a marker souhlasí s trackerem (`status`, `major`, `seq`);
- žádný HTML soubor s V-next signálem (`rv-vnext-page`, `rv-vnext-identity.css`, RV-VNEXT marker) není mimo tracker;
- `nextCandidate` není už současně trackovaný jako dokončený/rozpracovaný/current;
- `updatedAt` není starší než nejnovější `majorChangeDate`.

## Severity

- **P0** — tracker nelze načíst / základní struktura je nevalidní.
- **P1** — untracked V-next HTML, chybějící soubor, duplicita mezi stavovými bucketami, rozbitá sequence, chybějící nebo nesouhlasící marker, povinná metadata chybí.
- **P2/P3** — pouze doplňkové nekritické nekonzistence, pokud je scanner explicitně zavede.

Jakýkoli P0/P1 = release FAIL.

## Recovery rule

Pokud gate selže po přechodu mezi chaty nebo po ručním deployi:

1. source lock na nejnovější ZIP/repo snapshot;
2. skutečný kód má přednost před starým trackerem;
3. obnov přesné pořadí z build markerů / historie pouze jako forenzní pomůcku;
4. neopravuj produktový HTML obsah kvůli trackingu — povolen je technický komentář RV-VNEXT;
5. teprve po `TRACKING GATE: PASS` smí začít PRE-BUILD další kalkulačky.
