# RV3 – audit ukládání a zveřejněných tvrzení (20. 11. 2026)
Stav: **PARTIAL SOURCE AUDIT — RELEASE BLOCKED**. Nejde o síťový ani právní audit; není potvrzeno, co se odehrává v prohlížeči po udělení souhlasu.

## Ověřené konkrétní nesoulady
Veřejný `cookies.html` popisuje devět `localStorage` klíčů, včetně:
- `rv-vacation-planner-v1` — údajně aktivován po „Zapamatovat nastavení…“;
- `rv-shift-calendar-v1` — údajně aktivován po „Zapamatovat nastavení…“.

Ověřeno ve větvi `rv3/trust-copy-cleanup-20261120`:
- `planovac-dovolene.html` načítá `/planovac-dovolene.js?v=20260826-clean2`; v souboru `planovac-dovolene.js` nejsou odkazy na `localStorage`, `sessionStorage`, `indexedDB` ani uvedený klíč.
- `smenovy-kalendar.html` načítá `/smenovy-kalendar.js?v=20260907-1`; v souboru `smenovy-kalendar.js` nejsou odkazy na `localStorage`, `sessionStorage`, `indexedDB` ani uvedený klíč.
- Přímo v obou HTML souborech nejsou odkazy na tyto storage API či oba deklarované klíče.
- Toto je důkaz rozdílu mezi **deklarovaným localStorage chováním a uvedenými klientskými soubory**, nikoli důkaz neexistence všech dalších mechanismů ukládání na webu.

Uvedená tvrzení v `cookies.html` jsou tedy potřeba věcně opravit a následně synchronizovat `ochrana-osobnich-udaju.html`. Změna veřejných textů nesmí tiše obejít ochranu source SHA v `rv3/engine/studio-cookies.mjs` a `rv3/engine/studio-privacy.mjs`; musí být explicitně zrevidována spolu s testy a schválena.

## Co ještě NENÍ ověřeno
1. Všechny zbývající localStorage klíče, přesný trigger, odvolání nastavení, retenční chování a reset.
2. Živé HTTP/network požadavky před souhlasem a po udělení/odvolání: GA4, Google Tag, Consent Mode, AdSense, CMP, affiliate tracking, jiné domény.
3. Dostupnost a činnost všech JS/CMP skriptů na **produkční** `main` (preview může mít jiný obsah).
4. Skutečný hosting/provozovatelé a právní znění po případném deploymentu.
5. Browser QA a screenshoty 390×844 a 1440×900 pro finální opravené texty.

## Praktický další postup
- Sestavit tabulku **zdokumentovaný klíč → reálný kód → trigger → mazání → uživatelské sdělení** pro všech devět položek.
- Chybné dvě položky buď opravit podle skutečně fungujícího kódu, nebo z implementace odstranit neplatné popisy. **Nezavádět novou storage funkci jen kvůli dokumentaci.**
- V prohlížeči provést kontrolu s čistým profilem a se souhlasy; uložit HAR/QA report bez osobních hodnot a screenshoty.
- Ověřená zjištění promítnout do veřejných stránek stručně, přesně, bez vět o interním QA.
- Po každé změně aktualizovat source fingerprints a spustit Node/Cloudflare/Browser QA.
- Neprovádět merge do produkce bez explicitního schválení.

## Dohledatelné zdroje
- `cookies.html` (source blob `68e9ba2b0db21a80dfdb5a7dc3443e17394eb56f`)
- `planovac-dovolene.html` (blob `b4a40332c9860f26d7e6bfbe665010dd7b3476bb`)
- `planovac-dovolene.js` (blob `3c123f16b18b06890549ecc2fb277c1886b5976a`)
- `smenovy-kalendar.html` (blob `9d81ecc093624c933247bed3551f17e787a75c85`)
- `smenovy-kalendar.js` (blob `646dfb117e6ed13c719b95b5c8ae6d92dac3d12f`)
