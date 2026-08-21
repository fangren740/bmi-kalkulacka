# RychléVýpočty.cz V-next — Experience Standard v2

**Revize:** 21. 8. 2026  
**Verze:** 2.4  
**Účel:** závazná produktová a UX nadstavba nad `RV-VNEXT-PRODUCTION-STANDARD.md` pro nové kalkulačky, decision tooly, trackery a lookupy.

## 0. Proč v2 vzniká

Technicky správný výpočet, užitečný obsah, zdroje a čistý responsive layout už nejsou konkurenční výhoda. Jsou vstupní podmínka. V-next v2 má zabránit tomu, aby nové produkty skončily jako série zaměnitelných „formulář + tmavý box + článek“ stránek.

**Cíl:** každý významný nový tool musí být na první pohled konkrétní produkt pro konkrétní situaci a během několika sekund dát uživateli pocit: „Tady přesně vyřeším svůj problém.“

---

## 1. Product thesis před designem

Před HTML musí být jednou větou vyplněno:

> **Když uživatel přijde s [situací], zadá [minimum], získá [rozhodnutí/odpověď] a hned pochopí [důsledek].**

Pokud věta popisuje pouze matematickou operaci, produkt není dostatečně navržený.

Každý tool musí mít:
- **primární otázku** — lidskou, ne právní/technickou;
- **moment rozhodnutí** — co uživatel po výsledku ví nebo udělá;
- **jednu vlastní produktovou výhodu**, kterou konkurence typicky nemá;
- **jednu věc, kterou záměrně neřeší**, pokud by falešná přesnost byla horší než omezení.

---

## 2. Vlastní vizuální gramatika každého produktu

### 2.1 Premium page dramaturgy — hero nestačí
- Vizuální originalita se hodnotí přes **celou stránku**, ne pouze první viewport.
- Každá významná kalkulačka musí mít nejméně **2 signature visual blocks mimo hero**, které vycházejí z jejího problému (material atlas, technical cutaway, decision console, timeline, route/map, scenario board, data plot, system matrix…).
- Ne více než **2 po sobě jdoucí hlavní sekce** ve formátu `headline + grid stejných cards`. Poté musí přijít změna rytmu, měřítka nebo vizuálního jazyka.
- Dark card + KPI grid není automatický premium pattern. Používat ho jen tehdy, když je výsledková/dashboardová logika nativní pro user job.
- Před BUILD LOCK proveď **3-page anti-template comparison** proti posledním třem V-next produktům. Cíl: stejná brand rodina, ale jiná kompozice, signature bloky a vizuální metafora.
- Premium ≠ více dekorací. Premium = lepší hierarchie, vlastní vizuální metafora, kontrolovaný prostor, kvalitní microdetail a jasná dramaturgie.


Hero a výsledek se nesmí skládat automaticky ze stejného dashboardu.

Před buildem se vybere **nativní vizuální archetyp podle problému**:
- **timeline** — termíny, lhůty, pracovní poměr, splatnost;
- **A/B comparison** — úvěr vs. úvěr, nájem vs. koupě, dvě varianty pravidel;
- **flow / decision tree** — legislativní podmínky, nárok, režim;
- **stack / waterfall** — mzda, cena, daně, rozpad částky;
- **gauge / threshold** — limity, DPH obrat, LTV, rezerva;
- **map / route** — cestovní náhrady a geografie;
- **calendar / heatmap** — pracovní dny, dovolená, směny;
- **material scene** — stavba, objem, plocha, počet balení;
- **scenario canvas** — několik lidských situací s jasným rozdílem výsledků.

### Hard rule
**Dvě po sobě jdoucí V-next kalkulačky nesmí mít stejnou hero kompozici a stejný hlavní výsledkový archetyp**, pokud to není objektivně nejlepší řešení obou intentů.

Dekorativní grafika bez informační role se nepovažuje za diferenciaci.

---


## 2.2 Brand Lineage / Project Identity Gate — povinné od 21. 8. 2026

V-next nesmí vytvořit sérii kvalitních, ale vzájemně izolovaných microsites. Každý významný tool musí vizuálně patřit do stejného produktu jako `index.html`, `kalkulacky.html` a relevantní hub.

