# RychléVýpočty.cz V-next — Brand / Identity Audit

**Datum:** 21. 8. 2026  
**Rozsah:** index, katalog kalkulaček, Finance hub, poslední V-next kalkulačky a aktuální `kalkulacka-celkove-ceny-nemovitosti.html`.

## 1. Zjištění

### Co funguje na indexu / katalogu / hubech
- silná a okamžitá RV identita: navy + blue + green rail, vlastní brand field, plný header/footer;
- kombinace `hero copy + brand module`, nikoli jen text + běžná karta;
- jasné micro-signály produktu: index nástrojů, stavové čipy, search / quick actions, živý výpočet;
- kontrolovaný rytmus: světlé plochy střídají dark brand moduly, datové bloky a decision cesty;
- komponenty působí jako jeden produktový systém, ne jako samostatné landing pages.

### Kde se poslední V-next kalkulačky začaly rozcházet
- lokální CSS začalo příliš často stavět vlastní `white editorial page`, která používá logo, ale málo dalšího RV DNA;
- hero často sklouzl do stejného schématu `velký H1 + bílá výsledková karta vpravo`;
- mezi hero a footerem někdy chybí opakované brandové kotvy, takže stránka působí jako kvalitní microsite, ale ne dost jako RychléVýpočty.cz;
- signature visual system byl často produktově správný, ale značka se omezila na barvy;
- příliš mnoho sekcí používá neutrální karty bez společného systému rail / status / data / decision signalů.

## 2. Root cause

Dosavadní anti-template pravidlo hlídalo hlavně odlišnost kalkulaček mezi sebou. Chyběl rovnocenný **brand lineage gate**: nový tool se musí porovnávat nejen s posledními třemi V-next stránkami, ale také s indexem, katalogem a relevantním hubem.

Výsledkem byla lokální originalita, ale postupný drift od hlavní produktové identity.

## 3. Nový třívrstvý vizuální model

Každá významná V-next stránka od nynějška používá tři vrstvy současně:

1. **RV CORE** — logo, brand field / rail, status/data jazyk, plný footer, typografická a spacing rodina.
2. **TOPIC GRAMMAR** — finance, bydlení, podnikání, stavba atd.; tématické znaky a informační metafora.
3. **PRODUCT PROOF** — konkrétní vizuální důkaz kalkulačky: receipt, timeline, waterfall, map, gauge, material cutaway, A/B board atd.

Pokud je přítomná jen vrstva 2 + 3, stránka může být hezká, ale není dost RV. Pokud je přítomná jen vrstva 1, stránka je template.

## 4. Nový pre-build identity gate

Před BUILD LOCK se povinně vyplní:
- **RV inheritance:** které 3–5 prvků z indexu / katalogu / relevantního hubu stránka vědomě dědí;
- **topic signature:** jak je na první pohled poznat konkrétní téma;
- **product signature:** jaký vizuální blok patří pouze tomuto toolu;
- **section rhythm:** kde se mění světlá / dark / diagram / data / editorial gramatika;
- **mobile identity:** co z brandu zůstane v prvních 2 obrazovkách mobilu.

## 5. Povinné brand kotvy na stránce

Významná kalkulačka má standardně:
- header v RV V3.2 rodině;
- hero s viditelnou RV identity vrstvou, ne pouze logem;
- minimálně jednu brandovou micro-kotvu u kalkulačky/výsledku (rail, RV status, result system, cut corner, grid/field apod.);
- datovou sekci jasně označenou `RV DATA`, pokud benchmark existuje;
- další alespoň jednu identitní kotvu ve spodní polovině stránky;
- plný `rv-brand-footer`.

Brand kotvy nesmí být dekorace bez funkce. Musí pomáhat hierarchii, orientaci nebo důvěře.

## 6. Identity QA score (0–2 za bod)

Před release hodnotit:
1. rozpoznatelnost RychléVýpočty.cz bez čtení loga;
2. tematická rozpoznatelnost;
3. unikátní product visual proof;
4. rytmus celé stránky;
5. konzistence formuláře/výsledku s RV systémem;
6. datová/metodická identita;
7. footer / next-step integrace;
8. mobilní první dvě obrazovky.

