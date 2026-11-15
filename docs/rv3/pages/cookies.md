# RV3 Page Studio — Cookies, zákaznicky orientovaná revize

**Preview:** \`/rv3/studio/cookies.html\`. **Produkce:** \`/cookies.html\` (beze změny).
**Status:** DRAFT / reálný právně-technický audit nástrojů, CMP a reklam BLOCKED / Browser QA pending.

## Původní chyba
První návrh PR #78 převzal do hlavní návštěvnické stránky celou starou interní referenční tabulku: 9 \`localStorage\` klíčů s 54 poli, včetně technických spouštěčů. To neodpovídá přímé potřebě návštěvníka ani požadavku na srozumitelné právní informace. Přehled byl navíc ve dvou řádcích fakticky sporný vzhledem k reálně odkazovaným JavaScriptům. Pouhé zkrácení předmluvy problém neřeší.

## Nová redakční verze
- Hero: \`Cookies a vaše nastavení\`. Dvě volby navigace: **Co si web pamatuje** / **Jak údaje smazat**.
- **Uložená nastavení:** několik běžných příkladů bez interních názvů nebo detailů nepodstatných pro návštěvníka. Formulace \`některé funkce\` a \`kde existuje volba\` nevydává zastaralé nástroje za podporované.
- **Smazání:** konkrétní uživatelská cesta (reset/vypnutí v dané funkci, nebo data webu v prohlížeči).
- **Měření a reklama:** věcně vysvětlená obecná podmínka souhlasu pro netechnické cookies, nikoli nedoložené tvrzení, že je GA4 či AdSense nyní zapnuté nebo vypnuté. **Přechodová neprodukční poznámka musí být před veřejným vydáním nahrazena ověřenými fakty.**
- Odkazy na úplnou stránku Ochrana osobních údajů a Kontakt. Žádná tabulka, žádná zbytečná JS akce, žádný „inspektor URL“, žádné kopírování debug/QA informací.
- Lokální autorská ilustrace a katalogová značka zůstávají, ale samotný text je nyní krátký a čitelný.

## Co nezmizelo z technického auditu
Git blob source \`cookies.html\`: \`68e9ba2b0db21a80dfdb5a7dc3443e17394eb56f\`. Renderer dál fail-closed ověřuje původní 5 sekcí, 9 klíčů/54 polí, JSON-LD, SEO canonical a identitu. Informace **zůstávají v GitHubu jako historický interní podklad**, ale nejsou vystavované zákazníkovi jako aktuálně pravdivá tabulka. \`sourceInventoryReviewed=false\` a \`technicalKeysExposed=0\` v preview manifestu. Původní veřejná verze byla nedotčena.

## Co brání právně bezpečnému vydání

1. Současné produkční \`planovac-dovolene.html\` a \`smenovy-kalendar.html\` odkazují skripty, které nedokládají uvedené dva storage klíče. Provést úplný technický audit, odstranit zastaralé řádky z interní referenční evidence a finalizovat přesné údaje podle skutečného běhu.
2. Zkontrolovat síťový provoz na reálných produkčních URL **před i po souhlasu**: Google Analytics, AdSense, CMP a cookies, a tomu odpovídající účely/příjemce/doby uchování. Aktuální stav není potvrzen pouhým textem v GitHubu.
3. Ověřit soulad původního \`ochrana-osobnich-udaju.html\`, provozní hosting GitHub Pages a nově navrhovaný lokální HTML mailto pomocník. V případě změn revidovat právní dokumenty **koordinovaně**.
4. Posoudit povinnou informační transparentnost podle GDPR čl. 12/13 a zákona č. 127/2005 Sb. §89(3), včetně právní relevance konkrétního localStorage a případných cookies.
5. Cloudflare immutable preview pro přesné SHA, reálný Browser Run 390×844/1440×900, čitelnost a klikací odkazy, noindex, bez rozbitých assetů a overflow. Schválení obsahu/designu a právní verze, pak teprve explicitní merge.

Oficiální české výklady: [ÚOOÚ – Cookies Q&A](https://uoou.gov.cz/verejnost/qa-otazky-a-odpovedi/cookies), [ÚOOÚ – informační povinnost](https://uoou.gov.cz/profesional/metodiky-a-doporuceni-pro-spravce/metodika-k-plneni-informacni-povinnosti-a-k-souvisejicim-ujednanim-vuci-zakaznikum).

**Výsledek:** zařadit technický audit do interního issue, nevystavovat seznam implementačních klíčů zákazníkům. Právní úplnost nelze prohlásit za splněnou do ověření skutečných systémů.
