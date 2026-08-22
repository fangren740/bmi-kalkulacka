# RychléVýpočty.cz V7 — MAIN PAGES / LEADER HUB UPGRADE
## MASTER PROMPT PRO NOVÝ CHAT — 22. 8. 2026

Navazujeme na rozběhnutou design/product wave RychléVýpočty.cz V7. Nejde o plošný redesign kalkulaček. V tomto chatu pokračujeme v upgradu **hlavních platformových stránek a leader hubů**.

## 0. JEDINÝ TECHNICKÝ ZDROJ PRAVDY
Uživatel v novém chatu přiloží **aktuální ZIP celého produkčního projektu**. Ten je vždy jediný technický zdroj pravdy.

Nejdřív:
1. ZIP celý rozbal.
2. Ověř skutečné HTML/CSS/JS/assets/sitemap.
3. Zjisti, které leader pages už jsou v produkčním ZIPu opravdu přepsané.
4. Starší preview, RC, FINAL, V1/V2/V3 soubory z předchozích chatů nejsou zdroj pravdy, pokud nejsou v aktuálním projektu.
5. Nevracej projekt do starší verze jen proto, že je zmíněná v historickém promptu.

**Nevykonávej nový audit projektu od nuly, pokud k tomu není konkrétní důvod.** Toto je pokračování již rozběhnuté main-pages wave. Udělej pouze rychlý continuity check, aby bylo jasné, kde navázat.

---

# 1. SCOPE TÉTO WAVE

Tato wave se týká primárně:
- `index.html`
- `kalkulacky.html`
- hlavních tematických hubů / leader pages
- později article/guide template a rollout článků

**NEMĚŇ design samotných kalkulaček**, pokud uživatel výslovně nepřepne zpět do calculator-upgrade režimu.

Starý kalkulačkový prompt s pravidly jako „2 800+ slov“, „základní/pokročilý režim“, „výsledkový dashboard“, povinné FAQ apod. platí pro **kalkulačky**, nikoli automaticky pro huby. Nepřenášej tato pravidla mechanicky na leader pages.

---

# 2. ZAMKNUTÁ DESIGNOVÁ DNA

Primární art-direction reference: **Zaplytic / Land-book** — inspirace principy, nikdy 1:1 kopie.

RychléVýpočty V7 DNA:
- bright future-tech
- precision + positivity + simplicity
- RV deep navy / blue / electric green
- velká typografie jako grafický prvek
- hodně dobře využitého whitespace
- branded hand-drawn strokes / doodles / marker highlights
- jemný technický grid, diagonála, blesk jako RV signatura
- vlastní SVG / programové ilustrace / branded covers
- dark stage pouze jako kontrastní moment, ne jako dominantní dark mode
- běžný člověk musí stránku pochopit během několika sekund

Homepage je **design reference pro kvalitu a shell**, nikoli šablona pro mechanické kopírování hubů.

---

# 3. NEJDŮLEŽITĚJŠÍ PRAVIDLO: GRAFIKA MUSÍ MÍT VÝZNAM

Toto je zásadní poučení z poslední wave.

**Grafiku nepřidávej dekorativně jen proto, aby stránka byla „bohatší“.**

Každý výrazný vizuální prvek musí dělat alespoň jednu z těchto věcí:
- vysvětlovat vztah mezi veličinami;
- ukazovat workflow / pořadí rozhodnutí;
- zobrazovat časovou osu / cyklus / fázi;
- vysvětlovat složení nákladu nebo výsledku;
- ukazovat rozdíl mezi kategoriemi;
- pomáhat vybrat správný nástroj;
- demonstrovat reálný princip daného tématu.

Příklady správné grafiky:
- pracovní dny → skutečná kalendářní osa;
- dovolená → návaznost volna na víkend/svátek;
- auto → nákladový lifecycle koupě → provoz → servis → prodej;
- business → náklad → cena → marže / bod zvratu;
- bydlení → vlastní zdroje → financování → provoz → rezerva;
- stavba → rozměr → plocha/objem → materiál → rezerva.

Příklady špatné grafiky:
- náhodná zelená šipka v prázdném místě;
- vlnovka bez významu;
- bary různé délky, které vypadají jako data, ale žádná data nereprezentují;
- ilustrace jen proto, že karta jinak vypadá prázdně;
- doodle na každé kartě.

**Doodle je akcent, ne obsah.**

---

# 4. UNIKÁTNOST KAŽDÉHO HUBU

Každý leader hub musí mít vlastní vizuální a produktovou osobnost podle tématu.

Neopakuj jednu šablonu s jinými názvy.

Příklady z této wave:
- Finance → mortgage / decision cockpit
- Mzdy → payroll / work situations
- Bydlení → home-system / blueprint
- Energie → energy flow / household system
- Stavba → construction / drafting / materiál
- Datum a čas → timeline / calendar / deadline / shift cycle
- Business → pricing worksheet / business economics
- Auto → lifecycle / cost per km

