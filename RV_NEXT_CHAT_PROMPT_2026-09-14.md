# RychléVýpočty.cz V7 — prompt pro nový navazující chat

Použij následující prompt jako start dalšího chatu po dokončení Gold upgradu kalkulačky měsíční mzdy z hodinové sazby.

---

Navazujeme na projekt **RychléVýpočty.cz V7** v repository:

`fangren740/bmi-kalkulacka`

Branch `main` je vždy source of truth.

Nejdřív načti aktuální `READ_ME_FIRST_RV_VNEXT_2026-09-06.txt` a celý povinný prompt stack. Zejména dodržuj:

- `RV_QUALITY_CALIBRATION_LOCK_2026-09-14.md`
- `RV_LIVE_PREVIEW_LOCK_2026-09-11.md`
- `RV_NO_REGRESSION_RELEASE_LOCK_2026-09-14.md`
- `RV_CONTENT_DEPTH_AND_IDENTITY_LOCK_2026-09-11.md`
- `RV_METHOD_SOURCE_DISCLAIMER_LOCK_2026-09-11.md`
- `RV_ADSENSE_FINISH_MODE_2026-09-11.md`
- `RV_ADSENSE_FINISH_QUEUE_2026-09-11.md`

## Způsob práce

Pracujeme **striktně jednu kalkulačku po druhé. Žádné batche.**

Před každým buildem:

1. otevři aktuální produkční verzi stejné URL a projdi ji jako skutečný uživatel na desktopu i mobilu;
2. explicitně zaznamenej, co live verze už dělá dobře a co se nesmí ztratit;
3. kalibruj kvalitu minimálně proti:
   - `cista-mzda-kalkulacka.html` (#74),
   - dvěma relevantním S-tier referencím,
   - poslednímu schválenému Gold upgradu `mesicni-mzda-z-hodinove-sazby-kalkulacka.html`;
4. proveď method-risk audit a ověř aktuální primární zdroje tam, kde je to potřeba.

## HARD RULE — žádné slabé iterace do user review

Uživatel není beta tester.

Neposílej první funkční variantu, checklistový redesign ani generický template jen proto, že je technicky správný. Slabé pokusy oprav interně.

Kandidát musí působit jako skutečný **RychléVýpočty V7 produkt**:

- topic-native hero objekt / visual field;
- hero → tool bez zbytečných mezibloků;
- jednoduchý first use;
- progressive disclosure sekundárních vstupů;
- dominantní a interpretovaný výsledek;
- unikátní result grammar podle tématu;
- smysluplná datavizualizace / decision aid / scénář, pokud téma dovoluje;
- kvalitní obsah pod výsledkem podle skutečné hloubky tématu;
- canonical V3.2 logo, inverse footer logo, plný footer, FB/IG;
- žádný generic SaaS dashboard, admin panel, cards-everywhere vzhled, technický report ani mikropísmo.

## NO REGRESSION

Nová verze nesmí být v žádném důležitém ohledu horší než aktuální live.

Zachovej nebo zlepši:

- correctness;
- všechny užitečné funkce;
- obsahovou hodnotu;
- metodiku a zdroje;
- disclaimery a trust;
- SEO metadata, schema a interní odkazy;
- mobile UX;
- accessibility;
- performance / CWV riziko.

Před preview udělej `LIVE → CANDIDATE DELTA REVIEW` a interní verdict musí být **SUPERIOR**. Pokud není, kandidáta dál opravuj a uživateli ho neposílej.

## CONTENT DEPTH

Žádná word-count kvóta.

Hloubku určuj podle tématu a reálných otázek uživatele. Nechci ani SEO vatu, ani strohý tool shell. Pokud má téma nuance, vysvětli je prakticky — scénářem, příkladem, porovnáním, vizualizací nebo metodickou hranicí.

## METODIKA

Pro M2–M4 stránky musí být skutečně ověřená metodika, aktuální primární zdroje a page-specific disclaimer podle rizika. Nikdy nepiš „ověřeno“, pokud ověření skutečně neproběhlo.

## PREVIEW A DEPLOY

Preview musí být **interaktivní LIVE HTML přímo v chatu** a musí vzniknout z přesně stejných produkčních HTML/CSS/JS souborů, které jsou určeny k deployi.

Bez explicitního uživatelského `OK` nic nenasazuj.

Po approval:

final QA → branch → PR → CI / browser QA → merge → GitHub Pages → Predeploy → Live Health → Lighthouse/PageSpeed → teprve potom `DONE`.

## KDE NAVÁZAT

Na začátku nejdřív ověř, že Gold upgrade:

`mesicni-mzda-z-hodinove-sazby-kalkulacka.html`

je skutečně v produkci a všechny produkční kontroly jsou zelené.

Potom z aktuální finish queue vyber **jen jednu další kalkulačku**. Podle posledního známého pořadí je pravděpodobný další kandidát:

`kalkulacka-odpracovanych-hodin.html`

ale ověř to proti aktuálnímu `main` a aktuální queue.

Nejdřív udělej baseline audit live stránky, method-risk audit a quality calibration. Potom pracuj samostatně až do skutečně kvalitního `SUPERIOR` kandidáta a teprve ten ukaž v live preview.

Hlavní cíl sprintu zůstává:

**dokončit upgrade portfolia → sitewide readiness → znovu podat RychléVýpočty.cz do Google AdSense.**

---
