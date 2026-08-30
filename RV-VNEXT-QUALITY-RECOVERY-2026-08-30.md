# RychléVýpočty.cz V7 — V-next Quality Recovery Gate

**Platnost od:** 2026-08-30  
**Důvod:** retro audit po sekvenci #94 potvrdil vizuální / product-design drift. Technická správnost a počet sekcí zůstaly převážně dobré, ale část novější vlny začala používat příliš podobnou page-level kompozici.

## 1. Golden calibration wave

Před BUILD LOCK každé další významné kalkulačky se povinně kalibruj proti sekvencím **#11–#25**, zejména proti stránkám, které mají jednoznačnou topic-native gramatiku:

- #11 Floor Order Architect
- #12 Thermal Layer Blueprint
- #13 Drywall Material Desk / Order Ticket
- #14 Foundation Block Course Planner
- #15 Plaster Finish Studio
- #16 House Budget Atlas
- #17 Kitchen Budget Counter
- #18 Bathroom Price Mirror
- #19 Renovation X-Ray
- #20 Material Measure Board
- #21 Receipt Split
- #22 Price Stack
- #23 Break-even Crossing
- #24 Billable Time Calendar
- #25 Invoice Runway

Golden wave **není template**. Je to kvalitativní laťka pro míru skutečné produktové práce, topic-native vizuální logiku, rytmus a schopnost každé URL působit jako vlastní produkt.

## 2. Page-level Originality Gate — HARD FAIL

Před buildem se musí zapsat 4 položky pro poslední 4 dokončené kalkulačky a pro nový návrh:

1. **Hero composition** — co je dominantní objekt a jak je hero složené.
2. **Calculator composition** — jak uživatel zadává data; panel, timeline, ledger, board, matrix, map, instrument apod.
3. **Result archetype** — jak je zobrazen hlavní answer.
4. **Post-result grammar** — jaké jsou 2–5 hlavní product moments po výsledku.

Nový návrh nesmí mechanicky opakovat stejnou kombinaci. Pokud se shoduje s kteroukoli z posledních 3 kalkulaček ve **2 nebo více z těchto 4 vrstev**, návrh musí být přepracován nebo musí být v BUILD LOCK explicitně doloženo, proč je právě tato kompozice objektivně nejlepší pro user job.

**Absolutní FAIL:** stejný hero shell + stejný result shell jako bezprostředně předchozí kalkulačka bez silného produktového důvodu.

## 3. Default-shell ban

Následující kompozice už není dovolena jako automatický default:

> pale background → velký H1 vlevo → CTA/trust row → floating white proof card vpravo → bílá form card → tmavý result card → série stejných card-grid sekcí

Použít ji lze pouze tehdy, když je pro konkrétní problém nejlepší a anti-template review vysvětlí proč.

**White floating proof card není design systém.** Je to pouze jedna z možných kompozic.

## 4. Topic-native signature floor

Významná kalkulačka musí mít:

- minimálně **1 topic-native dominantní objekt v hero**, který není jen generický KPI panel,
- minimálně **2 topic-native product moments mimo hero**,
- minimálně **1 hlavní kompozici mimo card-grid**,
- vizuální logiku, která pokračuje přes **hero → calculator → result → depth**, ne pouze dekoraci v prvním viewportu.

Příklady skutečné topic-native gramatiky: řady bednění, vrstvy izolace, účtenka DPH, kalendář fakturačních měsíců, break-even zero-line, skutečný cost strip kilometru, materiálový order ticket, timeline podle reálného procesu.

## 5. Golden-wave Stranger Test

Před předložením uživateli si polož dvě otázky:

1. Kdyby zmizelo logo, H1 a SEO text, poznám z rozložení a vizuálních objektů **o jaký typ problému jde**?
2. Kdybych vedle sebe otevřel tuto stránku a poslední tři kalkulačky, vypadají jako **čtyři produkty jedné značky**, nebo jako čtyři varianty jednoho template?

Pokud odpověď na 1 je NE nebo na 2 „varianty jednoho template“, release candidate = **FAIL**.

## 6. Visual Drift Screenshot Gate — povinné před user review

Uživatel není beta tester. Před prvním náhledem musí být reálně vyrenderováno a zkontrolováno:

- desktop 1440 px — hero / first viewport,
- desktop 1440 px — calculator + dominant result,
- desktop — minimálně jeden signature post-result block,
- mobile 390 px — hero,
- mobile 390 px — calculator/result.

Současně:

