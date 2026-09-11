# RychléVýpočty.cz V7 — ADSENSE FINISH BATCH 1 / METHOD + TRUST AUDIT

**Datum auditu:** 2026-09-11  
**Branch:** `adsense-finish/batch-1`  
**Řídicí standard:** `RV_METHOD_SOURCE_DISCLAIMER_LOCK_2026-09-11.md`

> Tento soubor je pracovní release evidence. `PASS` znamená, že metodika byla skutečně zkontrolována proti kódu a odpovídajícím zdrojům; samotná existence sekce „Metodika“ se za PASS nepovažuje.

---

## Souhrn

| URL | Class | Method verdict | Hlavní stav | Disclaimer |
|---|---|---|---|---|
| `procenta-kalkulacka.html` | M0 | **PASS** | stabilní matematika, validace nul a hranic zkontrolována | NOT REQUIRED |
| `kalkulacka-celkove-ceny-vlastnictvi-auta.html` | M2 | **FIX** | TCO matematika dává smysl; chybí current V3.2 identity + modelový disclaimer/trust polish + regression evidence | REQUIRED – modelový |
| `kalkulacka-hodinove-mzdy.html` | M1/M3-supporting | **FIX** | analytický přepočet je správný; automatická interpretace minima 134,40 Kč/h musí výslovně omezit 40h režim | REQUIRED only for legal interpretation |
| `kalkulacka-dovolene.html` | M3 | **PASS WITH POLISH** | core vzorec, 1/52, >52 násobků, DPP/DPČ 20 h / 28 dnů / 80 h, rounding ověřeny | REQUIRED |
| `kalkulacka-prescasu.html` | M3 | **FIX** | výpočet mzda/plat + 25/50 % + náhradní volno je koncepčně správný; copy „hodiny nad rozvrženou dobu“ je nepřesná u kratší pracovní doby | REQUIRED |
| `cestovni-nahrady-kalkulacka.html` | M3 | **FIX IN BRANCH** | sazby 2026 ověřeny; nalezena a opravena chyba dvoudenního stravného podle § 163 odst. 4 | REQUIRED |

Žádná stránka označená `FIX` nesmí být PROMOTE TO DONE před uzavřením uvedených bodů a následným regression/runtime QA.

---

# 1. Procenta

**Risk:** M0  
**Verdict:** PASS

### Ověřená logika
- procento z čísla: `základ × procento / 100`,
- část z celku: `část / celek × 100`,
- zvýšení/snížení: `základ × (1 ± p/100)`,
- dopočet základu: `část / (p/100)`,
- relativní změna: `(nová − původní) / původní × 100`,
- procentní body: `nová sazba − původní sazba`,
- dvě změny po sobě: násobení koeficientů, nikoli prostý součet.

### Boundary kontrola
- celek = 0: blokováno,
- procento = 0 při dopočtu základu: blokováno,
- původní hodnota = 0 při relativní změně: blokováno,
- snížení > 100 %: blokováno,
- navazující snížení > 100 %: blokováno.

### Disclaimer
NOT REQUIRED. Jde o čistou matematiku. Obecný „odborný disclaimer“ na této stránce nepřidává hodnotu a nemá být předstírán jako metodická nutnost.

### Zbývá před DONE
- identity/footer/socials check,
- deterministic regression,
- mobile/runtime QA.

---

# 2. TCO auta

**Risk:** M2 — model / ekonomický scénář  
**Verdict:** FIX

### Ověřená core logika
- `měsíce = roky × 12`,
- `celkové km = roční nájezd × roky`,
- `ztráta hodnoty = kupní cena − budoucí prodejní cena`,
- provoz je buď uživatelský agregát, nebo součet energie + pojištění + servis + pneu + parkování + poplatky + ostatní,
- financování přidává do ekonomického TCO pouze `max(0, úplné pořizovací platby − kupní cena)`, tedy cenu financování nad cenu vozu; jistina se znovu nepřičítá,
- `TCO = ztráta hodnoty + provoz + náklad financování navíc`,
- měsíční TCO a Kč/km jsou pouze derivace tohoto součtu.

### Pozitivní metodický bod
Kontrolní podíl příjmu je v UI označen jako **vlastní plánovací limit, ne hranice schválení**. To musí zůstat.

### Known limitations
- prodejní cena je uživatelský odhad, ne tržní predikce,
- servis/provoz/energie jsou scénářové vstupy,
- model neoceňuje čas, alternativní výnos kapitálu ani neočekávané škody, pokud je uživatel výslovně nezahrne,
- budoucí TCO není garantovaný výsledek.

### Disclaimer
REQUIRED, krátký a konkrétní: výsledek je model pro zadané předpoklady; není ocenění vozidla, nabídka financování ani garance budoucí ceny/provozních nákladů.

