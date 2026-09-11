# RychléVýpočty.cz V7 — ADSENSE FINISH QUEUE

**Datum:** 2026-09-11  
**Navazuje na:** `RV_ADSENSE_FINISH_MODE_2026-09-11.md`  
**Stav při snapshotu:** 133 kalkulaček

## 1. INVENTORY SNAPSHOT

Aktuální `RV_VNEXT_INVENTORY.json`:

- `DONE`: **45**
- `RELEASE_CANDIDATE`: **50**
- `REFERENCE_ONLY`: **5**
- `REVIEW_REQUIRED`: **33**

### Důležité: tracker má drift

Status není release truth. Aktuální produkční `main`, commit history a live QA mají přednost.

Konkrétní známé příklady:
- `naklady-na-provoz-auta-kalkulacka.html` je produkčně nasazená/odsouhlasená, ale inventory ji stále vede jako `RELEASE_CANDIDATE`.
- `sklon-a-spad-kalkulacka.html` a `rosny-bod-kalkulacka.html` mají release commity v `main`, ale inventory je stále vede jako `REVIEW_REQUIRED`.

**První úkol sprintu je proto reclassify/promotion sweep, ne 88 redesignů.**

---

# 2. PRACOVNÍ MODEL

Každá non-DONE stránka dostane v jednom průchodu jednu z klasifikací:

- `PROMOTE TO DONE` — live stránka už splňuje finish gate; jen metadata/tracker fix.
- `KEEP + POLISH` — produkt je dobrý, opravit jen konkrétní UX/content/SEO/trust vady.
- `REBUILD` — pouze pokud je stránka skutečně pod quality/value floor.
- `MERGE/RETIRE` — pouze pokud intent není samostatně obhajitelný.

**Default není REBUILD. Default je zachovat fungující produkt a odstranit jen skutečné nedostatky.**

---

# 3. BATCH 0 — STATE RECONCILIATION / QUICK WIN

Nejdřív uzavřít tracker drift u nedávno nasazených stránek a znovu nepředělávat hotovou práci.

Prioritně ověřit release evidence a reclassify:

1. `naklady-na-provoz-auta-kalkulacka.html`
2. `sklon-a-spad-kalkulacka.html`
3. `rosny-bod-kalkulacka.html`
4. další recent `RELEASE_CANDIDATE`, u kterých main/live/QA prokazuje hotový release

Výstup: tracker/inventory odpovídá realitě.

---

# 4. BATCH 1 — HIGH-OPPORTUNITY REVIEW (ZAČÍT TADY)

Vybráno podle GSC opportunity + aktuálního inventory + rychlého live on-page auditu.

## 4.1 `procenta-kalkulacka.html`
- GSC 2026-03-01 → 2026-09-08: 2 kliky / 76 impresí
- live audit: ~2796 slov, indexable, bez high/critical SEO issue
- **počáteční klasifikace: KEEP + POLISH**
- riziko: obsah je bohatý, ale fragmentovaný (43× H3); neřešit přidáním dalšího obsahu, spíš UX/structure polish

## 4.2 `kalkulacka-celkove-ceny-vlastnictvi-auta.html`
- GSC: 2 kliky / 42 impresí
- live audit: ~3613 slov, indexable, bez high/critical SEO issue
- **počáteční klasifikace: KEEP + POLISH / focused UX rebuild jen pokud mobile first-use skutečně selhává**
- nesmí se překrývat intent s `naklady-na-provoz-auta-kalkulacka.html`

## 4.3 `kalkulacka-hodinove-mzdy.html`
- GSC: 22 impresí v dlouhém okně, pozice kolem 6–7
- live audit: ~3440 slov, bez high/critical issue
- **počáteční klasifikace: KEEP + POLISH**
- vysoká šance rychlého uzavření bez rebuild smyčky

## 4.4 `kalkulacka-dovolene.html`
- GSC: 21 impresí v dlouhém okně
- live audit: ~2790 slov
- **počáteční klasifikace: KEEP + POLISH**
- zkontrolovat především mobile complexity, právní metodiku 2026, title/meta a customer copy

## 4.5 `kalkulacka-prescasu.html`
- GSC: pozice kolem 8 v dlouhém okně
- live audit: ~2879 slov; žádný audit issue
- **počáteční klasifikace: KEEP + POLISH**
- explicitně chránit vazbu na příplatky za směny; nepřidávat duplicity

## 4.6 `cestovni-nahrady-kalkulacka.html`
- live audit: ~2613 slov
- **počáteční klasifikace: KEEP + POLISH**
- drobné meta/image hygiene + UX/method review; ne redesign od nuly

### Batch 1 conclusion

Těchto 6 stránek **není content-thin**. Jejich inventory `REVIEW_REQUIRED` proto nesmí automaticky spustit redesign. Cíl je rychle ověřit UX, correctness, methodology, branding, footer/socials, mobile a release gates — a pokud projdou, uzavřít je.

---

