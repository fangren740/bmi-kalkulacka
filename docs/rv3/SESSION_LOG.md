# RV3 Session Log — append-only významné události

Zapisovat pouze to, co bylo **skutečně provedeno / ověřeno**. Věta o plánovaném PR není důkaz jeho existence. Když je stav nejasný, napsat UNKNOWN.

## 2026-11-11 — V3 pilot převzat z PR #58
- Ověřen existující `main` HEAD `2041e3eaefe15ac066ba1bf3b0bcd57d34125fb7` a `rv3/clean-slate` na `50893e2a3c9e657bbd23596269cd56fc5f4b2566` při zahájení této plánovací etapy.
- Předchozí Cloudflare Worker preview build pro `50893e2` byl SUCCESS; tím nejsou doložené skutečné 390/1440 screenshots, Lighthouse ani live HTTP noindex.
- Pilot V3 upravil jen tři URL; zbytek webu se má migrovat postupně.

## 2026-11-11 — založeno projektové řízení nové generace
- Z Git stromu ověřeno **207 root HTML URL**, `rv-tool-index.js` obsahuje **135 existujících nástrojů** a dalších **72 URL**.
- Zkontrolovány reprezentanti: příplatky, hypotéka, superdávka, DPP/DPČ, katalog, finance hub, bydlení; nejde o jedinou uniformní HTML/JS architekturu.
- Vytvořen [master issue #59](https://github.com/fangren740/bmi-kalkulacka/issues/59) a realizační issue #60 až #64.
- Přidán `docs/rv3/route-registry.json`: 135 tool / 22 hub / 8 legal / 1 embed / 1 homepage / **40 dosud neklasifikovaných**; 3 stránky označené preview-built, nikoli released.
- Vypracována úvodní architektura, roadmapa, nový chat handoff, rozhodnutí a workflow (konkrétní commity ověřit v GitHubu po dokončení dokumentačního commitu).
- **Další skutečná práce:** #60 typologie pěti archetypů + #61 první adapter-engine POC; nepřepisovat všech 207 HTML.

## Standard jedné další položky
`YYYY-MM-DD HH:mm CET | Issue | commit/branch/PR | provedeno | skutečné testy | preview | rizika | next | schválení`.

## 2026-11-11 19:xx CET — #60 večerní evidence
- Přímé GitHub čtení: main SHA `2041e3ea`, clean-slate 81 commitů před main v době kontroly; PR #58 otevřený draft; existuje také engine draft PR #65.
- Commit `4d7406f`: přidán `docs/rv3/ARCHETYPES_60.md`; doloženo 5 archetypů a 5 z 40 unclassified; zbývajících 35 UNKNOWN. Žádná numerika/produkce změněna.
- Testy: statická inspekce HTML/skriptů; browser 390/1440, GSC, live HTTP noindex a Cloudflare build tohoto dokumentačního SHA **neověřeny**.
- Next: 35 URL klasifikace + PR #65 browser QA; schválení architektury A teprve poté.

## 2026-11-12 15:xx CET — sitewide W1 zahájena
- Zadání: přestavět celý portál podle prémiové ilustrované V3; žádný merge ani změna produkce.
- Auditované podklady: aktuální `main 2041e3e`, PR #66, `route-registry.json` (207/135/72, 35 UNKNOWN), #59–#63, P1 renderer.
- Dokumentovaný design+rollout plán `docs/rv3/SITEWIDE_EXECUTION_PLAN_2026-11-12.md`.
- Draft PR #67: dvě opt-in hub URL, sdílený scoped foundation + hub skin, adapter přes existing P1 helpers. Originální SVG logo se nemění, skripty a main jsou nedotčené.
- Cloudflare first failing attempt `6534c5b` / test regex, subsequent `b8194a3` build SUCCESS.
- Nelze tvrdit browser PASS či Lighthouse. Next: reálné preview deploy HEAD a browser QA; bez nasazení produkce.

## 12. 11. 2026 — reorientace sitewide V3 na každou stránku zvlášť
- Uživatel požaduje plnohodnotný individuální redesign každé URL, především homepage, 22 hubů, o projektu/metodiky/redakčních/trust stránek, a až potom jednotlivé kalkulačky. Metrika úspěchu = výborný konkrétní produkt, ne počet „přebarvených URL“.
- Vytvořen nový master [PAGE_BY_PAGE_MASTERPLAN_2026-11-12.md](PAGE_BY_PAGE_MASTERPLAN_2026-11-12.md) a [tracker všech 207 HTML URL](PAGE_TRACKER_2026-11-12.json) s pravdivými stavy.
- Source audit `index.html`, `o-nas.html`, `jak-pocitame.html`, `redakcni-zasady.html`, `kontakt.html`, `navody.html`, `situace.html`, `kalkulacky.html`, `ochrana-osobnich-udaju.html`, `reklama-a-spoluprace.html` ze současné vývojové větve; ověřeny titulky, H1 a role.
- Specifické briefs `pages/index.md`, `pages/o-nas.md`, `pages/jak-pocitame.md`; homepage preview adapter+stylesheet+test pro `/rv3/wave1/index.html`, původní výpočetní JS, main, URL, canonical netknuté.
- Drobné rozpory vyžadující faktický audit: privacy uvádí „Google Analytics nyní není aktivní“, současný kód a CMP je třeba nezávisle ověřit před novou verzí. Browser/PSI zatím NEOVĚŘENO.
- Automatizace vývojových kol 17/18/19 CET a jednorázový souhrn 20 CET skutečně vytvořeny. Nepředstírat, že scheduled task před spuštěním něco udělal.