### Zbývá před PASS
- deterministic regression,
- current V3.2 canonical logo + inverse footer logo,
- V7/V3.2 hero watermark/visual field,
- full footer + FB/IG,
- page-specific disclaimer v trust kontextu,
- mobile/runtime QA.

---

# 3. Hodinová mzda

**Risk:** M1 s podpůrnými M3 tvrzeními  
**Verdict:** FIX

### Core výpočet
Basic: `zadaný měsíční příjem / hodiny stejného období`.  
PRO: `(základní odměna za období + bonusy + volitelně oceněné benefity) / hodiny stejného období`.

Kalkulačka správně opakovaně uvádí, že tento analytický podíl **není automaticky pracovněprávní průměrný výdělek**.

### Ověřené externí tvrzení
MPSV 2026: minimální mzda při stanovené 40hodinové týdenní pracovní době = **22 400 Kč/měs. / 134,40 Kč/h**.

### Nalezený trust/method problém
Kód automaticky interpretuje `cashHourly >= 134,40` jako „nad orientační hranicí 2026“. To je příliš široké, protože hodinová minimální mzda se při zkrácené stanovené týdenní pracovní době 38,75 / 37,5 h poměrně zvyšuje.

### Fix
Výsledek smí 134,40 Kč/h označit pouze jako **základní hranici pro 40h stanovenou týdenní pracovní dobu**. Pokud stránka nezná pracovní režim, nesmí tvrdit, že vyšší sazba automaticky splňuje minimum pro každý režim.

### Disclaimer
Obecný právní disclaimer není potřeba kvůli samotnému dělení. Je však nutná jasná hranice u právních interpretací: analytická hodinovka ≠ pracovněprávní průměrný výdělek a automatický minimum-wage verdict bez znalosti režimu není závazný.

### Zbývá před PASS
- opravit minimum-wage interpretaci,
- regression,
- V3.2 identity + watermark + footer/socials,
- QA.

---

# 4. Dovolená

**Risk:** M3  
**Verdict:** PASS WITH POLISH

### Ověřené proti aktuálnímu zákoníku práce / MPSV
- běžná dovolená se stanovuje v hodinách,
- plný roční základ = týdenní pracovní doba × výměra dovolené,
- poměrná část = za každý celý odpracovaný násobek týdenní pracovní doby `1/52` ročního základu,
- konečný nárok v hodinách se zaokrouhluje **nahoru na celé hodiny**,
- při více než 52 odpracovaných násobcích podle rozvrhu směn se dovolená může prodlužovat o další `1/52` za každý další násobek,
- u DPP/DPČ se pro účely dovolené používá fiktivní týdenní pracovní doba **20 h**,
- základní podmínka DPP/DPČ: vztah alespoň **28 kalendářních dnů** a alespoň **80 započtených hodin**,
- základní výměra běžného pracovního poměru minimálně 4 týdny; zvláštní zákonné výměry 5/8 týdnů podle skupiny zaměstnanců.

### Kód
`dovolena.js` používá floor počtu celých násobků, `1/52`, `Math.ceil` finálního nároku a podporuje >52 násobků. DPP/DPČ přepíná weekly na 20 h a eligibility `28 dnů + 4×20 h`.

### Known limitations
- některé náhradní doby / překážky v práci mají speciální pravidla a stránka proto správně požaduje započitatelné hodiny z evidence,
- změna úvazku během roku se má řešit po obdobích,
- orientační přepočet hodin na „dny“ nenahrazuje rozvrh směn.

### Disclaimer
REQUIRED: přesný nárok závisí na evidenci zaměstnavatele, rozvrhu směn, náhradních dobách a konkrétním průběhu pracovněprávního vztahu.

### Zbývá před DONE
- aktualizovat visible method verification / zdroje na skutečnou kontrolu 2026-09-11,
- V3.2 logo + inverse footer + watermark + FB/IG,
- regression/runtime/mobile QA.

---

# 5. Přesčas

**Risk:** M3  
**Verdict:** FIX

### Ověřená pravidla
- mzda: dosažená mzda + nejméně **25 % průměrného výdělku**, pokud nebylo dohodnuto náhradní volno,
- plat: příslušná část platu + **25 %**, nebo **50 %** při práci v den nepřetržitého odpočinku; náhradní volno lze použít podle zákonných pravidel,
- nařízený přesčas standardně max. 8 h týdně a 150 h ročně; celkový průměrný rozsah podléhá vyrovnávacímu období,
- mzdu lze sjednat s přihlédnutím k práci přesčas pouze v konkrétně sjednaném rozsahu; u běžného zaměstnance standardně nejvýše 150 h/rok,
- u zaměstnance s kratší pracovní dobou není každá práce nad jeho kratší rozvrh automaticky prací přesčas; přesčas se posuzuje vůči stanovené týdenní pracovní době.

