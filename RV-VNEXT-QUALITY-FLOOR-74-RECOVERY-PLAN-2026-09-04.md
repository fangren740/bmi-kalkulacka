# RychléVýpočty.cz V7 — QUALITY FLOOR #74 / RECOVERY PLAN

**Platnost od:** 2026-09-04  
**Status:** ACTIVE / BUILD FREEZE pro další recovery buildy do dokončení parity auditu  
**Referenční stránka kvality:** `cista-mzda-kalkulacka.html` — sekvence #74  
**Originality reference:** golden wave #11–#25

## 0. Důvod změny

Dosavadní recovery pravidla správně hlídala originalitu, hero visual, copy, adaptivní délku a technické QA, ale chyběl jim **explicitní kvalitativní benchmark vůči nejlepší současné V-next stránce**.

Výsledek: stránka mohla projít checklistem, být topic-native a technicky čistá, a přesto působit jako o úroveň slabší produkt než #74. To je nově HARD FAIL.

#74 je minimum řemeslné a produktové kvality, nikoli layoutová šablona.

- Užší téma smí být kratší než #74.
- Užší téma nesmí být méně dotažené než #74.
- Širší téma může a má být delší než #74, pokud další hloubka řeší přirozené otázky stejného intentu.
- Originalita se nadále kalibruje proti #11–#25; #74 se nekopíruje vizuálně.

## 1. BUILD FREEZE

Do dokončení parity auditu:

- nezačínat #80 ani další recovery build,
- #75–#79 považovat za PROVISIONAL, ne za hotové recovery PASS,
- nic z lokálních recovery preview nepromovat do produkce jen na základě technického QA,
- nejdřív zmapovat quality debt na posledních 30 sekvencích #65–#94.

## 2. Co dělá #74 kvalitativním minimem

Povinné principy, nikoli konkrétní layout:

1. **Silný first-screen** — jasný user job, vysoká informační hustota, viditelná RV identita a téma bez prázdné dekorativní plochy.
2. **Produktový objekt pokračuje stránkou** — u #74 je tok `cena práce → hrubá → srážky → čistá`, nikoli pouze jedna hero grafika.
3. **Kalkulačka je hlavní produkt** — základní režim je jednoduchý, pokročilý režim zvládá reálné výjimky, vstupy mají vysvětlení a validaci.
4. **Výsledek není pouze headline KPI** — ukazuje hlavní odpověď, rozpad, kontext a praktické použití.
5. **Post-result hloubka řeší další přirozené otázky** — scénáře, co mění výsledek, limity, praktické použití, chyby, metodika a další krok podle šířky tématu.
6. **Copy je zákaznická** — žádné interní názvy produktu; každá věta má uživatelský účel.
7. **Metodika a hranice jsou transparentní** — u citlivých témat je jasné, co výpočet umí a neumí.
8. **Sekce mají choreografii** — stránka není série podobných boxů; kompozice se mění podle informace.
9. **Polish je konzistentní** — typografie, mezery, mikrocopy, stavy, hover/focus, mobile a footer působí jako jeden dokončený produkt.

## 3. QUALITY PARITY SCORECARD — HARD FAIL

Každá stránka se před preview porovná s #74 v sedmi oblastech, každá 0–5 bodů:

1. First-screen / brand / topic clarity
2. Calculator UX / input architecture / interaction states
3. Result clarity / decision value / decomposition
4. Same-intent depth / completeness / practical usefulness
5. Visual craft / section choreography / originality
6. Customer copy / methodology / trust / disclaimers
7. Mobile / accessibility / render / technical finish

### PASS

- minimálně **31 / 35**,
- žádná oblast pod **4 / 5**,
- technické PASS nesmí kompenzovat slabý produkt nebo design,
- u tématu srovnatelné či vyšší komplexity nesmí být same-intent depth nebo polish viditelně slabší než #74, i kdyby numerický součet vyšel.

### Automatický FAIL

