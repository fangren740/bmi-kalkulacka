# PR #52: směna → vysvětlení → měsíc → kontrola pásky

Rozsah: zadání v komentáři 6698297948. Výchozí revize 412eb76a34366844e3aa3a1f09c90b8cf313bb00. Produkce se nenasazuje.

## Produktové změny

- Začátek/konec jsou vedle sebe, přestávka tvoří druhou dvojici. Dříve první a poslední pole přepisovala sloupce mřížky a formulář se zbytečně prodlužoval.
- Desktop má samostatný kompaktní výsledek a navazující vysvětlení přes šířku stránky. Časová osa už není stlačená do dlouhého postranního panelu.
- Měsíc obsahuje částky po kategoriích a barevné rozložení jednotlivých směn. Všechny pruhy používají stejné měřítko vůči nejdražší směně; barvy nenahrazují číselné popisky. Překrývající se příplatkové hodiny nejsou vydávány za odpracovanou dobu.
- Původní logo zachováno. Tmavý peněžní souhrn, teplá barva výsledné částky a oddělená bílá analýza navazují na stávající charakter stránky.
- Zachována stávající JSON záloha bez serveru a kontrola pásky po kategoriích. Žádná nová analytika, úložiště ani knihovna.

## Obsah, vyhledávací záměry a konkurence

Kontrolované stránky 6. 11. 2026: https://davky.cz/kalkulacky/priplatky/, https://kalkuj.cz/priplatky-ke-mzde/, https://remoter.cz/kalkulacka-priplatku/.

Konkurence nabízí rychlé zadání souhrnných příplatkových hodin, sazeb či výchozí mzdy. Proto zachováváme i režim „Mám hodiny z docházky“. Vlastní přínos této stránky je konkrétní datovaná směna přes půlnoc, rozlišení přestávky a překryvů, sestavení měsíce a porovnání stejných kategorií na pásce. To je užitečnější odlišení než další obecný přepočet procent.

Primární záměr: kolik za noční/víkend/svátek/přesčas a proč se částka liší od pásky. Title, popis a H1 jej již pokrývají. FAQ nyní pojmenovává noční, víkend a svátek konkrétně. Průměrný výdělek má nový kontextový odkaz přímo u PHV; návštěvník nemusí hledat výklad až ve spodním seznamu. Samostatná stránka přesčasů zůstává navazující specializací, nikoliv duplicitním cílem této stránky. Příchozí odkazy byly ověřeny v katalogu kalkulaček i v hubu Mzdy a práce; URL je v sitemapě. Canonical se nemění.

Toto je obsahová a technická kontrola, nikoli důkaz lepší pozice v Googlu. Bez aktuálních dat GSC nelze potvrdit indexaci ani nárůst CTR. Nepřidáváme text jen kvůli délce ani nepřisuzujeme rešerši důkaz, že jsme nejlepší.

## Ověření

Automatické prohlížečové testy: `.github/scripts/shift51-browser.py` (výpočty, přestávky, mzda/plat, náhradní volno, DST, formulář, mobilní menu, JSON zálohy, porovnání pásky, CSV). Nový `.github/scripts/shift52-review.py` používá stejná data ve výchozí a nové revizi; pořizuje zadání/výsledek/měsíc při 390 a 1440 px a kontroluje přetečení také na 320 px.

Nezávislé očekávané částky při mzdě i PHV 200 Kč/h, přestávce 30 minut:

| Scénář | Výpočet hrubých příplatků | Výsledek |
|---|---|---:|
| So 5. 12., 06–14, pauza 10:00 | 7,5 × 200 × 10 % | 150 Kč |
| Pá 11. 12., 22–06, pauza 02:00 | 7,5 × 200 × 10 % + 5,5 × 200 × 10 % | 260 Kč |
| Svátek 25. 12., 08–16, pauza 12:00, 2 h přesčas, peněžní kompenzace | 7,5 × 200 + 2 × 200 × 25 % | 1 600 Kč |
| Měsíc těchto tří směn | 150 + 260 + 1 600 | 2 010 Kč |

Modelový základ 22,5 × 200 = 4 500 Kč; součet 6 510 Kč. Nejde o čistou mzdu ani automaticky celou měsíční mzdu. Matematické jádro nebylo měněno; úpravy JS se týkají zobrazení kategorií a pruhů.

Párové screenshoty a zdrojový náhled se ukládají v artefaktech workflow „RV příplatky za směny“. Nové testy nejsou náhradou vizuální kontroly screenshotů.