**Minimum pro RELEASE_CANDIDATE: 13 / 16 a žádná nula v bodech 1–5.**

## 7. Aplikace na #42 Celková cena nemovitosti

Původní verze byla obsahově a metodicky silná, ale identity score bylo přibližně **9/16**: zejména hero, calculator shell a spodní polovina byly příliš neutrální.

Upgrade 21. 8. 2026 přidává:
- skutečné `rv-identity-hero` dědictví z indexu/hubů;
- RV brand stamp + page code;
- výraznější closing-receipt jako produktový důkaz;
- brand rail / cut-corner / grid identity na kalkulačce a výsledku;
- jasný `RV DATA` lockup;
- propojenou closing timeline místo tří izolovaných karet;
- brand field ve spodní části stránky;
- plný `rv-brand-footer`.

Tento audit je nový závazný podklad pro další V-next buildy.



## Quiet Luxury correction — povinné od 21. 8. 2026

RychléVýpočty.cz má působit **luxusně, ale jednoduše luxusně**. Brand recognition nevzniká počtem dekorací, ale konzistencí, hierarchií, typografií, spacingem a několika přesnými signály.

### Hard rules
- **Jedna dominantní brand kotva na viewport.** Nekombinovat současně stamp + page code + vertikální rail + watermark + grid + cut-corner, pokud to nemá jasný funkční důvod.
- Hero standardně používá pouze: shared header/logo, jeden jemný RV signál (např. tri-color rail/line), tématický product proof a čistou typografii.
- `RV CORE` je primárně **systém**, ne ornament: navy/blue/green rodina, čisté radiusy, důsledný spacing, result/status language, RV DATA a plný footer.
- Dekorace mají rozpočet: **max. 2 nefukční vizuální vrstvy v hero**, z toho pouze jedna může být výrazná.
- Pokud odstranění dekorace zlepší čitelnost a produkt neztratí identitu, dekorace se odstraní.
- Preferovat **quiet confidence**: hodně vzduchu, přesné alignmenty, jeden silný vizuální proof, žádný „dashboard cosplay“.
- Hero nesmí připomínat interní dashboard, design-system demo ani konferenční slide.
- Product proof má být výraznější než brand ornament. Uživatel má nejprve pochopit výpočet, až potom vnímat design.
- Na mobilu se brand vrstvy dále redukují; priorita je H1 → payoff → CTA → výsledek.

### Anti-overdesign gate
Visual gate = FAIL, pokud:
- hero obsahuje 3+ konkurenční identity prvky;
- je v prvním viewportu více malých štítků/kódů než skutečných informací;
- více než jeden blok používá cut-corner / grid / rail jen kvůli vzhledu;
- stránka působí „víc navržená než užitečná“.

Cíl: **Apple-like restraint, ne sterilita; prémiová přesnost, ne vizuální exhibice.**


## 2026-08-21 — Identity Continuity correction: Quiet Luxury ≠ generic microsite

Poslední vizuální audit ukázal druhý extrém: po omezení dekorací některé V-next kalkulačky zůstaly sice čisté, ale působily jako kvalitní generická microsite. To je stejně nežádoucí jako overdesign.

### Povinné minimum shared RV identity
Každá významná kalkulačka musí ve finálním DOM/CSS skutečně použít, ne pouze deklarovat, alespoň tyto funkční vrstvy:
1. **Hero lineage:** shared `rv-identity-hero` nebo kvalitativně rovnocenný RV brand field + tematický product proof.
2. **Value moment:** shared result language (`rv-brand-result`, RV rail/status/result caption nebo ekvivalent) v calculator/result zóně.
3. **Mid-page continuity:** alespoň jedna funkční RV kotva mimo hero a footer — typicky RV DATA, scope comparison, method flow nebo decision route.
4. **Footer lineage:** tmavý footer vždy používá inverse logo asset + RV 4-step signature `Zadat → Spočítat → Pochopit → Rozhodnout` u hlavních V-next produktů.

