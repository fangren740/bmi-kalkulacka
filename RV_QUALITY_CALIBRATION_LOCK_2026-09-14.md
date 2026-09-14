# RychléVýpočty.cz V7 — QUALITY CALIBRATION LOCK

Datum: 14. 9. 2026
Stav: ACTIVE / RELEASE-BLOCKING QUALITY RULE

## Proč toto pravidlo existuje

Nestačí splnit checklist. Kandidát může mít správné logo, zdroje, disclaimer i funkční výpočet a přesto působit slabě, genericky nebo jako formulářový template.

Cílem V7 je, aby každý upgrade byl skutečný produktový posun a aby se kvalita v čase zvyšovala, ne resetovala na obecný default.

## Povinná kalibrace PŘED buildem

Než začne redesign jedné kalkulačky, musí se projít a porovnat:

1. aktuální LIVE verze stejné URL — povinný baseline;
2. `cista-mzda-kalkulacka.html` (#74) — quality floor;
3. minimálně dvě relevantní S-tier reference podle typu tématu, např. DPH, Bod zvratu, Minimální fakturace, Sádrokarton, Omítka, Rekonstrukce;
4. poslední uživatelem schválený Gold upgrade, pokud existuje — aktuálně po nasazení tohoto releasu `mesicni-mzda-z-hodinove-sazby-kalkulacka.html`.

Kalibrace nesmí být povrchní. Explicitně se hodnotí:
- celkový vizuální craft a měřítko;
- topic-native hero objekt / visual field;
- informační hierarchie;
- hero → tool flow;
- jednoduchost first use;
- progressive disclosure;
- result grammar a dominance výsledku;
- produktové momenty pod výsledkem — datavizualizace, decision aid, příklady, scénáře;
- textová a metodická hloubka podle tématu;
- mobile choreography;
- brand lineage bez uniformního template vzhledu.

## HARD GATE — USER NENÍ BETA TESTER

Do user preview se NESMÍ poslat první funkční varianta ani kandidát, který je pouze „technicky správný“.

Před preview musí proběhnout interní self-review:

- Vypadá stránka minimálně jako současný quality floor?
- Je proti live zřetelně lepší, ne jen jiná?
- Má vlastní produktovou metaforu odpovídající tématu?
- Nepůsobí jako SaaS dashboard, admin panel, generic form builder nebo cards-everywhere šablona?
- Není typografie drobná nebo přehuštěná?
- Má výsledek jasnou interpretaci a další logický krok?
- Obsahuje jen užitečnou hloubku, ale nic důležitého z live neztratila?
- Je na mobilu jednodušší nebo minimálně stejně dobrá?

Pokud je odpověď na některou zásadní otázku NE, kandidát se opraví interně a uživateli se NEPOSÍLÁ.

## Topic-native product rule

Každá stránka musí mít vlastní vizuální a produktový důvod své existence.

Preferuj objekty a metafory přirozené tématu:
- mzdy: mzdový lístek, docházka, směna, výplatní rozpad;
- finance: tok peněz, scénáře, break-even, cashflow;
- stavebnictví: materiál, řezný plán, vrstvy, rozměry;
- auto: provozní náklady, kilometr, vlastnictví, časová osa;
- čas: kalendář, směny, intervaly, timeline.

Zakázané jako výchozí návrh:
- generický dashboard v hero bez vazby na téma;
- univerzální grid kartiček jako hlavní vizuální jazyk;
- technický formulář bez produktu;
- stejné hero/result schéma pro každou kalkulačku;
- dekorace bez informační funkce.

## Content + product depth rule

Hloubku neurčuje počet slov. Určuje ji téma a user job.

Pokud má téma praktické nuance, musí je stránka řešit například:
- konkrétním scénářem;
- vizuálním srovnáním;
- decision aid;
- metodickou hranicí;
- typickou chybou;
- navazujícím rozhodnutím uživatele.

SEO text bez produktové hodnoty není upgrade. Stejně tak minimalistický tool shell bez vysvětlení není upgrade.

## Continuous improvement rule

Každý schválený Gold upgrade se stává novým kalibračním důkazem.

Při další kalkulačce:
- zachovej kvalitu předchozích Gold stránek;
- neopakuj jejich design mechanicky;
- přenes jejich úroveň craftu, nikoli jejich konkrétní layout;
- pokud nové řešení objeví lepší pattern, zapiš jej do standardu pro další práci.

Projekt se tedy kalibruje směrem nahoru. Nový chat nesmí začít od generického výchozího návrhu.

## Povinné pořadí jedné kalkulačky

1. LIVE baseline audit.
2. Quality calibration proti #74 + 2 S-tier + poslední Gold.
3. Method-risk audit a ověření zdrojů podle rizika.
4. Build skutečného produkčního kandidáta.
5. Interní product/visual self-review — slabé varianty se uživateli neposílají.
6. LIVE → CANDIDATE delta review podle NO-REGRESSION LOCK; verdict musí být `SUPERIOR`.
7. Funkční interaktivní LIVE preview z přesně stejného kandidáta.
8. User approval.
9. Final QA → PR → CI → merge → Pages → Predeploy → Live Health → Lighthouse/PageSpeed.
10. Teprve potom DONE a další kalkulačka.

## Nadřazený princip

**Checklist je minimum. Schválený produkt musí mít craft, vlastní charakter a měřítko odpovídající TOP českému kalkulačkovému webu.**

Uživatel nemá kalibrovat asistenta každou stránku znovu. Asistent si musí kvalitu přenášet dopředu a průběžně ji zvyšovat.
