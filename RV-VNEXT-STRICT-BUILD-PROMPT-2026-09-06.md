# RychléVýpočty.cz V7 — STRICT BUILD PROMPT

**Revize:** 2026-09-06  
**Status:** CURRENT / závazný BUILD LOCK pro všechny nové i recovery kalkulačky  
**Nahrazuje pro budoucí buildy:** `RV-VNEXT-STRICT-BUILD-PROMPT-2026-09-04.md`  
**Produkční repo:** `fangren740/bmi-kalkulacka`, branch `main`

> Nadřazený princip: **jeden prémiový web, mnoho skutečně různých produktů.** Kvalita, user job, správnost, použitelnost a výkon mají přednost před rychlostí výroby.

---

## 0. KANONICKÁ HIERARCHIE — NEIMPROVIZOVAT

Před každým buildem platí tato hierarchie:

1. **Source of truth pro aktuální stav:** produkční `main` v `fangren740/bmi-kalkulacka`.
2. **Quality floor:** `cista-mzda-kalkulacka.html` — sekvence **#74**.
   - #74 je minimální úroveň craftu, completeness, UX a polish.
   - #74 není povinná layoutová kopie.
3. **S-TIER kalibrace kvality/originality:**
   - **#13 Sádrokarton**
   - **#15 Omítka**
   - **#19 Rekonstrukce celkem**
   - **#21 DPH**
   - **#23 Bod zvratu**
   - **#25 Minimální fakturace**
4. **Sekundární kvalitativní reference:** #11 Podlahy, #12 Izolace, #17 Kuchyň, #18 Koupelna, #22 Marže, #33 Podnikatelská rezerva.
5. **Výrobní/technický standard:** `RV-VNEXT-PRODUCTION-STANDARD.md`.
6. **Experience standard a recovery dokumenty** z aktuálního `main`.

### S-TIER LOCK — HARD FAIL

Před návrhem nové stránky **otevři skutečné HTML alespoň 2–3 nejrelevantnějších S-tier referencí**. Nestačí tracker, název, screenshot z paměti ani předchozí chat.

Reference se **nekopírují layoutově**. Přenáší se jejich úroveň:
- řemeslného zpracování,
- topic-native vizuálu,
- product metaphor,
- continuity hero → calculator → result → depth,
- full-page rytmu,
- informační hustoty bez bordelu,
- detailu na mobilu.

Pokud stránka pouze splní checklist, ale nepůsobí na úrovni nejlepší relevantní S-tier reference, **preview = FAIL**.

---

## 1. STATE RECOVERY / SEQUENCE INTEGRITY

Před buildem:
- ověř `RV_VNEXT_PROGRESS.json`, registry, sitemap a skutečné HTML/CSS/JS,
- zjisti poslední schválenou sekvenci a další kandidát,
- žádnou hotovou URL nevydávej za novou sekvenci,
- pokud tracker a kód nesouhlasí, skutečný produkční kód má přednost a nesoulad se musí vyřešit,
- neptej se uživatele na stav, který lze zjistit z repa.

Novou URL nezačínej, pokud quality/recovery lock říká, že se má nejdřív opravit předchozí wave.

---

## 2. PRIMARY INTENT LOCK

Před jakýmkoli designem napiš jednou větou:

**„Uživatel přichází, protože chce …“**

Tato věta je product lock. Každý významný blok musí:
- vyřešit hlavní job,
- vysvětlit výsledek,
- zpřesnit ho,
- porovnat relevantní variantu,
- ukázat hranici/nejistotu,
- nebo posunout uživatele k přirozenému dalšímu rozhodnutí.

Blok bez této hodnoty nevznikne.

---

## 3. STABILNÍ UX ZÁKLAD — ORIGINALITA NENÍ LAYOUT ROULETTE

Pokud user job objektivně nevyžaduje jinak, preferovaný výchozí pattern významné kalkulačky je:

### Desktop
- header,
- **hero: text vlevo / silný topic-native vizuál vpravo**,
- bez sekundární obsahové sekce přejít přímo k toolu,
- **kalkulačka/vstupy vlevo / dominantní živý výsledek vpravo**,
- same-intent depth,
- světlá metodika/trust,
- tmavý plnohodnotný footer.

### Mobile
- header,
- hero copy,
- topic visual,
- kalkulačka,
- výsledek,
- same-intent depth,
- metodika,
- footer.

