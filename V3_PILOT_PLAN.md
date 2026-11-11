# RychléVýpočty — Studio 2026 (pilot V3)

**Stav:** samostatná funkční vývojová větev `rv3/clean-slate`. Produkční `main` a GitHub Pages beze změn. **Bez schválení nemergovat.**

## Designová rešerše (11. listopadu 2026)
Prověřeny aktuální Framer fintech templates (Basis, Marginal, Isobar, KAFO, Kestrel) a trendové reporty Webflow 2026, Bubble 2026, Netguru 2026. Relevantní zjištění:
- **Product proof místo obrázkového mockupu**: Basis má živý dashboard a kalkulátor; Marginal ukazuje reálně přepočítanou hodnotu přímo na úvodu.
- **Silná typografická identita**: oversized editorial type + kontrolovaná serif kurzíva, nikoli běžný SaaS gradient a kartičky.
- **Účelná dynamika**: okamžité výsledky při inputu, aktivní volba úlohy, zřetelný stav, redukovaný pohyb. Bez externího 3D, videa a obrázkového balastu.
- **Data-first / trust**: kontrast a originální interaktivní rozhraní jsou důležitější než efektní scroll animace.

Reference:
- https://www.framer.com/marketplace/templates/basis-money-finance/
- https://www.framer.com/marketplace/templates/marginal/
- https://www.framer.com/marketplace/templates/isobar/
- https://www.framer.com/marketplace/templates/kafo/
- https://webflow.com/blog/web-design-trends-2026
- https://bubble.io/blog/web-design-trends/
- https://www.netguru.com/blog/modern-web-design-trends

**Žádná šablona ani její kód nebyly převzaty.** Koncept jsme navrhli originálně pro české praktické kalkulačky.

## Vlastní vizuální motiv: číslo jako odpověď
- Logo `logo-rv-v32.svg` a původní námořnická modrá / modrá / zelená beze změny.
- Barevná signatura, živý výpočtový list, typografická dvouúrovňová kompozice (moderní sans + redakční serif), tenké sítě a očíslované kapitoly.
- Homepage: uživatel začíná otázkou; kontextově přepíná výpočetní oblast, vidí skutečné porovnání dvou pracovních nabídek (42 000 vs 52 000 hrubého → rozdíl 7 340 Kč čistého měsíčně / 88 080 Kč ročně) a pokračuje ke konkrétnímu nástroji.
- `mzdy-a-prace.html`: originálně art-directed pracovní rozcestník se 4 situacemi a zachovanými nástroji.
- `cista-mzda-kalkulacka.html`: calculator-first vstupy / výsledek / pokročilá metodika. Výpočetní engine převeden ze stávající produkční logiky, bez změny vzorců.
- Žádný framework, žádné externí fonty, klientské výpočty a hledání, kompatibilní s původním statickým hostingem.

## QA a bezpečnost
- Automatické regrese výpočtového jádra a interakce UI přes Cloudflare Worker Build.
- Zachování všech kanonických URL i existujících `.html` cest, hlavně příplatků; žádné úpravy 199 dalších URL.
- Cloudflare preview bez indexace a custom domény, produkční `main` bez zásahu.
- **Build SUCCESS neznamená browser E2E**: nezávislé screenshotové testy 390/1440 px a ověření reálných HTTP hlaviček na preview stále zbývají.
