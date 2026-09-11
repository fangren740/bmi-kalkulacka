RYCHLÉVÝPOČTY.CZ V7 — READ ME FIRST / V-NEXT PROMPT STACK
Aktualizace: 11. 9. 2026

CURRENT SOURCE OF TRUTH
Repository: fangren740/bmi-kalkulacka
Branch: main

CURRENT OPERATIONAL MODE — POVINNĚ ČÍST PRVNÍ
RV_CONTENT_DEPTH_AND_IDENTITY_LOCK_2026-09-11.md
RV_METHOD_SOURCE_DISCLAIMER_LOCK_2026-09-11.md
RV_ADSENSE_FINISH_MODE_2026-09-11.md
RV_ADSENSE_FINISH_QUEUE_2026-09-11.md
RV_ADSENSE_REVIEW_REQUIRED_AUDIT_2026-09-11.md
- Aktivní do explicitního odemčení uživatelem po dokončení AdSense readiness sprintu.
- Cíl: dokončit celé portfolio a sitewide readiness; žádné nekonečné redesign smyčky jedné URL.
- `RV_CONTENT_DEPTH_AND_IDENTITY_LOCK_2026-09-11.md` je závazné upřesnění: žádná word-count kvóta; hloubka podle tématu; žádná strohost; canonical V3.2 logo + inverse footer logo + V7/V3.2 watermark/visual field na každé upgradované stránce.
- `RV_METHOD_SOURCE_DISCLAIMER_LOCK_2026-09-11.md` je release-blocking: metodika musí být skutečně ověřena; M2–M4 vyžadují method verdict; disclaimer se používá podle konkrétního rizika stránky.
- Pokud se starší workflow dostane do konfliktu s finish modem v otázce pořadí práce / batching / stop-loss, platí finish mode.
- Pokud se starší dokument dá vyložit jako word-count target nebo povolení vizuálně strohého tool shellu, platí CONTENT DEPTH + IDENTITY LOCK.
- Pokud se starší dokument spokojí pouze s přítomností metodiky/zdrojů bez skutečné verifikace, platí METHOD / SOURCE / DISCLAIMER LOCK.
- Quality, correctness, methodology, mobile UX, brand a production gates se NESNIŽUJÍ.

POVINNÉ POŘADÍ PRO NOVÝ / NAVAZUJÍCÍ CHAT
1) RV_CONTENT_DEPTH_AND_IDENTITY_LOCK_2026-09-11.md
2) RV_METHOD_SOURCE_DISCLAIMER_LOCK_2026-09-11.md
3) RV_ADSENSE_FINISH_MODE_2026-09-11.md
4) RV_ADSENSE_FINISH_QUEUE_2026-09-11.md
5) RV_ADSENSE_REVIEW_REQUIRED_AUDIT_2026-09-11.md
6) RV_VNEXT_MASTER_PROMPT.txt
7) RV-VNEXT-STRICT-BUILD-PROMPT-2026-09-06.md
8) RV-VNEXT-PRODUCTION-STANDARD.md
9) aktuální recovery / experience / customer-copy dokumenty v main
10) RV_VNEXT_PROGRESS.json + skutečný relevantní HTML/CSS/JS + benchmark/data files

KVALITATIVNÍ KALIBRACE
- Quality floor: #74 cista-mzda-kalkulacka.html
- S-tier: #13 Sádrokarton, #15 Omítka, #19 Rekonstrukce celkem, #21 DPH, #23 Bod zvratu, #25 Minimální fakturace
- Secondary refs: #11, #12, #17, #18, #22, #33
- V finish mode navíc kalibruj obsahovou úplnost proti tématu a user jobu; nevyráběj strohé tool-only shells.
- Word count NENÍ quality gate. Hloubka má být adekvátní tématu, ne mechanicky stejně dlouhá.
- Každá upgradovaná stránka musí působit jako jeden RV produkt: canonical logo, watermark/visual field, topic-native hero/result, plný footer a sociální sítě.

DŮLEŽITÉ
- Starší `RV-VNEXT-STRICT-BUILD-PROMPT-2026-09-04.md` je HISTORICKÁ REFERENCE; pro nový build použij 2026-09-06.
- Starší master verze 1.7 byla nahrazena `RV_VNEXT_MASTER_PROMPT.txt` verze 2.0.
- Pro pořadí finish sprintu a stop-loss platí `RV_ADSENSE_FINISH_MODE_2026-09-11.md`.
- Pro obsahovou hloubku a V7/V3.2 identitu platí `RV_CONTENT_DEPTH_AND_IDENTITY_LOCK_2026-09-11.md`.
- Pro metodiku, zdroje, re-verifikaci a disclaimery platí `RV_METHOD_SOURCE_DISCLAIMER_LOCK_2026-09-11.md`.
- Nezačínej nový audit od nuly. Recovery udělej z produkčního main.
- Uživatel není beta tester: žádný polotovar před PASS C / batch gate.
- PREVIEW PASS != DONE.
- M2–M4 nemohou být DONE bez `methodVerdict=PASS`.
- „Ověřeno / aktualizováno k …“ se nesmí zobrazit bez skutečné kontroly metodiky.
- DONE až po user approval / batch approval podle finish mode + production deploy + live health + PageSpeed Insights/Lighthouse Mobile + Desktop + bez známé actionable CWV/performance regrese.

ZÁKLADNÍ DESIGNOVÝ SMĚR
- desktop hero: text vlevo / topic-native vizuál vpravo
- defaultně hero → rovnou kalkulačka; nevkládat před tool marketingové bloky bez skutečného produktového důvodu
- kalkulačka + dominantní výsledek vedle sebe, pokud user job nevyžaduje jinak
- mobil: hero → visual → inputs → result → depth → metodika → footer
- žádné překážející floating result bary
- text nesmí být mikro / strohý; každá indexovatelná kalkulačka musí být obsahově dokončený produkt, ne jen formulář
- obsahová hloubka se řídí tématem; žádné povinné 1000/1800/3000 slov
- každá upgradovaná stránka musí mít canonical V3.2 logo, inverse footer logo a jemný topic/brand-specific V7/V3.2 watermark/visual field
- originalita přes skutečný topic object / result grammar / data vizualizaci / depth, ne přes náhodné přehazování layoutu
- žádné staré logo, fake logo, badge spam nebo dvojité section labels
- plný footer + Facebook + Instagram
- PageSpeed/Core Web Vitals se nesmí obětovat designu

METODIKA / TRUST — HARD RULE
- před buildem určit M0–M4 method risk class
- zkontrolovat výpočet, jednotky, rounding, edge cases a proměnlivé parametry
- M2–M4 vyžadují aktuální primární zdroje a dohledatelný method verification record
- disclaimer se nepřidává plošně; tam, kde je potřeba, musí být page-specific, stručný a viditelný v kontextu výsledku/metodiky
- chybný zákonný parametr / chybná metodika / zavádějící health nebo financial claim = P0/P1 a spouští portfolio regression sweep
