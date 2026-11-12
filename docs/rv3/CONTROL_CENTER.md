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
| Nový sdílený V3 build engine | **DESIGN PROPOSAL**, NENÍ IMPLEMENTOVÁNO | [#61](https://github.com/fangren740/bmi-kalkulacka/issues/61) |
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

## 2026-11-11 večerní round #60
- **Doloženo 5 technických archetypů** (katalog / externí směny / externí hypotéka / inline DPP-DPČ / legislativní superdávka) a rizika v [ARCHETYPES_60.md](ARCHETYPES_60.md), commit `4d7406f`.
- Z původních 40 unclassified **5 individuálně prohlédnuto**: 2 legacy landing/redirect, 1 standalone kalkulačka, 2 guide; **35 stále neověřeno**. Registr záměrně zatím nepřeznačen, aby nedošlo k falešné klasifikaci.
- Paralelní [draft PR #65](https://github.com/fangren740/bmi-kalkulacka/pull/65) již obsahuje izolovaný engine PoC a katalog; neduplikovat. Build PASS dle textu PR, nezávislé browser QA/HTTP preview stále UNKNOWN.
- **Další:** ověřit zbývajících 35 URL a browser QA PR #65; žádný merge/produkce.

### Autonomní noční kola 11.–12. 11. 2026
Uživatel autorizoval izolovaný noční vývoj a testování, nikoliv merge produkce. Devět samostatných plánovaných roundů 21:15–05:15, shrnutí 05:50. Pravdivé výstupy a pracovní postup v [OVERNIGHT_PLAN_2026-11-12.md](OVERNIGHT_PLAN_2026-11-12.md) a [NIGHT_RUN_LOG_2026-11-12.md](NIGHT_RUN_LOG_2026-11-12.md). Katalog V2 čeká na vizuální schválení; `main` nedotčeno.

## 2026-11-12 — rozhodnutí: sitewide V3, W1 zahájena
- Uživatel ocenil nový ilustrovaný katalog a požádal o **kompletní sjednocení 207 HTML stránek** ve stejném kvalitativním duchu.
- **Nová platná strategie:** [SITEWIDE_EXECUTION_PLAN_2026-11-12.md](SITEWIDE_EXECUTION_PLAN_2026-11-12.md) — W0–W7 bez big-bang migrace, huby → tři archetypy nástrojů → další typy → SEO/release. 135 tools / 207 HTML / 35 UNKNOWN zůstávají důsledně oddělené.
- **[PR #67](https://github.com/fangren740/bmi-kalkulacka/pull/67)** (draft, base `rv3/integration-qa-20261112`): first wave Finance+OSVČ generovaná pod `/rv3/wave1/`, společná identita, adapter zachovává main/scripts/title/canonical a noindex preview. Původní root URL se v tomto PR nemění.
- Automatické testy + build **PASS na `b8194a3`**, skutečné browser QA **NEOVĚŘENO**. Původní PR #66 je zachovaný jako reference. **Nedotýkat se `main` bez schválení.**
