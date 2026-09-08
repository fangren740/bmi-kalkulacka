# ASTRA GOLD — Kalkulačka tapet

**Verdikt: NOT READY — BLOCKED BY BROWSER / VISUAL QA.**

Implementace je připravena na izolované experimentální branchi k dalšímu ověření. Není certifikovaná jako Gold PASS, není určena k produkčnímu nasazení. Uživatel může otevřít přiložený samostatný HTML náhled. To neznamená, že agent provedl kontrolu v prohlížeči.

## Implementation

Nové runtime soubory:

- `kalkulacka-tapet.html` — kompaktní úvod, zadání více stěn, výsledek, plán, metodika, související nástroje a plná patička.
- `tapety.css` — styly pouze pod rootem nové stránky, responzivní pravidla a tisk.
- `tapety-core.js` — čistý model, parser, validace, celočíselné milimetry, žádná knihovna.
- `tapety-page.js` — DOM adapter, stavy, dynamické stěny, reset, undo odstranění, tisk.
- `audits/tapety/*` — předem odvozené příklady, spustitelné testy a výsledky, reference assetů, tento report, návod k dokončení QA.

Žádné existující soubory se nemění. Shared CSS a skutečné logo V3.2 jsou jen použity. Shared JS s historickými parsery a automatickými výsledkovými efekty není připojen, aby nový result contract neměl druhého vlastníka. Registry, sitemap, katalog, correctness backlog a Gold pilot #74 zůstávají mimo diff. Preview má `noindex,follow` a produkční canonical; před releasem potřebuje autorizovanou integraci.

## Product model

Pro každou stěnu samostatně zaokrouhlíme počet pásů nahoru. Výška je společná s volitelnou výjimkou u stěny. Výška + horní ořez + dolní ořez tvoří základ pásu. Bez vzoru se řeže právě tato délka; se vzorem ji zaokrouhlíme nahoru na celý raport. Prodloužení zůstává dole, aby se neposunul vrchní motiv.

Při rovném sesazení je poloha vzoru každého pásu 0. Při přesazeném sesazení je poloha j×posun modulo raport, počínaje j=0 na každé stěně. Half-drop je speciální případ posunu o polovinu raportu. UI definuje směr po odvíjení a upozorňuje na autoritu konkrétního návodu výrobce.

Řezač vkládá pásy v pořadí stěn do první otevřené role, do které se vejdou včetně dorovnání vzoru. Proto může pozdější pás využít dřívější roli. ID `2.3` znamená třetí pás druhé stěny a zabraňuje záměně řezného a lepicího pořadí. Žádné tvrzení optimality: algoritmus neprohledává všechny možnosti.

Při neznámém začátku rolí je na každé vyhrazen 1 raport pro nalezení stejného motivu. Tato rezerva není povel celý raport odříznout. Člověk nejprve najde společný motiv a od něj měří navazující dorovnání. Zbytky jsou v tomto režimu konzervativní dolní meze. V režimu ověřeného shodného počátku je rezerva 0 a zbytky jsou přesné v rámci modelu.

Otvory nemění počet pásů ani rolí. UI výslovně nevyčísluje plošnou úsporu. Ostění, návaznost přes rohy, podélné použití zbytků, fotografie/panely a obrácené lepení nejsou podporovány. Dodatečná náhradní role není skrytě přičtena.

## Independent tests — expected → actual

Očekávání byla napsána před core funkcí do `MODEL_AND_EXPECTED.md`. Oprava původně chybného ručního očekávání T05 je transparentně zdokumentována; nebylo vygenerováno z produkční funkce. Všechny délky níže jsou cm.

