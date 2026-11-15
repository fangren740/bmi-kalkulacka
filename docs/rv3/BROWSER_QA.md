# Browser Run pro RV3 preview

Cloudflare Preview command na vývojovém Workeru `rychlevypocty-v3-preview` spouští hook z této větve. Hook nasadí jeden preview přes stávající Wrangler 4.135, použije **Unique Deployment URL** a ověří ji proti SHA v preview manifestu. Browser Run běží na samostatném Workeru `rv3-browser-qa` s limitem a vlastní Cloudflare KV. Běžný běh nepotřebuje GitHub Actions ani ChatGPT Work.

## Rozsah

- `/index.html` — české hledání, volba záměru, proklik na čistou mzdu.
- `/rv3/poc/katalog-v2.html` — 135 unikátních odkazů v kategoriích, rozbalení kategorie, hledání hypotéky a proklik.
- `/rv3/wave1/finance-a-hypoteky.html` — navigace na formulář a jeden funkční případ. Při 6 mil. Kč, vlastních zdrojích 1,2 mil. Kč, 25 letech a 0 % musí UI ukázat 16 000 Kč a LTV 80 %.
- `/rv3/wave1/osvc-a-freelancing.html` — proklik na výběr nástroje.

Na každé stránce 390 × 844 a 1440 × 900, HTTP 200 bez přesměrování, viditelný main a H1, žádné horizontální přetečení ani chyby konzole/JavaScriptu, HTTP i HTML noindex a JPEG. Proklik do kalkulačky ověřuje navigaci. Numerický QA dokládá pouze uvedený případ ve financích. PageSpeed a širší release kontroly jsou zvlášť v issue #64.

## Zapojení

Samostatný QA Worker staví z QA větve a kořene `cloudflare/browser-qa`. Používá Browser Run, limiter a KV z vlastní konfigurace. `QA_AUTO_TOKEN` je identický, náhodný 64znakový hex secret v runtime QA Workeru a v oddělených **Previews Base → Builds** secrets V3. U již existujícího Preview použij stejný příkaz a encrypted secret i v nastavení buildu dané Preview větve, protože její nastavení přetrvává při změně Previews Base. Hook token nepředává Wrangleru. Worker neumožňuje vlastní URL, produkci, aliasy ani volné QA scénáře.

Preview command z kořene repozitáře:

```sh
if [ -f cloudflare/browser-qa/preview-hook.mjs ]; then node cloudflare/browser-qa/preview-hook.mjs; else npx wrangler preview; fi
```

Na větvích bez hooku běží původní preview. Příkaz pro větev `rv3/cloudflare-preview`, GitHub Pages a DNS zůstávají oddělené. Pro návrat k původnímu chování změň jen Preview command na `npx wrangler preview`.

Výsledek a odkaz na důkaz jsou v logu buildu. Důkazy jsou pod náhodným odkazem po sedm dní v samostatné KV. Poslední ověřený běh je v [řídicím centru #59](https://github.com/fangren740/bmi-kalkulacka/issues/59) a [QA plánu #64](https://github.com/fangren740/bmi-kalkulacka/issues/64).

## První ověření nasazení

[První automatický build](https://dash.cloudflare.com/69c821d02b55b2645d0f1059623d1dde/workers/services/view/rychlevypocty-v3-preview/production/previews/rv3-browser-run-qa/builds/3482e9e3-1111-4d15-bba9-da5270162d5a) vytvořil neměnný náhled a správně skončil FAIL, protože Workers odmítly hodnotu redirect `error`. Přímý Worker-to-Worker fetch následně nedostal manifest konkrétní Preview URL, i když veřejná URL správné SHA vracela. Kontrola manifestu se proto provádí na začátku stejné Browser Run session. Přijímá HTTP 200 bez přesměrování, HTTP noindex a přesnou shodu SHA. Při změně kódu QA Workeru ověř jeho samostatný deploy před opakováním preview buildu.

[První kompletní Browser Run](https://dash.cloudflare.com/69c821d02b55b2645d0f1059623d1dde/workers/services/view/rychlevypocty-v3-preview/production/previews/rv3-browser-run-qa/builds/6157def1-57cc-4085-9d22-99722f280076) našel mobilní přetečení homepage a desktopové pokročilé volby financí bez dostupného ovládacího prvku. Opravy jsou omezené na styly V3. U katalogového prokliku test počítá s tím, že cílová kalkulačka po HTTP 200 nastavuje výchozí parametry v query přes History API. Stále vyžaduje stejné preview, původní cílovou cestu a úspěšnou síťovou odpověď bez přesměrování.