- horizontal overflow = 0,
- runtime/page errors = 0,
- duplicate IDs = 0,
- neexistuje rozpad DOM/sekcí,
- žádný klíčový obsah není useknutý nebo překrytý.

Polotovar, rozhozená stránka nebo layout s evidentní kolizí se **nesmí poslat ke kontrole**.

## 7. Machine clone warning

Standardizované hero screenshoty lze použít jako pomocný clone detector. Vysoká vizuální podobnost není sama o sobě chyba, ale je trigger pro ruční review:

- velmi vysoká podobnost s jednou z posledních 5 stran → povinný manual anti-template review,
- téměř identická dvojice → redesign před user preview, pokud nejde o záměrně svázaný produkt a kompozice není objektivně nezbytná.

Machine similarity je **triage**, ne náhrada vizuálního úsudku.

## 8. Product Richness Recovery

TOP stránka nesmí skončit u „dobré kalkulačky + metodiky“. Po hlavním výsledku má nabídnout pouze relevantní, ale skutečnou produktovou hodnotu:

- interpretaci,
- delta / sensitivity / compare, pokud mění rozhodnutí,
- edge-case nebo scope map,
- praktický next action,
- metodiku / data / zdroje.

Přidávání textu jen kvůli délce je zakázané. Cíl je **více relevantní produktové hodnoty, ne více obsahu**.

## 9. Sequence / URL Integrity Gate

Před zahájením nové sekvence povinně ověř:

- URL není už v `completedPages`,
- soubor není už označen DONE pod jinou sekvencí,
- `nextSequence` odpovídá trackeru,
- nový build nepřepisuje právě dokončenou URL pod novým číslem.

Kolize = **HARD FAIL před buildem**.

## 10. Retro repair policy

Retro audit rozdělí starší V-next stránky do tří pásem:

- **REPAIR** — reálný produktový/visual quality deficit proti golden wave; zařadit do opravné vlny,
- **WATCH** — funkčně dobré, ale template-risk / slabší originalita; opravovat podle priority a topical clusteru,
- **PASS** — splňuje současnou laťku; nepřepisovat bez konkrétního důvodu.

Static score nesmí sám rozhodnout. Konečná klasifikace kombinuje:

1. skutečný render,
2. product/visual originality,
3. primary-intent kvalitu,
4. post-result depth,
5. metodiku/data,
6. historický user feedback,
7. technický QA stav.

## 11. Release decision

Od této revize je kalkulačka připravena k předložení pouze pokud platí současně:

**PRIMARY INTENT PASS + CALCULATION PASS + TOPIC DEPTH PASS + PAGE-LEVEL ORIGINALITY PASS + VISUAL DRIFT PASS + RENDER QA PASS + IDENTITY PASS.**

Technické PASS bez originality už nestačí.

## 12. Recovery Lock — ACTIVE

Dokud není recovery backlog uzavřen nebo výslovně odložen product ownerem:

- nový build nesmí být nasazen jen proto, že má správný výpočet a lokální technické QA,
- každý kandidát vytvořený před tímto gate se před release znovu posoudí podle Golden-wave Stranger Testu,
- globální pozdější feedback uživatele o template driftu má přednost před dřívějším rychlým „fajn, dále“, pokud kandidát ještě nebyl produkčně uzavřen,
- lokální koncept s URL, která už má dokončenou sekvenci, je recovery návrh dané sekvence, ne nová sekvence.

Aktuální retro backlog a konkrétní klasifikace jsou vedeny v `RV-VNEXT-QUALITY-RECOVERY-AUDIT-2026-08-30.md`.

## 13. Golden Delta Card — povinná před BUILD LOCK

Před každým novým nebo recovery buildem musí interní BUILD LOCK obsahovat stručný **Golden Delta Card**:

- **Native object:** hlavní fyzický / procesní / datový objekt tohoto problému.
- **Why this composition:** jedna věta, proč zvolená page grammar odpovídá tomuto user jobu.
- **Not like previous 4:** konkrétně co je jiné v hero, calculatoru, výsledku a depth oproti posledním 4 relevantním stránkám.
- **Golden reference:** která 1–2 stránky z #11–#25 jsou kvalitativní reference a co se z nich přebírá jako princip, nikoli layout.
- **Clone risk:** LOW / MEDIUM / HIGH; MEDIUM/HIGH musí být před buildem přepracováno nebo explicitně odůvodněno.

Bez Golden Delta Card není BUILD LOCK kompletní.