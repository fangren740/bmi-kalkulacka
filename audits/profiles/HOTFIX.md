# PROFILE — HOTFIX

Použij při opravě konkrétní vady z GSC, produkce, bug reportu nebo technického auditu.

## Povinný postup
1. reprodukuj konkrétní vadu;
2. urč root cause;
3. proskenuj celý projekt na **stejný pattern**;
4. proskenuj nejbližší **příbuzné varianty**;
5. proveď nejmenší bezpečný patch;
6. spusť celý relevantní statický audit;
7. ověř, že diff nezasáhl nesouvisející logiku;
8. podle typu změny spusť runtime/live smoke;
9. uzavři `90_RELEASE_GATE`.

## Povinné moduly
- 10 REPO INTEGRITY
- 20 SEO/INDEXABILITY — pokud se dotýká HTML/URL/meta/linků
- 30 STRUCTURED DATA — pokud je schema přítomné nebo dotčené
- 40 LINKS/ASSETS — pokud se mění HTML/CSS/asset reference
- 90 RELEASE GATE

## Podmíněné
- 50 RUNTIME — povinný při změně JS, DOM interakcí, formuláře nebo runtime assetu;
- 60 VISUAL — povinný při změně layout/CSS/hero/komponent;
- 70 PERFORMANCE — povinný při změně CSS/JS/velkých assetů;
- 80 CONTENT/METHOD — povinný při změně vzorce, konstanty, metodiky nebo citlivého textu.

## Scope guard
Hotfix nesmí samovolně přejít do redesignu nebo obsahové wave.
