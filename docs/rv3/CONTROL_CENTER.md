# RV3 CONTROL CENTER — živý stav projektu

**Revize:** 2026-11-11 (výchozí architektonická etapa). Toto je verzovaný řídicí přehled; PR/CI/Cloudflare HEAD je nutné vždy ověřit live. Trvalý tracker: [issue #59](https://github.com/fangren740/bmi-kalkulacka/issues/59).

## Produkt
Portál má být nejlepší české místo pro praktická rozhodnutí pomocí výpočtů. Nejprve výsledky, následně vysvětlení. Ověřitelná metodika; originální, konsistentní UI a kvalitní mobile-first výsledek. Původní logo a vizuální identita zůstávají. Nezakládat generické klony ani prázdné zbytečné URL.

## Evidence inventáře (z Git tree, 11. 11. 2026)
- **207 skutečných HTML URL** v kořeni Git stromu.
- **135 nástrojů** explicitně v `rv-tool-index.js`, všechny ukazují na existující HTML soubor.
- **72 ostatních URL**: 22 rozcestníků (jeden V3 pilot), 8 právních/trust stránek, 1 embed, 1 homepage a **40 neklasifikovaných** — klasifikace 40 je nutné potvrdit ručně.
- **283 JS a 292 CSS souborů** v kořeni; není to 283 současně načítaných JS a 292 současně načítaných CSS! Jde o existující historické/stránkové soubory.
- Počet 207 ≠ počet indexovaných URL. Google coverage je samostatný nezávislý úkol [SEO issue #50](https://github.com/fangren740/bmi-kalkulacka/issues/50). Nezaměňovat nástroje / HTML / Google index.

## Co je skutečně hotovo / co ještě ne
| Oblast | Aktuální stav | Důkaz / další práce |
|---|---|---|
| Vizuální směr V3 | **PILOT PREVIEW** na homepage, mzdy-a-prace, čistá mzda | [PR #58](https://github.com/fangren740/bmi-kalkulacka/pull/58); čeká na kompletní integrační schválení |
| Cloudflare preview bez změny prod | **FUNGUJE** | build pro commit `50893e2` PASS; novější commity ověřit live |
| V3 route registry | **207 URL ZAPSÁNO** | `route-registry.json`; technické klasifikace zbývají |
| Nový sdílený V3 build engine | **IMPLEMENTED POC, QA PENDING** na izolované větvi | [draft PR #65](https://github.com/fangren740/bmi-kalkulacka/pull/65), build ad6ea655 SUCCESS; neschváleno, neprodukční |
| 135 nových šablon nástrojů | **NENÍ HOTOVO** | migrovat postupně; nejprve typologie a adaptéry |
| Katalog a všechny huby | **NENÍ HOTOVO** | [#62](https://github.com/fangren740/bmi-kalkulacka/issues/62) |
| 390px/1440px browser screenshoty, Lighthouse, live HTTP headers | **NEOVĚŘENO** | před schválením releasu skutečně změřit |
| Výpočtové regrese pilotu | **Cloudflare testy PASS na předchozím HEAD** | ověřit i konkrétní nové HEAD |

## Aktuální issue queue
1. [#60 P0: inventář a SEO baseline](https://github.com/fangren740/bmi-kalkulacka/issues/60): **IN PROGRESS**, statický inventář dodán; klasifikace, 5 archetypů a GSC evidence zbývají.
2. [#61 P1: V3 engine a adaptery](https://github.com/fangren740/bmi-kalkulacka/issues/61): **QUEUED**, zvolit architekturu, vytvořit živý důkaz na 3 odlišných typech stránky.
3. [#62 P2: katalog a huby](https://github.com/fangren740/bmi-kalkulacka/issues/62): **QUEUED**.
4. [#63 P3: migrační vlny kalkulaček](https://github.com/fangren740/bmi-kalkulacka/issues/63): **QUEUED**.
5. [#64 P4: SEO/performance/release/handoff](https://github.com/fangren740/bmi-kalkulacka/issues/64): **CROSS-CUTTING**.

## Ochranné podmínky
1. `main` = živý GitHub Pages web; `rv3/clean-slate` = V3 preview-only. Migrace na Cloudflare v produkci je **samostatné budoucí rozhodnutí**, není schválena.
2. Žádné změny URL, směrování, DNS/CNAME nebo canonical bez výslovného souhlasu a dopadové analýzy.
3. `kalkulacka-priplatku-za-smeny.html` (organicky významný nástroj) a `superdavka-kalkulacka.html` (legislativně rizikový) mají zvláštní ochranu.
4. V každém PR doložit novou hodnotu, screenshoty, výpočetní QA, SEO regresi a rollback. Pokud nelze browser ověřit, zapsat BLOCKED, nikoli PASS.
5. Jeden uzavřený kvalitní realizační blok je lepší než nekonečné audity.

## Schvalovací brány vlastníka
- **A — Architektura V3 engine:** akceptace směru a živého reprezentativního PoC.
- **B — Katalog/huby:** ukázka 390/1440 + klikací náhled.
- **C — Každá větší migrační vlna:** skutečná preview URL a ukázky před/po.
- **D — Jakékoli produkční nasazení/změna hostingu:** výslovné aktuální schválení.

## Pro příští chat
Načti `RV3_START_HERE.md`, `docs/rv3/HANDOFF.md` a tento dokument. **Ověř HEAD**, pak pokračuj bodem #60 a připrav první proof of concept V3 layout enginu podle #61. Na konci práce napiš: větev/SHA, co je PASS/NEOVĚŘENO, konkrétní výsledky, URL preview, další úkol, souhlas požadovaný od vlastníka.

### Paralelní větev pro architektonický PoC
Build-time V3 engine P1 se vyvíjí na `rv3/engine-poc` (PR #65 proti `rv3/clean-slate`), aby večerní automatizace mohla bezpečně pracovat na původní pilotní větvi bez konfliktu. Viz `docs/rv3/ENGINE_POC.md`. Následující uživatelovo schválení A až po screenshotovém a funkčním browser testu; nezaměňovat s hotovým enginem pro 207 URL.

### 2026-11-11 — P2 katalogový PoC navazuje na engine
**PILOT PREVIEW BUILT**: [draft PR #65](https://github.com/fangren740/bmi-kalkulacka/pull/65) vytváří samostatnou generovanou `/rv3/poc/studio-katalog.html` s 135 odkazy v 9 skupinách. Cloudflare pro `da5b0dd` PASS, ale skutečné browser/390/1440/Lighthouse/HTTP **NEOVĚŘENO**. Původní `kalkulacky.html` zůstává beze změny. Následuje #61 integrace a #62 přechod reálného katalogu až po schválení.

### 2026-11-11 — katalog V1 zamítnut, V2 od základů v draft PR #65
Po kritice 135 karet/9 filtrů byl zvolen **nový rozhodovací koncept**, ne grafický retuš. [Celý design brief](CATALOG_RETHINK_2026.md). V2 build = Cloudflare SUCCESS `4d3b8d02`, vygenerováno 135/135 odkazů, 6 přímo dostupných situací, 8 sbalených oblastí, české vyhledávání. **USER APPROVAL A/B A BROWSER QA PENDING.** Nová preview adresa `https://rv3-engine-poc-rychlevypocty-v3-preview.maattinek.workers.dev/rv3/poc/katalog-v2.html`; původní V1 `https://rv3-engine-poc-rychlevypocty-v3-preview.maattinek.workers.dev/rv3/poc/studio-katalog.html`; netýká se `main`.
