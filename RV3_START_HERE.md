# RV3 START HERE — RychléVýpočty.cz (aktivní projekt)

> **Čtěte tento soubor na větvi `rv3/clean-slate` při každém novém chatu.** Historické soubory V7/V8 nejsou živý stav V3. Aktualizováno 11. 11. 2026.

**Cíl:** kompletní přestavba RychléVýpočty.cz na prémiový, rychlý, český portál s kvalitními, vysvětlitelnými kalkulačkami. Zachovat současné logo a identitu; vynikající UX na mobilu i desktopu; žádný SEO regres.

## Odkazy / pravdivý aktuální stav
- **Trvalý GitHub řídicí bod:** [RV3 Control Center #59](https://github.com/fangren740/bmi-kalkulacka/issues/59).
- **V3 produktový pilot:** [draft PR #58](https://github.com/fangren740/bmi-kalkulacka/pull/58), branch `rv3/clean-slate`.
- **Živý nezveřejněný preview host:** https://rv3-clean-slate-rychlevypocty-v3-preview.maattinek.workers.dev/
- **Produkce:** `https://rychlevypocty.cz`, GitHub Pages, branch `main`; nelze ztotožnit s preview.
- **Dokumenty:** [CONTROL CENTER](docs/rv3/CONTROL_CENTER.md) · [ROADMAP](docs/rv3/ROADMAP.md) · [ARCHITECTURE](docs/rv3/ARCHITECTURE.md) · [WORKFLOW](docs/rv3/WORKFLOW.md) · [HANDOFF](docs/rv3/HANDOFF.md) · [DECISIONS](docs/rv3/DECISIONS.md) · [SESSION LOG](docs/rv3/SESSION_LOG.md).
- **Registr URL:** [route-registry.json](docs/rv3/route-registry.json) — Git stromem doložených **207 HTML souborů**, 135 nástrojů katalogu; registry statuses jsou plánovací, nikoli důkaz SEO.

## Povinná rutina pro nové chaty (4 kroky)
1. Přečíst issue #59, CONTROL_CENTER, HANDOFF a poslední SESSION_LOG.
2. **Naživo načíst** GitHub `main`, head `rv3/clean-slate`, PR #58 a Cloudflare build status. Nevěřit starému SHA ani dávno uvedenému PASS.
3. Vybrat **jeden nejbližší realizační issue** #60–#64; dokončit ucelený, viditelný výsledek, založit draft PR / preview, otestovat a dát odkaz.
4. Po každém významném dokončeném roundu aktualizovat CONTROL_CENTER, SESSION_LOG, registr stavů a master issue #59. Tím přežije projekt i nový chat.

## NEPORUŠIT
- **Bez aktuálního explicitního schválení vlastníka:** nikdy nemergovat ani nenasazovat produkci, neměnit DNS, CNAME či `main`.
- Neničit stávající `.html` cesty, canonical, obsah, GSC důkazy, funkční JS, výpočtové vzorce, Consent Mode/CMP/GA4 a AdSense.
- Žádný lokální build po uživateli — pracuje z firemního PC. Cloudflare preview a GitHub jsou preferovaný workflow.
- Žádná mechanická SEO délka textu: obsah se řídí přínosem a rizikem. Žádné nekonečné quality gates/audity bez výstupů.
- Build PASS **není** browser/screenshot/Lighthouse PASS. Měřené a neměřené věci označovat pravdivě.

**Krátký startovací prompt pro další chat:**
> Pokračuj RychléVýpočty V3 podle issue #59 a souboru RV3_START_HERE.md v repo fangren740/bmi-kalkulacka, branch rv3/clean-slate. Ověř aktuální HEAD, PR #58, CONTROL_CENTER a HANDOFF; vyber další realizační krok a pracuj v bezpečném preview. Nesahej na produkci; po dokončení aktualizuj GitHub předávací dokumenty a dej mi stručný výstup s náhledem.

## Aktualita: katalog V2 po uživatelské kritice (11. 11. 2026)
Před dalším vývojem katalogu otevři [CATALOG_RETHINK_2026.md](docs/rv3/CATALOG_RETHINK_2026.md). **Původní Studio V1 zamítnuté**: 135 karet/9 filtrů bylo nepřehledných. Nový `/rv3/poc/katalog-v2.html` (draft PR #65) je rozhodovací rozcestník se 6 přímými cestami a 8 rozbalovacími oblastmi; Cloudflare build prošel, ale chybí uživatelské vizuální schválení a nezávislý browser QA. Nevracet se k 135-card řešení bez jasného důkazu. `main` nedotčeno.
