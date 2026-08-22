# 80 — CONTENT / METHOD / TRUST

## Cíl
U nových a zásadně přestavěných kalkulaček ověřit, že správný kód neprezentuje chybnou, neověřenou nebo nedostatečně vysvětlenou metodiku.

## Povinné zdroje pravidel
- `RV-VNEXT-PRODUCTION-STANDARD.md`
- `RV-VNEXT-EXPERIENCE-STANDARD-V2.md`
- aktuální právní/finanční/technické primární zdroje podle tématu

## Kontrolovat
- primary intent a plain-language gate;
- matematiku/vzorce/edge cases;
- jednotky, zaokrouhlení a vstupní rozsahy;
- datum a rozsah metodiky;
- benchmark/data provenance;
- disclaimer u finančních, daňových, právních, zdravotních nebo jinak citlivých výsledků;
- worked example a interpretaci výsledku;
- rozdíl mezi odhadem/modelovým scénářem a tvrzeným faktem;
- content coverage matrix podle produkčního standardu.

## Root-cause pravidlo
Pokud se opravuje metodická chyba, zkontroluj stejné konstanty/vzorce/zdroje na všech stránkách, které je používají.

## Severity
Chybný hlavní výpočet nebo zavádějící citlivý výsledek = P0/P1. Nejasná metodická hranice = P2. Chybějící podpůrná nuance = P3.
