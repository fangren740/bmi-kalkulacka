# RV3 — Cloudflare Browser Run Free quota: bezpečné odložení vizuálního QA

Stav: návrh pouze na neprodukční vývojové větvi, navázaný na [draft PR #72](https://github.com/fangren740/bmi-kalkulacka/pull/72) pro ikonografii stránky O projektu.

## Problém / doložená příčina

Dne 15. listopadu 2026 Cloudflare Browser Run překročil denní limit Workers Free (použito 610 sekund při limitu 600 sekund). Build proces nejprve úspěšně odeslal přesný commit pomocí Wrangler na immutable Cloudflare URL, poté však zavolal QA Worker, který při startu browser session vrátil 429. Celý Workers Builds run pak dostal červené FAIL, i když nový stránkový náhled již existoval. V PR následně nebyl snadno viditelný živý URL. Vadu HTML/CSS/Node testů z toho nelze automaticky vyvozovat.

## Bezpečné pravidlo

`cloudflare/browser-qa/preview-hook.mjs` rozlišuje **3 odlišné výsledky**:

| Výsledek | Browser QA | Exit | Release |
|---|---|---:|---|
| `PASS` | všechny předepsané 8+2 výsledky, manifest a screenshotové důkazy ověřené | 0 | design stále čeká na majitele |
| `FAIL` | reálný neúspěšný test nebo neplatný SHA/manifest/autentizace/API | 1 nebo 2 | blokovat |
| `DEFERRED_QUOTA — NOT VERIFIED` | pouze přesně rozpoznaná odpověď Free kvóty HTTP 429 `Rate limit` nebo HTTP 502 s `429` a zmínkou o browser/limit/quota **po úspěšném Wrangler uploadu a validaci immutable origin + Git SHA** | 0 | **NESMÍ být schváleno/mergováno** před pozdějším QA PASS |

Exit 0 v posledním řádku znamená **pouze dostupný neprodukční náhled**, nikoliv úspěšné browser QA. Stav je explicitně vidět ve výstupu buildu jako `DEFERRED_QUOTA — NOT VERIFIED` a obsahuje immutable URL pro uživatelskou kontrolu. **NIKDY nepřevádět status „Build Success“ na tvrzení „Browser QA PASS“.**

Normální aplikací způsobené chyby (např. HTTP 409 vadný manifest, HTTP 502 bez tokenu 429, skutečné FAIL v kontrolách, 401, 503, chybějící/nesprávné sekrety) zůstávají blokované a nedojde k jejich maskování.

## Ověření / provozní kontrola

- Unit test v `cloudflare/browser-qa/tests/policy.test.mjs` ověřuje, že se odloží výhradně přesně vymezená kvóta, ale běžné chyby zůstávají FAIL.
- Build a nahrání preview pokračují jen ve větvi `rv3/*` a přes existující whitelist immutable workers.dev origin; žádné odkazy na `main`, žádný zásah do DNS a žádný placený Cloudflare tarif.
- Po resetu kvóty stále povinné skutečné 8+2 Browser Run QA včetně screenshotů 390×844 a 1440×900, kontrola nových SVG ikon, konzole, overflow, interních odkazů a noindex. Bez důkazu se nesmí přepsat `NOT VERIFIED`.
- Není dovoleno použít obecné `try/catch => return 0`, univerzální ignorování 502 ani ignorování vlastních regresních testů; výjimka se vztahuje pouze na doloženou kvótu **po úspěšném deploymentu**.

## Přenositelnost pro další stránky

Změny nejsou specifické pro stránku O projektu. Cílem je při každém novém izolovaném Page Studio preview automaticky zveřejnit link i ve dnech, kdy je Browser Run kvóta vyčerpána. Vizuální hodnocení člověkem je samostatná schvalovací brána a nikdy se nepřeskočí.