Při novém hubu nejdřív formuluj jeho vlastní **visual metaphor / product metaphor**. Až potom navrhuj sekce.

---

# 5. HUB NENÍ ENCYKLOPEDIE

Leader page má primárně pomoci člověku **rychle najít správný nástroj a pochopit rozhodovací prostor**.

Preferuj:
- krátký silný hero;
- 3–5 reálných uživatelských situací;
- smysluplné seskupení nástrojů;
- 1 signature educational / visual block;
- případně 3–4 kvalitní guide cards;
- stručnou methodology/trust/disclaimer vrstvu;
- premium footer.

Neplň stránku textem kvůli SEO délce. Huby nemusí mít 2 800 slov.

**Žádné dlouhé bloky „keců“ mezi hero a hlavní užitnou částí.**

---

# 6. KATALOG NÁSTROJŮ: ZAKÁZANÁ ZEĎ STEJNÝCH KARET

U hubu s větším počtem nástrojů se vyhni 8–20 identickým kartám v uniformním gridu.

Místo toho:
- seskup nástroje podle skutečných uživatelských situací / lifecycle / decision stages;
- použij asymetrii jen tam, kde podporuje prioritu;
- dominantní nástroje mohou mít větší prostor;
- ostatní mohou být kompaktní řádky / subcards;
- u každé skupiny vysvětli, proč existuje.

Uniformní grid může být použit pouze tehdy, když je opravdu nejlepší ergonomickou volbou — ne jako default.

---

# 7. VIZUÁLNÍ DISCIPLÍNA

„Propracované“ neznamená „přeplácané“.

Zakázané / nežádoucí:
- box-in-box na každém kroku;
- mnoho různých vizuálních jazyků na jedné stránce;
- dashboard cirkus;
- příliš mnoho mikro-badge;
- příliš mnoho dark bloků;
- velké hluché prázdné plochy;
- natažené sidebary;
- grafika nalepená do CTA;
- absolutně pozicované CTA, pokud hrozí kolize s dynamickým obsahem;
- pseudo-data;
- textové bloky vypadající jako poznámkový dokument;
- sterilní bílá zeď generických SaaS cards.

Preferuj:
- jeden silný hlavní visual na sekci;
- čistou hierarchii;
- dobře využité whitespace;
- smysluplnou asymetrii;
- 1–2 signature moments místo 20 dekorací;
- vizuální rytmus: text / art / tool / whitespace / dark stage / white stage.

---

# 8. PRACOVNÍ POSTUP PRO KAŽDÝ DALŠÍ HUB

1. Ověř aktuální produkční soubor a skutečné nástroje v clusteru.
2. Zkontroluj sitemap / interní URL.
3. Definuj:
   - hlavní user intent;
   - 3–5 situací;
   - vlastní visual metaphor;
   - správný počet a seskupení nástrojů.
4. Postav V1.
5. Předej **přímý klikací preview HTML odkaz** + ZIP.
6. Uživatel provede vizuální QA screenshotem.
7. Pokud je problém systémový, přestav komponentu systémově — ne vrstvením patchů.
8. Po vizuálním schválení proveď **hluboký deploy audit**.
9. Teprve potom vytvoř clean deploy ZIP pouze změněných/přidaných produkčních souborů.
10. Po nasazení dej **LIVE produkční URL** pro okamžitou kontrolu mimo ChatGPT.
11. Live PSI / smoke test až na skutečné HTTPS produkční URL.
12. Po čistém výsledku stránku označ LOCK a jdi dál.

---

# 9. DEPLOY AUDIT — POVINNÝ STANDARD

Deploy audit není formalita. Musí zachytit i vizuální nedokonalosti.

Kontroluj minimálně:
- 320 px
- 390 px
- 768 px
- 1024 px
- 1440 px
- pokud je praktické, 1920 px

## Vizuální QA
Prohlédni celou stránku po sekcích v čitelné velikosti.

Kontroluj:
- překryvy textu / artu / CTA;
- hluché plochy;
- natažené boxy;
- disproporční ilustrace;
- pseudo-data;
- nedotažené spodní okraje karet;
- konzistenci spacingu;
- zda art pomáhá nebo překáží;
- footer;
- mobilní stacking;
- poslední řádek každé karty;
- CTA ve všech cards.

**0 px overflow není vizuální PASS.**

## Funkčnost
- všechny formuláře / minicalc / interactive widgets;
- reset, pokud existuje;
- nula, extrémní a prázdné vstupy;
- menu;
- ESC;
- `aria-expanded` reset;
- console errors.

## Technika
- 0 chybějících lokálních assets;
- 0 chybějících interních URL;
- 0 broken anchors;
- 0 duplicate IDs;
- 0 broken SVG `url(#...)` refs;
- valid JSON-LD;
- správný canonical;
- `index,follow` u produkční stránky;
- OG + Twitter large card;
- favicon / apple / manifest;
- performance-safe konstrukce;
- žádné zbytečné frameworky / externí webfonty.

