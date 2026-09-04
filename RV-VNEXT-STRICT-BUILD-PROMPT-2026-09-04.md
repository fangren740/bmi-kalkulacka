# RychléVýpočty.cz V7 — STRICT BUILD PROMPT

**Platnost od:** 2026-09-04  
**Status:** závazný BUILD LOCK pro všechny nové i recovery kalkulačky.  
**Nadřazený princip:** jedna značka, různé skutečné produkty. Kvalita, relevance a user job mají přednost před rychlostí, šablonou i počtem sekcí.

## 1. Source of truth

- Produkční repo: `fangren740/bmi-kalkulacka`, branch `main`.
- **Quality floor:** `cista-mzda-kalkulacka.html` — sekvence #74. Je to minimální úroveň craftu, completeness a product polish; není to layoutová šablona.
- **Originality calibration:** sekvence #11–#25.
- Povinně respektovat také:
  - `RV-VNEXT-QUALITY-RECOVERY-2026-08-30.md`
  - `RV-VNEXT-CUSTOMER-COPY-AND-ADAPTIVE-DEPTH-GATE-2026-09-04.md`
  - `RV-VNEXT-QUALITY-FLOOR-74-RECOVERY-PLAN-2026-09-04.md`
- Před buildem ověřit Sequence / URL Integrity. Žádná hotová URL nesmí být omylem vydávána za novou sekvenci.

## 2. #74 Quality Parity Gate — HARD FAIL

Každá nová nebo recovery stránka musí být před preview porovnána s `cista-mzda-kalkulacka.html`.

Platí:
- užší téma smí být kratší než #74, ale nesmí být méně dotažené,
- širší téma může a má být delší, pokud další hloubka řeší přirozené otázky stejného intentu,
- jedna silná hero grafika nebo signature block nesmí maskovat slabší calculator/result/depth,
- technické QA není důkaz product quality,
- preview po jediném coding passu bez samostatného product/design review = FAIL.

Před preview vyplň Quality Parity Scorecard 0–5 v sedmi oblastech:
1. first-screen / brand / topic clarity,
2. calculator UX / vstupní architektura / interaction states,
3. result clarity / decomposition / decision value,
4. same-intent depth / completeness / practical usefulness,
5. visual craft / section choreography / originality,
6. customer copy / methodology / trust / disclaimers,
7. mobile / accessibility / render / technical finish.

PASS pouze pokud:
- total >= 31 / 35,
- žádná oblast < 4 / 5,
- u tématu srovnatelné nebo vyšší složitosti není depth/polish viditelně pod #74.

#74 se nekopíruje kompozičně. Kvalitativní floor a originalita jsou dvě různé podmínky: **#74 = minimum kvality, #11–#25 = kalibrace originality.**

## 3. Primary-intent lock

Před návrhem napiš jednu větu: **„Uživatel přichází, protože chce …“**

Každý významný blok stránky musí tento job:
- vyřešit,
- vysvětlit,
- zpřesnit,
- porovnat,
- nebo přirozeně posunout k dalšímu rozhodnutí.

Blok, který to nedělá, nevznikne.

## 4. Above-the-fold UX — HARD FAIL

- Hero musí rychle vysvětlit user job.
- Mezi hero a hlavní kalkulačkou nesmí být sekundární obsahová sekce.
- Na desktopu jsou **kalkulačka a dominantní výsledek standardně vedle sebe**, pokud user job objektivně nevyžaduje jinou kompozici.
- Mobil může přirozeně stackovat.
- Výsledek musí reagovat živě na vstupy, pokud je to pro daný výpočet vhodné.
- Sekundární hloubka začíná až po hlavním výsledku.

## 5. Hero Visual Integrity Gate — HARD FAIL

Hero nesmí být jen velký text na prázdné ploše.

Pokud je hero dvousloupcové:
- pravá strana musí nést **skutečný topic-native dominantní vizuální objekt**, ne jen textový box, KPI kartu nebo dekorativní gradient,
- vizuál musí být pochopitelný i bez H1 a musí souviset s konkrétním problémem,
- může jít o výplatní pásku, pracovní místo, časovou osu, materiálovou skladbu, mapu procesu, vozidlo, účtenku, kalendář, zásobu, rozpad částky apod., podle tématu.

Pokud topic-native vizuál nedává smysl, zvol jinou hero kompozici — ne prázdnou pravou polovinu.

Vizuál nesmí být samoúčelná náhrada za product depth. Pokud působí jako placeholder, jednoduchá CSS ilustrace nebo dekorace bez informační hodnoty, Hero Visual FAIL.

## 6. Identity Lock — HARD FAIL

- Logo je vždy stejné RV V3.2: `logo-rv-v32.svg?v=1`.
- Footer používá standardní RV inverse logo, sociální sítě, metodiku / projektové odkazy a podpis `Zadat → Spočítat → Pochopit → Rozhodnout`.
- Žádné nové wordmarky, fallback logotypy, redesign značky ani experimentální footery.
- Originalita vzniká v produktu stránky, ne změnou identity.

## 7. Page-level originality — HARD FAIL

Před buildem udělej Golden Delta Card:
- **Native object** — hlavní fyzický / procesní / datový objekt.
- **Why this composition** — proč odpovídá user jobu.
- **Not like previous 4** — rozdíl v hero, calculatoru, výsledku a post-result grammar proti posledním 4 relevantním stránkám.
- **Golden reference** — 1–2 kvalitativní reference z #11–#25; přebírá se princip, ne layout.
- **Clone risk** — LOW / MEDIUM / HIGH. MEDIUM/HIGH = redesign nebo silné odůvodnění.

