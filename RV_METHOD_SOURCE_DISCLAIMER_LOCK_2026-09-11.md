# RychléVýpočty.cz V7 — METHOD / SOURCE / DISCLAIMER LOCK

**Datum:** 2026-09-11  
**Status:** CURRENT / RELEASE-BLOCKING během AdSense finish sprintu  
**Platí pro:** všechny indexovatelné kalkulačky, návody a datové stránky RychléVýpočty.cz

> Cíl: nestačí, aby stránka metodiku pouze zobrazovala. Metodika musí být **skutečně zkontrolovaná**, musí být jasné, z jakých pravidel/vzorců vychází, kdy byla ověřena, kde jsou hranice modelu a zda téma vyžaduje konkrétní disclaimer.

---

# 1. ZÁKLADNÍ PRINCIP

Před release každé kalkulačky odpověz na 5 otázek:

1. **Co přesně kalkulačka tvrdí?**
2. **Je hlavní výpočet matematicky a metodicky správný?**
3. **Jsou všechny proměnlivé parametry aktuální pro deklarovaný rok/datum?**
4. **Máme pro klíčové tvrzení odpovídající primární / autoritativní zdroj?**
5. **Může uživatel výsledek zaměnit za právní, daňové, zdravotní, investiční, technické nebo jiné individuální rozhodnutí?** Pokud ano, musí být hranice výsledku jasně viditelná.

**Přítomnost sekce „Metodika“ sama o sobě není PASS.**

---

# 2. METHOD RISK CLASS — POVINNÁ KLASIFIKACE

Každá stránka dostane před úpravou jednu metodickou třídu.

## M0 — Stabilní matematika / převody
Příklady: procenta, průměr, trojčlenka, převod jednotek.

Povinné:
- ověřit vzorec,
- jednotky,
- zaokrouhlení,
- nuly, záporné hodnoty a hranice podle významu.

Typicky **bez disclaimeru**.

## M1 — Stabilní praktický výpočet
Příklady: plocha, objem, spotřeba z uživatelských vstupů, datumové utility bez proměnlivých sazeb.

Povinné:
- vzorec + jednotky,
- význam vstupů,
- jasně odlišit výpočet od doporučení,
- zdroj definice tam, kde existuje odborný standard.

Disclaimer pouze pokud může uživatel výsledek nebezpečně přecenit.

## M2 — Model / odhad / ekonomický scénář
Příklady: TCO auta, provozní náklady, návratnost, finanční rezerva, rozpočet domácnosti.

Povinné:
- transparentní předpoklady,
- oddělit uživatelský vstup od interního modelu,
- žádné „tržní průměry“ bez zdroje,
- citlivost / rozsah tam, kde jeden bod vytváří falešnou přesnost,
- viditelně uvést, že jde o modelový odhad, pokud výsledek není fakt.

Disclaimer má být krátký a konkrétní, např. že výsledek není nabídka, ocenění ani garance budoucího výsledku.

## M3 — Regulované / právní / daňové / pracovněprávní / sociální téma
Příklady: mzda, dovolená, přesčas, DPP/DPČ, daně, dávky, cestovní náhrady, exekuce, důchod.

Povinné:
- aktuální zákonná metodika,
- datum ověření,
- primární / oficiální zdroje,
- všechny aktuální sazby/limity/hranice,
- rozhodovací logika a výjimky relevantní pro user job,
- regression scénáře včetně hranic,
- disclaimer přímo v blízkosti výsledku nebo metodiky.

Disclaimer nesmí být obecné „neneseme odpovědnost“. Musí říct konkrétně, co může výsledek změnit — např. smlouva, evidence zaměstnavatele, individuální daňová situace nebo rozhodnutí úřadu.

## M4 — Health / medical / safety-adjacent
Příklady: BMI, kalorická kalkulačka, ovulace, termín porodu, těhotenský test, těhotenství.

Povinné:
- metodika z autoritativních medicínských / veřejnozdravotních zdrojů,
- nepoužívat diagnostickou jistotu tam, kde výpočet poskytuje pouze orientaci,
- jasně popsat nejistotu a biologickou variabilitu,
- žádná léčebná doporučení bez odpovídajícího podkladu,
- viditelný konkrétní health disclaimer.

Disclaimer: výsledek je orientační/edukační a nenahrazuje individuální posouzení zdravotníkem. Text nesmí být alarmistický ani působit jako automatická diagnóza.

---

# 3. SOURCE HIERARCHY — CO POVAŽUJEME ZA DŮKAZ

Používej zdroje v tomto pořadí:

1. **primární právní / státní / regulatorní zdroj**, pokud existuje,
2. oficiální metodika příslušné instituce,
3. norma / technický list / výrobce pro technická data,
4. důvěryhodná statistická instituce pro benchmarky,
5. sekundární odborný zdroj pouze jako doplněk, ne jako jediný základ klíčového tvrzení.

### Typické zdroje podle tématu