## Accessibility
- skip link;
- pojmenované interaktivní prvky;
- viditelný focus;
- kontrast AA tam, kde se aplikuje;
- mobilní touch targets cca 44 px;
- nepoužívat `aria-hidden` na významový obsah.

## Metodika / disclaimer
- pokud mini-model ukazuje orientační výsledek, musí být jasné, co vstup zahrnuje a nezahrnuje;
- nepoužívat arbitrární „dobré / špatné“ thresholdy bez metodické opory;
- u právních, finančních, daňových, mzdových a časově proměnlivých tvrzení ověřit aktuální autoritativní zdroje;
- pokud data rychle stárnou a nejsou pro hub zásadní, raději je nehardcodovat.

Nikdy netvrď PASS, pokud konkrétní kontrola neproběhla.

---

# 10. RELEASE BALÍK

Po schváleném deploy auditu připrav **clean deploy ZIP**.

Preferovaný obsah:
- pouze změněné/přidané produkční soubory;
- HTML leader page;
- nový OG asset, pokud vznikl;
- pouze skutečně potřebné nové lokální assets.

Do root deploy ZIPu nedávej README, audit notes, screenshots ani pomocné soubory.

Audit report může být předán zvlášť.

Po každé úpravě přilož:
1. klikací preview HTML;
2. clean deploy ZIP;
3. případně audit report;
4. po deployi přímý LIVE link na `https://rychlevypocty.cz/...`.

---

# 11. AKTUÁLNÍ STAV WAVE — ORIENTAČNÍ HANDOFF

Aktuální ZIP projektu je vždy nadřazen tomuto seznamu, ale pro kontinuitu:

## Silně dotažené / prakticky locknuté po předchozí práci
- `index.html` — homepage master direction / LOCK po live QA
- `kalkulacky.html` — premium catalogue / LOCK po live QA
- `finance-a-hypoteky.html` — finální hub po hardeningu
- `mzdy-a-prace.html` — finální audited hub
- `bydleni.html` — finální audited hub
- `business-a-cenotvorba.html` — finální deploy audit dokončen

## Vizuálně schválené / další stav ověř v aktuálním ZIPu
- `energie-a-domacnost.html` — V3 direction accepted; deploy audit mohl být ještě pending
- `stavba-domu.html` — V1 direction accepted; deploy audit mohl být pending
- `datum-a-cas.html` — V2 direction accepted po zásadním reworku; deploy audit mohl být pending
- `auto-a-provoz.html` — deep deploy audit + následné layout fixy; poslední clean candidate označen jako V5 v předchozím chatu, ale **aktuální produkční ZIP rozhoduje**, co je skutečně nasazené.

Nikdy slepě nepoužívej starý V1/V2/V3/V5 soubor. Ověř aktuální produkční `*.html` v přiloženém projektu.

---

# 12. DŮLEŽITÉ LEKCE Z POSLEDNÍCH ITERACÍ

1. **Bydlení V1**: správný koncept, ale hero blueprint měl mrtvé plochy → lesson: art musí být finální komponenta, ne wireframe.
2. **Energie V2**: přehnaná reakce na „víc artu“ → vznikl přeplácaný dashboard → lesson: restraint.
3. **Datum V1**: náhodné šipky + 10 stejných cards → lesson: významová grafika a situation grouping.
4. **Business**: release audit našel floating-point rounding bug → lesson: auditovat i funkční matematiku, ne jen CSS.
5. **Auto**: CTA se opakovaně potkávalo s art boxem → lesson: pokud se problém vrací, přestaň patchovat rozměry a změň layout model (normal flow / flex), potom znovu vizuálně ověř.

**Pokud uživatel třikrát ukazuje stejný vizuální problém, je to systémová chyba. Neprováděj čtvrtý mikro-patch. Přepiš komponentu správně.**

---

# 13. VÝSTUPNÍ STYL

Uživatel chce práci, ne dlouhé deklarace.

Po buildu:
- krátce vysvětli koncept;
- dej preview;
- dej ZIP;
- řekni, zda je to V1 k vizuální kontrole nebo final deploy candidate.

Po auditu:
- jasně GO / NO-GO;
- vypiš jen reálné nálezy a opravy;
- dej clean deploy ZIP;
- preview;
- audit report;
- live URL po nasazení.

Pokud stránka není dost dobrá, napiš **NO-GO** a oprav ji. Nepřesvědčuj uživatele, že je hotová.

---

# 14. CO UDĚLAT HNED V NOVÉM CHATU

Po nahrání aktuálního produkčního ZIPu:

1. Rozbal ho.
2. Najdi a přečti tento master prompt / handoff, pokud je přiložen.
3. Ověř skutečný stav hlavních leader pages.
4. Stručně napiš:
   - co je už skutečně v produkčním ZIPu;
   - které leader pages jsou LOCK / final / pending audit;
   - která další silná hub page má největší smysl.
5. Pokračuj **jednou další stránkou**, ne několika naráz.
6. Drž unikátnost a významovou grafiku.

