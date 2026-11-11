# RV3 Decision Log / ADR

Každé rozhodnutí má stav a rozsah. **Návrh není schválený release.**

## ADR-001 — sdílený build-time static V3 engine
- **Status:** PROPOSED 2026-11-11; PoC a souhlas A ještě čekají.
- **Volba:** deterministický Node HTML renderer v Cloudflare preview + společný shell, route registry, per-page adapter, lokální výpočtové moduly. Zachovává .html adresy a obsah.
- **Proč:** repo má 207 HTML a mnoho specializovaných JS/CSS; nejnižší riziko oproti big-bang framework rewrite.
- **Alternativy zamítnuté:** masivní Next/React přepis, runtime DOM patch všech stránek, pouze jednotné přemalování CSS.
- **Následek:** nejprve PoC na `kalkulacky.html`, `hypotecni-kalkulacka.html`, `dpp-dpc-kalkulacka.html`, potom kontrola a potvrzení.

## ADR-002 — brand a design systém
- **Status:** PILOT PREFERENCE, ne finální produkční schválení.
- **Volba:** původní logo a identita navy/blue/green, výrazná typografie, praktická vizualizace podle problému; uživatel schválil progres jako výrazně lepší a požádal o kompletní migraci.
- **Zakázat:** generické opakující se karty a duplicitní barevné bloky, prázdné animace, vymyšlené autority, ztrátu odborného obsahu.

## ADR-003 — rollout a hosting
- **Status:** ACTIVE SAFETY LOCK.
- `main` + GitHub Pages zůstává produkce. Cloudflare Worker je pouze oddělený preview host, žádné custom routes/DNS.
- Produkční hosting/migrace na Cloudflare není schválená. Každý release potřebuje konkrétní souhlas a rollback.

## ADR-004 — SEO a obsah
- **Status:** ACTIVE SAFETY LOCK.
- Věrné URL + canonical, užitečný původní obsah, primární zdroje a skutečné kalkulační hodnoty. Nesmí zmizet důležitá metodika kvůli čistšímu designu.
- Bez mechanických kvót slov. Čitelnost a konkrétní užitečnost určuje obsahovou hloubku.

## ADR-005 — projektová paměť
- **Status:** ACTIVE 2026-11-11.
- Source of truth pro RV3: issue #59 → `RV3_START_HERE.md` → `docs/rv3/CONTROL_CENTER.md` → `HANDOFF.md` → SESSION_LOG + route-registry. Před každým novým chatem se ověřuje GitHub HEAD.
- Starý issue #53 sloužil V8 a nesmí být automaticky považován za aktuálnější než RV3, pokud jde o V3 plán. Změny V3 zapisovat do #59.

## Otevřená rozhodnutí
1. Schválit nebo upravit ADR-001 po živém PoC.
2. Ověřit, zda GSC potvrzuje prioritu migračních vln; chybějící data = UNKNOWN.
3. Výběr produkčního release mechanismu pro statické vygenerované HTML — samostatné schválení.
4. Jak měřit 390/1440 browser QA bez instalací na PC uživatele.