Odchylka je možná, ale musí mít **jasný produktový důvod**. Nevymýšlej novou makrokompozici jen proto, aby stránka působila originálně.

Originalita má vznikat hlavně přes:
- topic-native hero objekt,
- jinou výsledkovou gramatiku,
- data / graf / timeline / physical metaphor,
- post-result product moments,
- jiný rytmus a kompozici depth bloků.

---

## 4. HERO VISUAL / PRODUCT METAPHOR GATE — HARD FAIL

Hero nesmí být:
- H1 + prázdná pravá polovina,
- obyčejná KPI karta,
- generická bílá karta s číslem,
- dekorativní gradient bez informační hodnoty,
- stejný „design box“ jako na předchozí stránce s jiným textem.

Pravý hero objekt má být **samotný problém nebo proces nakreslený jako produkt**. Příklady správné úrovně:
- skutečný řez / skladba materiálu,
- účtenka / faktura / rozpočet,
- crossing graf,
- kalendář,
- mzdová páska,
- plán směn,
- časová osa,
- produktový štítek,
- vozidlo / dům / fyzická součást problému,
- process map,
- plánovací list.

### Metaphor continuity gate
Když hero zavede silný objekt/metaforu, pokud to téma unese, musí se její logika projevit i dále:
**hero → calculator → result → alespoň část same-intent depth.**

Silné hero + generický formulář + generický tmavý result + stejné card gridy = **FAIL**.

---

## 5. WATERMARK / VISUAL FIELD

Hero má být vizuálně bohaté, ale lehké a klidné.

Povoleno a žádoucí:
- topic watermark,
- jemný RV/brand pattern,
- SVG/CSS linky, rastry, křivky, vrstvy, technické značky,
- velmi low-contrast typografické motivy,
- topic-specific kruhy, osy, trasy, obrysy.

Pravidla:
- watermark nesmí soutěžit s H1/CTA,
- nesmí vytvářet overflow ani CLS,
- musí být topic-specific nebo brand-specific, ne náhodná dekorace,
- preferuj CSS/SVG před bitmapou,
- stejný watermark pattern mechanicky neopakuj na sérii stránek.

---

## 6. RV IDENTITY LOCK

Povinné:
- header: canonical `logo-rv-v32.svg?v=1`,
- footer: canonical inverse logo,
- navy / blue / green RV lineage,
- full footer s projektovými + tematickými odkazy,
- FB/IG podle production standardu,
- podpis `Zadat → Spočítat → Pochopit → Rozhodnout`.

Zakázané:
- staré logo,
- compact/staré lockupy místo canonical varianty,
- vlastní wordmark,
- nový experimentální footer,
- textová imitace loga.

### NO BADGE SPAM
Identita se **nesmí nahrazovat nalepenými pseudo-brand štítky** typu malá karta `RV / RychléVýpočty.cz / MODEL 2026`, pokud takový prvek nemá přirozenou produktovou funkci.

Nepoužívej několik identitních labelů nad sebou. Např. `RV kontrolní body` + `06 · Co si zkontrolovat` = vizuální šum a FAIL.

Brand se má projevit přes celek: logo, barvy, watermark, linework, result language, typografii, section choreography a footer.

---

## 7. CUSTOMER COPY — HARD FAIL

Viditelný text je pro zákazníka.

Zakázané interní názvy, pokud nejsou přirozeným termínem tématu:
`engine`, `solver`, `rail`, `desk`, `lab`, `runway`, `stack`, `control room`, `lens`, `dossier`, `reverse mode` apod.

Každá fráze musí pomoci pochopit:
- co zadat,
- co se stalo,
- co číslo znamená,
- proč se změnilo,
- co je hranice,
- co si zkontrolovat,
- co udělat dál.

### Hierarchie labelů
Jedna sekce = jeden dominantní kicker/eyebrow. Nevrstvit dva podobné labely jen kvůli brandingu.

Před preview proveď Customer Copy Scan a odstraň interní/designérský jazyk.

---

## 8. CALCULATOR UX

- První režim musí řešit nejčastější user job s minimem vstupů.
- Pokročilý režim pouze pokud přidává skutečnou přesnost/užitek.
- Live calculation tam, kde je bezpečný a srozumitelný.
- Jasné jednotky.
- Bez useknutých inputů, date pickerů, selectů, prefixů/suffixů.
- Bez horizontálního scrollu.
- Výsledek musí být dominantní a interpretovaný, ne jen číslo.
- Výsledek má ukázat rozpad, hranici nebo praktický dopad podle tématu.

