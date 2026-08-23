# 30 — STRUCTURED DATA

## Cíl
Zabránit invalidnímu nebo nekompletnímu JSON-LD, které může generovat chyby v Google Search Console nebo zneplatnit rich-result/data signály.

## Automaticky kontrolovat
- každý `<script type="application/ld+json">` je validní JSON;
- Dataset objekt má neprázdné `name`;
- Dataset objekt má `description` v rozsahu definovaném `audit-config.json` (V1: 50–5000 znaků);
- stejné pravidlo platí i pro Dataset uvnitř `@graph` nebo vnořených struktur;
- report uvádí počet JSON-LD bloků a Dataset objektů.

## Generation guard — povinné od 23. 8. 2026
- Každý nový nebo přestavěný page-level `Dataset` JSON-LD musí vzniknout už při buildu s neprázdným `name` a `description`; audit nesmí být místo, kde se description teprve dopisuje.
- `description` musí mít 50–5000 znaků a významově odpovídat stejnému datasetu v `rychlevypocty-datasets.json` / `data-a-benchmarky.html`; nevymýšlet druhý nesouvisející popis pouze pro crawler.
- Při vytváření benchmarku nejdřív zamkni dataset identitu (`id` / CSV `contentUrl` / name / description / methodology) a stejné hodnoty konzistentně použij v page schema, registru a data hubu.
- Nová kalkulačka s RV DATA benchmarkem se nesmí označit `RELEASE_CANDIDATE`, dokud `python .github/scripts/audit_static_site.py --root . --config audits/audit-config.json --check-js` nedá pro structured data P0=0 a P1=0.
- Kopie existujícího Dataset bloku bez `description` je release-blocking chyba, i když je JSON syntakticky validní.

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
