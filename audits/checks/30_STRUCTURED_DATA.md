# 30 — STRUCTURED DATA

## Cíl
Zabránit invalidnímu nebo nekompletnímu JSON-LD, které může generovat chyby v Google Search Console nebo zneplatnit rich-result/data signály.

## Automaticky kontrolovat
- každý `<script type="application/ld+json">` je validní JSON;
- Dataset objekt má neprázdné `name`;
- Dataset objekt má `description` v rozsahu definovaném `audit-config.json` (V1: 50–5000 znaků);
- Dataset nepoužívá `contentUrl` přímo; download musí být modelovaný jako `Dataset.distribution` → `DataDownload.contentUrl`;
- pokud Dataset obsahuje `distribution`, každá distribuce je `DataDownload` s neprázdným `contentUrl`;
- stejné Dataset pravidlo platí i uvnitř `@graph` nebo vnořených struktur;
- pokud je použit `SoftwareApplication`, má neprázdné `name`, `offers.price` a legitimní `aggregateRating` nebo `review` podle aktuálních podmínek Google Software App rich result;
- report uvádí počet JSON-LD bloků, Dataset objektů a SoftwareApplication objektů.

## Manuálně kontrolovat
- zda schema odpovídá viditelnému obsahu stránky;
- zda hodnoty nejsou zavádějící nebo vytvořené pouze pro crawler;
- nikdy nevytvářet falešné hodnocení/review jen kvůli splnění rich-result validace; pokud legitimní rating/review neexistuje, `SoftwareApplication` pro Google rich result nepoužívat;
- u nového schema typu ověřit aktuální dokumentaci Google/Schema.org před zavedením povinných gate.

## Severity
- invalid JSON-LD: P1;
- Dataset bez required `name`/`description`, s chybným umístěním `contentUrl` nebo nevalidní `distribution`: P1;
- nekompletní `SoftwareApplication` generující Google rich-result validation error: P1;
- schema/content mismatch: P1/P2 podle dopadu.

## Root-cause pravidlo
Když GSC nahlásí jednu schema chybu, vždy proskenuj **všechny objekty stejného typu v celém projektu**, ne jen ukázkové URL z GSC.