### Responsive safety contract
U gridových polí a controlů standardně hlídat:
- `min-width: 0`,
- controls `width:100%; min-width:0; max-width:100%`,
- date inputs nesmí vytlačovat rodiče,
- dvousloupcový calculator/result se stackuje **dřív, než je vizuálně stísněný**.

---

## 9. ADAPTIVE DEPTH / FULL-PAGE RHYTHM

Délka není kvóta.

Před buildem vytvoř Depth Map:
1. Primary answer.
2. Přirozené následné otázky.
3. Které z nich mění rozhodnutí.
4. Jaký máme podklad/evidence.
5. Nejlepší vizuální forma odpovědi.

Stránka je příliš krátká, pokud po výsledku zůstávají důležité same-intent otázky bez odpovědi.

Stránka je příliš dlouhá, pokud sekce pouze opakuje předchozí odpověď jinými slovy.

### Section rhythm gate
- ne více než dvě po sobě jdoucí sekce se stejnou gramatikou `headline + equal cards`,
- změna barvy sama o sobě není jiná kompozice,
- nepokládej tmavou metodiku přímo nad tmavý footer,
- typický konec: **světlá praktická hloubka → světlá metodika/trust → tmavý footer**.

---

## 10. S-TIER PRODUCT RICHNESS

U významného tématu očekávej, pokud dává smysl:
- 1 dominantní topic-native hero objekt,
- 1 výrazný calculator/result product moment,
- alespoň 2 další relevantní product moments mimo hero,
- alespoň 1 hlavní kompozici mimo generický card-grid.

Možné formy:
- threshold/crossing map,
- decomposition / waterfall,
- scenario compare,
- calendar,
- timeline,
- sensitivity,
- physical cutaway / layers,
- process flow,
- worked example,
- decision map,
- checklist,
- comparison table,
- x-ray / scope map.

Jen pokud skutečně pomáhají user jobu.

---

## 11. CALCULATION / DATA / TRUST

Před redesignem zachovej nebo zlepši správnost výpočtu.

Povinně:
- audit současné produkční logiky,
- audit parametrů a jejich roku platnosti,
- regression dataset / benchmark, pokud existuje,
- edge/boundary scenarios,
- aktuální právní/finanční/zdravotní parametry ověřit z autoritativních zdrojů, pokud jsou proměnlivé,
- metodiku napsat lidsky a transparentně.

U finančních, daňových, právních, zdravotních a dalších citlivých témat použij stručný viditelný disclaimer. Nesmí být schovaný jen ve footeru ani být přehnaně právnický.

---

## 12. MANDATORY THREE-PASS WORKFLOW

### PASS A — Product architecture
Před kódem:
- Primary Intent,
- calculation/data/method audit,
- Depth Map,
- native product object,
- section choreography,
- Golden Delta,
- S-tier reference selection,
- Benchmark Delta proti #74,
- mobile journey plan.

### PASS B — Build & interaction
- kompletní desktop + mobile,
- skutečné interaction states,
- edge cases,
- benchmark/regression QA,
- žádné placeholdery,
- žádný polotovar.

### PASS C — Independent parity review
Až po dokončení buildu:
- full-page desktop review,
- full-page mobile review,
- #74 Quality Parity Scorecard,
- S-tier visual/craft comparison,
- customer copy scan,
- non-duplication scan proti předchozím 4 relevantním stránkám,
- adaptive depth completeness,
- full-page rhythm,
- identity/logo/footer/disclaimer scan,
- interaction state review.

**Uživatel nesmí dostat preview před PASS C.**

---

## 13. QUALITY SCORECARD

Před preview 0–5 v sedmi oblastech:
1. first-screen / brand / topic clarity,
2. calculator UX / interaction states,
3. result clarity / decomposition / decision value,
4. same-intent depth / practical completeness,
5. visual craft / choreography / originality,
6. customer copy / methodology / trust,
7. mobile / accessibility / render / technical finish.

PASS jen pokud:
- **>= 31 / 35**,
- žádná oblast < 4/5,
- full-page dojem není viditelně pod #74,
- craft/originalita není viditelně pod relevantní S-tier referencí.

Scorecard není omluva. Stránka může mít papírově 31/35 a přesto FAIL, pokud působí genericky nebo nedotaženě.

