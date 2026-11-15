# O projektu — RV3 page-studio / úplný redesign od nuly

**Výchozí URL:** `/o-nas.html` · **produkce:** nedotčena · **draft PR:** [#70](https://github.com/fangren740/bmi-kalkulacka/pull/70)

## Verdikt majitele ze dne 15. 11. 2026

První verze PR #70 byla **zamítnuta**, protože pouze kosmeticky přetvořila starou stránku: starý hero, levé menu, obsahové karty a stejná lineární struktura. Tato iterace je **nahrazena úplně jiným markupem**. Z předešlé stránky se nevkládá ani jediná část `<main>`; její obsah je pouze podklad pro ověření faktů a SEO metadat.

## Produktový brief

**Jedna primární otázka návštěvníka:** *Kdo za RychléVýpočty.cz stojí, proč web vznikl a mohu jeho výsledkům rozumně věřit?*

Uživatel má rychle zjistit, že jde o samostatný projekt konkrétního provozovatele; pochopit důvod existence, princip správného použití výsledků i transparentní omezení; dostat se ke kalkulačkám, metodice a možnosti nahlásit chybu.

**Vizuální směr:** současná identita V3 katalogu, originální logo a zelená/navy paleta, ale stránka má vlastní redakční architekturu. Žádné překreslení starých trust karet a sidebaru. Místo katalogového gridu příběh podpořený originálním CSS diagramem „Otázka → vstupy → výsledek“ (výslovně ne skutečný výpočet), velkými nadpisy, rytmem světlých a tmavých bloků a čitelným autorským panelem.

## Struktura stránky

1. **Editorial hero:** *Čísla jsou začátek. Rozhodnutí je cíl.* — primární CTA do V3 katalogu, sekundární CTA do příběhu; napravo vlastní postupový diagram, žádná vymyšlená výpočetní čísla
2. **Proč projekt existuje:** lidské otázky (mzda, práce, hypotéka) a konkrétní přínos
3. **Jak přemýšlíme:** 3 návazné kroky — zadání, pravidla, vysvětlení; odkaz na skutečnou metodiku
4. **Omezení výsledků:** přesný / modelový / orientační výpočet, důsledně bez falešné odborné garance
5. **Provozovatel:** skutečné jméno, ověřená právní forma podle stávajícího zdroje, skutečný přímý kontakt; bez vymyšleného portrétu, společnosti či týmu
6. **Další krok:** kalkulačky, metodika a kontakt; existující FB/IG odkazy

## Srovnání se zamítnutou verzí

| | Zamítnutá verze | Nová verze |
|---|---|---|
| HTML | kopie původní stránky | **nově sestavené od nuly** |
| Navigace obsahu | původní boční trust menu | samostatná redakční sekvence a cesty dál |
| Vizuální komunikace | starý hero + čtyři karty | vlastní velký hero, vysvětlující diagram, editorial bloky |
| Důvěryhodnost | staré faktové boxy | samostatná transparentní kapitola s reálným provozovatelem |
| Ovládání na mobilu | pouze reskin původní struktury | nové samostatné grid/stack layouty a accessible navigace |
| Zdroj | původní `<main>` | zdrojová fakta pouze striktně validována, nikdy nekopírována jako HTML |

## Technické a SEO hranice

- `rv3/engine/studio-about.mjs` — nová SSR HTML stránka, používá jen shared V3 header/footer a ověřuje produkční fakta
- `rv3/sitewide/about.css` — izolovaný originální CSS systém; žádná závislost na `rv-trust-v7.css`
- `cloudflare/tests/studio-about.test.mjs` — ochrana faktů, českých textů, strukturální nezávislosti, SEO a mobile layoutu
- HTML output pouze `/rv3/studio/o-nas.html`, produkční `/o-nas.html` beze změn
- Canonical `https://rychlevypocty.cz/o-nas.html`, původní title/meta description a JSON-LD zachovány ze zdroje, preview noindex
- Bez klientského JS, cookies, tracking změn, externích fontů, formulářů nebo externích obrazových zdrojů
- Interní linky v preview na katalog V3, metodiku, situace a kontakt; před případným produkčním převodem se musí preview odkaz na katalog přepnout na veřejný katalog

## Evidence a acceptance criteria

- Cílené simulované kontroly nad aktuálním GitHub kódem: kompilace rendereru, zcela nový main, doložené faktické údaje, správné odkazy, jeden H1/main, 4 fail-closed testy, SEO/noindex a responzivní CSS
- **Cloudflare build a deploy aktuálního SHA:** vždy zkontrolovat přes bot komentář PR, ne automaticky považovat změnu kódu za live
- **Browser QA nové stránky:** skutečné screenshoty 390×844 a 1440×900, horizontální overflow, console, viditelnost CTA, keyboard, HTTP/HTML noindex, kontakt/social a finální vizuální kontrola — zatím nedoloženo
- **Vlastník:** nejdříve **vidí a schválí design**. Stav `VISUAL_REVIEW_PENDING`. Nezaměnit za schválení produkčního nasazení.

## Stage checklist
- [x] Přečtený současný HTML/SEO a ověřené skutečné údaje
- [x] Individuální produktový brief + odlišení od zamítnuté varianty
- [x] Design + implementace zcela nového HTML a vlastního CSS na izolovaném preview
- [x] Test source identity / canonical / linků / starého DOM v Node test suite; Cloudflare potvrzení pro kódový SHA `a1579e4`
- [ ] Skutečný browser QA nové stránky 390 × 844 + 1440 × 900 se screenshoty, klávesnice a overflow
- [ ] PageSpeed / Lighthouse na konkrétním preview
- [ ] Vizuální a obsahové schválení vlastníkem
- [ ] Produkční release s konkrétním výslovným souhlasem
