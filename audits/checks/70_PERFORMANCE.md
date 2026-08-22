# 70 — PERFORMANCE

## Cíl
Zabránit tomu, aby nový design nebo funkcionalita zhoršily rychlost a Core Web Vitals bez přidané hodnoty.

## Kontrolovat podle profilu
- Lighthouse/PageSpeed mobile + desktop u významných release;
- LCP/CLS/INP rizika;
- velikost a formát hero/OG/inline obrázků;
- blokující CSS/JS;
- zbytečné externí dependency;
- layout shift z obrázků bez rozměrů nebo pozdě renderovaných bloků;
- dlouhé main-thread tasky u interaktivních kalkulaček.

## Baseline princip
Pokud se mění pouze schema/meta bez render dopadu, plný performance rerun není povinný. Pokud se mění hero, CSS, JS nebo assety, performance gate je povinný podle release profilu.

## Severity
Výrazná regresní změna CWV/PSI proti baseline = P1/P2 podle rozsahu. Malý neblokující rozdíl = P3/INFO.
