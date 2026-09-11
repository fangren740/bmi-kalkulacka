RYCHLÉVÝPOČTY.CZ V7 — READ ME FIRST / V-NEXT PROMPT STACK
Aktualizace: 11. 9. 2026

CURRENT SOURCE OF TRUTH
Repository: fangren740/bmi-kalkulacka
Branch: main

CURRENT OPERATIONAL MODE — POVINNĚ ČÍST PRVNÍ
RV_ADSENSE_FINISH_MODE_2026-09-11.md
- Aktivní do explicitního odemčení uživatelem po dokončení AdSense readiness sprintu.
- Cíl: dokončit celé portfolio a sitewide readiness; žádné nekonečné redesign smyčky jedné URL.
- Pokud se starší workflow dostane do konfliktu s tímto finish modem v otázce pořadí práce / batching / stop-loss, platí finish mode.
- Quality, correctness, methodology, mobile UX, brand a production gates se NESNIŽUJÍ.

POVINNÉ POŘADÍ PRO NOVÝ / NAVAZUJÍCÍ CHAT
1) RV_ADSENSE_FINISH_MODE_2026-09-11.md
2) RV_VNEXT_MASTER_PROMPT.txt
3) RV-VNEXT-STRICT-BUILD-PROMPT-2026-09-06.md
4) RV-VNEXT-PRODUCTION-STANDARD.md
5) aktuální recovery / experience / customer-copy dokumenty v main
6) RV_VNEXT_PROGRESS.json + skutečný relevantní HTML/CSS/JS + benchmark/data files

KVALITATIVNÍ KALIBRACE
- Quality floor: #74 cista-mzda-kalkulacka.html
- S-tier: #13 Sádrokarton, #15 Omítka, #19 Rekonstrukce celkem, #21 DPH, #23 Bod zvratu, #25 Minimální fakturace
- Secondary refs: #11, #12, #17, #18, #22, #33
- V finish mode navíc kalibruj obsahovou úplnost proti live top stránkám; nevyráběj strohé tool-only shells.

DŮLEŽITÉ
- Starší `RV-VNEXT-STRICT-BUILD-PROMPT-2026-09-04.md` je HISTORICKÁ REFERENCE; pro nový build použij 2026-09-06.
- Starší master verze 1.7 byla nahrazena `RV_VNEXT_MASTER_PROMPT.txt` verze 2.0.
- Pokud starší prompt odporuje current master/strict/production standardu, platí novější dokument; pro pořadí finish sprintu a stop-loss platí `RV_ADSENSE_FINISH_MODE_2026-09-11.md`.
- Nezačínej nový audit od nuly. Recovery udělej z produkčního main.
- Uživatel není beta tester: žádný polotovar před PASS C.
- PREVIEW PASS != DONE.
- DONE až po user approval / batch approval podle finish mode + production deploy + live health + PageSpeed Insights/Lighthouse Mobile + Desktop + bez známé actionable CWV/performance regrese.

ZÁKLADNÍ DESIGNOVÝ SMĚR
- desktop hero: text vlevo / topic-native vizuál vpravo
- defaultně hero → rovnou kalkulačka; nevkládat před tool marketingové bloky bez skutečného produktového důvodu
- kalkulačka + dominantní výsledek vedle sebe, pokud user job nevyžaduje jinak
- mobil: hero → visual → inputs → result → depth → metodika → footer
- žádné překážející floating result bary
- text nesmí být mikro / strohý; každá indexovatelná kalkulačka musí být obsahově dokončený produkt, ne jen formulář
- originalita přes skutečný topic object / result grammar / data vizualizaci / depth, ne přes náhodné přehazování layoutu
- žádné staré logo, badge spam nebo dvojité section labels
- PageSpeed/Core Web Vitals se nesmí obětovat designu