### Anti-generic gate
Před release povinně zkontroluj 4 screenshoty: **hero / calculator+result / data-or-method / footer**. U každého polož otázku: „Kdybych odstranil logo, poznám podle produktu, typografie, railů, result language a kompozice, že jde o RychléVýpočty.cz?“ Pokud jsou 2 nebo více oblastí zaměnitelné s generickým SaaS/fintech template, visual gate = FAIL.

### Restraint balance
- Quiet Luxury omezuje **dekorace**, nikoli **identitu**.
- Shared brand primitive má přednost před novým lokálním ornamentem.
- Max. jedna dominantní identity vrstva v jednom viewportu, ale identita se musí opakovat funkčně napříč stránkou.
- `logo-rv-v32.svg` patří na světlý povrch; `logo-rv-v32-inverse.svg` na tmavý footer. Tohle je release-blocking kontrola.
- Produktový proof musí zůstat hlavní hvězdou; brand system ho rámuje, ne překrývá.

### Procesní změna
BUILD LOCK nově obsahuje explicitní řádek `Shared RV primitives to be used:` s konkrétními CSS/HTML třídami nebo komponentami. Obecná formulace „bude tam identita“ nestačí.

## 2026-08-22 — Identity lineage without homepage cloning

Index, katalog a tematické huby jsou od této chvíle **referencí identity**, nikoli povinnou kostrou kalkulaček. Shared RV lineage se dědí přes několik přesných primitiv (barvy, rail/status/result language, typografii, jeden hand-drawn signál, RV metodiku/data a footer), ale kompozice kalkulačky se vždy řídí jejím vlastním user jobem.

### BUILD LOCK
- **Primary product reference:** nejprve současná kalkulačka + nejlepší dokončené V-next kalkulačky se srovnatelným user jobem; index/katalog/hub slouží jako kontrola brand lineage, ne jako layout template.
- **Preserve/evolve when strong:** pokud existující archetyp správně řeší intent, zachová se a vylepší. Full rebuild neznamená automaticky nový layout od nuly.
- **Shared RV primitives:** vědomě použít 3–5 funkčních prvků RV systému (např. `rv-identity-hero`, category rail/status, `rv-brand-result`, RV METODIKA/DATA, inverse footer + 4-step signature).
- **Topic-native product proof:** hlavní vizuální důkaz musí patřit konkrétnímu výpočtu. Dekorace ho pouze rámuje.
- **Graphic budget:** v jednom viewportu zpravidla jeden hlavní product proof + přibližně 1–2 sekundární akcenty. Pokud další doodle/rail/marker nepomáhá orientaci nebo významu, odstranit.
- **Section choreography:** délka, rytmus a množství sekcí jsou intent-driven; nepřevádět dlouhé stránky na jednotný grid karet.
- **Mobile identity:** na mobilu zůstává H1 → payoff → hlavní vstup/výsledek; dekorace se redukují dříve než produkt.

### Aktivace na #44 — Akontace a LTV hypotéky
#44 zachovává vlastní dvousloupcový archetyp **LTV Equity Planneru**, protože odpovídá jobu „kolik vlastních peněz budu potřebovat a co se stane při nižším bankovním odhadu“. Není to homepage workspace clone.

- RV inheritance: shared header/logo, `rv-identity-hero`, jemný tri-color rail, calculator category rail, branded result, RV METODIKA a inverse footer s `Zadat → Spočítat → Pochopit → Rozhodnout`.
- Topic signature: dům/klíč + živý LTV proof; funkční rozdělení `Banka × vlastní podíl`; LTV ring/valuation logic.
- Secondary signature moments: scénářové „papers“, editorial mistake ledger a časová cesta koupě.
- Quiet Luxury correction: po auditu byl odstraněn nadbytečný zelený burst v hero; product proof zůstává dominantní a hand-drawn circle je jediný výraznější nefunkční hero akcent.
- Anti-template comparison #41–#44: PASS. Stránky sdílejí RV rodinu, ale #44 má vlastní result archetyp, finanční dramaturgii a výrazně větší intent-driven hloubku.

