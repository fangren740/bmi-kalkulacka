# 40 — LINKS / ASSETS

## Cíl
Odhalit rozbité lokální odkazy a asset reference dřív, než se projeví jako nefunkční UI, chybějící styling nebo rozbitý social preview.

## Automaticky kontrolovat
- lokální `href` a `src` v HTML;
- lokální `srcset` kandidáty;
- lokální `url(...)` reference v CSS;
- lokální `og:image` a `twitter:image`;
- chybějící HTML/CSS/JS/image/font/data asset;
- HTTP mixed-content reference na HTTPS webu.

## Pravidla
- fragmenty, `mailto:`, `tel:`, `data:`, `javascript:` a externí origin se nevyhodnocují jako lokální soubor;
- root-relative `/asset.css` se mapuje do kořene repa;
- reference s query/fragmentem se kontroluje bez query/fragmentu;
- existence assetu je statický gate; jeho správné vykreslení patří do runtime/visual gate.

## Severity
- chybějící aktivní CSS/JS nebo zásadní funkční asset: P1;
- rozbitý interní HTML link: P1/P2 podle dosahu;
- chybějící OG/social asset: P2;
- mixed content: P2, případně P1 pokud blokuje funkci.