# 5. BATCH 2 — MZDY / PRÁCE COMPLETION

Po Batch 1:

1. `mesicni-mzda-z-hodinove-sazby-kalkulacka.html`
2. `kalkulacka-odpracovanych-hodin.html`
3. `odstupne-kalkulacka.html`
4. `nahrada-mzdy-za-dovolenou-kalkulacka.html`

Reference v kategorii:
- `cista-mzda-kalkulacka.html`
- `kalkulacka-priplatku-za-smeny.html`
- `kalkulacka-hrube-mzdy-z-ciste.html`
- `prumerny-vydelek-kalkulacka.html` (reference only)

Default: KEEP + POLISH, pokud actual mobile/UX/correctness audit neprokáže nutnost rebuildu.

---

# 6. BATCH 3 — AUTO + MATEMATIKA

1. `spotreba-paliva-kalkulacka.html`
2. `prevodnik-jednotek.html`

`procenta-kalkulacka.html` a TCO už řeší Batch 1.

Reference:
- `cena-za-km-kalkulacka.html`
- `amortizace-auta-kalkulacka.html`
- `naklady-na-provoz-auta-kalkulacka.html`
- `dph-kalkulacka.html`

---

# 7. BATCH 4 — ENERGIE A DOMÁCNOST

1. `spotreba-elektriny-kalkulacka.html`
2. `naklady-na-vytapeni-kalkulacka.html`
3. `porovnani-vytapeni-kalkulacka.html`
4. `navratnost-fotovoltaiky-kalkulacka.html`
5. `spotreba-plynu-kalkulacka.html`
6. `spotreba-vody-a-naklady-kalkulacka.html`
7. `spotreba-klimatizace-kalkulacka.html`
8. `led-uspora-elektriny-kalkulacka.html`

Reference:
- recent `rosny-bod-kalkulacka.html` po ověření release kvality
- finance S-tier pro result/depth metodiku, ne layout copy

Energy batch je vhodný pro reuse technických primitives, ale každá stránka musí mít vlastní topic object + vlastní praktickou depth část.

---

# 8. BATCH 5 — PRONÁJEM / INVESTIČNÍ BYDLENÍ

1. `kalkulacka-cisteho-vynosu-z-pronajmu.html`
2. `kalkulacka-cashflow-z-pronajmu.html`
3. `kalkulacka-mesicnich-nakladu-investicniho-bytu.html`

Pohlídat intent separation; pokud dvě URL odpovídají stejné otázce prakticky totožně, teprve pak zvažovat merge/retire.

---

# 9. BATCH 6 — RODINA / TĚHOTENSTVÍ

Rodina:
1. `kalkulacka-zivotnich-nakladu.html`
2. `kalkulacka-financni-rezervy.html`
3. `kalkulacka-rozpoctu-domacnosti.html`

Těhotenství/cyklus:
4. `termin-porodu-kalkulacka.html`
5. `kdy-si-udelat-tehotensky-test.html`
6. `ovulacni-kalkulacka.html`
7. `menstruacni-kalendar.html`

Health-adjacent stránky: extra důraz na zdroje, omezení výsledku a zákaz pseudo-medical certainty.

---

# 10. BATCH 7 — LEGACY / SPECIAL

1. `kalkulacka-tapet.html`

A po Batch 0 ověřit, zda `sklon-a-spad-kalkulacka.html` a `rosny-bod-kalkulacka.html` už mají být pouze metadata promotion, ne nový build.

---

# 11. RELEASE_CANDIDATE PROMOTION SWEEP

50 položek `RELEASE_CANDIDATE` se **nepředělává automaticky**.

Postup po kategoriích:

1. production/live exists + correct canonical/indexability,
2. UX gate,
3. content/value gate,
4. methodology/source gate dle tématu,
5. brand/footer/socials,
6. responsive/runtime,
7. regression data / correctness,
8. production performance evidence.

Pokud PASS → `PROMOTE TO DONE`.

Pokud jedna konkrétní vada → `KEEP + POLISH`.

`REBUILD` jen při prokazatelném produktu pod quality floor.

Toto je hlavní páka pro rychlost: **50 release candidates nesmí znamenat 50 nových redesignů.**

---

# 12. DEFINITION OF PORTFOLIO COMPLETE

Calculator phase je hotová, když:

- inventory neobsahuje nevysvětlené `REVIEW_REQUIRED`,
- `RELEASE_CANDIDATE` zůstává pouze u právě čekajícího reálného release, ne jako historický stav,
- všechny kalkulačky jsou buď `DONE`, vědomě `REFERENCE_ONLY`, nebo mají explicitní merge/retire decision,
- žádná indexovatelná kalkulačka nepůsobí jako thin tool shell,
- žádná známá P0/P1 correctness/mobile/trust/SEO vada nezůstává otevřená.

Pak se bez mezikola přesouváme na homepage → katalog → category hubs → trust/contact → sitewide technical audit → AdSense resubmission.