### Třívrstvý model
Každá stránka kombinuje:
1. **RV CORE** — sdílená identita projektu;
2. **TOPIC GRAMMAR** — vizuální jazyk tématu;
3. **PRODUCT PROOF** — nativní vizuální důkaz konkrétního výpočtu.

### Povinný benchmark před BUILD LOCK
Novou stránku porovnej současně s:
- indexem;
- katalogem kalkulaček;
- relevantním tematickým hubem;
- posledními 3 V-next produkty.

Anti-template test bez tohoto brandového srovnání je neúplný. Cíl je **stejná značka, jiný produkt**, nikoli „jiná microsite se stejným logem“.

### Minimum identity kotvení
Významná kalkulačka standardně obsahuje:
- shared RV header / navigační rodinu;
- hero identity layer (`rv-identity-hero` nebo kvalitativně rovnocenné řešení);
- RV rail / field / status / result-system nebo jiný funkční brand signal v calculator/result zóně;
- `RV DATA` identitu, pokud je datový benchmark;
- další brandovou kotvu ve spodní polovině stránky;
- plný `rv-brand-footer`.

Pouhá barevná paleta nebo logo se za splnění nepovažují.

### Identity QA score
Hodnoť 0–2: brand recognition, topic recognition, product proof, page rhythm, calculator/result integration, data/method identity, footer/next-step, mobile identity.

**Release floor: 13/16 a žádná nula v prvních pěti bodech.**

Detailní audit a rationale: `RV-VNEXT-IDENTITY-AUDIT-2026-08-21.md`.

## 3. Hero musí prodat užitek, ne šablonu

První viewport musí obsahovat:
1. **viditelnou identitu RychléVýpočty.cz**;
2. lidský H1, ideálně do 8–12 slov;
3. jednu větu s konkrétním payoffem;
4. primární CTA do výpočtu;
5. **tematický vizuální důkaz** — ne generický dashboard;
6. nejvýše 3–4 důvěryhodnostní signály.

Hero vizuál musí odpovědět alespoň na jednu otázku:
- Co se bude počítat?
- Jaký faktor výsledek mění?
- Jaký rozdíl mezi variantami může vzniknout?
- Jak vypadá cesta od vstupu k výsledku?

### 3.1 Hero identity / watermark layer — povinné od 18. 8. 2026
Hero se posuzuje i jako vizuální brandový povrch. Funkčně správný, ale prázdný nebo sterilní první viewport není dostatečný.

Každý významný hero musí mít alespoň jednu smysluplnou vrstvu, u hlavních produktů ideálně kombinaci:
- **RV brand watermark/pattern** — fragment loga, šipka, grid, diagonála, linework nebo jiný jemný motiv;
- **topic watermark** — vizuální stopa konkrétního tématu;
- **product visual proof** — mini scénář, schéma, timeline, vrstvy, nákupní řádek, mini-výsledek apod.

Pravidla:
- dovolena je malá knihovna opakovaně použitelných RV watermarků, ale společný motiv se vždy tematicky adaptuje;
- watermark je low-contrast a nesmí soupeřit s H1/CTA;
- preferovat CSS/SVG, případně lokální lehké assety; nevytvářet těžkou dekoraci bez užitku;
- hero musí zůstat silný na desktopu i mobilu a při 200% zoomu;
- generický gradient se nepovažuje za identitní vrstvu;
- pokud po odstranění textu není hero vizuálně rozpoznatelné jako konkrétní RV produkt nebo alespoň tematicky ukotvené, visual gate není splněn.

### 3.2 Hero distinctiveness gate — presence ≠ quality
Hero nesplní standard jen tím, že obsahuje watermark. Před zamknutím musí projít čtyřmi otázkami:
1. **Relevance:** vysvětluje vizuální motiv něco z problému nebo rozhodnutí?
2. **Distinctiveness:** je motiv přirozeně jiný než u předchozí kalkulačky?
3. **Brand integration:** působí jako RV produkt, ne jako náhodná stock dekorace?
4. **Composition:** zvyšuje vizuální energii stránky, aniž by soutěžil s H1 a CTA?

Pouhý velký text tématu v nízké opacity = podpůrná vrstva, nikoli signaturní hero. U odborných produktů preferovat nativní vizuální logiku problému: technický řez, tok, skladbu, měřítko, graf závislosti, mapu rozhodnutí, timeline apod.

