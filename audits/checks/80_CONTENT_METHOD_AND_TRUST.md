# 80 — CONTENT / METHOD / TRUST

## Cíl
U každé indexovatelné kalkulačky ověřit, že správný kód neprezentuje chybnou, neověřenou nebo nedostatečně vysvětlenou metodiku.

## Povinné zdroje pravidel
- `RV_METHOD_SOURCE_DISCLAIMER_LOCK_2026-09-11.md` — **release-blocking**
- `RV_CONTENT_DEPTH_AND_IDENTITY_LOCK_2026-09-11.md`
- `RV-VNEXT-PRODUCTION-STANDARD.md`
- `RV-VNEXT-EXPERIENCE-STANDARD-V2.md`
- aktuální primární / autoritativní zdroje podle tématu

## Povinný výstup auditu
Každá stránka musí dostat:

- `methodRiskClass`: M0 / M1 / M2 / M3 / M4,
- `methodVerdict`: PASS / FIX / BLOCK,
- `methodVerifiedAt`, pokud byla metodika skutečně ověřena,
- hlavní primární zdroje,
- seznam proměnlivých sazeb/limitů a jejich roku,
- hlavní vzorec / decision logic,
- rounding policy,
- relevantní boundary/edge cases,
- disclaimer verdict: REQUIRED / NOT REQUIRED + důvod,
- známé hranice modelu,
- reverify trigger.

**Pouhá existence sekce „Metodika“ není PASS.**

## Kontrolovat
- primary intent a plain-language gate;
- matematiku/vzorce/edge cases;
- jednotky, zaokrouhlení a vstupní rozsahy;
- zda text metodiky odpovídá tomu, co kód skutečně počítá;
- datum a rozsah metodické kontroly;
- aktuálnost proměnlivých sazeb/limitů;
- benchmark/data provenance;
- rozdíl mezi faktem, uživatelským předpokladem a modelem RV;
- page-specific disclaimer u citlivých výsledků;
- worked example a interpretaci výsledku;
- content coverage podle depth/identity locku.

## Disclaimer pravidlo
Disclaimer není univerzální footer věta.

- U M3 a M4 je standardně povinný.
- U M2 je povinný, pokud by model mohl být zaměněn za individuální nabídku, ocenění, investiční/finanční doporučení nebo garanci.
- U M0 je typicky zbytečný.
- U M1 podle konkrétního rizika.

Musí být stručný, konkrétní k riziku a viditelný v kontextu výsledku/metodiky.

## Root-cause pravidlo
Pokud se opravuje metodická chyba, zkontroluj stejné konstanty/vzorce/zdroje na všech stránkách, které je používají. Izolovaný hotfix bez portfolio sweepu je nedostatečný.

## Severity
- **P0:** chybný hlavní výpočet, chybný zákonný parametr, zavádějící health/financial claim.
- **P1:** významná chybějící výjimka nebo disclaimer, která může změnit rozhodnutí uživatele.
- **P2:** metodika je správná, ale nedostatečně vysvětlená / chybí významná podpůrná nuance.
- **P3:** copy/presentation polish bez dopadu na správnost.

## Release gate
Stránka M2–M4 nemůže být `DONE`, pokud je `methodVerdict != PASS`.
