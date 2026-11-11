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

## 2026-11-11 — implementován samostatný engine PoC (PR #65)
- **PR:** https://github.com/fangren740/bmi-kalkulacka/pull/65 (`rv3/engine-poc` → `rv3/clean-slate`), **DRAFT / NEMERGEOVAT**.
- **Změna:** statický sdílený shell pro tři technické archetypy; source files `rv3/engine/renderer.mjs`, `scripts/build-v3-engine-poc.mjs`, `rv3/poc-theme.css`, `cloudflare/tests/v3-engine-poc.test.mjs`.
- **Výsledky Cloudflare build-u pro implementační commit `ad6ea655`: SUCCESS.** Tři stránkové proofy generované na `/rv3/poc/kalkulacky.html`, `/rv3/poc/hypotecni-kalkulacka.html`, `/rv3/poc/dpp-dpc-kalkulacka.html`.
- **QA rozsah:** integrita source main HTML, JS a canonical PASS v Node build testech; skutečné 390/1440, konzole, interaktivita kalkulaček, veřejné HTTP hlavičky a Lighthouse **NOT VERIFIED**.
- **Důležité:** skrytý/inert starý header/footer je přechodný compatibility shim pro legacy JS, ne konečná produkční architektura.
- **Další rozhodnutí:** nejprve reálný browser E2E + odstranit shim bezpečným adapterem; následně předat vlastníkovi architektonické schválení A. Bez souhlasu žádné další masové migrace.
- **Současný master pro automatizaci:** issue #59 a #61 nyní obsahují odkaz na PR #65; jestli se mezitím pohnula `rv3/clean-slate`, nezačínat bez ověření aktuálního HEAD.