- preview po jediném coding passu bez samostatného product/design review,
- jedna silná hero grafika maskuje slabý zbytek stránky,
- významná přirozená otázka stejného intentu zůstává bez odpovědi, přestože máme spolehlivý podklad,
- opakování stejné informace ve více blocích bez nové decision value,
- generický `H1 + karta vpravo + form + dark result + gridy` shell bez objektivního důvodu,
- vizuál působí jako prototyp / placeholder / jednoduchá CSS ilustrace, pokud téma snese kvalitnější produktový objekt,
- interní design/product copy v zákaznickém UI,
- full-page dojem je o úroveň slabší než #74.

## 4. Povinný tříprůchodový workflow

### PASS A — PRODUCT ARCHITECTURE

Ještě před kódem:

- Primary intent sentence
- Depth Map
- Decision-changing questions
- Calculation / data / legal-method audit
- Native product object
- Section choreography
- Golden Delta proti posledním 4 stránkám
- Benchmark Delta proti #74: co musí být stejně kvalitní a kde bude stránka jiná

Bez PASS A se nekóduje.

### PASS B — BUILD & INTERACTION

- kompletní desktop + mobile build,
- základní i pokročilé stavy, pokud je téma vyžaduje,
- reálné interakční scénáře,
- žádný polotovar nebo placeholder,
- kalkulační regression QA.

### PASS C — BENCHMARK PARITY REVIEW

Samostatný průchod po dokončení buildu, ne ve stejném momentu:

- full-page vizuální review 1440,
- full-page vizuální review 390,
- blok po bloku proti #74,
- Customer Copy Scan,
- Non-duplication Scan,
- Depth completeness review,
- whitespace / typography / density / rhythm review,
- interaction state review,
- scorecard 0–35.

Uživatel uvidí preview až po PASS C.

## 5. Recovery audit posledních 30 sekvencí

**Scope: #65–#94.**

Každá URL dostane jeden stav:

- `PASS` — minimálně úroveň #74 vzhledem ke své šířce tématu.
- `POLISH` — produkt je dobrý, chybí pouze cílený craft/depth uplift.
- `REWORK` — logika je dobrá, ale kompozice nebo hloubka je pod floor.
- `REBUILD` — stránka je strukturálně pod floor nebo příliš template-like.

Audit musí u každé stránky uvést:

- scorecard 7 oblastí,
- 3 nejsilnější stránky,
- konkrétní gap proti #74,
- potřebný zásah,
- prioritu P0 / P1 / P2,
- zda se mění pouze design/content, nebo i calculation/method.

**Předchozí odhad 14 recovery URL není automaticky platný pod novým quality floor. Počet se určí znovu.**

## 6. Pořadí nápravy

1. **P0:** znovu posoudit právě rozpracované #75–#79. Žádná není automaticky DONE jen proto, že prošla lokálním QA.
2. **P0/P1:** dokončit #80–#83 až po potvrzení flooru na předchozí recovery skupině.
3. **P1:** opravit další stránky z #65–#94 označené REBUILD / REWORK.
4. **P2:** cílený POLISH pouze tam, kde je gap skutečně malý.
5. Nové sekvence / nové URL obnovit až po stabilizaci recovery quality flooru.

## 7. Co se přestává dělat

- Nehonit počet dokončených kalkulaček za den.
- Nehodnotit kvalitu podle toho, kolik signature blocks stránka má.
- Nevyrábět grafiku jen proto, aby pravá strana hero nebyla prázdná.
- Nezaměňovat originalitu za zvláštní CSS objekt nebo nový název archetypu.
- Nepouštět preview po technickém QA bez druhého product/design průchodu.
- Nezkracovat komplexní témata na několik bloků jen proto, že předchozí stránka byla kratší.
- Nenatahovat úzké téma článkem bez nové decision value.

## 8. Release lock

Recovery page lze označit jako PASS pouze při současném splnění:

**CALCULATION + PRIMARY INTENT + #74 QUALITY PARITY + PAGE ORIGINALITY + CUSTOMER COPY + ADAPTIVE DEPTH + FULL-PAGE VISUAL REVIEW + MOBILE + TECHNICAL QA.**

#74 je kvalitativní minimum. #11–#25 jsou originality calibration. Oba benchmarky jsou povinné.