- **Práce / mzdy / dovolená:** zákoník práce, MPSV / Příručka pro personální agendu, případně ČSSZ pro pojistné souvislosti.
- **Daně / OSVČ:** Finanční správa, Ministerstvo financí, ČSSZ, příslušné zdravotní pojištění / zákonné předpisy.
- **Hypotéky / úvěry / finance:** ČNB, zákonná pravidla, vlastní transparentní matematický model.
- **Sociální dávky:** MPSV, ČSSZ, ÚP podle kompetence.
- **Energie:** ERÚ, MPO, ČEZ/DSO pouze pro konkrétní technické údaje, výrobce pro účinnost/specifikace.
- **Stavebnictví / materiál:** technický list výrobce, norma / oficiální technická dokumentace; cenové benchmarky musí mít popsaný rozsah.
- **Statistiky / benchmarky:** ČSÚ, Eurostat nebo jiný jasně popsaný veřejný dataset.
- **Health:** MZ ČR, SZÚ, WHO, odborné guidelines / respektované zdravotnické autority podle tématu.
- **Kalendář / svátky:** aktuální právní kalendář / oficiální pravidla, pokud výpočet na svátcích závisí.

Sekundární portály mohou pomoci při rešerši, ale **release metodika nesmí stát jen na SEO článku třetí strany**, pokud existuje primární zdroj.

---

# 4. POVINNÝ METHOD VERIFICATION RECORD

Každá stránka M2–M4 a každá netriviální M1 musí mít před release interně doloženo:

- `methodRiskClass` — M0 až M4,
- `methodVerifiedAt` — skutečné datum kontroly,
- `methodScope` — co bylo ověřeno,
- `primarySources` — seznam klíčových zdrojů,
- `constantsAndRates` — použité sazby/limity a jejich rok,
- `formulaOrDecisionLogic` — hlavní výpočet / rozhodovací strom,
- `roundingPolicy`,
- `boundaryCases`,
- `benchmarkOrRegression` — pokud dává smysl,
- `knownLimitations`,
- `reverifyTrigger` — co vyvolá novou kontrolu.

Nemusí to být vždy samostatný soubor. Může to být tracker / audit poznámka / benchmark metadata. Ale musí být dohledatelné a konkrétní.

**Zakázáno:** označit na stránce „Ověřeno 2026“, pokud kontrola fakticky neproběhla.

---

# 5. KDY METODIKU ZNOVU OVĚŘIT

Re-verifikace je povinná při:

- změně roku u sazeb/limitů,
- legislativní změně,
- změně oficiální metodiky instituce,
- změně vzorce / core logiky,
- významné změně vstupů nebo interpretace výsledku,
- nalezené correctness chybě na příbuzné stránce,
- nahrazení zdroje nebo zániku původního zdroje.

U stabilní M0 matematiky není potřeba uměle měnit datum každý rok.

---

# 6. DISCLAIMER POLICY — KDE ANO A KDE NE

Disclaimer není dekorace a není povinný na každé stránce.

## Disclaimer POVINNÝ

- právní / pracovněprávní,
- daňové,
- sociální dávky / nárokové výpočty,
- health / pregnancy / nutrition,
- investiční nebo finanční model, pokud by mohl být zaměněn za individuální doporučení / nabídku,
- technický výpočet, pokud by mohl být zaměněn za projekt, statický návrh, revizi nebo bezpečnostní posouzení.

## Disclaimer typicky NEPOTŘEBNÝ

- procenta,
- průměr,
- převod jednotek,
- jednoduché datumové utility,
- čistá geometrie,
- jednoduché spotřební přepočty založené pouze na uživatelských vstupech,

pokud stránka nedělá další regulované / odborné tvrzení.

## Umístění

- stručná relevantní věta **u výsledku / v bezprostředním trust kontextu**,
- podrobnější hranice v metodice,
- obecný footer disclaimer může existovat, ale **nenahrazuje page-specific disclaimer**.

## Zakázané disclaimer patterns

- univerzální „informace nejsou závazné“ zkopírované všude,
- dlouhý právnický blok před kalkulačkou,
- strašení uživatele,
- disclaimer, který popře celý smysl kalkulačky,
- schování jediného důležitého omezení až do footeru.

---

# 7. DOMAIN-SPECIFIC RELEASE RULES

## Mzdy / práce

Povinně ověřit:
- pracovněprávní režim,
- PHV / průměrný výdělek, pokud se používá,
- aktuální příplatky/limity,
- DPP/DPČ specifika, pokud jsou součástí stránky,
- náhradní volno / přesčas / svátek tam, kde relevantní.

Page-specific disclaimer: kalkulačka je orientační; u konkrétní výplaty mají přednost smluvní podmínky, docházka, mzdové podklady a aktuální právní stav.

## Daně / OSVČ

Povinně ověřit:
- rok,
- limity,
- sazby,
- pásma,
- pojištění,
- slevy/odpočty, pokud se používají.

Disclaimer: výsledek je model pro zadané údaje a nenahrazuje posouzení konkrétní daňové situace.

## Finance / hypotéky / investice

