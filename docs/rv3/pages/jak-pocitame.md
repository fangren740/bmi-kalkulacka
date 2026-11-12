# RV3 Page Studio — Jak počítáme — viditelná metodika
**URL:** `/jak-pocitame.html` · **stav:** SOURCE REVIEW + INDIVIDUAL BRIEF, **ne** hotový redesign · **12. 11. 2026**

## Přečtený současný obsah
- Title `Jak počítáme | RychléVýpočty.cz`, H1 `Jak počítáme`.
- Obsah rozlišuje označení výsledku, platné období, data a benchmark CSV, hraniční příklady i opakovanou kontrolu.

## Individuální produktový koncept
- Udělat z metodiky **klikací, ověřitelný postup**: 1. zdroj a období 2. vstupy a vzorec 3. několik testovacích scénářů 4. výsledek s omezeními 5. oprava a aktualizace.
- Vizualizovat jeden **opravdu doložený** výpočet (bez smyšlených testů); propojit na konkrétní kalkulačku a správný typ zdrojů.
- Označení výsledků vysvětlit lidskou řečí, ne SEO tapetu. Přehled kontrolních případů a jak nahlásit chybu.
- Aktualizační proces popsat pouze v rozsahu, který skutečně běží; není-li automatický review proces, nevymýšlet.

## QA a release
- Ověřit každý odkaz na CSV/metodiku/zdroj; strukturovaná data jen pokud pravdivá, canonical zachovat; noindex pouze preview.
- Čitelnost v 390 px, přístupnost schématu a textové alternativy, Lighthouse/performance.


## Stage checklist
- [x] Předběžná analýza skutečného HTML v GitHubu
- [x] Účel a individuální návrhový brief
- [ ] Ověřené SEO/GSC/baseline metadata a aktuální primární zdroje
- [ ] Design na 390 / 1440 px + interakce
- [ ] Implementovaný izolovaný preview
- [ ] Node/integrita/číselné regresní testy
- [ ] Skutečné browser screenshoty a Lighthouse
- [ ] Vizuální a věcné schválení vlastníkem
- [ ] Produkční release s výslovným souhlasem
