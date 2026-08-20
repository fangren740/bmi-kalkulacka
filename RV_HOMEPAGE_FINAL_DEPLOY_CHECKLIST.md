# RychléVýpočty.cz — FINAL HOMEPAGE DEPLOY CHECKLIST

## Deploy status
**Release candidate: GO**

Tento balík obsahuje finální homepage po posledním designovém, mobilním, SEO, trust/legal a technickém auditu.

## Soubory, které se mění / přidávají
1. `index.html` — přepsat produkční homepage.
2. `logo-rv-v32-compact.svg` — nový kompaktní header lockup bez artefaktů při zmenšení.
3. `logo-rv-v32-compact-inverse.svg` — inverse varianta pro footer.
4. `og-rv-home-v8.jpg` — nový 1200×630 social / OG cover homepage.
5. `rv-tool-index.js` — aktuální index nástrojů používaný homepage search (v produkčním repo již existuje; v balíku je přiložen pro jistotu konzistence).

## Co bylo v posledním kole dotaženo
- zachován nový Zaplytic-inspired bright future-tech směr,
- jemně vrácena původní RV webová DNA: technický grid + modro-zelený footer rail,
- footer přestavěn na `Rychlé vstupy / Hlavní oblasti / Informace`,
- reálné Facebook / Instagram CTA,
- metodika + data + redakční zásady + disclaimer + privacy/cookies/terms,
- přímý vstup na všechny kalkulačky na desktopu i mobilu,
- opraven compact header logo,
- produkční SEO metadata, canonical, OG, Twitter a JSON-LD,
- opraveny SVG gradient/reference chyby.

## Statický pre-deploy audit
- chybějící interní odkazy: **0**
- chybějící lokální assety: **0**
- duplicitní DOM ID: **0**
- rozbité SVG `url(#...)` reference: **0**
- JSON-LD syntakticky validní: **ANO**
- `robots`: **index,follow**
- canonical: **https://rychlevypocty.cz/**

## Po nasazení — povinný 5–10min smoke test
1. Otevřít homepage na desktopu a telefonu.
2. Ověřit header logo, `Všechny kalkulačky`, hamburger menu a search.
3. Otevřít 3–5 hlavních odkazů (Finance, Práce, Bydlení, Návody, O projektu).
4. Ověřit article cards, metodiku/disclaimer a footer.
5. Otevřít FB/IG odkazy v novém tabu.
6. Spustit PageSpeed Insights pro Mobile i Desktop.
7. Pokud nejsou zásadní regresní problémy, označit homepage **INDEX LOCK**.

## PageSpeed / CWV
Konstrukce je performance-safe (žádný framework, webfont, hero JPG/video nebo velká externí knihovna). Přesné Lighthouse / PSI skóre ale musí být potvrzeno až na živé HTTPS URL, protože závisí i na delivery/cache vrstvě GitHub Pages.

## Rollback
Před merge/nasazením zachovat předchozí produkční `index.html` / git commit. Pokud by live smoke test odhalil blokující regresi, revertovat pouze homepage commit a assety tohoto release.