### Kód
Odděluje hodinovou odměnu, průměrný výdělek, 25/50% premium, cash vs. leave a sjednaný zahrnutý rozsah. Koncepčně odpovídá user jobu.

### Nalezený P1 copy/method problém
UI vysvětluje „Hodiny přesčasu“ jako **„Jen hodiny nad rozvrženou pracovní dobu.“** To je nepřesné pro zaměstnance s kratší pracovní dobou a může uživatele vést k nesprávnému počtu hodin.

### Fix
Copy musí vysvětlit, že uživatel zadává hodiny, které **skutečně splňují definici práce přesčas**; u kratší pracovní doby není samotné překročení sjednaného kratšího úvazku automaticky přesčasem.

### Disclaimer
REQUIRED: orientační kontrola; konkrétní vyrovnání závisí na evidenci, průměrném výdělku, smluvním ujednání, režimu mzda/plat a skutečném posouzení hodin jako přesčas.

### Zbývá před PASS
- opravit copy/interpretaci kratší pracovní doby,
- regression,
- current V3.2 identity/watermark/footer/socials,
- source/method date,
- QA.

---

# 6. Cestovní náhrady

**Risk:** M3  
**Verdict:** FIX IN BRANCH

### Ověřené sazby 2026
- osobní automobil: **5,90 Kč/km**,
- jednostopé vozidlo / tříkolka: **1,60 Kč/km**,
- Natural 95: **34,70 Kč/l**,
- Natural 98: **39,00 Kč/l**,
- elektřina: **7,20 Kč/kWh**,
- motorová nafta: **34,10 Kč/l** do 31. 5. 2026; **44,50 Kč/l od 1. 6. 2026** po mimořádné změně,
- minimální tuzemské stravné v podnikatelské sféře: **155 / 236 / 370 Kč**,
- horní sazby veřejné sféry: **185 / 284 / 442 Kč**,
- bezplatná jídla: krácení max. **70 / 35 / 25 %** podle pásma.

### Nalezená correctness chyba
Původní `advancedCalc()` každou cestu přes půlnoc automaticky rozdělil na kalendářní dny a sečetl stravné za každý den.

Aktuální § 163 odst. 4 stanoví zvláštní pravidlo pro pracovní cestu spadající **přesně do 2 kalendářních dnů**: od odděleného posouzení se musí upustit, pokud je společné posouzení pro zaměstnance výhodnější.

### Implementovaný fix na branchi
`cestovni-nahrady.js` nyní:
- počítá oddělenou variantu,
- pro přesně 2 kalendářní dny počítá i společnou variantu,
- porovná je a použije vyšší stravné,
- ve výsledku ukáže kontrolu obou variant,
- opravuje vysvětlení overnight cesty.

### Regression spot checks
- 4,5 h + 4,5 h, 0 jídel: odděleně 0; společně 155 → **155**,
- 9 h + 10 h, 0 jídel: odděleně 310; společně 370 → **370**,
- 10 h + 15 h, 0 jídel: odděleně 391; společně 370 → **391**,
- 10 h + 17,5 h, 1 + 2 jídla: odděleně 117,30; společně 92,50 → **117,30**.

### Disclaimer
REQUIRED: výsledek je kontrolní výpočet pro zadanou tuzemskou pracovní cestu; konkrétní nárok závisí na cestovním příkazu, dokladech, interních pravidlech a přesném pracovněprávním režimu. Daňové posouzení nadlimitních plnění není totožné s výpočtem náhrady.

### Zbývá před PASS
- přidat regression CSV včetně 2-day cases a diesel date boundary,
- aktualizovat visible verification date/copy,
- FB/IG footer check/fix,
- JS/browser/mobile QA.

---

# Primární metodické zdroje použité v tomto batchi

- Zákon č. 262/2006 Sb., zákoník práce — aktuální znění / Příručka MPSV.
- MPSV Příručka: dovolená za kalendářní rok a poměrná část (§ 212/213).
- MPSV Příručka: práce přesčas, mzda a plat (§ 93, § 114, § 127).
- MPSV Příručka: tuzemské cestovní náhrady (§ 163 a související ustanovení).
- Vyhláška č. 573/2025 Sb. — cestovní náhrady 2026.
- Vyhláška č. 78/2026 Sb. — mimořádná změna ceny motorové nafty od 1. 6. 2026.
- MPSV: minimální mzda 2026 — 22 400 Kč / 134,40 Kč/h při 40h stanovené týdenní pracovní době.

---

# Batch release rule

Batch 1 nesmí být merge do `main`, dokud:
- všechny `FIX` položky nejsou uzavřené,
- všechny M2/M3 položky nemají `methodVerdict=PASS`,
- branding/identity lock není PASS,
- deterministic regression + responsive/runtime + static SEO/a11y gate není PASS.
