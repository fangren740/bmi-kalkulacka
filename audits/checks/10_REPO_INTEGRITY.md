# 10 — REPO INTEGRITY

## Cíl
Ověřit, že release balík je technicky konzistentní ještě před SEO, UX a obsahovým auditem.

## Automaticky kontrolovat
- čitelnost HTML souborů;
- přesně jeden neprázdný `<title>` u indexovatelných HTML;
- přítomnost `<meta name="viewport">` u indexovatelných HTML;
- duplicitní `id` v jednom HTML;
- syntaxi externích `.js` a inline JavaScriptu, pokud je dostupný Node.js;
- existenci základních repo souborů vyžadovaných konfigurací (`sitemap.xml`, `robots.txt`);
- validitu `audit-config.json` a auditních výjimek.

## Manuálně kontrolovat podle scope
- zda ZIP/repo skutečně odpovídá aktuálnímu produkčnímu stavu;
- zda nejsou v release nechtěné debug/test soubory nebo dočasné exporty;
- zda patch nemění soubory mimo deklarovaný scope.

## Severity
- nečitelný/rozbitý klíčový soubor nebo invalidní audit config: P0/P1;
- JS syntax error v aktivním assetu: P1;
- chybějící title na indexovatelné stránce: P1;
- duplicitní ID / viewport: P2, pokud nezpůsobuje funkční regresi.

## PASS podmínka
Žádný nevyjmutý P0/P1 a všechny povinné automatické kontroly proběhly.
