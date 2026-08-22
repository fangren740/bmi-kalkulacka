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

## 2026-08-21 — INDEX / KATALOG LINEAGE ACTIVATED od #44

Vizuální audit aktuálního `index.html` a `kalkulacky.html` ukázal, že samotné použití RV barev, loga a rounded panelů nestačí. Nová hlavní identita stojí na **editorial typografii + ručním značkování + skutečném product proof + asymetrickém workspace rytmu**. Od kalkulačky #44 je tento směr součástí BUILD LOCK a má přednost před kopírováním poslední dokončené kalkulačky.

### Povinný inheritance gate před buildem
- **Primary visual references:** vždy nejdřív aktuální `index.html` + `kalkulacky.html`, až potom tematický hub a sousední kalkulačky.
- **Editorial scale:** hero musí mít jasnou typografickou dominantu; nesmí končit jako standardní H1 + odstavec + dvě tlačítka v generickém dvousloupcovém layoutu.
- **Hand / marker signal:** minimálně jeden účelný ruční, doodle nebo markerový signál převzatý z hlavních stránek; na mobilu se redukuje, ne násobí.
- **Product proof:** pravá strana hero nesmí být pouze dekorativní karta. Musí vizualizovat konkrétní logiku nástroje a ideálně reagovat na vstupy.
- **Asymmetric rhythm:** stránka má pracovat s měřítkem, střídáním světlého/dark prostoru, datovou nebo metodickou plochou a rozdílnými kompozicemi; ne se sérií stejně velkých card gridů.
- **Decision continuity:** produkt vede uživatele v rytmu `Zadat → Spočítat → Pochopit → Rozhodnout`; tento princip musí být vidět v kalkulačce, výsledku i spodní části stránky.

### Release-blocking anti-boring gate
Visual gate = FAIL, pokud platí některé z následujících:
1. po odebrání loga hero působí jako zaměnitelný fintech/SaaS template;
2. hlavní product proof lze bez úprav vložit na jinou kalkulačku;
3. kalkulačka + výsledek jsou jen dvě anonymní zaoblené karty bez topic grammar;
4. první dvě mobilní obrazovky ztratí editorial charakter a product proof;
5. stránka pouze používá navy/blue/green, ale nepřenáší kompoziční jazyk indexu/katalogu.

### Povinný screenshot gate
Před release kontrolovat minimálně: **desktop hero, calculator + result, data/method, footer a mobilní první dvě obrazovky**. Product proof musí být na desktopu v prvním viewportu a na mobilu nejpozději v prvních dvou obrazovkách.

### Aktivace na #44 — Akontace a LTV hypotéky
- RV inheritance: editorial headline, ruční circle/doodle signál, nový header/footer lineage, navy/blue/green product canvas.
- Topic signature: zvýrazněné `20 %` a explicitní rozdíl kupní cena × bankovní odhad.
- Product signature: **Equity Blueprint** — živý řez financováním banka × vlastní zdroje napojený na výpočet.
- Calculator/result grammar: worksheet + branded result climax, nikoli dvě generické karty.
- Mobile identity: H1 → payoff → CTA → LTV proof → Equity Blueprint v prvních dvou obrazovkách.



## 2026-08-22 — #44 RECALIBRATION AFTER VISUAL REJECTION

První implementace #44 byla vizuálně odmítnuta, protože stále vycházela z logiky staré kalkulačky a novou identitu přidávala převážně jako skin. Tohle je od této chvíle explicitní **FAIL pattern**.

### Co se mění v BUILD LOCK
- **Rebuild znamená strukturální rebuild:** u stránky určené k full rebuildu se nesmí ponechat staré hero/work rozložení a jen na něj navěsit nový CSS skin.
- **Index-first composition:** nejdřív se navrhne editorial statement + topic-specific product canvas + decision workspace; teprve potom se do něj mapují existující vstupy a výpočtová logika.
- **Identity elements musí mít funkci:** doodle/marker zvýrazňuje klíčový princip, product canvas vysvětluje matematiku nástroje a dark/data plochy mění rytmus stránky. Dekorace bez role se nepočítá.
- **Legacy stylesheet gate:** po full rebuildu se ověří, zda stránka zbytečně nenačítá starý page-specific stylesheet. Pokud nový page system staré CSS nepotřebuje, legacy stylesheet se odpojí.
- **Screenshot rejection rule:** pokud desktop hero nebo první dvě mobilní obrazovky působí jako převlečená předchozí stránka, release se zastavuje bez ohledu na technický PASS.

### #44 po recalibraci
- centered editorial hero v měřítku aktuálního indexu;
- hand-circle + dva redukované doodle signály, nikoli dekorativní soup;
- samostatný browser-like **LTV Workspace** pod headline místo generické pravé hero karty;
- jedna souvislá pracovní plocha `Zadat → Spočítat → Pochopit → Rozhodnout` s tmavým výsledkovým climaxem;
- vlastní RV DATA sekce 70 / 80 / 90 a papírový price-vs-valuation explain panel;
- odpojený legacy `akontace-ltv-v4.css`;
- mobilní product proof zůstává v prvních dvou obrazovkách; horizontální overflow 0 px na 320 / 390 / 1440.
