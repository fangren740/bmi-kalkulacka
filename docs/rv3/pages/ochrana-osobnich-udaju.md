# RV3 Page Studio — Ochrana osobních údajů (Privacy Reading Room)

**Datum přípravy:** 15. 11. 2026  
**Původní veřejná URL:** \`/ochrana-osobnich-udaju.html\` — BEZE ZMĚNY  
**Izolovaný náhled:** \`/rv3/studio/ochrana-osobnich-udaju.html\`  
**Stav:** DRAFT; **právní/zpracovatelský audit BLOCKED** do ověření skutečného provozu, Browser QA NOT VERIFIED, design sign-off PENDING.

## 1. Základní pravidlo: nesmíme měnit právní obsah kvůli designu

Přímo načtený zdroj GitHub \`ochrana-osobnich-udaju.html\` má git blob SHA **\`74c09875753ba7eac387ec10b871b5fd04ffe845\`**. Renderer \`rv3/engine/studio-privacy.mjs\` validuje:
- Git blob SHA z původních bytů (\`sha1("blob "+UTF8_byteLength+"\\0"+content)\`); jakákoli změna souboru tedy **FAIL CLOSED**, dokud není provedena explicitní obsahová revize a opraven fingerprint.
- Původní title/description/canonical a \`PrivacyPolicy\` JSON-LD včetně původního \`dateModified\` (aktuálně 2026-08-04).
- **Přesně 7 legal sections**, jejich pořadí, texty nadpisů a 17 odstavců ([1, 4, 2, 4, 3, 1, 2]).
- Každý kompletní HTML fragment včetně odkazu na Seznam.cz, GitHub a ÚOOÚ je vložen **doslova** do nové struktury, bez změny vnitřní formulace.

**Nejedná se o právní revizi.** Vizuální přepracování a zachování starého textu samo nedokládá, že je text aktuální, právně úplný nebo odpovídá skutečnému technickému provozu. V uživatelské preview je pravdivě označen status věcného auditu.

## 2. Zdrojově ověřené důležité body

- **Správce a kontakt**: Martin Šilinger, fyzická osoba bez přiděleného IČO, \`rychlevypocty@seznam.cz\`.
- **Běžné výpočty** dle stávajícího zdroje zůstávají v prohlížeči; funkcím localStorage a možným datům v URL je věnován samostatný obsah.
- **Analytika**: aktuální starý právní zdroj tvrdí, že Google Analytics/AdSense nejsou aktivní. Toto tvrzení je nutné ověřit, ne přebírat jako čerstvý důkaz.
- **E-mailová komunikace**: dobrovolné údaje, účel a podmínky, čl. 6 odst. 1 písm. f, b a c GDPR, příjemce Seznam.cz.
- **Hosting**: stávající právní zdroj popisuje GitHub Pages (produkci). Nové Cloudflare Workers preview je odlišné prostředí. Preview hero výslovně upozorňuje na tento rozdíl, aniž by přepisovalo původní oddíl.
- **Externí odkazy / práva GDPR**: přesné původní texty, oficiální zdroje a kontaktní cesta jsou zachované.

## 3. Originalita vůči ostatním stránkám V3

Stránka se řídí značkou katalogu: původní logo, navy sans headline, zelená italic Georgia, kvalitní mint/paper podklady, vlastní \`privacy-flow.svg\` se štítem, prohlížečem a oddělenými cestami údajů. **Není to další klon About / Kontakt.**

Nová unikátní kompozice:
1. Hero s ilustrací štítu a vysvětlením, kde hledat pravidla.
2. **Tři odlišné cesty údajů**: prohlížeč, e-mail, technické doručení stránky. Jde o zjednodušenou orientaci, nikoli náhradu plného textu.
3. **Skutečná lokální pomůcka „Zkontrolovat odkaz“**: analyzuje *jen strukturu* HTTP(S) nebo relativní URL a vrací počet parametrů a informaci o fragmentu. Nic nesíťuje, neukládá, neloguje a nevypisuje hodnoty URL do výsledku. Nikdy netvrdí, že je odkaz „bezpečný“.
4. **Čtecí místnost**: plných sedm doslovných právních sekcí, sticky navigation desktop a rozbalený mobilní obsah; žádné skryté právní detaily v „přečtěte si víc“.
5. Srozumitelné odkazy na cookies/localStorage, přímý mailto ke správci a stránku Kontakt V3.

## 4. Zásadní nesoulady k ověření před veřejným vydáním

**RELEASE BLOCKER A — kontaktní e-mailový pomocník.** Původní text doslova uvádí „Web nemá uživatelské účty, přihlášení, newsletter ani kontaktní formulář.“ V návrhu [Kontakt V3 / PR #76](https://github.com/fangren740/bmi-kalkulacka/pull/76) už je HTML formulář, který pouze sestavuje \`mailto:\` a sám nic neposílá. Před publikací je třeba právně věcně upřesnit pojem „serverový kontaktní formulář“ a pravdivě vysvětlit, že vyplnění probíhá lokálně a data se až po samostatném odeslání dostanou do e-mailu. Synchronizovat \`kontakt.html\`, \`redakcni-zasady.html\`, \`ochrana-osobnich-udaju.html\`, \`cookies.html\` ve společném release, ale do produkčního \`main\` do té doby nesahat.

**RELEASE BLOCKER B — Analytics/AdSense a CMP.** Ověřit skutečný produkční kód/síťové požadavky v prohlížeči před souhlasem i po souhlasu (GA4/gtag, AdSense, Consent Mode, cookies), nikoliv jen text v repozitáři. Náš namátkový nález ve zdrojovém \`index.html\` neobsahoval \`gtag\` ani \`googletagmanager\`, což **neprokazuje stav všech veřejných URL**. Starý právní zdroj tvrdí, že služby nejsou aktivní, ale tato tvrzení zatím nebyla pokryta kompletním síťovým auditem. Aktualizovat po důkazech.

**RELEASE BLOCKER C — hostování.** Produkční veřejný web je dosud veden na GitHub Pages, kdežto vývojový náhled na Cloudflare Workers. Před případnou změnou produkční infrastruktury znovu ověřit poskytovatele, subprocesory, logování a transferové informace. U přesunu Cloudflare do produkce už starý GitHub-only text nebude stačit.

**RELEASE BLOCKER D — právní kvalita a aktuálnost.** Finální právní kontrola zákonných základů, retention, příjemců, přenosů a údajů o subdodavatelích, i samotného tvrzení o souhlasu, by měla být provedena podle skutečné implementace. Nepřepisovat na základě domněnek, nezměnit datum aktualizace bez reálné publikované revize.

## 5. Připravená implementace a QA

- \`rv3/engine/studio-privacy.mjs\` — fail-closed identity, full source content copy, Git blob SHA pin.
- \`rv3/engine/privacy.template.html\` — samostatný layout a 7 přesných originálních textových vložek.
- \`rv3/sitewide/privacy.css\` — bespoke sticky reading room, 390px responsive, focus, reduced motion.
- \`rv3/assets/privacy-flow.svg\` — vlastní lokální vektorová ilustrace.
- \`rv3/sitewide/privacy-inspect.js\` — bez backendu/localStorage, čistá funkce + user-triggered DOM kontrola.
- \`cloudflare/tests/studio-privacy.test.mjs\` — 11 regresních scénářů pro obsahovou integritu, právní výhrady, SEO/JSON-LD, vizuální aktiva, UX a URL nástroj.
- \`scripts/build-v3-engine-poc.mjs\` generuje pouze \`/rv3/studio/ochrana-osobnich-udaju.html\`.
- \`cloudflare/browser-qa/visual-review.json\` pro branch cílí pouze na konkrétní stránku.

**Povinná release evidence**: Node build, immutable Cloudflare deployment (konkrétní SHA), Browser Run 8+2 a screenshoty 390×844 / 1440×900 včetně navigace a kontroly URL, noindex HTTP/HTML, absence overflow/console errors, a samostatné faktické/právní schválení + design signoff vlastníka.

**V případě 429 na Free**: \`DEFERRED_QUOTA — NOT VERIFIED\` není Browser PASS. **Nic nemergovat do \`main\` bez výslovného schválení.**