## 2026-08-22 — Portfolio uniqueness + graphic accent calibration

User feedback clarified the intended balance after an overdesigned LTV iteration. This is now a release rule:

- **No universal calculator template.** Each calculator keeps a composition, page length, content depth, result archetype and signature blocks that fit its own user job. Two consecutive calculators must not become text/color swaps of the same shell.
- **Uniqueness is product-led, not chaos-led.** A full rebuild does not require importing homepage composition into every calculator. Existing strong V-next calculator archetypes may be preserved and evolved when they already fit the intent.
- **Graphic identity grows as a library.** Add a small number of topic-appropriate RV hand-drawn / doodle / rail / marker motifs per page; keep inventing new motifs across the portfolio instead of repeating the same 4–5 graphics everywhere.
- **Default graphic budget:** one main topic-native visual proof plus roughly 1–2 secondary graphic accents in a viewport/section. Decorative graphics must not overpower the calculator.
- **Box modernization is selective.** Replace weak legacy cards/results when it improves hierarchy; do not rebuild every section into the newest card pattern.
- **Length remains intent-driven.** Simple calculators can be short; YMYL or decision-heavy tools can be substantially deeper. Never normalize pages to a shared word count.
- **Visual comparison target:** same RV family, different product. If a page can be converted into the previous calculator by swapping copy, release = FAIL. If it looks like a one-off design experiment unrelated to finished RV calculators, release = FAIL too.


## 2026-08-22 — #44 Full prompt-compliance audit after contrast rejection

Opakovaný audit #44 proti `RV_VNEXT_MASTER_PROMPT.txt`, `RV-VNEXT-PRODUCTION-STANDARD.md`, `RV-VNEXT-EXPERIENCE-STANDARD-V2.md` a tomuto identity auditu odhalil, že předchozí release candidate **nebyl plně compliant**. Hlavní vady byly systémové, ne pouze kosmetické.

### Release-blocking nálezy a opravy
- **Kontrast / shared CSS collision:** formulář měl omylem `rv-brand-module`, takže shared CSS ztmavilo plochu bez odpovídajícího textového tématu. Třída byla odstraněna. Broad local heading selector zároveň přepisoval světlé nadpisy dark sekcí; selektory byly omezeny a dark Decision/Method sekce mají explicitní kontrastní tokeny.
- **Primary intent / hidden defaults:** rychlý režim dříve skrytě připočítával 200 000 Kč vedlejších nákladů a podrobný režim měl další nenulové skryté defaulty. Všechny volitelné náklady a stres jsou nyní defaultně 0; rychlý režim transparentně předpokládá bankovní hodnotu = kupní cena, dokud uživatel nepřejde do podrobného režimu.
- **Metodika LTV:** dominantní KPI je `LTV nového úvěru = nový úvěr / hodnota zajištění`. Konzervativní model prostoru při další zástavě a existujícím dluhu je odděleně popsán jako RV plánovací model, nikoli jako oficiální definice ČNB nebo příslib banky.
- **Investment scenario:** 70 % / DTI 7 je označeno jako doporučení ČNB pro investiční hypotéky, ne jako obecně závazný limit pro vlastní bydlení.
- **RV lineage:** kalkulačka používá `rv-brand-calculator` + category rail, `rv-brand-result`, `/rv-brand-v32.js`, RV METODIKA a inverse footer.
- **Accessibility:** 3-step advanced UI má kompletní `tablist/tab/tabpanel`, `aria-controls`, `aria-labelledby`, roving `tabindex` a Arrow/Home/End keyboard model.
- **Social Icon Gate:** footer #44 používá icon-only Facebook/Instagram s aria-label a 44×44 hit area. Stejný opakující se defekt byl nalezen a TECHNICAL_QA opraven i na 7 starších dokončených V-next stránkách; jejich MAJOR HOLD data se tím neresetují.
- **Sensitive-finance disclaimer:** footer obsahuje page-specific upozornění, že výsledek je orientační plánovací model a individuální schválení určuje banka.
- **Dedicated OG:** #44 má vlastní 1200×630 OG asset.
- **Section choreography:** série stejných card gridů byla rozbita — mistakes jsou editorial ledger, audit/check část používá jinou dvousloupcovou gramatiku a vlastní full-width callout.
- **Quiet Luxury:** nadbytečný hero burst byl odstraněn; hlavní topic-native proof zůstává dominantní.

