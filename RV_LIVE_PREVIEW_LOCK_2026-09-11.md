# RychléVýpočty.cz V7 — LIVE PREVIEW LOCK

Datum: 11. 9. 2026
Stav: ACTIVE / RELEASE-BLOCKING WORKFLOW RULE

## Základní pravidlo

Každá jednotlivě upravovaná kalkulačka musí být před user approval zobrazena jako **reálný interaktivní LIVE HTML preview přímo v chatu**.

Screenshoty jsou pouze doplňkový QA důkaz. Samy o sobě NENAHRADÍ live preview.

## Povinný postup pro každou kalkulačku

1. Pracovat vždy jen na **jedné kalkulačce**.
2. Dokončit correctness, metodiku, zdroje, disclaimer podle rizika, branding, mobile UX, a11y a regression QA.
3. Vytvořit samostatný funkční live HTML preview kandidáta, ve kterém:
   - fungují všechny hlavní vstupy a výpočet,
   - je správné canonical V3.2 logo a V7 identita,
   - je vidět reálný layout desktopu i mobilu,
   - nejsou placeholder/fake assety,
   - preview odpovídá kandidátu určenému k review.
4. **Vložit live preview přímo do chatu jako primární review výstup.**
5. Screenshoty lze přidat pouze jako doplněk pro rychlou kontrolu konkrétních breakpointů.
6. Bez explicitního user approval se stránka nesmí označit DONE ani nasadit jako schválený upgrade.
7. Po approval následuje merge/deploy/live health/PageSpeed a teprve potom další kalkulačka.

## Zakázané náhrady live preview

Za splnění pravidla se nepovažuje:
- pouze screenshot,
- ZIP bez okamžitě otevřitelného náhledu,
- popis změn,
- statický report,
- odkaz na branch bez renderovaného náhledu,
- tvrzení, že browser QA prošlo.

## Důvod

Uživatel chce hodnotit skutečný produkt a interakce, nikoli screenshot nebo implementační report. Live preview je proto součást release procesu stejně jako correctness a QA.

## Konflikt pravidel

Pokud starší workflow připouští batch approval nebo screenshot-only review, toto pravidlo má pro aktuální AdSense finish sprint přednost.
