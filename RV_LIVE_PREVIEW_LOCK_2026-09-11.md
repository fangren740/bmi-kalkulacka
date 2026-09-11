# RychléVýpočty.cz V7 — LIVE PREVIEW LOCK

Datum: 11. 9. 2026
Stav: ACTIVE / RELEASE-BLOCKING WORKFLOW RULE

## Základní pravidlo

Každá jednotlivě upravovaná kalkulačka musí být před user approval zobrazena jako **reálný interaktivní LIVE HTML preview přímo v chatu**.

Screenshoty jsou pouze doplňkový QA důkaz. Samy o sobě NENAHRADÍ live preview.

## POVINNÁ PREVIEW → PRODUCTION PARITA

Live preview nesmí být samostatně ručně vytvořená „ukázka“, která se následně liší od souborů určených k deployi.

Povinně platí:
- nejdřív vznikne skutečný produkční kandidát HTML/CSS/JS,
- live preview se vygeneruje **z těchto stejných kandidátních souborů** pouze zabalením/inlinováním assetů nutným pro náhled v chatu,
- layout, text, ovládání, metodika, disclaimer, logo, watermark/visual field a výpočetní logika musí být shodné s kandidátem k deployi,
- po user approval se smí nasadit pouze tento schválený kandidát nebo technicky ekvivalentní build bez produktových/obsahových změn,
- jakákoli produktová změna po approval ruší approval a vyžaduje nový live preview.

**Deploy jiného branch/stale buildu než toho, který uživatel schválil v live preview = RELEASE FAIL a musí být okamžitě rollbacknut.**

## Povinný postup pro každou kalkulačku

1. Pracovat vždy jen na **jedné kalkulačce**.
2. Dokončit correctness, metodiku, zdroje, disclaimer podle rizika, branding, mobile UX, a11y a regression QA.
3. Vytvořit skutečný produkční kandidát HTML/CSS/JS.
4. Z tohoto stejného kandidáta vytvořit funkční live HTML preview, ve kterém:
   - fungují všechny hlavní vstupy a výpočet,
   - je správné canonical V3.2 logo a V7 identita,
   - je vidět reálný layout desktopu i mobilu,
   - nejsou placeholder/fake assety,
   - preview odpovídá 1:1 kandidátu určenému k review s výjimkou čistě technického inlinování assetů.
5. **Vložit live preview přímo do chatu jako primární review výstup.**
6. Screenshoty lze přidat pouze jako doplněk pro rychlou kontrolu konkrétních breakpointů.
7. Bez explicitního user approval se stránka nesmí označit DONE ani nasadit jako schválený upgrade.
8. Po approval následuje deploy přesně schváleného kandidáta, live health, PageSpeed/Lighthouse a teprve potom další kalkulačka.

## Zakázané náhrady live preview

Za splnění pravidla se nepovažuje:
- pouze screenshot,
- ZIP bez okamžitě otevřitelného náhledu,
- popis změn,
- statický report,
- odkaz na branch bez renderovaného náhledu,
- tvrzení, že browser QA prošlo,
- preview vytvořený jiným HTML/CSS/JS než produkční kandidát,
- deploy staršího nebo jiného branch buildu po schválení preview.

## Důvod

Uživatel chce hodnotit skutečný produkt a interakce, nikoli screenshot nebo implementační report. Live preview je proto součást release procesu stejně jako correctness a QA. Schválení se vztahuje na konkrétní produktový kandidát, ne obecně na název kalkulačky.

## Konflikt pravidel

Pokud starší workflow připouští batch approval, screenshot-only review nebo oddělený mockup a následný jiný deploy build, toto pravidlo má pro aktuální AdSense finish sprint přednost.