---

## 14. PREVIEW RENDER GATE — UŽIVATEL NENÍ BETA TESTER

Před prvním preview skutečně zkontroluj alespoň:
- 1440,
- 1280,
- 1120,
- 1024,
- 768,
- 390,
- 320 px.

Na každé relevantní šířce:
- horizontal overflow = 0,
- žádný clipped input / text / jednotka / date input,
- žádný text collision,
- žádné rozbité borders / accent strips,
- žádná překrytá grafika,
- result čitelný,
- header/footer správný,
- mobilní pořadí odpovídá user journey.

Navíc:
- runtime errors = 0,
- duplicate IDs = 0,
- žádný zjevný DOM fail,
- všechny zásadní interaction modes skutečně otevřít a vyzkoušet.

Viditelná chyba, kterou mohl tento gate zachytit, = **interní QA FAIL**.

---

## 15. PERFORMANCE / PAGESPEED / CORE WEB VITALS — HARD RELEASE GATE

Vizuální kvalita se nesmí kupovat zpomalením webu.

### Build-time pravidla
- preferuj CSS/SVG a lehké DOM kompozice,
- žádné zbytečné externí JS/CSS knihovny,
- hlídat velikost a formát hero/inline assetů,
- obrázky mají rozměry a nesmí způsobovat layout shift,
- minimalizovat blocking CSS/JS,
- kalkulačka nesmí vytvářet dlouhé main-thread tasky,
- watermarky a dekorace nesmí zvyšovat CLS nebo LCP bez reálné hodnoty.

### Post-deploy gate
**PREVIEW PASS != DONE.**

Po produkčním deployi významné změny hero/CSS/JS/assetů povinně:
1. spustit **PageSpeed Insights / Lighthouse na skutečné produkční URL**,
2. zkontrolovat **Mobile i Desktop**,
3. zkontrolovat LCP / CLS / INP rizika,
4. porovnat proti baseline / předchozí produkční verzi, pokud je k dispozici,
5. odstranit známou actionable regresi před označením DONE.

Cíl projektu:
- **Performance: 100**, bez známého akčního failu,
- **Accessibility: 100**,
- **Best Practices: 100**,
- **SEO: 100**.

Jednorázový laboratorní výkyv nemusí automaticky blokovat release, pokud nejsou známé akční problémy a CWV riziko je čisté. **Production PSI je autoritativní; lokální screenshot/smoke test není náhrada.**

---

## 16. FINAL STRANGER + S-TIER TEST

Před preview odpověz:

1. Kdyby zmizelo logo, H1 a SEO text, poznám z vizuálu a interakce, o jaký problém jde? **ANO**
2. Působí stránka jako samostatný produkt stejné značky, ne varianta posledního template? **ANO**
3. Je user journey jednodušší než naše designové ambice? **ANO**
4. Není stránka strohá vzhledem k šířce tématu? **NE**
5. Není naopak přeplácaná / přeznačkovaná? **NE**
6. Je full-page kvalita minimálně #74? **ANO**
7. Je craft/originalita srovnatelná s nejlepší relevantní S-tier referencí? **ANO**
8. Je mobil skutečně navržený, ne jen zmenšený desktop? **ANO**
9. Neobětujeme designu PSI/CWV? **NE**

Jakákoli jiná odpověď = další interní pass, ne user preview.

---

## 17. RELEASE DECISION

### Preview lze ukázat jen pokud:

**PRIMARY INTENT PASS + CALCULATION PASS + #74 QUALITY PARITY PASS + S-TIER CALIBRATION PASS + CUSTOMER COPY PASS + ADAPTIVE DEPTH PASS + PAGE ORIGINALITY PASS + HERO VISUAL PASS + IDENTITY PASS + FULL-PAGE VISUAL PASS + MOBILE PASS + RENDER QA PASS.**

### DONE lze označit až po:

**USER VISUAL APPROVAL + PRODUCTION DEPLOY + LIVE HEALTH + PRODUCTION PSI MOBILE/DESKTOP + NO KNOWN ACTIONABLE PERFORMANCE REGRESSION.**

Technické PASS bez produktu nestačí. Produkt bez user-friendliness nestačí. Originalita bez relevance nestačí. Silné hero nemůže zachránit slabý zbytek stránky. A krásná stránka, která poškodí PageSpeed/Core Web Vitals, není hotový upgrade.