Zakázaný default shell:
`pale hero → H1 vlevo → proof card vpravo → bílý formulář → tmavý result → série stejných card-gridů`.

Stejný hero + stejný result jako předchozí stránka bez produktového důvodu = FAIL.

## 8. Customer Copy Gate — HARD FAIL

Viditelný text je pro zákazníka, ne pro interní design/product tým.

Do UI nesmí pronikat interní codenames typu:
`engine`, `solver`, `rail`, `desk`, `lab`, `reverse mode`, `control room`, `runway`, `stack`, `lens`, `dossier` apod., pokud nejde o přirozený termín daného tématu.

Každá fráze musí pomáhat alespoň s jedním z bodů:
- co zadat,
- co výsledek znamená,
- proč se změnil,
- co porovnat,
- jaká je hranice / nejistota,
- co udělat dál.

Před preview proveď Customer Copy Scan a zjednoduš vše, co zní jako interní pracovní jazyk.

## 9. Adaptive Page Depth Gate — HARD FAIL

Délka stránky se neurčuje šablonou ani kvótou.

Před buildem vytvoř Depth Map:
1. Primary answer.
2. 3–10 natural next questions.
3. Decision-changing subset.
4. Evidence / výpočtový podklad.
5. Nejlepší forma každé odpovědi.

Platí oba směry:
- úzké téma nesmí být uměle natažené,
- široké téma nesmí být uměle zkrácené.

Stop rule: další sekce nevzniká, pokud nepřidává novou odpověď, rozhodovací hodnotu nebo důležitou hranici. Naopak stránka je příliš krátká, pokud po výsledku zůstávají důležité přirozené otázky stejného intentu bez odpovědi, přestože pro ně máme kvalitní podklad.

**Fewer blocks != lower polish. More blocks != higher quality.**

## 10. Product Richness

Významná stránka má mít minimálně:
- 1 topic-native dominantní vizuál v hero,
- 2 topic-native product moments mimo hero, pokud je téma unese,
- alespoň 1 hlavní kompozici mimo generický card-grid,
- vizuální logiku pokračující přes hero → calculator → result → depth.

Post-result bloky mohou být například:
- sensitivity,
- threshold / crossing map,
- timeline,
- waterfall / decomposition,
- scenario compare,
- scope map,
- process flow,
- checklist,
- calendar,
- worked example,
- edge-case map.

Pouze tehdy, když mají skutečnou relevance / decision value.

## 11. Topic-sensitive disclaimers

U finančních, daňových, právních, zdravotních a jiných citlivých témat zachovat stručný viditelný disclaimer. Má říct, že výsledek je orientační a nenahrazuje individuální odborné posouzení. Nesmí být strašák ani dlouhá právnická zeď.

## 12. Mandatory Three-Pass Workflow — HARD FAIL

### PASS A — Product architecture
Před kódem musí být hotovo:
- Primary Intent,
- Depth Map,
- calculation/data/method audit,
- native product object,
- section choreography,
- Golden Delta,
- Benchmark Delta proti #74.

### PASS B — Build & interaction
- kompletní desktop + mobile,
- reálné interaction states a edge scenarios,
- regression QA,
- žádné placeholdery nebo polotovar.

### PASS C — Benchmark parity review
Samostatný průchod až po dokončení buildu:
- full-page review 1440,
- full-page review 390,
- quality scorecard proti #74,
- Customer Copy Scan,
- Non-duplication Scan,
- depth completeness,
- whitespace / typography / density / rhythm,
- interaction state review.

**Uživatel nesmí dostat preview před PASS C.**

## 13. Pre-review render gate — HARD FAIL

Uživatel není beta tester. Před prvním náhledem musí být hotovo a zkontrolováno:
- desktop 1440: hero,
- desktop 1440: kalkulačka + dominantní výsledek,
- desktop: všechny významné post-result bloky a full-page rhythm,
- mobile 390: hero,
- mobile 390: kalkulačka / výsledek,
- mobile: full-page scan,
- horizontal overflow = 0,
- runtime errors = 0,
- duplicate IDs = 0,
- žádný rozpad DOM, překryv, useknutý obsah nebo evidentní vizuální chyba.

Polotovar se k user review neposílá.

## 14. Final Stranger Test

Před user preview si polož:
1. Kdyby zmizelo logo, H1 a SEO text, poznám z rozložení a vizuálních objektů, o jaký problém jde?
2. Vypadají poslední čtyři stránky jako čtyři produkty jedné značky, nebo jako čtyři varianty jednoho template?
3. Není stránka příliš strohá?
4. Nevymýšlíme už zbytečné kraviny?
5. Je délka přirozená vzhledem k tématu?
6. Je full-page dojem minimálně na úrovni #74 vzhledem k šířce tématu?

Správná odpověď: 1 = ANO, 2 = čtyři produkty jedné značky, 3 = NE, 4 = NE, 5 = ANO, 6 = ANO.

## 15. Release decision

Preview lze předložit jen pokud současně platí:

**PRIMARY INTENT PASS + CALCULATION PASS + #74 QUALITY PARITY PASS + CUSTOMER COPY PASS + ADAPTIVE DEPTH PASS + TOPIC DEPTH PASS + PAGE-LEVEL ORIGINALITY PASS + HERO VISUAL PASS + IDENTITY PASS + FULL-PAGE VISUAL PASS + RENDER QA PASS.**

Technické PASS bez originality nestačí. Originalita bez relevance nestačí. Bohatá stránka bez jasného hlavního výpočtu nestačí. Minimalistická stránka, která zamlčí důležité otázky tématu, také nestačí. Jedna povedená hero grafika nemůže zachránit slabší zbytek stránky.