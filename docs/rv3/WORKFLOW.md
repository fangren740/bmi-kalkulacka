# RV3 Execution Playbook — řízení krátkých quality roundů

## Jak vypadá jeden round (žádná nekonečná auditní smyčka)
1. **Select:** vyber jedno konkrétní [issue #60–64](https://github.com/fangren740/bmi-kalkulacka/issues/59), 3–5 ověřitelných acceptance criteria a maximálně 5–10 URL (komplexní 1–3).
2. **Build:** implementuj na vývojové větvi; nevyžaduj instalace na uživatelově firemním PC. Design musí být originální a výsledek hned použitelný.
3. **QA:** výpočty vs současná produkce, HTML/SEO snapshot, link/URL, přístupnost, reálný browser viewport 390/1440 a ověřený Cloudflare deploy. Co není změřeno = UNKNOWN.
4. **Delivery:** pošli živý preview, krátké před/po, co se změnilo, co se nezměnilo a jaký konkrétní souhlas je potřeba.
5. **Close:** aktualizuj registry, `CONTROL_CENTER.md`, `SESSION_LOG.md` a issue #59. Po schválení jeden safe merge/rollout a live QA; další round až pak.

**Bez průběžného čekání:** v tomto chatu lze pracovat jen při aktivním tahu. Samostatný večerní běh vyžaduje vytvořenou automatizaci; neimplikovat background vývoj tam, kde neexistuje.

## Standard statusů
- `PLAN` — návrh bez implementace.
- `IN_PROGRESS` — existují konkrétní commity/pracovní artefakty.
- `PREVIEW_BUILT` — Cloudflare build/deploy pro daný HEAD prošel.
- `QA_PENDING` — funkce sestavena, ale chybí reálný browser/SEO/performance důkaz.
- `READY_FOR_APPROVAL` — všechny deklarované gate doloženy, čeká vlastníkův verdikt.
- `APPROVED` — výslovný souhlas s konkrétním HEAD/rozsahem.
- `RELEASED` — skutečný produkční deploy ověřen.
- `BLOCKED` — konkrétní překážka a owner/action popsané.

**Nezaměňovat:** PASS build vs PASS kalkulace vs PASS vizuální vs PASS produkce.

## Závazná GitHub evidence
- Nové rozhodnutí → `DECISIONS.md`.
- Každé zavřené rozpracování → krátký append v `SESSION_LOG.md` (datum, commit, PR, testy, preview, rizika, next).
- Každá migrovaná URL → updated entry v `route-registry.json` (status, typ, schválení). Nedeklarovat migrováno jen proto, že byl změněn globální CSS.
- Každá etapa → `CONTROL_CENTER.md` (1 odstavec + issue link).
- Každý nový chat → `RV3_START_HERE.md`.

## QA stop/go
**Go**: chráněné vzorce beze změn, testy skutečně PASS, preview URL skutečně vrací zamýšlené stránky, 390/1440 bez chyb, klávesnice + form error, metadata/canonical/obsah zachovány, žádný návrat v GSC bez vysvětlení, schválení pro produkci.
**Stop**: neznámý výsledek pro numeriku/legislativu; rozbité URL/canonical; chybějící relevantní obsah; noindex na prod; dvojitý CMP/analytics; neověřené screenshoty vydávané za PASS; práce jiného PR bez dohody.

## Release/rollback
- Preview URL vždy z branch Cloudflare Workera; vývojové `rv3/clean-slate` **není produkční host**.
- `main` se nemění bez souhlasu, stávající GitHub Pages zůstává veřejným zdrojem.
- Každá veřejná vlna si předem ponechá poslední produkční SHA, seznam migrovaných URL, možnosti revertu a ověření live.
- Po každém release porovnat produkční output s `main` baseline (výpočty i SEO); počkat na konkrétní GSC měření, ne slibovat okamžité ranking.
