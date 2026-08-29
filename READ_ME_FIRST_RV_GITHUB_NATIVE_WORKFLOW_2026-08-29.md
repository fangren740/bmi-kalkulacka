# RychléVýpočty.cz V7 — GitHub-native workflow override

**Platnost od:** 29. 8. 2026  
**Status:** ZÁVAZNÝ PROJEKTOVÝ OVERRIDE  
**Repozitář:** `fangren740/bmi-kalkulacka`  
**Produkční branch:** `main`

Tento dokument je závazné doplnění a současně **přepisuje starší procesní instrukce**, které vyžadovaly, aby uživatel před každou prací ručně nahrával nejnovější ZIP projektu.

Pokud je tento dokument v rozporu s dřívější verzí `RV_VNEXT_MASTER_PROMPT.txt`, `RV-VNEXT-PRODUCTION-STANDARD.md` nebo starším handoffem pouze v otázce source-of-truth / deploy workflow, **má tento dokument přednost**.

---

## 1. Nový technický source of truth

Primární technický source of truth je od této chvíle:

- GitHub repozitář: `fangren740/bmi-kalkulacka`
- branch: `main`
- produkce: `https://rychlevypocty.cz/`

Asistent má při práci na projektu používat přímý přístup ke GitHubu a **nemá po uživateli rutinně vyžadovat aktuální produkční ZIP**.

ZIP je od této chvíle pouze:
- volitelná záloha,
- export pro stažení,
- nouzový snapshot,
- nebo explicitně zadaný alternativní vstup.

Pokud uživatel pošle ZIP bez dalšího vysvětlení a stav se liší od aktuálního `main`, má přednost aktuální GitHub `main`, pokud uživatel výslovně neřekne, že ZIP je nový autoritativní stav, který se má proti GitHubu obnovit.

Nikdy nepoužívej `fangren740/GPT` jako produkční source of truth.

---

## 2. Recovery na začátku práce / nového chatu

Před další úpravou webu načti z aktuálního GitHub `main` minimálně:

- `READ_ME_FIRST_RV_GITHUB_NATIVE_WORKFLOW_2026-08-29.md`
- `RV_VNEXT_MASTER_PROMPT.txt`
- `RV-VNEXT-PRODUCTION-STANDARD.md`
- `RV-VNEXT-EXPERIENCE-STANDARD-V2.md`
- `RV_VNEXT_PROGRESS.json`
- `calculators-registry.json`
- `sitemap.xml`
- relevantní HTML/CSS/JS řešené URL
- relevantní benchmark/data soubory
- hlavní index/katalog/hub, pokud mají význam pro brand lineage nebo integraci

Před buildem ověř skutečný stav proti trackeru. Pokud tracker a kód nesouhlasí, nejprve zjisti proč a stav reconciliuj. Skutečný produkční kód má přednost před historickou konverzací nebo starým ZIPem.

Když je relevantní CI/deploy stav, načti také poslední GitHub Actions běhy a jejich logy.

---

## 3. GitHub obsluhuje asistent, ne uživatel

Standardní workflow už **nemá obsahovat ruční krok uživatele „stáhni ZIP → rozbal → nahraj soubory na GitHub“**.

Asistent má sám:

1. načíst aktuální soubory z `main`,
2. připravit změnu,
3. provést lokální/statický/runtime QA podle možností,
4. po schválení zapsat všechny dotčené soubory přímo do GitHub `main`,
5. zkontrolovat Actions,
6. ověřit produkci,
7. opravit nalezené release chyby bez přenášení této administrativy na uživatele.

Uživatel je primárně **product owner / vizuální schvalovatel**, ne manuální deploy operátor.

---

## 4. PREVIEW → SCHVÁLENÍ → DEPLOY → DONE

### 4.1 Větší rebuild / nový V-next archetyp

U MAJOR redesignu nebo nového V-next rebuildu:

1. stránku nejdřív připrav jako `PREVIEW` / `inProgress`,
2. neposouvej ji předčasně do `DONE`,
3. dej uživateli výsledek k vizuální kontrole,
4. až po schválení proveď produkční commit do `main`,
5. potom sleduj CI a živou produkci,
6. `DONE` je možné až po úspěšném release gate.

Za schválení po vizuální kontrole lze považovat přirozené formulace typu:
- „cajk“
- „super“
- „schváleno“
- „vyřešeno“
- „nasadit“
- „jdi dál / jdeme na další“

pokud je z kontextu zřejmé, že uživatel právě schválil zobrazenou verzi. Pokud uživatel zároveň popíše další vadu, schválení nenastalo.

### 4.2 Menší hotfix

U jednoznačného opravnému zásahu, který uživatel přímo požádal (`fixni logo`, `oprav alignment`, `doplň socials`, `oprav broken asset`), může asistent opravu commitnout přímo do `main`, pokud nemění produktovou logiku nebo metodiku a riziko je malé.

Po takovém commitu stále platí povinná kontrola CI a produkce.

---

## 5. Atomický release — všechny související soubory spolu

