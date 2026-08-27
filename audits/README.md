# RychléVýpočty.cz — Audit System V1

**Verze:** 1.1  
**Datum:** 27. 8. 2026  
**Status:** ACTIVE

Tento adresář je zdroj pravdy pro **auditní workflow** projektu RychléVýpočty.cz. Nenahrazuje produktové a designové standardy; pouze určuje, **jak konzistentně kontrolovat změny a release**.

## Jak systém používat

1. Otevři `audits/00_MASTER_AUDIT.md`.
2. Zvol profil v `audits/profiles/` podle typu práce.
3. U V-next práce nejdřív ověř stav/tracking a potom spusť statický scanner:

```bash
python rv-vnext-progress-audit.py --root .
python .github/scripts/audit_static_site.py --root . --config audits/audit-config.json --check-js
```

4. Potom proveď manuální/browser/live kontroly požadované profilem.
5. Každý audit uzavři jednotným release verdict formátem z `checks/90_RELEASE_GATE.md`.

## Jak to zadat AI v novém chatu

Stačí například:

> Načti aktuální projekt a řiď se `audits/00_MASTER_AUDIT.md`. Pro tuto opravu použij profil `audits/profiles/HOTFIX.md`. Nejdřív reprodukuj vadu, potom proskenuj celý projekt na stejný a příbuzný pattern, proveď minimální patch a zopakuj relevantní gate.

Pro novou kalkulačku:

> Načti `audits/00_MASTER_AUDIT.md` a spusť profil `audits/profiles/CALCULATOR_RELEASE.md` nad aktuální verzí projektu. Produktové požadavky ber z aktuálního `RV-VNEXT-PRODUCTION-STANDARD.md` a `RV-VNEXT-EXPERIENCE-STANDARD-V2.md`.

## Co patří kam

- `00_MASTER_AUDIT.md` — orchestrace a základní pravidla.
- `checks/` — jednotlivé auditní moduly.
- `profiles/` — kombinace modulů podle typu práce.
- `audit-config.json` — strojově čitelná konfigurace a explicitní výjimky.
- `rv-vnext-progress-audit.py` — deterministická kontrola souladu trackeru a skutečných V-next HTML.
- `.github/scripts/audit_static_site.py` — deterministický statický audit.
- `.github/workflows/rv-predeploy-audit.yml` — automatické spuštění v GitHub Actions.

## Zdroj pravdy a vztah ke standardům

Auditní systém **nesmí duplikovat** obsah těchto dokumentů:

- `RV-VNEXT-PRODUCTION-STANDARD.md`
- `RV-VNEXT-EXPERIENCE-STANDARD-V2.md`
- `RV-VNEXT-IDENTITY-AUDIT-2026-08-21.md`
- případné aktuální handoff/master dokumenty pro konkrétní wave

Když se produktové pravidlo změní, mění se primárně příslušný standard. Auditní modul se upraví jen tehdy, pokud je potřeba změnit způsob kontroly nebo release gate.

## Výjimky

Žádná trvalá „magická“ výjimka nesmí být schovaná v promptu ani ve skriptu. Výjimka, kterou nelze odstranit, patří do `audits/audit-config.json`:

```json
{
  "check": "CHECK_ID",
  "path": "soubor-nebo-glob.html",
  "reason": "Konkrétní technický důvod výjimky.",
  "expires": "2026-12-31"
}
```

- `check` musí odpovídat ID kontroly z reportu.
- `path` podporuje glob patterny.
- `reason` je povinný a musí vysvětlit proč.
- `expires` je doporučený; po expiraci audit výjimku odmítne.

## GitHub merge gate

Workflow `.github/workflows/rv-predeploy-audit.yml` běží při Pull Requestu, pushi do `main` a ručním spuštění. Pokud má audit **skutečně blokovat merge**, nastav v GitHub branch protection / rulesetu check **`Static release gate`** jako required status check. Samotná existence workflow bez branch protection zabrání tichému selhání CI, ale nezakáže oprávněnému uživateli merge obejít.

## Základní princip

**Co lze spolehlivě změřit, má kontrolovat skript. Co vyžaduje úsudek, má kontrolovat auditní modul.**

Tím se minimalizuje rozdíl mezi chaty, lidmi a jednotlivými release.
