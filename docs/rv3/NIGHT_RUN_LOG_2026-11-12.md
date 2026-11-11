# RV3 — noční běhy 11.–12. 11. 2026

Zdroj: [OVERNIGHT_PLAN_2026-11-12.md](OVERNIGHT_PLAN_2026-11-12.md).
Sem autonomní běhy **přidávají reálné dokončené výsledky**. Jedno spuštění automatizace ještě nedokazuje žádný pokrok.

| Čas CET | Průběžný výsledek | SHA / PR | Testy / build | Rizika a next |
|---|---|---|---|---|
| 20:54 (příprava) | Založeny noční úkoly a plán, neprovedena nová produktová implementace | PR #65 / předběžný SHA a28b066 | Next round ještě neproběhl | Začít skutečnou prací na katalogu V2; neprod. |

| 21:15 (round 1) | **Opravena relevance českého hledání při překlepech**: když přesná shoda vrátí 0 výsledků, povolí se jediný překlep (záměna, vložení, vynechání, sousední přehození znaků) v celém slově délky ≥5. Přesné výsledky mají vždy přednost; žádný síťový dotaz. Nový regresní test pro `hipoteka`, `hypotkea`, `dovloena`, `priplatki za smeny`. | [98ff84b](https://github.com/fangren740/bmi-kalkulacka/commit/98ff84befbdc749b3a5f1095a7c4e503a4e98d98) / [PR #65](https://github.com/fangren740/bmi-kalkulacka/pull/65) | **Lokální Node syntetické assertions 10/10 PASS** na ekvivalentním search core; **Cloudflare check pro HEAD PENDING** (v době kontroly žádný check run); celý repozitářový test suite **NEOVĚŘEN**. | Preview [katalog V2](https://rv3-engine-poc-rychlevypocty-v3-preview.maattinek.workers.dev/rv3/poc/katalog-v2.html) je odvozená URL, **HTTP/browser 390/1440 NEOVĚŘEN**. Další kolo: Cloudflare check + skutečná integrace 135 položek a ověření dotazů; pokud browser dostupný, vizuální kontrola. `main` zůstává `2041e3e`. |

<!-- Každý další round appendne další řádek výše nebo vlastní sekci. Při editaci po souběžných změnách nejdříve reload HEAD a spojit obsah, ne přepsat. -->
