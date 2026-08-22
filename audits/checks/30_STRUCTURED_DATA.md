# 30 — STRUCTURED DATA

## Cíl
Zabránit invalidnímu nebo nekompletnímu JSON-LD, které může generovat chyby v Google Search Console nebo zneplatnit rich-result/data signály.

## Automaticky kontrolovat
- každý `<script type="application/ld+json">` je validní JSON;
- Dataset objekt má neprázdné `name`;
- Dataset objekt má `description` v rozsahu definovaném `audit-config.json` (V1: 50–5000 znaků);
- stejné pravidlo platí i pro Dataset uvnitř `@graph` nebo vnořených struktur;
- report uvádí počet JSON-LD bloků a Dataset objektů.

## Manuálně kontrolovat
- zda schema odpovídá viditelnému obsahu stránky;
- zda hodnoty nejsou zavádějící nebo vytvořené pouze pro crawler;
- u nového schema typu ověřit aktuální dokumentaci Google/Schema.org před zavedením povinných gate.

## Severity
- invalid JSON-LD: P1;
- Dataset bez required `name`/`description` nebo mimo povolenou délku: P1;
- schema/content mismatch: P1/P2 podle dopadu.

## Root-cause pravidlo
Když GSC nahlásí jednu schema chybu, vždy proskenuj **všechny objekty stejného typu v celém projektu**, ne jen ukázkové URL z GSC.
