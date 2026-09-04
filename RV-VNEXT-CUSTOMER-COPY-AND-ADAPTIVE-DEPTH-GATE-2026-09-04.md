# RychléVýpočty.cz V7 — Customer Copy + Adaptive Page Depth Gate

**Platnost od:** 2026-09-04  
**Status:** HARD GATE pro všechny nové buildy i recovery stránky.  
**Důvod:** novější vlna ukázala dva opakující se problémy: interní designové/codename fráze pronikaly do zákaznického UI a délka stránek se začala nevědomky sjednocovat místo individuálního posouzení tématu.

## 1. Customer Copy Gate — HARD FAIL

Veškerý viditelný text musí být psaný pro návštěvníka stránky, nikoli pro interní product/design tým.

Viditelný text musí pomáhat alespoň v jednom z těchto bodů:

- co zadat,
- co výsledek znamená,
- proč se výsledek změnil,
- jak porovnat scénáře,
- jaká je hranice nebo nejistota výpočtu,
- jaký je další logický krok.

Do zákaznického UI **nepatří** interní názvy konceptů, archetypů a návrhových objektů typu `engine`, `solver`, `rail`, `desk`, `lab`, `reverse mode`, `control room`, `runway`, `stack`, `map`, `lens`, `dossier` apod., pokud daný termín není sám o sobě běžný a přirozený jazyk uživatele v daném tématu.

Interní codename může zůstat v komentáři, class name, trackeru nebo BUILD LOCKu. **Nesmí být používán jako marketingový text jen proto, že zní produktově.**

Před user preview proveď Customer Copy Scan:

1. Je každá fráze srozumitelná bez znalosti projektu?
2. Řekl by ji normálně člověk hledající tento výpočet?
3. Přidává konkrétní význam, nebo jen pojmenovává designový modul?
4. Není možné stejnou věc říct jednodušeji česky?

Pokud některá odpověď selže, copy gate = FAIL.

## 2. Adaptive Page Depth Gate — HARD FAIL

**Délka stránky se nikdy neurčuje podle template, pořadového čísla, SEO kvóty ani podle poslední dokončené kalkulačky.**

Každá URL se posuzuje individuálně podle šíře user intentu, počtu přirozených následných otázek, rozhodovací hodnoty a množství ověřitelných informací.

Platí oba směry současně:

- úzké téma nesmí být uměle natažené,
- široké téma nesmí být uměle zkrácené.

Cílem není krátká ani dlouhá stránka. Cílem je **úplná stránka bez balastu**.

## 3. Povinný Depth Map před buildem

Před návrhem stránky zapiš:

1. **Primary answer** — co musí uživatel vědět okamžitě po výpočtu.
2. **Natural next questions** — 3–10 přirozených otázek, které stejného uživatele typicky napadnou hned potom.
3. **Decision-changing subset** — které z nich skutečně mění pochopení, rozhodnutí nebo další krok.
4. **Evidence** — zda pro ně máme deterministický výpočet, uživatelská data nebo kvalitní zdroj.
5. **Best format** — kalkulačka, waterfall, timeline, tabulka, scénáře, checklist, proces, sensitivity, kalendář, ledger, porovnání, text atd.

Sekce vzniká jen tehdy, pokud projde relevance testem:

- je to stále stejný intent,
- mění to pochopení / rozhodnutí / další krok,
- máme pro to poctivý podklad,
- neopakuje to něco, co už stránka říká lépe jinde.

## 4. Orientační depth tiers — nejsou kvóta

Tier se volí **až po Depth Map**, nikoli předem.

### S — úzký nástroj
Typicky jedna přímá otázka a malý počet následných rozhodnutí.

Obvykle stačí:
- hero,
- kalkulačka + výsledek,
- 1–2 relevantní product moments,
- metodika / hranice,
- logický next step.

### M — standardní rozhodovací nástroj
Má několik přirozených následných otázek nebo více užitečných interpretací výsledku.

Obvykle:
- hero,
- kalkulačka + výsledek,
- 2–5 relevantních product moments,
- alespoň dvě rozdílné vizuální kompozice mimo hero,
- metodika / data / hranice,
- next step.

### L — široké / citlivé / rozhodovací téma
Uživatel potřebuje nejen číslo, ale i rozpad, scénáře, limity, interpretaci a praktickou práci s výsledkem.

Může legitimně obsahovat:
- 4–7 nebo více product moments,
- více scénářů / sensitivity,
- detailní scope mapu,
- tabulky / časovou osu / rozpad,
- zdroje, metodiku, edge cases,
- praktické doporučení dalšího kroku.

**L není licence k vatě. Každý blok stále musí projít relevance gate.**

## 5. Stop rule

Stránka je dostatečně dlouhá ve chvíli, kdy další navrhovaná sekce už nepřidává novou odpověď, rozhodovací hodnotu nebo důležitou hranici.

Stránka je příliš krátká, pokud po výsledku zůstávají důležité přirozené otázky stejného intentu nezodpovězené, přestože pro ně máme kvalitní výpočet nebo podklad.

Nikdy nepřidávej sekci jen proto, že:

- „TOP stránka má mít hodně sekcí“,
- potřebujeme více textu,
- jiná kalkulačka byla delší,
- chceme stránku opticky zaplnit.

A nikdy nemaž důležitou sekci jen proto, že:

- stránka už je dlouhá,
- předchozí kalkulačka byla kratší,
- minimalistický layout vypadá čistěji.

## 6. Above-the-fold / calculator priority

Bez ohledu na tier platí:

- hero musí rychle vysvětlit user job,
- mezi hero a hlavní kalkulačkou nesmí být vložena sekundární obsahová sekce,
- na desktopu je kalkulačka + dominantní výsledek standardně vedle sebe, pokud tomu user job objektivně nebrání,
- mobil může přirozeně stackovat,
- sekundární hloubka začíná až po hlavním výsledku.

## 7. Identity Lock

- produkční logo je stejné RV V3.2,
- footer používá standardní RV identitu a sociální sítě,
- originalita vzniká v topic-native produktu, nikoli změnou loga nebo základní značky,
- customer copy nesmí používat interní codename jen pro vytvoření dojmu originality.

## 8. Povinný pre-review checklist

Před každým user preview musí současně projít:

- PRIMARY INTENT PASS,
- CALCULATION PASS,
- CUSTOMER COPY PASS,
- ADAPTIVE DEPTH PASS,
- TOPIC DEPTH PASS,
- PAGE-LEVEL ORIGINALITY PASS,
- IDENTITY PASS,
- VISUAL DRIFT PASS,
- desktop 1440 render PASS,
- mobile 390 render PASS,
- horizontal overflow = 0,
- runtime errors = 0,
- duplicate IDs = 0.

**Technicky správná, originální, ale obsahově podvyživená stránka = FAIL.**  
**Dlouhá, ale nafouknutá stránka = FAIL.**  
**Správný stav = tak dlouhá a tak hluboká, jak vyžaduje konkrétní téma.**
