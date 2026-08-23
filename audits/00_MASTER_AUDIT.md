# RV MASTER AUDIT — V1.1

**Verze:** 1.1  
**Datum:** 23. 8. 2026  
**Status:** ACTIVE / SOURCE OF TRUTH FOR AUDIT WORKFLOW

## 1. Účel

Tento dokument je jediný vstupní bod pro technický, release a regresní audit RychléVýpočty.cz. Neobsahuje detailní produktová pravidla; orchestruje auditní moduly a odkazuje na aktuální standardy projektu.

## 2. Povinný postup

1. **SOURCE LOCK** — jako technický zdroj pravdy použij aktuální ZIP/repo/commit dodaný pro danou práci. Starší kopie nesmí přebít novější projekt.
2. **PROFILE LOCK** — před auditem zvol přesně jeden primární profil z `audits/profiles/`.
3. **BASELINE** — před patchem reprodukuj problém nebo změř výchozí stav, pokud to typ práce dovoluje.
4. **STATIC FIRST** — spusť deterministické kontroly před manuálními kontrolami.
5. **ROOT-CAUSE SCAN** — při nálezu neprohlížej jen první URL; proskenuj celý projekt na stejný pattern a blízké varianty.
6. **MINIMAL PATCH** — oprav root cause s nejmenším bezpečným diffem. Mimo scope neměň design, obsah ani výpočetní logiku.
7. **REGRESSION** — po patchi zopakuj celý relevantní gate, nikoli jen dotčený soubor.
8. **LIVE AFTER DEPLOY** — pokud došlo k produkčnímu deployi, spusť/ověř `45 LIVE PRODUCTION HEALTH`. Repo PASS není důkaz produkčního PASS.
9. **RUNTIME/VISUAL/LIVE** — proveď podle profilu a dostupného prostředí. Co nebylo možné spustit, označ `NOT RUN`, nikdy ne `PASS`.
10. **VERDICT** — audit vždy ukonči jednotným release verdict podle `checks/90_RELEASE_GATE.md`.

## 3. Severity model

- **P0 BLOCKER** — web/build/release zásadně nefunguje nebo hrozí rozsáhlá škoda.
- **P1 HIGH** — funkční, indexační, schema nebo asset chyba na produkčním rozsahu; release blokuje.
- **P2 MEDIUM** — významná degradace, nekonzistence nebo technický dluh; standardně opravit před běžným release.
- **P3 LOW** — neblokující quality debt.
- **INFO** — ověřená výjimka, omezení prostředí nebo doporučení.

P0 a P1 vždy blokují release. P2 může blokovat podle profilu nebo dopadu. Výjimka musí být explicitní v `audit-config.json`.

## 4. Moduly

Auditní strom se provádí v tomto pořadí:

1. `checks/10_REPO_INTEGRITY.md`
2. `checks/20_SEO_INDEXABILITY.md`
3. `checks/30_STRUCTURED_DATA.md`
4. `checks/40_LINKS_AND_ASSETS.md`
5. `checks/45_LIVE_HEALTH.md`
6. `checks/50_RUNTIME_BROWSER.md`
7. `checks/60_VISUAL_RESPONSIVE.md`
8. `checks/70_PERFORMANCE.md`
9. `checks/80_CONTENT_METHOD_AND_TRUST.md`
10. `checks/90_RELEASE_GATE.md`

`45 LIVE HEALTH` se spouští nad skutečnou produkcí po deployi a pravidelně ze scheduleru. Profil určuje, které ostatní moduly jsou povinné a které jen podmíněné.

## 5. Deterministické scannery

### Repo/static gate

```bash
python .github/scripts/audit_static_site.py --root . --config audits/audit-config.json --check-js
```

### Live production gate

```bash
python .github/scripts/live_health_monitor.py --root . --config audits/audit-config.json
```

Scannery musí být bezpečné pro CI, nesmí upravovat projekt a musí vracet nenulový exit code při nevyjmutém P0/P1 nálezu.

## 6. Produktové/designové standardy

Při auditu nové nebo zásadně upravené kalkulačky načti také:

- `RV-VNEXT-PRODUCTION-STANDARD.md`
- `RV-VNEXT-EXPERIENCE-STANDARD-V2.md`
- `RV-VNEXT-IDENTITY-AUDIT-2026-08-21.md`

Tyto soubory mají přednost před starými handoffy a historickými prompty, pokud si odporují.

## 7. Zakázané auditní chování

- označit kontrolu `PASS`, přestože nebyla spuštěna;
- považovat repo/static PASS za důkaz, že produkční deploy je zdravý;
- opravit pouze URL uvedené v GSC bez scanování stejného patternu v celém repu;
- schovat výjimku do kódu, workflow nebo do paměti chatu;
- rozšířit hotfix o redesign nebo obsahové změny bez důvodu;
- považovat syntaktický PASS za runtime/visual PASS;
- použít starý ZIP jako zdroj pravdy jen proto, že už byl rozbalený;
- vydat `RELEASE`, pokud zůstává nevyřešený P0/P1.