Před BUILD LOCK musí být zapsána věta: **„Tento hero vizuál patří právě sem, protože …“**. Pokud ji nelze přesvědčivě dokončit, hero se vrací do návrhu.

**Zakázané defaulty:** obří H1 jen proto, aby byl „premium“; tmavý panel vpravo bez informační funkce; série generických KPI karet; falešná statistika nebo testimonial; sterilní textová plocha bez brand/topic identity, pokud není vědomě odůvodněná.

---

### 3.3 Content Sufficiency / Authority Gate
Design a výpočet nejsou hotový produkt, pokud stránka po výsledku nepokrývá relevantní rozhodovací kontext. Před buildem vznikne **CONTENT COVERAGE MATRIX**:
- výběr správného vstupu / produktu / režimu;
- interpretace výsledku;
- compare / delta scénář;
- chyby a edge cases;
- metodická hranice a co nástroj záměrně neřeší;
- konkrétní worked example;
- primární zdroje / data;
- next action.

Každý bod se označí `RELEVANT` nebo `N/A`. Release je FAIL, pokud některý `RELEVANT` bod není na stránce skutečně pokryt. Nejde o počet sekcí ani slov; několik bodů lze spojit do jednoho silného modulu.

**Authority floor pro odborná témata:** správný výběrový kontext + interpretace + metodická hranice + worked example/compare + častá chyba + primární zdroj.

Povinný test: **„Po výpočtu — jakou zásadní otázku by uživatel ještě musel hned googlit, aby mohl bezpečně udělat stejné rozhodnutí?“** Pokud existuje zjevná odpověď v rámci stejného intentu, stránka je příliš stručná.

---

## 4. Progressive disclosure: složitost až ve chvíli, kdy je potřeba

Výchozí cesta žádá pouze údaje nutné k bezpečné odpovědi.

RV pravidla:
- **Basic = nejkratší bezpečná cesta k výsledku.**
- Advanced nepřidává dekoraci, ale jiný stupeň kontroly/přesnosti.
- Pole se objevují podmíněně podle předchozí volby.
- Nezobrazovat 12 polí, pokud uživatel potřebuje 3.
- Essential informace nesmí být schovaná v `<details>`.
- Select nepoužívat jako reflex; pro 2–5 srozumitelných možností preferovat radio/choice cards.
- U legitimní nejistoty nabídnout „Nevím / nejsem si jistý“ a vysvětlit dopad.

---

## 5. Formulář je rozhraní, ne tabulka polí

### Field-row contract
Každá desktopová dvojice polí musí mít stejnou vertikální strukturu:
`label zone → control zone → helper/error zone`.

- standardní control min-height: **52 px**;
- interní touch target: **min. 44×44 px**;
- běžný text/helper musí mít kontrast minimálně **4.5:1**; velký text minimálně **3:1**;
- vlastní widget není hotový jen vizuálně: semantic role model + keyboard model musí být kompletní;
- `tablist` bez skutečných `tab` potomků je release FAIL, stejně jako `aria-selected` na prvku bez odpovídající role;
- accessibility tree musí být smysluplný pro screen reader i agentní procházení; generické `div` s `aria-label` bez vhodné role nepoužívat.
- delší label nesmí posunout vedlejší control;
- helper text nesmí posunout control, pouze obsah pod ním;
- na mobilu vždy jedna jasná čtecí osa;
- jednotka je vizuálně svázaná s číslem;
- input state: default / focus / valid-info / warning / error;
- error nezmaže zadanou hodnotu.

### Validation
Nehlásit chybu uprostřed psaní, pokud nejde o okamžitý fyzikální/technický limit. Po dokončení vstupu musí chyba říct **co je špatně a jak to opravit**, ne pouze „neplatná hodnota“.

---

## 6. Výsledek: Answer → Why → Delta → Next action → Trust

Výsledkový panel má pět vrstev v tomto pořadí:

1. **ANSWER** — největší konkrétní odpověď.
2. **WHY** — 1–3 důvody, které ji určily.
3. **DELTA / CONTEXT** — co by se změnilo u jiné relevantní varianty, limitu nebo scénáře.
4. **NEXT ACTION** — co s výsledkem může uživatel udělat dál.
5. **TRUST** — režim, datum metodiky, zdroj, omezení.