| Test | Expected | Actual | Stav |
|---|---|---|---|
| T01 bez vzoru | 2 role, 4×258; zbytky 226 / 742 | stejné | PASS |
| T02 přesné dělení | 1 role, 4×250; zbytek 0 | stejné | PASS |
| T03 pás navíc | 2 role, 5 pásů; zbytky 0 / 750 | stejné | PASS |
| T04 raport 64 | 1 role, 3×320; zbytek 40 | stejné | PASS |
| T05 half-drop 64/32 | 2 role, fáze 0/32/0/32; zbytky 8 / 680 | stejné | PASS |
| T06 dvě výšky | 2 role, 3×250 + 2×200; zbytky 50 / 800 | stejné | PASS |
| T07 příliš dlouhý pás | unavailable, bez počtu rolí | stejné | PASS |
| T08 desetinná čárka | 1 role, 3×255,1; zbytek 239,7 | stejné | PASS |
| T09 ořez jednou | 1 role, 4×250; ořez celkem 40 | stejné | PASS |
| T10 otvor | beze změny proti T02 | stejné | PASS |
| T11 neznámý počátek | 2 role; zbytky nejméně 296 / 616 | stejné | PASS |
| T12 jiný posun 60/20 | fáze 0/20/40; zbytek 240 | stejné | PASS |
| T13 raport > role | unavailable | stejné | PASS |
| T14b rezervovaný začátek se nevejde | unavailable | stejné | PASS |

Celkem **30 funkčních fixtures, 12 parserových případů, 120 scénářů fyzikálních invariantů — PASS**. Invarianty kontrolují zachování délky role, nepřekročení délky, jedinečnost pásů, pokrytí šířky a správnou fázi v místě řezu. Detail expected/actual je v `test-results.json`.

Parser mimo jiné testuje tisícové mezery/NBSP, tečku a čárku, prázdno, text, zápornou hodnotu, nulu, Infinity, přebytečnou přesnost a extrémy. Metry přijímají 3 desetinná místa, cm 1, bez tichého zaokrouhlování. Vyžaduje číslici před desetinným oddělovačem. Další nulová místa hodnotu nemění a jsou povolena.

## UX

Pattern D: ovládání → řezný přehled → vysvětlení jednotlivých řezů. Na desktopu zadání vlevo a přehled vpravo, pod 1024 px jeden sloupec. Formulář je explicitně submitovaný: uživatel může připravit stěny i tapetu najednou a pak dostane jeden konzistentní plán. Každá editace odstraní předchozí plán včetně tisku; během psaní se neprovádí alokace rolí.

Výchozí příklad je viditelně označený. Výsledek zdůrazňuje počet rolí a tři podpůrné metriky. Následují rozměry stěn a číslované role s grafickou pomůckou, konkrétními řezy a zbytky. Celý graf má číselný textový ekvivalent. Metodika odpovídá na rizika, nikoli na slovní kvótu SEO.

## QA

| Gate | Stav | Rozsah důkazu |
|---|---|---|
| Izolace vůči main / P0 / #74 | PASS | Jen nové soubory, oddělená branch; nový strom porovnán proti parentu |
| Výpočet a parser | PASS | 30 + 12 fixtures a 120 invariantních scénářů |
| Syntax JavaScriptu | PASS | Node syntax check obou souborů |
| H1, canonical, schema JSON | PASS | Statický parser HTML, BreadcrumbList a WebApplication |
| Assety a interní odkazy | PASS | 24 referencí proti souborům a inventáři main; žádná kolize URL |
| Labels, IDs, popisy chyb | PASS — statický rozsah | Nativní prvky mají jména; ID unikátní; aria-describedby cíle existují |
| Nominální kontrast palety | PASS — statický rozsah | Textové páry ≥4,5:1; hranice pole ≥3:1; nejde o computed-style audit |
| 320 / 390 / 768 / 1024 / 1366 / 1440 | NOT TESTED | Prohlížeč odmítl lokální preview bezpečnostní politikou |
| Add/remove/undo, módy, reset, invalid → correction v DOM | NOT TESTED | Kód zrevidován; neprovedena interakce v reálném browseru |
| Keyboard, focus, živá oznámení, zoom 200 %, screen reader | NOT TESTED | Statická příprava neprokazuje runtime chování |
| Tisk řezného plánu | NOT TESTED | Print CSS a akce připraveny, náhled tisku neotevřen |
| Lighthouse mobile/desktop, LCP/CLS/INP | NOT TESTED | Nesmí být odvozeno ze souborové velikosti |
| Field CWV | NOT AVAILABLE | Nová URL nebyla nasazena |
| Produkce, integrační registry/sitemap | NOT TESTED / odloženo | Produkční release není autorizován |

