# RychléVýpočty.cz V7 — STRICT BUILD PROMPT

**Platnost od:** 2026-09-04  
**Status:** závazný BUILD LOCK pro všechny nové i recovery kalkulačky.  
**Nadřazený princip:** jedna značka, různé skutečné produkty. Kvalita, relevance a user job mají přednost před rychlostí, šablonou i počtem sekcí.

## 1. Source of truth

- Produkční repo: `fangren740/bmi-kalkulacka`, branch `main`.
- Golden quality calibration: sekvence #11–#25.
- Povinně respektovat také:
  - `RV-VNEXT-QUALITY-RECOVERY-2026-08-30.md`
  - `RV-VNEXT-CUSTOMER-COPY-AND-ADAPTIVE-DEPTH-GATE-2026-09-04.md`
- Před buildem ověřit Sequence / URL Integrity. Žádná hotová URL nesmí být omylem vydávána za novou sekvenci.

## 2. Primary-intent lock

Před návrhem napiš jednu větu: **„Uživatel přichází, protože chce …“**

Každý významný blok stránky musí tento job:
- vyřešit,
- vysvětlit,
- zpřesnit,
- porovnat,
- nebo přirozeně posunout k dalšímu rozhodnutí.

Blok, který to nedělá, nevznikne.

## 3. Above-the-fold UX — HARD FAIL

- Hero musí rychle vysvětlit user job.
- Mezi hero a hlavní kalkulačkou nesmí být sekundární obsahová sekce.
- Na desktopu jsou **kalkulačka a dominantní výsledek standardně vedle sebe**, pokud user job objektivně nevyžaduje jinou kompozici.
- Mobil může přirozeně stackovat.
- Výsledek musí reagovat živě na vstupy, pokud je to pro daný výpočet vhodné.
- Sekundární hloubka začíná až po hlavním výsledku.

## 4. Hero Visual Integrity Gate — HARD FAIL

Hero nesmí být jen velký text na prázdné ploše.

Pokud je hero dvousloupcové:
- pravá strana musí nést **skutečný topic-native dominantní vizuální objekt**, ne jen textový box, KPI kartu nebo dekorativní gradient,
- vizuál musí být pochopitelný i bez H1 a musí souviset s konkrétním problémem,
- může jít o výplatní pásku, pracovní místo, časovou osu, materiálovou skladbu, mapu procesu, vozidlo, účtenku, kalendář, zásobu, rozpad částky apod., podle tématu.

Pokud topic-native vizuál nedává smysl, zvol jinou hero kompozici — ne prázdnou pravou polovinu.

## 5. Identity Lock — HARD FAIL

- Logo je vždy stejné RV V3.2: `logo-rv-v32.svg?v=1`.
- Footer používá standardní RV inverse logo, sociální sítě, metodiku / projektové odkazy a podpis `Zadat → Spočítat → Pochopit → Rozhodnout`.
- Žádné nové wordmarky, fallback logotypy, redesign značky ani experimentální footery.
- Originalita vzniká v produktu stránky, ne změnou identity.

## 6. Page-level originality — HARD FAIL

Před buildem udělej Golden Delta Card:
- **Native object** — hlavní fyzický / procesní / datový objekt.
- **Why this composition** — proč odpovídá user jobu.
- **Not like previous 4** — rozdíl v hero, calculatoru, výsledku a post-result grammar proti posledním 4 relevantním stránkám.
- **Golden reference** — 1–2 kvalitativní reference z #11–#25; přebírá se princip, ne layout.
- **Clone risk** — LOW / MEDIUM / HIGH. MEDIUM/HIGH = redesign nebo silné odůvodnění.

Zakázaný default shell:
`pale hero → H1 vlevo → proof card vpravo → bílý formulář → tmavý result → série stejných card-gridů`.

Stejný hero + stejný result jako předchozí stránka bez produktového důvodu = FAIL.

## 7. Customer Copy Gate — HARD FAIL

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

## 8. Adaptive Page Depth Gate — HARD FAIL

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

## 9. Product Richness

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

## 10. Topic-sensitive disclaimers

U finančních, daňových, právních, zdravotních a jiných citlivých témat zachovat stručný viditelný disclaimer. Má říct, že výsledek je orientační a nenahrazuje individuální odborné posouzení. Nesmí být strašák ani dlouhá právnická zeď.

## 11. Pre-review render gate — HARD FAIL

Uživatel není beta tester. Před prvním náhledem musí být hotovo a zkontrolováno:
- desktop 1440: hero,
- desktop 1440: kalkulačka + dominantní výsledek,
- desktop: alespoň 1 signature post-result block,
- mobile 390: hero,
- mobile 390: kalkulačka / výsledek,
- horizontal overflow = 0,
- runtime errors = 0,
- duplicate IDs = 0,
- žádný rozpad DOM, překryv, useknutý obsah nebo evidentní vizuální chyba.

Polotovar se k user review neposílá.

## 12. Final Stranger Test

Před user preview si polož:
1. Kdyby zmizelo logo, H1 a SEO text, poznám z rozložení a vizuálních objektů, o jaký problém jde?
2. Vypadají poslední čtyři stránky jako čtyři produkty jedné značky, nebo jako čtyři varianty jednoho template?
3. Není stránka příliš strohá?
4. Nevymýšlíme už zbytečné kraviny?
5. Je délka přirozená vzhledem k tématu?

Správná odpověď: 1 = ANO, 2 = čtyři produkty jedné značky, 3 = NE, 4 = NE, 5 = ANO.

## 13. Release decision

Preview lze předložit jen pokud současně platí:

**PRIMARY INTENT PASS + CALCULATION PASS + CUSTOMER COPY PASS + ADAPTIVE DEPTH PASS + TOPIC DEPTH PASS + PAGE-LEVEL ORIGINALITY PASS + HERO VISUAL PASS + IDENTITY PASS + VISUAL DRIFT PASS + RENDER QA PASS.**

Technické PASS bez originality nestačí. Originalita bez relevance nestačí. Bohatá stránka bez jasného hlavního výpočtu nestačí. Minimalistická stránka, která zamlčí důležité otázky tématu, také nestačí.
