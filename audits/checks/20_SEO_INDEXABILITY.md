# 20 — SEO / INDEXABILITY

## Cíl
Zabránit technickým stavům, které vedou k nesprávné indexaci, duplicitám nebo zbytečným crawl hopům.

## Automaticky kontrolovat
- indexovatelná HTML mají canonical;
- canonical používá očekávaný site origin;
- indexovatelná canonical URL je v sitemapě;
- `noindex` URL není v sitemapě;
- sitemap URL odpovídá existujícímu lokálnímu dokumentu;
- sitemap neobsahuje duplicitní `<loc>`;
- interní odkazy z indexovatelných stránek nevedou na známý `noindex` HTML shim/redirect;
- `robots.txt` obsahuje deklaraci sitemap.

## Manuálně kontrolovat
- zda canonical odpovídá skutečnému search intentu při migraci/slučování URL;
- zda redirect/noindex shimy mají jasný a stále platný důvod;
- zda nové URL nevytvářejí cannibalization proti registru a existujícím stránkám.

## Severity
- indexovatelná URL bez canonical nebo mimo sitemap: P1;
- noindex URL v sitemapě: P1;
- sitemap URL bez lokální stránky: P1;
- aktivní interní link přes noindex shim: P2, případně P1 při rozsáhlém výskytu.

## Poznámka
`sitemap lastmod` není důkaz významné změny obsahu. Pro growth/HOLD rozhodování používej historii konkrétního souboru v produkčním repu.
