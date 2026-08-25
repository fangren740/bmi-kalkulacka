# 45 — LIVE PRODUCTION HEALTH

## Cíl
Ověřit, že stav skutečně nasazený na `https://rychlevypocty.cz` odpovídá očekávanému release a že deploy/CDN nezavedl technickou regresi, kterou statický audit repozitáře nemůže potvrdit.

## Automatický monitor

```bash
python .github/scripts/live_health_monitor.py \
  --root . \
  --config audits/audit-config.json \
  --json-out rv-live-health-report.json
```

## Povinné kontroly V1
- produkční `robots.txt` a `sitemap.xml` jsou dostupné;
- live sitemap není katastroficky zkrácená;
- live sitemap odpovídá aktuální repo sitemap;
- každá URL v sitemap vrací přímo HTTP 200 bez redirect chainu;
- URL v sitemap není na produkci `noindex`;
- canonical existuje a odpovídá dané sitemap URL;
- produkční JSON-LD je validní JSON;
- každý živý `Dataset` má `name` a `description` v povolené délce;
- kritické same-origin assety načítané živými stránkami existují;
- HTTP asset na HTTPS stránce je chyba;
- každý nakonfigurovaný legacy/alias origin (např. `https://www.rychlevypocty.cz`) musí být dostupný a jedním redirectem zachovat cestu na canonical origin bez `www`.

## Asset probe contract — od V1.0.1
- `HEAD` je pouze rychlá optimalizační kontrola, nikoli autoritativní důkaz dostupnosti assetu;
- pokud `HEAD` vrátí cokoli jiného než HTTP 200, monitor povinně ověří stejný asset skutečným `GET` requestem;
- finding vznikne až podle výsledku `GET`, protože ten odpovídá requestu prohlížeče;
- pravidlo řeší CDN/edge middleware (např. Cloudflare runtime assety), které mohou pro `HEAD` vracet jiný stav než pro `GET`;
- žádná konkrétní `/cdn-cgi/` cesta není globálně whitelistovaná: skutečný GET 4xx/5xx zůstává P1.

## Trigger
Monitor běží:
1. automaticky po úspěšném `pages-build-deployment`;
2. jednou denně ze scheduleru;
3. ručně přes `workflow_dispatch`.

## Severity
- homepage/server 5xx nebo nedostupná/rozbitá sitemap = **P0**;
- sitemap URL 4xx/5xx, noindex, canonical mismatch, invalid JSON-LD, Dataset contract, chybějící kritický asset nebo nefunkční alias-host redirect = **P1**;
- asset redirect, chybějící Sitemap directive v robots nebo jiná neblokující nekonzistence = **P2**.

P0/P1 vrací nenulový exit code a `LIVE GATE: FAIL`.

## Co V1 záměrně nedělá
- neprovádí JavaScript runtime interakce;
- neměří Core Web Vitals/Lighthouse;
- neposuzuje design;
- neověřuje správnost matematického výsledku kalkulačky.

Tyto kontroly patří do 50 RUNTIME, 60 VISUAL, 70 PERFORMANCE a budoucího calculation regression gate.

## Anti-false-positive pravidlo
Síťové timeouty a běžné transient 5xx/429 se opakují podle `audit-config.json`. Výjimky se nesmí schovávat ve workflow ani skriptu; používá se společný `exceptions` registr. U assetů je browser-visible `GET` autoritativní; samotný neúspěšný `HEAD` nesmí shodit release gate.
