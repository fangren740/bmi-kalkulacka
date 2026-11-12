# RV3 Page Studio — O projektu — skutečná důvěryhodnost
**URL:** `/o-nas.html` · **stav:** SOURCE REVIEW + INDIVIDUAL BRIEF, **ne** hotový redesign · **12. 11. 2026**

## Přečtený současný obsah
- Title: `O projektu | RychléVýpočty.cz`, H1: `Praktické výpočty pro každodenní otázky`.
- H2 zahrnují identitu provozovatele, srozumitelnost výsledku, cestu od zdroje a vzorce k testu a sociální sítě.
- Stránka je obsahově krátká (~8,5 kB HTML), žádný funkční formulář; **nevyžaduje kalkulační engine**.

## Individuální redakční koncepce
- „Kdo stojí za výsledky?“ → opravdové jméno provozovatele a odpovědnost; neprodávat fiktivní odbornou kancelář nebo vymyšlené zákazníky.
- „Proč web existuje?“ → stručná životní situace, matematika pomáhající při rozhodnutí, co je a není právní/finanční poradenství.
- „Kdo a jak kontroluje správnost?“ → propojení na `jak-pocitame.html`, `data-a-benchmarky.html`, redakční pravidla a kontakt.
- **Vizuál:** výrazná osobitá redakční úvodní sekce a konkrétní transparentní proces, ne přebarvený katalog; použít skutečná data, případně ilustrativní schéma bez falešných fotek.
- Neodvozovat kompetence jen z AI odpovědi; skutečný text ověřit proti původní stránce.

## QA a release
- Zachovat facts, title/canonical, dostupnost kontaktních odkazů, GDPR/identity linky. Formulář není potřeba.
- Mob/PC 390/1440, kvalita textu a kontrast, Lighthouse; až poté jako jeden samostatný schvalovatelný výstup.


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
