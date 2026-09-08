# Tapety — product lock a nezávislá očekávání

Base main: 1323be76b65b59dd55563b1985257658ba2181f0. Branch astra-gold-tapety.
Norma: Gold 1.0 (RV_V7_CALCULATOR_GOLD_STANDARD.md, 7. 9. 2026) + přesná delta 1.1 v oddílu 11 RV_V7_HIGH_RISK_CORRECTNESS_REVIEW.md. Ani jeden soubor není v base main; použity projektové review artefakty. Žádná změna pilotu #74.

Uživatel přichází, protože chce koupit celé role a vědět, který pás z které role uříznout.
Pattern D: zadání stěn a role → pracovní přehled rolí → číslované řezy. Bez dekorativního hero.
Společná výška je základ; každá stěna může mít vlastní. Každá začíná celým pásem, fáze vzoru se resetuje; návaznost přes rohy není modelována. Svislé pásy, bez obracení či skládání krátkých dílů. Otvory se neodečítají. Šířka je využitelná šířka, bez bočního překrytí.

Výpočty jsou v celých mm. Metry max 3 desetinná místa, cm max 1; další nenulová místa odmítnout. Mezery v čísle pouze správně seskupené tisíce, čárka nebo tečka. Parser oddělený od doménové validace.
Počet pásů stěny = ceil(šířka stěny / šířka role). Základ pásu = výška + horní + dolní ořez. Bez vzoru řez = základ. Se vzorem řez = ceil(základ / raport) * raport; přebytek je dole. Nejde o nejkratší možný řez.
Rovné sesazení: fáze všech pásů 0. Přesazené: fáze j-tého pásu = (j * posun) mod raport, j začíná 0 na každé stěně. Posun je délka po směru odvíjení, ne univerzální značka výrobce.
Neznámý počátek: z každé role vyhradit jeden raport; skutečný odřezek pro nalezení společného motivu je menší či roven rezervě. Po jeho nalezení odměřovat řezy od tohoto bodu, nikoli od surového počátku. Zbytek je konzervativní dolní mez. Při potvrzeném společném počátku fáze 0 je rezerva 0 a zbytky jsou přesné v modelu.
Před pásem odříznout (cílová fáze - dosavadní využitá délka mod raport + raport) mod raport. Vzít první dosud otevřenou roli, kam se celý pás včetně odřezku vejde, jinak novou. Pásy zpracovat v pořadí stěn. Žádné tvrzení optimality. Zobrazené řezy jsou v pořadí řezání v každé roli; ID stěna/pás určuje pořadí lepení.

Limity: 30 stěn, 500 pásů (přehlednost a omezení DOM), délky max 100 m, role šířka max 10 m, ořez max 100 cm. Při překročení vysvětlit podporovaný rozsah; hodnoty neomezovat potichu. Raport > role → unavailable; řez + rezerva + fáze > role → unavailable. Žádný dílčí úspěšný plán.

## Expected před implementací

V tabulce všechny délky v cm; bez vzoru a nulový ořez, není-li uvedeno jinak. Role šířka 50 cm; známý počátek při vzoru, pokud není uvedeno jinak. Expected stanoveno ruční aritmetikou, bez produkční funkce.

| ID | Vstup | Očekávání a nezávislé odvození |
|---|---|---|
| T01 | stěna 200 × 250; role 1000; ořez 4 + 4 | 4 pásy × 258; 3 na první roli, 1 na druhé; zbytky 226,742; 2 role |
| T02 | stěna 200 × 250; role 1000 | 4 × 250 = 1000; 1 role, zbytek 0 |
| T03 | stěna 200,1 × 250; role 1000 | ceil(200,1/50)=5; 2 role; zbytky 0,750 |
| T04 | stěna 150 × 250; role 1000; ořez 4+4; rovné R=64 | ceil(258/64)=5; řez 320; 3 pásy, 1 role, zbytek 40; prodloužení 62 na pás |
| T05 | stěna 200 × 250; role 1000; ořez 4+4; přesazené R=64 S=32 | 4 × 320; fáze 0,32,0,32; role 1 pásy 1.1,1.2,1.4: 320+32+320+320=992; role 2 pás 1.3: 320; 2 role, zbytky 8,680 |
| T06 | stěny 101 × 250 a 51 × 200; role 1000 | 3×250 + 2×200; 1. role 250+250+250+200=950; 2. role 200; zbytky 50,800; 5 pásů |
| T07 | stěna 50 × 1001; role 1000 | unavailable, žádný počet rolí |
| T08 | šířka stěny 1,061 m; výška 2,501 m; šířka role 53 cm; délka 10,05 m; ořez 2,5 + 2,5 cm | 3 × 255,1 = 765,3; 1 role; zbytek 239,7 cm |
| T09 | stěna 200 × 240; role 1000; ořez 5+5 | 4 × 250; přesně 1 role; ořez 40 celkem |
| T10 | T02 + přítomné okno/dveře | stejné 4 pásy, 1 role, 0 zbytek; žádný plošný odečet |
| T11 | T04, neznámý počátek | použitelné 936; vejdou se 2 ×320, třetí do druhé role; 2 role; zbytky nejméně 296,616; vyhrazeno 128 |
| T12 | 3 pásy 240; přesazené R=60 S=20; role 1000 | fáze 0,20,40; odřezky 0,20,20; 1 role; zbytek 240 |
| T13 | rovné R=1100, role 1000 | unavailable i pro nízkou stěnu |
| T14 | 1 pás 960, R=64; role 1000; neznámý počátek | 960+64 >1000; unavailable v konzervativním modelu |

## UX / richness lock
Tři navazující otázky: kam přijde který pás (ID stěna/pás), co spotřeboval vzor (prodloužení a dorovnání zvlášť), lze použít zbytky (samostatné délky, bez slibu využití). Tisk plánu obsahuje rozměry a předpoklady. Vstupy se submitují společně, každá editace ihned odstraní aktuální plán. Reset obnoví označený příklad. Mazání stěny má možnost vrátit.

## Primární zdroje, ověřeno 8. 9. 2026
- https://www.as-creation.com/en/advice-help/wallpaper-advice/wallpapering-tips — vzor podle vloženého návodu, zaokrouhlení délky na raport.
- https://www.as-creation.com/en/advice-help/wallpaper-advice/wallpapering-tips/paper-wallpaper-hanging-instructions — měření výšky a přídavek na ořez.
- https://www.arthouse.com/blogs/how-to/pattern-repeat-pattern-match-the-low-down — rozdíl raportu a sesazení.
Algoritmus, rezerva počátku, reset fáze a zacházení s otvory jsou naše explicitní konvence, nikoli příkaz těchto výrobců.

## Korekce nezávislého očekávání T05 při prvním běhu
Původní ruční tabulka počítala pouze pokračování na poslední roli (zbytky 328,328). To neodpovídalo předem popsanému first-fit pravidlu. Znovu odvozeno bez volání core: po pásech 1 a 2 končí role 1 v 672 cm, tedy ve fázi 32. Pás 3 s fází 0 se nevejde (32+320 >328), proto jde do role 2. Pás 4 s fází 32 ale do role 1 jde bez dorovnání: 672+320=992. Správné očekávání 8,680. Produkční algoritmus se kvůli tomuto nálezu neměnil.
