# RychléVýpočty.cz V-next — Brand / Identity Audit

**Datum:** 21. 8. 2026  
**Rozsah:** index, katalog kalkulaček, Finance hub, poslední V-next kalkulačky a aktuální `kalkulacka-celkove-ceny-nemovitosti.html`.

## 1. Zjištění

### Co funguje na indexu / katalogu / hubech
- silná a okamžitá RV identita: navy + blue + green rail, vlastní brand field, plný header/footer;
- kombinace `hero copy + brand module`, nikoli jen text + běžná karta;
- jasné micro-signály produktu: index nástrojů, stavové čipy, search / quick actions, živý výpočet;
- kontrolovaný rytmus: světlé plochy střídají dark brand moduly, datové bloky a decision cesty;
- komponenty působí jako jeden produktový systém, ne jako samostatné landing pages.

### Kde se poslední V-next kalkulačky začaly rozcházet
- lokální CSS začalo příliš často stavět vlastní `white editorial page`, která používá logo, ale málo dalšího RV DNA;
- hero často sklouzl do stejného schématu `velký H1 + bílá výsledková karta vpravo`;
- mezi hero a footerem někdy chybí opakované brandové kotvy, takže stránka působí jako kvalitní microsite, ale ne dost jako RychléVýpočty.cz;
- signature visual system byl často produktově správný, ale značka se omezila na barvy;
- příliš mnoho sekcí používá neutrální karty bez společného systému rail / status / data / decision signalů.

## 2. Root cause

Dosavadní anti-template pravidlo hlídalo hlavně odlišnost kalkulaček mezi sebou. Chyběl rovnocenný **brand lineage gate**: nový tool se musí porovnávat nejen s posledními třemi V-next stránkami, ale také s indexem, katalogem a relevantním hubem.

Výsledkem byla lokální originalita, ale postupný drift od hlavní produktové identity.

## 3. Nový třívrstvý vizuální model

Každá významná V-next stránka od nynějška používá tři vrstvy současně:

1. **RV CORE** — logo, brand field / rail, status/data jazyk, plný footer, typografická a spacing rodina.
2. **TOPIC GRAMMAR** — finance, bydlení, podnikání, stavba atd.; tématické znaky a informační metafora.
3. **PRODUCT PROOF** — konkrétní vizuální důkaz kalkulačky: receipt, timeline, waterfall, map, gauge, material cutaway, A/B board atd.

Pokud je přítomná jen vrstva 2 + 3, stránka může být hezká, ale není dost RV. Pokud je přítomná jen vrstva 1, stránka je template.

## 4. Nový pre-build identity gate

Před BUILD LOCK se povinně vyplní:
- **RV inheritance:** které 3–5 prvků z indexu / katalogu / relevantního hubu stránka vědomě dědí;
- **topic signature:** jak je na první pohled poznat konkrétní téma;
- **product signature:** jaký vizuální blok patří pouze tomuto toolu;
- **section rhythm:** kde se mění světlá / dark / diagram / data / editorial gramatika;
- **mobile identity:** co z brandu zůstane v prvních 2 obrazovkách mobilu.

## 5. Povinné brand kotvy na stránce

Významná kalkulačka má standardně:
- header v RV V3.2 rodině;
- hero s viditelnou RV identity vrstvou, ne pouze logem;
- minimálně jednu brandovou micro-kotvu u kalkulačky/výsledku (rail, RV status, result system, cut corner, grid/field apod.);
- datovou sekci jasně označenou `RV DATA`, pokud benchmark existuje;
- další alespoň jednu identitní kotvu ve spodní polovině stránky;
- plný `rv-brand-footer`.

Brand kotvy nesmí být dekorace bez funkce. Musí pomáhat hierarchii, orientaci nebo důvěře.

## 6. Identity QA score (0–2 za bod)

Před release hodnotit:
1. rozpoznatelnost RychléVýpočty.cz bez čtení loga;
2. tematická rozpoznatelnost;
3. unikátní product visual proof;
4. rytmus celé stránky;
5. konzistence formuláře/výsledku s RV systémem;
6. datová/metodická identita;
7. footer / next-step integrace;
8. mobilní první dvě obrazovky.

**Minimum pro RELEASE_CANDIDATE: 13 / 16 a žádná nula v bodech 1–5.**

## 7. Aplikace na #42 Celková cena nemovitosti

Původní verze byla obsahově a metodicky silná, ale identity score bylo přibližně **9/16**: zejména hero, calculator shell a spodní polovina byly příliš neutrální.

Upgrade 21. 8. 2026 přidává:
- skutečné `rv-identity-hero` dědictví z indexu/hubů;
- RV brand stamp + page code;
- výraznější closing-receipt jako produktový důkaz;
- brand rail / cut-corner / grid identity na kalkulačce a výsledku;
- jasný `RV DATA` lockup;
- propojenou closing timeline místo tří izolovaných karet;
- brand field ve spodní části stránky;
- plný `rv-brand-footer`.

Tento audit je nový závazný podklad pro další V-next buildy.
