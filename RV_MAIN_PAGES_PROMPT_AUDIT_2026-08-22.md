# RychléVýpočty.cz V7 — PROMPT STACK AUDIT
## Main pages / leader hub upgrade — 22. 8. 2026

## Co bylo zkontrolováno

Relevantní starší instrukce/prompt vrstvy nalezené ve File Library / uploads:

1. `RV_MAIN_PAGES_HANDOFF_FINAL.md` — **RELEVANT, ale zastaralý stavem wave**
   - správně zamyká Zaplytic-inspired bright future-tech DNA;
   - správně říká homepage = reference, ne mechanická šablona;
   - správně vyžaduje mobile/performance/trust/deploy QA;
   - ale vznikl 20. 8., kdy ještě nebyla hotová většina nové hub wave.

2. `rychlevypocty-v7-master-prompt-dalsi-faze.txt` — **STRATEGICKY UŽITEČNÝ, PRO TENTO CHAT ČÁSTEČNĚ SUPERSEDED**
   - obsahuje dobré obecné principy platformy, výkonu, QA, centrálního registru;
   - ale jeho roadmapa začíná baseline auditem, homepage a katalogem, což už je historická fáze;
   - pro pokračování hub rollout wave se nemá znovu spouštět od Fáze 0.

3. `rychlevypocty-v7-prompt-pro-novy-chat-aktualizovany-2026-07-31.txt` — **JINÝ SCOPE: CALCULATOR UPGRADE**
   - je platný pro zásadní přestavby jednotlivých kalkulaček;
   - obsahuje 2 800+ slov, basic/advanced režim, výsledkový dashboard, povinnou metodiku kalkulace, FAQ atd.;
   - tato pravidla se nesmí automaticky aplikovat na leader hub pages.

4. `RV-VNEXT-PRODUCTION-STANDARD.md` — **PLATNÝ PRO NOVÉ CALCULATOR/TOOL ASSETS, NE HUB TEMPLATE**
   - velmi důležitý pro budoucí nové kalkulačky;
   - nepoužívat jako přímou designovou specifikaci leader hubů.

5. Starší integrační/AdSense/brand rollout prompty a QA reporty — **REFERENCE, NE ŘÍDÍCÍ PROMPT PRO TUTO WAVE**.

## Hlavní konflikty, které nový master prompt odstraňuje

### Konflikt A — „nový chat musí začít kompletním baseline auditem“
Starý master prompt to vyžadoval pro začátek platformové fáze.
Dnes už máme homepage, katalog a několik hubů přepracovaných.

**Nové pravidlo:** pouze continuity audit aktuálního ZIPu, ne opakování celé Fáze 0.

### Konflikt B — kalkulačková pravidla vs. huby
Starý calculator prompt vyžaduje např. 2 800+ slov, basic/advanced mode a plnohodnotný výsledkový dashboard.

**Nové pravidlo:** toto není požadavek na leader hub. Hub má být krátký decision/discovery surface.

### Konflikt C — „SaaS“ interpretace
Starší prompt často používá formulaci premium/professional SaaS.
Během wave se ukázalo, že při slepé aplikaci to vede k boxům/dashboardům.

**Nové pravidlo:** platforma má být premium future-tech, ale lidská, editorial-tech a vizuálně bohatá; ne generic SaaS dashboard.

### Konflikt D — „víc artu“
Během Energie V2 se ukázalo, že prosté přidávání doodlů a panelů kvalitu snižuje.

**Nové pravidlo:** grafika musí vysvětlovat význam. Doodle jen jako akcent.

### Konflikt E — uniformní grid
Datum V1 ukázalo, že 10 stejných cards je funkční, ale ne leader-page quality.

**Nové pravidlo:** nástroje seskupovat podle situace/lifecycle; uniformní grid jen když je objektivně nejlepší.

### Konflikt F — „0 overflow = PASS“
Historické prompty už správně varují, že to nestačí; poslední wave to znovu potvrdila.

**Nové pravidlo:** skutečný full-page visual inspection na více viewports je povinný.

### Konflikt G — opakované mikro-patche
Auto card ukázal, že malé změny rozměrů mohou třikrát po sobě nevyřešit layout.

**Nové pravidlo:** opakující se bug = změna layout modelu / systematic rebuild komponenty + znovu browser QA.

## Co je nyní autoritativní pro nový chat

Pořadí autority:
1. aktuálně přiložený produkční ZIP projektu;
2. `RV_MAIN_PAGES_NEW_CHAT_MASTER_PROMPT_2026-08-22.md`;
3. `RV_MAIN_PAGES_HANDOFF_FINAL.md` jako historický design základ;
4. starší master/platform prompty pouze jako reference;
5. calculator-specific prompty pouze tehdy, když se skutečně upravuje kalkulačka.

## Doporučení

Do nového chatu nahraj:
- aktuální ZIP produkčního projektu;
- `RV_MAIN_PAGES_NEW_CHAT_HANDOFF_2026-08-22.zip`.

A napiš jen:

> Navazujeme na MAIN PAGES / LEADER HUB wave. Aktuální produkční ZIP je jediný technický zdroj pravdy. Načti handoff balík, ověř skutečný stav proti ZIPu a pokračuj další nejsilnější leader page. Nezačínej audit od nuly a neměň kalkulačky.