Výsledek není hotový, pokud uživatel musí číst článek, aby pochopil význam čísla.

### Stavové výsledky
Některé decision tooly nemají vždy „jedno číslo“. V takovém případě je legitimní výstup:
- „platí / neplatí“;
- „standardní / speciální režim“;
- „lze spočítat / je nutné individuální posouzení“.

Poctivá nejistota je lepší než falešná přesnost.

---

## 7. Compare mode a scénáře

Když rozhodnutí přirozeně obsahuje dvě varianty, musí být rozdíl vidět **současně**, ne v oddělených tabech.

Silný compare pattern obsahuje:
- Variant A / Variant B;
- absolutní rozdíl;
- relativní nebo kalendářní rozdíl, pokud dává smysl;
- text „proč se liší“;
- explicitní upozornění, pokud nejde říct, která varianta je obecně lepší.

Tabs nejsou vhodné pro data, která uživatel potřebuje porovnat současně.

---

## 8. Data visualization = vizuální důkaz

Graf nebo diagram smí existovat pouze tehdy, když odpovídá na otázku, kterou uživatel skutečně má.

Povinně musí mít:
- jasnou větu před grafem („Co na něm vidím“);
- čitelné hodnoty bez hoveru;
- alternativní textovou interpretaci;
- žádný 3D, dekorativní donut nebo mikro-graf bez rozhodovací hodnoty.

**RV DATA benchmark nemá být automaticky sekce dole.** Pokud insight pomáhá rozhodnutí, může se promítnout přímo do výsledku jako percentil, rozdíl, scénář nebo modelová osa.

---

## 9. Calculator as a working object

Kde to dává smysl, tool má podporovat pokračování práce:
- Kopírovat výsledek.
- Sdílet konkrétní scénář přes URL parametry (bez osobních/senzitivních údajů).
- Resetovat na transparentní výchozí stav.
- Užitečné vstupy lze zachovat lokálně pouze tam, kde to nevyvolává privacy problém.
- Odkázat na primární zdroj/metodiku přímo z výsledku.

Sdílený link musí po otevření reprodukovat stejný výpočet.

---

## 10. Microinteractions a rychlost

Motion má vysvětlovat změnu, ne dokazovat, že stránka má JavaScript.

- běžné přechody cca **150–250 ms**;
- změněný faktor může krátce zvýraznit příslušnou část výsledku;
- žádné nekonečné animace v pracovním rozhraní;
- respektovat `prefers-reduced-motion`;
- výpočet nesmí čekat na animaci;
- cíl **INP ≤ 200 ms na 75. percentilu**;
- nepřidávat framework nebo velkou knihovnu kvůli jednomu efektu.

---

## 11. Trust musí být kontextový

U citlivých témat nestačí zdroje vespod.

V místě výsledku má být vidět:
- která pravidla/režim se použily;
- datum metodické kontroly;
- zda jde o zákonný fakt, model RV nebo uživatelský předpoklad;
- relevantní omezení;
- přímý odkaz na primární zdroj.

Disclaimer má být konkrétní k riziku stránky, ne univerzální právnická věta zkopírovaná na 100 URL.

---

## 12. Vizuální anti-repetition gate

Před release se stránka porovná s předchozími 3 V-next produkty.

Fail, pokud:
- hero má stejnou kompozici bez věcného důvodu;
- používáme stejný tmavý „dashboard“ jako dominantní plochu;
- stejné 3–4 karty pouze mění text;
- DATA sekce je mechanická kopie;
- stránka po odstranění loga není tematicky rozpoznatelná;
- hero je pouze textová/prázdná plocha bez smysluplné identity layer a bez vědomého produktového důvodu.

Praktické pravidlo: v jednom viewportu nemá být více než **jedna dominantní tmavá informační plocha**, pokud další nemá odlišnou a nezbytnou funkci.

---

## 13. Accessibility / reflow nad minimum

