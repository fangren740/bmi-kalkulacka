# PR #49 · nezávislé číselné ověření bydlení

Období říjen až prosinec 2026. Částky níže jsou ručně odvozené z uvedených ustanovení a zveřejněné tabulky. Očekávání v prohlížečovém testu jsou pevná čísla, která se nepočítají pomocí testovaného JavaScriptu.

- § 23 odst. 3 až 5 a § 34 odst. 2. Skutečné náklady za celý byt se přepočtou poměrem započitatelných členů k počtu všech obyvatel. Neaktivní nezranitelný člen zůstává obyvatelem bytu, ale jeho podíl se při výpočtu nákladů domácnosti nezahrne. Teprve poté se použijí stropy. Paušály podle § 23 odst. 4, § 31 a § 32 jsou v modelu částky pro příslušnou velikost posuzované skupiny bez dalšího krácení. [Zákon č. 151/2025 Sb.](https://www.zakonyprolidi.cz/cs/2025-151)
- Praha má standardní normativ 13 380 Kč pro jednoho a 16 190 Kč pro dva. [Sdělení č. 169/2026 Sb.](https://www.zakonyprolidi.cz/cs/2026-169)
- Ve všech řádcích tvoří domácnost dva dospělí bez zranitelnosti a bez dětí. Životní minimum 5 000 + 3 750 = 8 750 Kč, hranice energie 1,43 × 8 750 = 12 512,50 Kč. Příjem 12 000 nebo 14 000 Kč neobsahuje příjem pro pracovní bonus. Odpočet dle § 19 je 3 600 nebo 4 200 Kč. Živobytí vychází 0 Kč, takže celková dávka odpovídá složce bydlení. [Úprava životního minima od října 2026](https://mpsv.gov.cz/od-rijna-plati-nove-parametry-superdavky-posiluji-podporu-samozivitelu-a-lepe-zohlednuji-naklady-na-bydleni)

| Scénář | Vstupy za celý byt a příjem v Kč | Započtený nájem nebo vlastnický paušál | Energie | Bydlení a dávka |
| --- | --- | ---: | ---: | ---: |
| Dva aktivní ze čtyř, nájem | 40 000 + 8 000, příjem 14 000 | min(40 000 × 2/4, 16 190) = 16 190 | Paušál 2 800 | 14 790 Kč |
| Dva aktivní ze čtyř, vlastník | Energie 8 000, příjem 14 000 | 0,30 × (16 190 − 1 240) + 1 240 = 5 725 | Paušál 2 800 | 4 325 Kč |
| Dva aktivní ze čtyř, skutečné energie | 12 000 + 8 000, příjem 12 000 | 12 000 × 2/4 = 6 000 | min(8 000 × 2/4, 1,2 × 2 800) = 3 360 | 5 760 Kč |
| Jeden aktivní a jeden neaktivní, byt pro dva | 20 000 + 8 000, příjem 14 000 | min(20 000 × 1/2, 13 380) = 10 000 | Paušál 2 300 | 8 100 Kč |
| Oba neaktivní a nezranitelní | 20 000 + 8 000, příjem 14 000 | 0 | 0 | 0 Kč |
| Jeden aktivní, jeden neaktivní a dvě osoby mimo domácnost | 24 000 + 12 000, příjem 12 000 | 24 000 × 1/4 = 6 000 | min(12 000 × 1/4, 1,2 × 2 300) = 2 760 | 5 160 Kč |
| Dva aktivní, bez dalších osob v bytě | 24 000 + 12 000, příjem 12 000 | min(24 000, 16 190) = 16 190 | min(12 000, 1,2 × 2 800) = 3 360 | 15 950 Kč |

Test přidání a odebrání osoby ověřuje počet 2 → 3 → 2 bez dalších obyvatel a 4 → 5 → 4 se dvěma dalšími obyvateli. V obou případech se musí částka vrátit na výchozí hodnotu. Celá sada běží v šířkách 320, 390, 768, 1100, 1440 a 1920 px. Jde o ruční výklad a kontrolu implementace, bez porovnání s rozhodnutím Úřadu práce.
