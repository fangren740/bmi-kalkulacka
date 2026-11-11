# RV3 Architecture — rozhodnutí návrhu sdíleného enginu

**Status:** architectural proposal; není to hotová implementace. Založeno na skutečném repo stavu 11. 11. 2026.

## Inventář a technická realita
- 207 root `.html`, 135 tools v `rv-tool-index.js`, další 72 URL; 283 root JS, 292 root CSS (mnoho historických verzí).
- Kalkulačka směn: externí `priplatky-smeny.js/css`; hypotéka externí `hypoteka-v4.js/css`; DPP/DPČ má významnou inline logiku; superdávka vlastní normativy + specializované skripty. **Jednotný renderer nesmí tyto motory slepě přepsat**.
- Aktuální veřejný web je statický GitHub Pages. V3 izolované preview je Cloudflare Workers Static Assets, `html_handling:"none"`; worker ošetřuje preview `X-Robots-Tag:noindex`.

## Rozhodnutí: hybridní build-time static V3 (viz DECISIONS ADR-001)
**Použijeme deterministické statické generování v Node v Cloudflare buildu, nikoliv hromadný React/Next.js client-side rewrite ani CSS přemalování runtime DOM.** Server neposílá žádná uživatelská výpočtová data.

### Cílové vrstvy
1. **Registry/metadata (single source):** `docs/rv3/route-registry.json`, později `rv3/data/routes.json` odvozený z ověřeného seznamu. Stable ID = existující cesta `.html`. Žádné nové URL bez evidence záměru.
2. **UI foundation:** komponentové design tokeny (navy/blue/green/logo), typography, spacing, accessible form controls, nav/header/footer, disclosure, results, metodika.
3. **Typové layouty:** `hub` / `catalog`, `calculator-inline`, `calculator-external`, `guide`, `trust`, `embed`. Vlastní vizuální identity jednotlivých kalkulaček mohou mít izolované CSS a data.
4. **Adapters:** na začátku ručně deklarované per-URL body/tool roots. Neměnit ID, `name`, `data-*`, externí/inline script order, event binding a původní výsledkový DOM bez testu. Neznámé architektury = passthrough, ne automatická migrace.
5. **Build:** source HTML + registry + token/theme/layout/adapters → deterministic `dist/*.html`, static assets, route checksum. V3 stránky vznikají před načtením, **ne klientským kompletním DOM replacementem**, takže indexace nečeká na JS.
6. **QA:** vložené testy per route; route manifest 207/207, golden numeric cases, canonical, link and content snapshots; browser 390/1440 + keyboard; production safety.

### Migrační kontrakt každé URL
`route`, `kind`, `family`, `owner`, `currentScripts`, `calculationCore`, `oldCanonical`, `oldTitle`, `oldH1`, `dataSource`, `contentSource`, `risk`, `adapter`, `previewURL`, `numericTests`, `SEORegressionStatus`, `browserStatus`, `approval`, `rollback`.
Chybějící data = **UNKNOWN/BLOCKED**; nenahrazovat předpokladem.

### Jak funguje přestavba bez zničení SEO
- HTML `.html` URL, canonical, title/H1 intent, obsah přinášející organiku a relevantní odkazy jsou zachovány. Redesign může text zlepšit, ale jen s obsahovou kontrolou a bez výmazu odborné metodiky.
- Zachovat robots, schema.org jen při pravdivých datech. Žádné fake FAQ rich snippets, žádná duplicitní strukturovaná data.
- Metadata pro právní/legislativní kalkulačky vyžadují primární zdroje a rok platnosti.
- Consent Mode/CMP/GA4/AdSense/ad affiliate: zůstanou funkční, bez double-loading. Výpočty klientské, neodesílat osobní vstupy.
- `main` a `rychlevypocty.cz` žijí dál na GitHub Pages. **Přechod produkce na Cloudflare je nepřijaté ADR, nikoliv technická nutnost V3 preview.**

### POC na 3 reprezentantech, nikoliv masivní rewrite
A. `kalkulacky.html` (velký inline styl/katalog 135) — prokázat nový shell a všechny odkazy;
B. `hypotecni-kalkulacka.html` (externí JS) — prokázat výpočet a old data-binding;
C. `dpp-dpc-kalkulacka.html` (inline JS) — zachovat funkční formulář a minimálně 5 výpočtových scénářů.
`kalkulacka-priplatku-za-smeny.html` jako chráněný benchmark; `superdavka-kalkulacka.html` jako legislativní riziko, až po potvrzení enginu.

### Výkon / dostupnost
- Žádný nutný JS pro první vykreslení textu a navigace; lazy jen pro nepovinnou interakci.
- CSS/JS rozdělit na sdílený základ a per-tool moduly; obsah pro příchozí URL nevyžaduje download všech 135 kalkulaček.
- Měřit LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1 jako **cílové hodnoty**, nikoliv aktuální měření. Ověřit na běžném mobilu a desktopu; žádné vymyšlené 100/100.
- Focus visible, Escape, klávesnice, screen-reader labels, form error/error recovery, reduced motion.
- Nepoužívat vzdálená font CDN bez skutečného přínosu a soukromí/performance kontroly.

## Rejected alternatives
- **Big-bang Next/Astro rewrite všech 207 URL:** vysoké riziko narušení hotové numeriky/SEO a složitý rollout, uživatel nemůže instalovat lokální toolchain.
- **Runtime JS přepsání celého HTML DOM:** hrozí CLS, rozbití event listenerů, SEO závislé na JS.
- **Jen nový globální CSS na starý HTML:** nízká konzistence, kolize tříd/selektorů, nevznikne udržovatelný engine.

Implementaci zahájit jako samostatný PoC pod [issue #61](https://github.com/fangren740/bmi-kalkulacka/issues/61); bez schválení neprohlásit řešení za definitivní.