Povinně oddělit:
- matematický výpočet,
- modelový scénář,
- regulatorní limit,
- tržní předpoklad.

Disclaimer: nejde o nabídku úvěru, investiční doporučení ani garanci budoucího výnosu/ceny.

## Sociální dávky

Povinně uvést, že konečné posouzení nároku provádí příslušný úřad a může záviset na údajích, které kalkulačka nezahrnuje.

## Stavba / rekonstrukce

Povinně rozlišit:
- čistý matematický výpočet množství,
- plánovací rezervu,
- projektovou/specifikační volbu,
- cenový odhad.

Pokud stránka není projekční nástroj, disclaimer jasně říká, že nenahrazuje projekt, statický návrh nebo technický posudek.

## Energie / FVE

Povinně oddělit:
- fyzikální přepočet,
- uživatelskou cenu,
- model spotřeby,
- budoucí cenu / úsporu.

Disclaimer: odhad není garance budoucí výroby, ceny energie nebo návratnosti; rozhodují skutečné tarify, profil spotřeby a technické podmínky.

## Auto / provoz

U modelových nákladů jasně označit uživatelské předpoklady. Žádný disclaimer není potřeba jen proto, že jde o auto; přidat ho pouze při financování, právních/tax tvrzeních nebo výrazném modelovém odhadu.

## Health / těhotenství / výživa

Povinně:
- orientační charakter,
- biologická variabilita,
- žádná diagnostická jistota,
- odborný zdroj.

Disclaimer viditelný, krátký a klidný: výsledek je informační a nenahrazuje individuální zdravotní posouzení.

---

# 8. VISIBLE METHOD BLOCK — CO MÁ UŽIVATEL VIDĚT

U M2–M4 a relevantní M1 typicky zobrazit:

- **Ověřeno / aktualizováno k DD. MM. YYYY**,
- 1–3 věty „Jak počítáme“,
- hlavní vzorec / logiku lidsky,
- co je zákonný/zdrojovaný fakt vs. uživatelský předpoklad vs. model RV,
- nejdůležitější omezení,
- primární zdroje.

Nezahlcovat. Plná interní evidence může být hlubší než viditelný blok.

---

# 9. CORRECTNESS + METHOD QA — RELEASE-BLOCKING

Před uzavřením stránky:

1. zkontrolovat core matematiku nezávislým přepočtem,
2. ověřit proměnlivé konstanty proti aktuálním primárním zdrojům,
3. projet hranice a výjimky relevantní pro user job,
4. porovnat text metodiky s tím, co kód skutečně dělá,
5. ověřit, že disclaimer odpovídá riziku stránky,
6. ověřit, že „Ověřeno k…“ je pravdivé,
7. při chybě zkontrolovat stejné pravidlo napříč portfoliem.

**P0:** chybný hlavní výpočet / chybný zákonný parametr / zavádějící health nebo financial claim.  
**P1:** významná chybějící výjimka nebo disclaimer, která může změnit rozhodnutí uživatele.  
**P2:** metodika je správná, ale nedostatečně vysvětlená / chybí minor nuance.  
**P3:** copy / presentation polish bez dopadu na správnost.

---

# 10. BATCH 1 METHOD MAP

Pro aktuální první finish batch:

| Stránka | Risk | Metodická akce | Disclaimer |
|---|---|---|---|
| `procenta-kalkulacka.html` | M0 | ověřit vzorce, režimy, nuly, záporné hodnoty, procentní body | ne |
| `kalkulacka-celkove-ceny-vlastnictvi-auta.html` | M2 | ověřit TCO matematiku, odpis, financování, dvojí započtení, user assumptions | krátký modelový disclaimer |
| `kalkulacka-hodinove-mzdy.html` | M1/M3 podle režimu | ověřit převody + případné pracovněprávní tvrzení | jen pokud stránka interpretuje právní/mzdové nároky |
| `kalkulacka-dovolene.html` | M3 | kompletní právní metodika 2026 + DPP/DPČ + zaokrouhlení + hranice | ano |
| `kalkulacka-prescasu.html` | M3 | zákoník práce, mzda/plat, náhradní volno, zahrnutí přesčasů | ano |
| `cestovni-nahrady-kalkulacka.html` | M3 | sazby 2026, krácení stravného, auto/palivo, tuzemsko vs. rozsah stránky | ano |

Toto není jen checklist. **Každá z těchto stránek musí před PROMOTE TO DONE dostat skutečný method verdict: PASS / FIX / BLOCK.**

---

# 11. HARD RULE PRO ADSENSE FINISH MODE

Během finish sprintu se rychlost nesmí získat tím, že přeskočíme metodiku.

Správný způsob zrychlení je:
- nedělat zbytečné redesigny,
- reuse QA postupů,
- batchovat podobné zdroje a legislativní kontroly,
- opravovat stejné chyby systematicky napříč portfoliem.

**Nikdy:** „vypadá to dobře, tak to zavřeme“ u stránky, kde metodika nebyla fakticky ověřena.
