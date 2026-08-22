# 60 — VISUAL / RESPONSIVE

## Cíl
Ověřit, že technicky validní stránka je skutečně použitelná a vizuálně odpovídá RV standardu.

## Povinné viewporty pro významný release
- mobil přibližně 360–390 px;
- tablet přibližně 768 px;
- desktop 1280 px;
- desktop 1440 px.

## Kontrolovat
- horizontal overflow;
- kolize hero copy / ilustrace / CTA;
- useknuté controls, dropdowny, výsledky a tabulky;
- sticky prvky zakrývající obsah;
- focus/hover/active stavy;
- footer a social icons;
- čitelnost grafů a datových bloků;
- nepřirozené whitespace, osamocené prvky a rozpad gridu;
- vizuální konzistenci s `RV-VNEXT-EXPERIENCE-STANDARD-V2.md`;
- identity score podle `RV-VNEXT-IDENTITY-AUDIT-2026-08-21.md`, pokud ho profil vyžaduje.

## Screenshot pravidlo
U zásadní vizuální změny nestačí DOM inspection. Pořiď a zkontroluj screenshoty relevantních viewportů.

## Severity
Kolize/overflow bránící použití = P1. Významná hierarchická/brand degradace = P2. Kosmetika bez dopadu = P3.
