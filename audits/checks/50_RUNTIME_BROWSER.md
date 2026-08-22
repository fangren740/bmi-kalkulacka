# 50 — RUNTIME BROWSER

## Cíl
Ověřit chyby, které statický scan nemůže spolehlivě zjistit.

## Povinné kontroly, pokud profil vyžaduje runtime
- načtení stránky v reálném Chromium/WebKit prostředí;
- JavaScript console errors;
- failed/blocked network requests;
- inicializace kalkulačky bez uncaught exception;
- změna hlavních vstupů skutečně aktualizuje výsledek;
- reset/presety/taby/choice controls fungují;
- hash/anchor navigace nevede do neexistujícího stavu;
- mobilní menu, pokud existuje, je funkční.

## Reprezentativní smoke při FULL_DEPLOY
Minimálně:
- homepage;
- katalog/hub;
- jedna finanční kalkulačka;
- jedna materiálová/stavební kalkulačka;
- jedna date/time utility;
- každá přímo změněná URL.

## Status
- `PASS` pouze pokud browser run skutečně proběhl;
- `NOT RUN` pokud prostředí browser blokuje nebo není dostupné;
- nikdy nepřevádět statický JS syntax PASS na runtime PASS.

## Severity
Uncaught error nebo nefunkční hlavní výpočet = P0/P1. Vedlejší interaction regression = P1/P2.