Před commitem zjisti aktuální blob SHA každého měněného souboru. Nepracuj nad zastaralou kopií, pokud mezitím vznikl nový commit.

Jedna produktová změna musí zahrnout všechny relevantní soubory, například:

- HTML,
- CSS,
- JS,
- OG/obrazové assety,
- benchmark/data CSV,
- `RV_VNEXT_PROGRESS.json`,
- `calculators-registry.json`,
- `sitemap.xml`,
- případné audit/config/prompty,
- další skutečně dotčené integrační soubory.

Nesmí vzniknout stav, kdy:

- tracker říká `DONE`, ale HTML marker říká `PREVIEW` / `RELEASE_CANDIDATE`,
- HTML odkazuje na asset, který není v `main`,
- nová stránka je V-next, ale tracker ji vůbec nezná,
- sitemap/registry jsou přepsané starší kopií,
- část změny zůstala pouze v lokálním ZIPu.

---

## 6. V-next marker a tracker jsou jeden kontrakt

Každá sledovaná V-next HTML stránka musí mít canonical marker kompatibilní s `rv-vnext-progress-audit.py`, např.:

`<!-- RV-VNEXT: status=DONE | major=2026-08-29 | qa=PASS | seq=87 -->`

Hodnoty `status`, `major` a `seq` musí odpovídat `RV_VNEXT_PROGRESS.json`.

Při PREVIEW/inProgress musí být i marker a tracker v PREVIEW/inProgress stavu. Po schválení se obojí mění společně.

Nikdy nepoužívej starý alternativní marker formát, který tracking audit neumí parsovat.

---

## 7. Povinný post-commit CI loop

Po každém produkčním commitu sleduj minimálně:

1. **RV Predeploy Audit**
2. **pages build and deployment**
3. **RV Live Health Monitor**

Pokud některý vlastní RV gate skončí červeně:

- nečekej, až uživatel pošle screenshot,
- otevři failing job,
- přečti konkrétní failing step a log,
- rozliš skutečný produkční problém od evidenční/CI chyby,
- oprav kořenovou příčinu,
- znovu ověř výsledek.

Červený vlastní audit se nesmí automaticky interpretovat jako neúspěšný GitHub Pages deploy. Vždy rozlišuj:
- deploy/build stav,
- tracking/static gate,
- live production gate.

Deprecation warning GitHub Actions není release blocker, pokud job nepadá právě kvůli němu.

---

## 8. Asset integrity gate

Každý nový lokální asset referencovaný HTML/CSS/JS musí před releasem splnit jedno z:

- už existuje v aktuálním `main`, nebo
- je součástí stejného release commitu.

To platí zvlášť pro:
- OG image,
- logo/inverse logo,
- SVG,
- CSS/JS,
- benchmark CSV,
- favicon/manifest odkazy.

Nevytvářej referenci na plánovaný asset s tím, že bude doplněn později. Broken lokální asset = release FAIL.

---

## 9. DONE znamená skutečně hotovo

Stránka nesmí být označena `DONE` jen proto, že:
- je napsaný kód,
- prošel lokální lint,
- nebo se povedl Pages build.

Pro `DONE` musí být konzistentně splněno:

- schválená produktová/visual verze,
- správná metodika,
- runtime/static QA podle tématu,
- tracker + marker + registry/sitemap integrita,
- GitHub Pages deployment úspěšný,
- RV Predeploy Audit bez blokujících P0/P1,
- RV Live Health Monitor bez blokujících P0/P1,
- živá produkční URL servíruje novou verzi.

Pokud něco z toho chybí, stránka zůstává `PREVIEW`, `RELEASE_CANDIDATE` nebo jiný odpovídající nedokončený stav.

---

## 10. Komunikace směrem k uživateli

Po úspěšném GitHub release stručně uveď:

- co bylo změněno,
- že změna byla commitnuta do `main`,
- produkční URL,
- stav Predeploy / Pages / Live Health,
- případný commit SHA, pokud je užitečný.

Nedávej uživateli changed-only ZIP jako povinný deploy krok. ZIP nabídni/vytvoř pouze:
- na explicitní žádost,
- jako backup,
- nebo pokud GitHub konektor dočasně neumožní bezpečný zápis.

---

## 11. Bezpečnost změn

- Produkční zápisy dělej pouze do `fangren740/bmi-kalkulacka`.
- Standardní produkční branch je `main`.
- Neprováděj plošný refactor bez produktového důvodu.
- Před přepsáním existujícího souboru vždy načti aktuální verzi a její SHA.
- Pokud se během práce změnil `main`, znovu načti dotčené soubory a změnu reconciliuj; nepřepisuj novější cizí změnu starou lokální kopií.
- U zásadní nejistoty raději zachovej PREVIEW než falešně dokončený release.

---

## 12. Procesní cíl

Cílový provozní model projektu je:

**GitHub main → asistent pracuje přímo se zdrojem → uživatel schvaluje produkt → asistent deployuje → CI automaticky kontroluje → asistent řeší chyby → uživatel dostává hotový live výsledek.**

Ruční přesouvání souborů uživatelem není standardní součástí workflow.
