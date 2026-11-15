# RychléVýpočty V3 — zákaznicky orientovaný obsah + právní úplnost
**Zpětný redakční audit návrhů 15. 11. 2026, 22:37 SEČ**  
**Větev:** \`rv3/customer-first-review-20261115\`, navazuje na [PR #78](https://github.com/fangren740/bmi-kalkulacka/pull/78) a předešlé drafty. **Nejde o potvrzení právní shody.** Produkce \`main\` beze změn.

## Problém, který audit odhalil

Dosavadní V3 Page Studio často využívalo „důvěru“ jako důvod pro další hero, kartu, technickou tabulku, ikonku, FAQ, interaktivní formulář či opakované vysvětlení. Výsledkem byla kognitivní zátěž a záměna interní dokumentace za uživatelskou. Číslo klíče, SHA, přesné řádky storage nebo logika deploye nejsou standardním zákaznickým sdělením.

**Norma:** *Právní úplnost ≠ technická výřečnost*. Jedna stránka odpovídá na jednu hlavní zákaznickou otázku. Související obsah odkazujeme místo opakování. Když nelze důležité fakta doložit, nebudeme na veřejném webu vydávat domněnku za ověřený stav.

## Stránka po stránce — zjištění a rozhodnutí

| URL / návrh V3 | Co je pro návštěvníka důležité | Co bylo nadbytečné / chybné | Rozhodnutí |
|---|---|---|---|
| \`/rv3/studio/o-nas.html\` (About) | Proč projekt existuje, kdo za ním stojí, jak najít kalkulačku a upozornit na chybu | Samostatný dvojblok o cookies a reklamě kopíroval témata právních stránek, opakovaly se role metodiky | Odstranit duplicitní „otevřeně o provozu“, zkrátit vyprávění, zachovat důvěryhodnost vlastníka a přímo použitelný katalog |
| \`/rv3/studio/jak-pocitame.html\` | Co výsledek znamená, jaké má předpoklady, praktický ověřitelný příklad | Opakovaný závěrečný velký prodejní blok a příliš mnoho meta vysvětlování | Zachovat praktický model, metodiku, zdroje a limity; zkrátit hero, steps copy a konec |
| \`/rv3/studio/redakcni-zasady.html\` | Jak vybíráme témata, ověřujeme zdroje, používáme AI, reagujeme na chyby | Druhý plný formulář pro hlášení chyb duplikoval Kontakt; poslední promo shrnutí opakovalo obsah | Formulář nahradit jedním odkazem na Kontakt, odstranit závěrečné promo; ponechat ověřitelné principy |
| \`/rv3/studio/kontakt.html\` | Oficiální kontakt a co napsat, aby šlo podnět řešit | Nadbytečný závěrečný reklamní/poděkovací blok; dlouhý hero a opakovaná ujištění | Zachovat 4 praktické typy a lokální mailto pomocník; zkrátit úvod a odstranit poslední dekorativní sekci. Nesmí tvrdit, že „nemáme kontaktní formulář“, aniž upřesníme lokální HTML funkci v právních textech |
| \`/rv3/studio/ochrana-osobnich-udaju.html\` | Identita správce, účely, právní tituly, příjemci, přenosy, uchování, práva a kontakt | Redesign dříve přidával technický URL inspektor a vysvětlovací mapy; v historickém právním textu mohou být zastaralé faktické věty | **7 právních oddílů / 17 odstavců ponechat úplných**, zkrátit pouze úvodní meta text. Faktickou revizi zákonných údajů provést samostatně |
| \`/rv3/studio/cookies.html\` | Jednoduše co může web do prohlížeče uložit, proč a jak to ovlivnit či smazat; kdy se uplatňuje souhlas | **9 interních klíčů × 6 technických polí**, poznámky o „storage keys“, zbytečný technický manuál; zjištěný rozpor u plánovače dovolené a směnového kalendáře | **Zcela nová zákaznická stránka** bez interních identifikátorů a detailní technické tabulky. Technické podklady zůstávají v GitHubu; změna není sama o sobě právním schválením. Reálné cookies/CMP/GA4/AdSense audity nadále blokují release |
| \`/reklama-a-spoluprace.html\` | Jak poznat placený obsah, zda může ovlivnit výpočty, kdo je provozovatel, kontakt pro spolupráci | Zatím veřejná původní verze tvrdí neaktivní AdSense/affiliate, bez čerstvé síťové verifikace; další dlouhé vysvětlování financování není třeba | Ještě nevytvářet další monumentální V3 stránku. Nejprve ověřit reklamní provoz a pak kompaktní důvěryhodné sdělení |
| \`/podminky-pouziti.html\` | Jak číst výsledky, omezení, podmínky užití, duševní vlastnictví, změny a kontakt | Osm oddílů je obsahově věcných, ale na V3 má být lepší navigace a žádné opakované podrobnosti o metodice | Věcný obsah zachovat; připravit čitelnou krátkou verzi s přístupným plným zněním až po právní review |
| \`/rv3/poc/katalog-v2.html\` | Vybrat nástroj a co nejrychleji ho otevřít | Katalog má existující search/direct paths a asi 135 položek; neřeší právní meta text | Zatím neměnit; samostatné UX QA pro relevance výsledků a nepřidávat „SEO vysvětlivky“ |
| \`/rv3/wave1/index.html\`, první 2 hub pages | Rychle pochopit nabídku a pokračovat k nástroji | Stávající preview *main HTML pouze přebírá* z veřejných zdrojů, nebyl proveden individuální obsahový audit všech formulací | **Nedokládat jako dokončenou copy revizi.** Zařadit do separátních page-by-page kol, priorita hlavně nad prvním foldem |

## Česká a evropská právní logika (ověřené zdroje)

- ÚOOÚ: u **nezbytných technických** cookies není třeba předchozí souhlas podle §89 odst. 3 zákona č. 127/2005 Sb.; u **netechnických** cookies a obdobného ukládání bývá potřeba svobodný, informovaný souhlas před uložením/čtením, včetně reálného odmítnutí a odvolání. Nepovažovat localStorage automaticky za „mimo pravidla cookies“. [ÚOOÚ – Cookies Q&A](https://uoou.gov.cz/verejnost/qa-otazky-a-odpovedi/cookies).
- ÚOOÚ: i bez cookie lišty mohou existovat povinnosti informovat o zpracování osobních údajů; s pouhou technickou cookie lišta není automatická nutnost, je-li zpracování řádně vysvětleno. [ÚOOÚ – Cookies Q&A](https://uoou.gov.cz/verejnost/qa-otazky-a-odpovedi/cookies).
- GDPR články 12 a 13: informace mají být stručné, transparentní, srozumitelné a snadno dostupné; musí pokrýt faktické účely, právní základ, identitu správce, příjemce, dobu uchování/kritéria, práva a případné přenosy. Neznamená to **obecnou povinnost vypisovat v prvním plánu interní názvy všech localStorage proměnných**. [ÚOOÚ – metodika informační povinnosti](https://uoou.gov.cz/profesional/metodiky-a-doporuceni-pro-spravce/metodika-k-plneni-informacni-povinnosti-a-k-souvisejicim-ujednanim-vuci-zakaznikum); [ÚOOÚ – základní příručka](https://uoou.gov.cz/verejnost/zakladni-prirucka-k-ochrane-udaju).
- Faktická přesnost údajů je právní podmínka. Například na původním \`cookies.html\` a \`ochrana-osobnich-udaju.html\` je věta, že GA4/AdSense nejsou aktivní, avšak samotný zdrojový dokument neprokazuje stav skutečného webu. Jakýkoli nový veřejný claim o měření/souhlasu se musí podpořit runtime network auditem a dokumentovaným právním posouzením.
- **Pro tento projekt to není právní posudek** a žádný zelený CI test ani pěkná stránka neznamená splnění GDPR, ePrivacy nebo českých předpisů. Podmínkou publikace je věcná kontrola finálních formulací vůči ověřené implementaci, případně externí právní review.

## Obsahová pravidla pro všechny budoucí URL

1. **Jedna návštěvnická otázka → přímá odpověď hned nahoře.** Úvod nesmí vysvětlovat interní proces vytváření webu, pokud se na něj návštěvník neptá.
2. **Žádná povinná délka textu.** Ani historické doporučení „min. 2 800 slov“ nesmí být použito jako důvod k výplni. Obsah podle intentu a důkazů; SEO není důvod k opakování.
3. **Technické názvy klíčů, SHA, testovací reporty, deploymenty a bugy** patří do issue/PR a technické dokumentace. Do veřejného obsahu pouze tehdy, když by návštěvník skutečně potřeboval konkrétní technický údaj pro svou volbu či právo.
4. **Žádné umělé tři karty nebo „wow tester“ pro právní stránku.** Ilustrace jen když vede k lepší orientaci.
5. Právní stránky poskytují plné závazné informace; **neskrývat povinné podmínky, práva či relevantní účely** do prakticky nedostupných míst. Krátké FAQ je orientační, ne náhrada právního textu.
6. Duplicitní formy a nabídky odstranit; nahlášení chyby vede na jedinou praktickou stránku Kontakt.
7. Při neověřených faktických tvrzeních **zablokovat release**, nevymýšlet, zda je služba aktivní či ne.
8. Každá úprava: source/provenance → textový audit → Node a source tests → immutable Cloudflare preview → Browser QA 390/1440 → majitelův content/design review → samostatný legal/provozní signoff → explicitně autorizovaný merge.

## Otevřené release brány

- [ ] Produkční browser/network audit GA4, AdSense, CMP, cookies a localStorage před i po volbě uživatele, relevantní URL napříč webem.
- [ ] Sjednotit tvrzení o lokálním HTML \`mailto:\` pomocníku V3 Kontakt s právním dokumentem („web nemá kontaktní formulář“ je bez upřesnění nepřesné).
- [ ] Ověřit aktuální hosting, logování, zpracovatele, retenční informace a případné přenosy.
- [ ] Sestavit obsahově přesné, srozumitelné **finální** právní dokumenty a udržovat je synchronně; žádné slepé překlopení historického textu.
- [ ] Reálný Cloudflare Browser Run a screenshoty 390×844 / 1440×900 **po posledním** editačním commitu; quota 429 nepovažovat za PASS.
- [ ] Vizuální a obsahové schválení, samostatné právní schválení; žádný \`main\` merge bez výslovného pokynu.

## Hranice auditu

Tento audit přímo četl osm původních trust/legal HTML dokumentů, šest existujících V3 návrhů, homepage/hub preview adaptery a katalog V3 renderer. **Netvrdí** dokončený content QA všech ~200 jednotlivých URL, všech aktivních kalkulaček ani úplný důkaz síťového provozu. To vyžaduje navazující samostatné kroky s důkazy.
