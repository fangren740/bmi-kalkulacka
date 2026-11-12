# RV3 HANDOFF — předání mezi chaty

**Aktivní projekt:** RychléVýpočty V3. **Ověřeno při založení:** 11. 11. 2026. Tento soubor se aktualizuje na konci každého dokončeného pracovního roundu.

## Co má další ChatGPT udělat první
1. Otevři [issue #59](https://github.com/fangren740/bmi-kalkulacka/issues/59), [RV3_START_HERE.md](../../RV3_START_HERE.md), [CONTROL_CENTER.md](CONTROL_CENTER.md), [ROADMAP.md](ROADMAP.md) a poslední [SESSION_LOG.md](SESSION_LOG.md).
2. Načti **nový live GitHub stav**: `main`, `rv3/clean-slate`, PR #58 a Cloudflare check. Nepředpokládej platnost dřívějšího SHA.
3. Zjisti aktuální otevřený issue z #60–64 a nepřeskakuj dependencies. Pokud chybí data/QA, vráť jednoznačné BLOCKED důkazy a navrhni opravu.
4. **Začni skutečnou prací bez opakovaného ptaní uživatele**: inventář archetypů → PoC engine → katalog → nástroje. Dodej ucelený PR s náhledem, ne jen opakovaný audit.
5. Po dokončení aktualizuj všechny dokumenty; v novém chatu dej stručný report (co hotovo, PR, preview, QA, potřeba souhlas, další krok).

## Důležitá východiska, nezaměnit
- Živý web `rychlevypocty.cz`: `main` GitHub Pages. Nesahej na DNS/CNAME ani nepublikuj.
- `rv3/clean-slate`: izolované V3 Cloudflare Workers Static Assets preview, draft [PR #58](https://github.com/fangren740/bmi-kalkulacka/pull/58). Nemergovat bez aktuálního souhlasu.
- Hlavní registry je **207 HTML URL**, kde **135** je explicitně v katalogu, **72** nejsou v katalogu; **40** z těch 72 dosud potřebuje typologickou klasifikaci. Nepřehazovat 135/207.
- `RV-VNEXT-PRODUCTION-STANDARD.md`, `RV-VNEXT-EXPERIENCE-STANDARD-V2.md`, `RV_CONTENT_DEPTH_AND_IDENTITY_LOCK_2026-09-11.md` jsou historické kvalitativní standardy, které zůstávají relevantní; pravidlo **žádné povinné kvóty slov** je závazné.
- GSC indexace je [issue #50](https://github.com/fangren740/bmi-kalkulacka/issues/50). Nepředstírat přístup nebo měřenou indexaci, není-li ověřena.
- Příplatky za směny jsou chráněný silný tool, Superdávka legislativně citlivá. Bez věcného důvodu a testů nezasahovat do algoritmů.
- Uživatel nemůže v práci instalovat Node/Chrome, browser test musí zajistit systém/hostované prostředí.
- Uživatel chce stručné české výstupy, jasné náhledy a souhlas s konkrétním návrhem; žádné nekonečné audity.

## Poslední potvrzený pilot (před vznikem těchto dokumentů)
- Homepage, `mzdy-a-prace.html`, `cista-mzda-kalkulacka.html` postaveny jako nový V3 design; zachovaná původní značka.
- Prokázaný Cloudflare build pro pilotní HEAD `50893e2a3c9e657bbd23596269cd56fc5f4b2566` byl SUCCESS. Pozdější dokumentační commity vyžadují novou kontrolu.
- **Neověřeno:** nezávislé 390/1440 browser screenshots, live HTTP headers / PageSpeed skóre, produkční release.
- Repo již obsahuje V3 lazy search index z 135 tools a výpočetní regresní testy pilotu; samostatný nový univerzální engine ještě neexistuje.

## Vzorová první zpráva nového chatu (copy/paste)
> Pokračuj na RychléVýpočty.cz V3. Otevři GitHub repo fangren740/bmi-kalkulacka, issue #59 a RV3_START_HERE.md na větvi rv3/clean-slate. Projdi CONTROL_CENTER, HANDOFF, ROUTE REGISTRY, issue #60–64. Ověř aktuální main/PR #58/Cloudflare. Pracuj na dalším konkrétním realizačním kroku podle roadmapy bez změn produkce. Vrať mi krátký report s náhledem, skutečnými testy a aktualizuj GitHub handoff dokumenty.

## Večerní předání 11. 11. 2026
- Nová důkazová analýza [ARCHETYPES_60.md](ARCHETYPES_60.md), commit `4d7406f`: 5 rozdílných architektur, migrační stop conditions a 5/40 doložených nekatalogových URL. Zbývajících 35 je stále UNKNOWN, neoznačovat hotovo.
- Draft [PR #65](https://github.com/fangren740/bmi-kalkulacka/pull/65) existuje souběžně s #58 a má vlastní engine PoC. Nedělat konkurenční implementaci. Cloudflare build uváděný v PR ≠ browser PASS.
- Následující krok: dokončit klasifikaci 35 a testovat PR #65 v browseru; žádný merge do main.

## 12. 11. 2026 — celý web V3, nová realizační vlna
- Uživatel schválil **vizuální směr katalogu** a požaduje důslednou přestavbu všech 207 HTML podle něj, nikoli mechanickou kopii 135 karet. Žádná autorizace produkčního merge.
- **Jediný aktuální plán:** [SITEWIDE_EXECUTION_PLAN_2026-11-12.md](SITEWIDE_EXECUTION_PLAN_2026-11-12.md). Mapa W0–W7, rizika, G1/G2/G3 QA, produkční lock.
- **Základ reference:** [PR #66](https://github.com/fangren740/bmi-kalkulacka/pull/66), branch `rv3/integration-qa-20261112`, katalog s 135 odkazy a původním logem.
- **Rozpracovaná W1:** [draft PR #67](https://github.com/fangren740/bmi-kalkulacka/pull/67), branch `rv3/sitewide-wave1-20261112` — shared foundation, adapters a první dvě verze v `/rv3/wave1/finance-a-hypoteky.html`, `/rv3/wave1/osvc-a-freelancing.html`.
- Zachovávané `<main>`, skripty, canonical/title. Skrytý legacy header/footer = **pouze kompatibilitní PoC**, nikoliv produkční řešení.
- První W1 testovací HEAD `6534c5b` Cloudflare **FAIL** (testový regex), opraveno v `b8194a3` s build **SUCCESS**. Browser screenshot 390/1440, live HTTP a PageSpeed **NEOVĚŘENO**.
- **Pokračování:** potvrdit Cloudflare deploy přesného HEAD PR #67, prohlédnout obě preview a zrevidovat kompatibilitu hidden shell, poté rozšířit na cílové šablony a browser QA. Produkce `main` při zahájení stále `2041e3ea`.
