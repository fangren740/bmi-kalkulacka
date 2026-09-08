# Dokončení experimentu bez zásahu do P0 streamu

1. Checkout branch `astra-gold-tapety` a ověř HEAD proti referenci předaného ZIPu. Nepracovat v main.
2. `node audits/tapety/test-core.cjs` a `python audits/tapety/test-static.py`.
3. V prostředí s povoleným náhledem spustit běžný statický webserver kořene repa. Nesmí být měněna bezpečnostní politika blokovaného prohlížeče; aktuální agent ji neobcházel.
4. Screenshot a overflow kontrola při 320×740, 390×844, 768×1024, 1024×768, 1366×768, 1440×900. First-use: celé první pole s labelem při 390/1366.
5. Default → add 2 walls → individuální výška → remove → undo. Zachovat ostatní raw hodnoty a správné ID/labels/focus.
6. Free → straight → offset. Raport 64/posun32 i 60/20; přepnout potvrzení počátku; neprávem nepoužít skryté neplatné pole v free režimu.
7. Valid → změna → dirty; staré číslo a řezný plán musí zmizet, tisk nesmí být dostupný. Pak empty/invalid → correction → submit → valid. Zero role width/length, negativní, text, dlouhé číslo, precision, unavailable při dlouhém pásu. Obnovit výchozí hodnoty.
8. Klávesnice Tab/Shift+Tab/Enter/Space, skip link, summary chyby a odkazy na pole, odstranění stěny a návrat focusu. 200% zoom/text. Jedna kombinace skutečného screen readeru a browseru; krátké oznámení result/dirty.
9. Tisk default i offset plánu: vstupy a omezení v kontextu, všechna ID a zbytky, žádný stale tisk po editaci.
10. 3 srovnatelné mobile Lighthouse běhy + desktop, reálné runtime logy, velikosti přenosu a kontrola CLS. Oddělit noindex experiment od produkční SEO readiness.
11. Revidovat screenshoty bez loga jako kontrolu RV lineage, nepřidávat ornament jen kvůli prázdnu. Ověřit dlouhý plán 500 pásů a případně zpřehlednit detail rolí.
12. Aktualizovat pouze nové experimentální soubory a report, vytvořit nové důkazy. Teprve po PASS relevantních testů označit READY FOR HUMAN REVIEW. Produkční integraci a odstranění noindex provést až po explicitním schválení vlastníka, na aktuálním main se zachováním P0 změn.