- Reflow bez ztráty funkcí na **320 CSS px**.
- Interní RV touch target 44×44 px.
- Viditelný keyboard focus; sticky prvky nesmí focus zakrývat.
- Žádná funkce pouze dragem.
- Barva nikdy není jediný nositel významu.
- Výsledkové změny oznámit vhodným `aria-live`, ale nezahlcovat screen reader při každém stisku klávesy.
- 200% zoom jako povinná vizuální kontrola.
- Accessibility contract se zamyká ve COMPONENT LOCK před buildem: u custom widgetu je předem jasné, zda je to native control nebo ARIA pattern, jak se tabuje, jak fungují šipky/Home/End/Space/Enter a co je `aria-live`.
- Jakmile post-deploy audit odhalí opakovatelný pattern, následuje portfolio regression sweep před další kalkulačkou; izolovaný hotfix bez aktualizace standardu/linteru je nedostatečný.

---

## 14. Visual regression matrix — povinná před release

Každý nový V-next tool se kontroluje minimálně na:

**Šířky:** 320 / 360 / 390 / 768 / 1024 / 1280 / 1366 / 1440 px.

**Stavy:**
- default;
- nejkratší i nejdelší label;
- prázdná hodnota;
- hraniční minimum/maximum;
- Basic / Advanced;
- conditionally revealed fields;
- error / warning / uncertainty;
- keyboard focus;
- hover;
- výsledek s nejdelším textem;
- 200% zoom;
- reduced motion.

**Layout assertions:**
- horizontal overflow = 0;
- paired controls baseline delta = 0–2 px;
- žádný grid item není nevědomky `stretch` na výšku dlouhého souseda;
- žádný `top` offset bez odpovídajícího positioning contextu;
- computed CSS po načtení `rv-brand-v32.css` odpovídá záměru;
- sticky header + anchor neskrývá nadpis;
- výsledek nevstupuje do další sekce při scrollu;
- první viewport na 1366×768 obsahuje payoff + CTA a neztrácí produkt pod foldem;
- hero identity layer je viditelná, ale neruší text/CTA a nezpůsobuje reflow/overflow.

---

## 15. Experience release gate — 16 otázek

Release pouze pokud je 16× ANO:

1. Poznám za 5 sekund, co tool řeší?
2. Je hero tematicky unikátní a současně zjevně RV?
3. Má hero jemnou brand/topic identity layer nebo product visual proof, takže nepůsobí sterilně?
4. Má vizuál informační funkci?
5. Ptáme se jen na údaje, které skutečně potřebujeme?
6. Je Basic cesta rychlá?
7. Přidává Advanced skutečnou hodnotu?
8. Je hlavní odpověď čitelná bez článku?
9. Vysvětlujeme, proč výsledek vyšel?
10. Ukazujeme relevantní rozdíl/alternativu, pokud existuje?
11. Je další krok jasný?
12. Jsou metodika, nejistota a zdroj vidět v kontextu?
13. Vypadá stránka jako produkt vytvořený pro tento problém, ne jako přebarvená šablona?
14. Projde custom UI semantikou a klávesnicí bez ARIA/role chyby a bez rozbitého accessibility tree?
15. Projde produkční mobilní Lighthouse/PageSpeed accessibility bez automatického failu (cílově 100), včetně kontrastu a touch targetů?
16. Má stránka mimo hero alespoň dva signaturní vizuální bloky nativní pro tento problém, nebo po kalkulačce sklouzává do generických card gridů?
17. Prošla screenshotovým anti-template porovnáním s předchozími 3 V-next stránkami a je zřejmé, že jde o jiný produkt, ne stejnou stránku s jiným textem?
16. Pokud jsme v této wave objevili novou systémovou QA chybu, proběhl regression sweep starších V-next URL a byla chyba přidána do lint/standardu?

---

## 16. Research evidence použité pro v2

- **GOV.UK Design System:** ptát se pouze na nutné informace, progressive disclosure, jasná validace.
- **W3C WCAG 2.2:** reflow při 320 CSS px; RV interně používá přísnější 44×44 px touch target.
- **web.dev — INP:** dobrá responzivita znamená INP do 200 ms na 75. percentilu.
- **Špičkové calculator patterns:** progressive/advanced inputs, itemized results, scenario comparison, share/reset, vizuální kontext a práce s nejistotou.

---

## Zlaté pravidlo v2

> **Neoptimalizujeme počet polí ani počet sekcí. Optimalizujeme čas od otázky uživatele k pochopenému rozhodnutí — a dáváme mu vizuální důkaz, proč výsledku věřit.**


## 2.3 Quiet Luxury / Restraint Gate — povinné od 21. 8. 2026

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
