# PROFILE — FULL DEPLOY

Použij před větším release, merge větší wave nebo když se mění společné brand/runtime assety.

## Povinné moduly
Všechny moduly 10–90, včetně `15 V-NEXT STATE / TRACKING INTEGRITY` a `45 LIVE PRODUCTION HEALTH` po skutečném deployi.

## Rozsah
- V-next state/tracking gate nad celým trackerem a skutečným HTML;
- statický audit celého repa;
- JS syntax celého repa;
- po deployi automatický live health gate nad celou sitemapou;
- runtime smoke všech přímo změněných URL + reprezentativních typů stránek;
- visual smoke homepage/hub/kalkulačka na mobilu a desktopu;
- performance kontrola reprezentativních nebo změněných URL;
- přesný diff a seznam changed files.

Bez live smoke/live health po deployi je stav `NOT DEPLOYED`, nikoli `PASS`.