## Performance

Statické HTML/CSS/JS, žádný framework, externí font, měření ani runtime knihovna. Počáteční assety mají přibližně **27,8 kB gzip** včetně shared CSS, obou log a footerového SVG. Jde o kompresní odhad lokálních souborů, ne o naměřenou síťovou odezvu.

Nejtěžší podporovaný allokátorový scénář: 500 pásů dlouhých 6 m do rolí 10 m, tedy 500 rolí a prohledávání dřívějších rolí. Průměr 100 lokálních Node výpočtů přibližně **0,52 ms**. Výsledek zahrnuje parser a model, nezahrnuje DOM, vykreslení ani mobilní CPU. Přesná hodnota v `test-results.json`. Úprava pole spouští jen parser a validaci; řezný plán až submit.

## Screenshots

**NOT AVAILABLE.** Nebyl vytvořen ani předstírán screenshot či vizuální PASS. Automatický prohlížeč odmítl lokální URL bezpečnostní politikou a nebyl použit obchvat. Samostatný HTML soubor v ZIPu je funkční náhled k otevření uživatelem, nikoli obrázek dokazující agentův browser QA.

## Red-team — nalezeno a opraveno

1. Původní očekávání T05 přehlíželo návrat na dřívější roli. Ručně přepočítáno a popsána příčina; test nyní ověřuje konkrétní rozdělení.
2. Shared CSS rušilo outline na focusem vybraném inputu. Přidán lokální dostatečně specifický focus-visible styl bez změny shared souboru. Skutečný browser focus zůstává k ověření.
3. Původní obsluha psaní zbytečně spouštěla celý výpočet. Nahrazena parserem a validací; alokace až při submitu.
4. Opakované psaní zbytečně přestavovalo hlášku a mohlo ji stále oznamovat. Dirty stav se nyní nastaví jednou.
5. Neúspěšné nastavení poloviny raportu mělo pouze neviditelné oznámení. Doplněna viditelná zpráva u raportu.
6. Vyhrazený raport se mohl vykládat jako přesný pokyn k odříznutí. Výsledek výslovně rozlišuje rezervu od skutečného nalezení motivu a označuje zbytky jako „nejméně“.

## Self-critique — zbývající nejslabší místa

1. Chybí reálné browser QA. Vizuální kvalitu, mobilní ergonomii a bezchybnou interakci nelze potvrdit.
2. First-fit v pořadí stěn nemusí dosáhnout nejmenšího počtu rolí. Přeskládání pořadí a společné řezání stejných fází by někdy ušetřilo materiál.
3. Celý raport na neznámý začátek role je konzervativní a může přidat roli. Přesnější plán by potřeboval skutečný počátek každé jednotlivé role.
4. Zaokrouhlení všech pásů na raport není nejúspornější metoda řezání. Transparentnost dostává přednost před složitější optimalizací.
5. Model neřeší geometrii otvorů, využití krátkých dílů, návaznost přes rohy ani vlastní počáteční polohu motivu každé stěny.
6. Každá stěna začíná celým pásem; velmi úzký poslední pás není automaticky přerozdělen na oba kraje. Jeho skutečná šířka je ale zobrazená.
7. U 500 pásů může být DOM přehled příliš dlouhý. Čas allokátoru to neřeší; rozhodnutí o sbalení/paginaci musí navázat na browser QA.

## Experimentální závěr

Výpočet a explicitnost konvencí mají reprodukovatelné důkazy. **Nelze ještě objektivně tvrdit, že Astra vytvořila kvalitnější hotovou kalkulačku než standardní stream**, protože chybí vizuální a interakční porovnání za stejných podmínek. Kód ani počet testů nejsou náhradou uživatelské zkušenosti.

**NOT READY — BLOCKED BY BROWSER / VISUAL QA.** Nemerĝovat do main. Nejprve dokončit seznam v `NEXT_QA.md`, opravit nálezy a až poté znovu vyhodnotit READY FOR HUMAN REVIEW.