### Uniqueness / length gate
PASS. #44 má přibližně 3,1 tis. slov a 22 hlavních sekcí, zatímco bezprostřední #41–#43 jsou přibližně 0,95–1,2 tis. slov a 8–11 sekcí. Rozdíl není kvóta, ale důsledek YMYL/decision-heavy intentu. #44 se nesmí zkracovat ani přepisovat do stejného template jen kvůli vizuální uniformitě.

### Local release status
- responsive browser QA: 320 / 360 / 390 / 768 / 1024 / 1280 / 1366 / 1440 px, 0 px horizontal overflow;
- browser runtime errors: 0;
- JS syntax: PASS;
- structural accessibility lint: PASS;
- all completed/current V-next regression lint after social sweep: PASS;
- deterministic finance fixtures: PASS;
- contrast: manual verification against actual dark gradient stops passes WCAG AA for relevant text; automatic walker cannot correctly resolve gradient backgrounds and its transparent-background false positives se nepoužívají jako verdict.

**Status = RELEASE_CANDIDATE.** `DONE` je zakázáno do skutečného post-deploy production PageSpeed/Lighthouse testu.

## MODERN PRODUCT UI CALIBRATION — FROM #50 (2026-08-22)

User visual direction after the #49 gate:

- Default typography direction should move toward a **modern sans / product / fintech UI** rather than editorial-serif or paper-document styling.
- Prefer clean grotesk/system-sans stacks, strong numerical hierarchy, tabular figures, crisp grids, restrained gradients and contemporary product dashboards where the intent supports them.
- Serif, paper cards, stamps and editorial motifs are **not forbidden**, but they are no longer the default. Use them only when the calculator's user job genuinely benefits from that metaphor.
- This is **not a new universal template**. Each calculator must still have its own archetype, length, information rhythm, result language, benchmark treatment and signature visual proof.
- The anti-template gate remains mandatory: modern typography is a shared direction, not permission to clone the same SaaS dashboard on every URL.


## 2026-08-23 — Anti-generic visual rejection gate after #51

Technický PASS (`0 overflow`, validní JS, accessibility, správná numerika) **není vizuální PASS**. Po odmítnutí první verze #51 je závazné:

- U FULL CLEAN REBUILD nesmí být nový produkt jen `hero + karta / formulář + result / tmavá tabulka`. Pokud stránka po odstranění copy působí jako generický SaaS/fintech shell, release = FAIL.
- Před release se povinně renderují a ručně hodnotí minimálně čtyři pohledy: **desktop hero**, **calculator + result**, **benchmark/data**, **mobile top + primary result**.
- Nový archetyp musí být viditelný v nejméně dvou částech stránky mimo copy. Nestačí ho pojmenovat v trackeru.
- Modern Product UI znamená moderní typografii a hierarchii, nikoli uniformní dashboard template. Topic-native product proof má přednost před generickými kartami.
- Pokud uživatel vizuální verzi zamítne jako nedotaženou, další iterace se nesmí dělat override patchováním stejného shellu. Povinný je nový build lock a při FULL REBUILD nový namespacovaný shell; ze zamítnuté verze se smí převzít matematika, fakta a validní dataset.
- #51 re-build reference: **Auto Finance Cockpit** používá tři nativní momenty — cockpit v hero, cash-trail v hlavním výsledku a 25scénářovou Balloon Map. Tyto prvky jsou referencí laťky, nikoli template pro další URL.
