# RV3 #60 — technické archetypy a migrační rizika (11. 11. 2026)

## Ověřené zdroje
Přímé čtení souborů na `rv3/clean-slate` (nikoli browser audit). Inventář: 207 HTML / 135 katalogových / 72 mimo katalog, z toho 40 původně `unclassified`. `main` při porovnání: `2041e3eaefe15ac066ba1bf3b0bcd57d34125fb7`; větev RV3 je 81 commitů napřed, 0 pozadu (v okamžiku kontroly). PR #58 je otevřený draft. Paralelně již existuje draft PR #65 s engine PoC, proto nový konkurenční engine nezakládáme.

## Pět konkrétních archetypů (statická evidence)
| URL | HTML / JS | CSS a další | Riziko / adaptér |
|---|---|---|---|
| `kalkulacky.html` | 210 673 znaků HTML; 2 inline script bloky; 1 form; JSON-LD | katalog 135 položek, rozsáhlý inline layout | Zachovat všech 135 funkčních odkazů, filtrování, index a strukturovaná data; pro nový katalog preferovat build-time HTML |
| `kalkulacka-priplatku-za-smeny.html` | 55 292 znaků; externí `priplatky-smeny.js?v=20261107-simple`; 4 inline skripty; 1 form | `priplatky-smeny.css`, společná brand vrstva, 4 JSON-LD | **Chráněná numerika**; žádná změna výpočtu, testovat přesahy přes půlnoc, souběhy, pauzu, plat/mzdu |
| `hypotecni-kalkulacka.html` | 30 326 znaků; `hypoteka-v4.js?v=20260817-vnext1`; 2 inline skripty; 1 form | `hypoteka-v4.css`, 2 JSON-LD | Amortizační tabulka, fixace, přesnost úroků, obsluha událostí; externí JS zachovat byte-for-byte |
| `dpp-dpc-kalkulacka.html` | 47 641 znaků; 3 inline skripty; 1 form; žádný externí script src | inline CSS, 2 JSON-LD | Výpočet závisí na inline skriptu a DOM identifikátorech; žádná extrakce nebo změna pořadí bez browser regrese |
| `superdavka-kalkulacka.html` | 49 520 znaků; `superdavka-normativy-2026-10.js` + `superdavka-vnext.js`; 3 inline skripty; 1 form | `superdavka-vnext.css`, 3 JSON-LD | **Legislativní high-risk**; okresní normativy, podmínky domácnosti a data účinnosti; žádný algoritmický zásah bez ověření zdrojů a testů |

## Nekatalogových 40 URL — rozhodnutí a otevřená kontrola
Není správné je hromadně označit jako `tool` podle názvu. Staticky potvrzené výjimky:
- `cena-nabijeni-elektromobilu-kalkulacka.html`: **redirect/legacy landing**; title „Stránka byla přesunuta“, bez formuláře a inputů (1281 znaků).
- `jak-si-spocitat-cistou-mzdu.html`: **sloučený návod / legacy landing**, title „Jak si spočítat čistou mzdu“, bez formuláře a inputů (1264 znaků).
- `minimalni-prodejni-cena.html`: **funkční nekatalogová kalkulačka**; title „Kalkulačka minimální prodejní ceny“, 1 form, 3 inputy, inline skript (2818 znaků).
- `kolik-stoji-provoz-spotrebice.html`: **obsahový průvodce**, 0 formulářů, 0 inputů (42192 znaků).
- `vyplati-se-fotovoltaika-co-si-spocitat.html`: **obsahový průvodce**, 0 formulářů, 0 inputů (39371 znaků).

**Zbývajících 35 URL má zatím pouze názvový signál, nikoli doloženou technickou klasifikaci.** Ponechat `unclassified` v registru do individuálního ověření; nevymýšlet 40/40 PASS. Rozlišovat `guide`, `redirect`, `standalone-tool` a případné `landing` podle skutečného DOM, canonical, meta refresh, JS a uživatelské funkce.

## Největší migrační rizika / stop conditions
1. **SEO:** zachovat přesné `.html` URL, canonical, title, robots, JSON-LD, interní odkazy a hodnotný obsah; `noindex` pouze preview. GSC indexace a Google-selected canonical **UNKNOWN** bez GSC důkazu (#50).
2. **Výpočty:** nevyměnit DOM ID, script order, externí JS ani inline kód; chráněné příplatky a superdávka vyžadují zvláštní regresní scénáře.
3. **Layout:** build-time engine nesmí skrýt interaktivní formuláře ani vytvořit duplicitní navigaci, skrytý legacy header je pouze přechodná PoC technika.
4. **Provoz:** Cloudflare build SUCCESS není browser PASS; požadovat 390/1440 screenshot, keyboard, konzoli, funkční výsledky, síťové requesty a reálné HTTP robots/noindex.
5. **Souběh:** existující #65 již implementuje izolovaný engine a studio katalog; nepřepisovat jeho větev ani nenasazovat bez schválení A.

## Následující jeden realizační blok
Dokončit ověření zbývajících 35 nekatalogových URL (DOM+canonical+redirect) a propsat `kind` do registry; pak browser QA PR #65 na 3 archetypech a katalogu. Bez výsledku browser QA neoznačovat #61 jako schválené. Produkce `main` nedotčena.
