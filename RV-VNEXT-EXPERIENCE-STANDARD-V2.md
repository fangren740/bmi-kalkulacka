# RychléVýpočty.cz V-next — Experience Standard v2

**Revize:** 18. 8. 2026  
**Verze:** 2.1  
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

## 15. Experience release gate — 15 otázek

Release pouze pokud je 15× ANO:

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

---

## 16. Research evidence použité pro v2

- **GOV.UK Design System:** ptát se pouze na nutné informace, progressive disclosure, jasná validace.
- **W3C WCAG 2.2:** reflow při 320 CSS px; RV interně používá přísnější 44×44 px touch target.
- **web.dev — INP:** dobrá responzivita znamená INP do 200 ms na 75. percentilu.
- **Špičkové calculator patterns:** progressive/advanced inputs, itemized results, scenario comparison, share/reset, vizuální kontext a práce s nejistotou.

---

## Zlaté pravidlo v2

> **Neoptimalizujeme počet polí ani počet sekcí. Optimalizujeme čas od otázky uživatele k pochopenému rozhodnutí — a dáváme mu vizuální důkaz, proč výsledku věřit.**
