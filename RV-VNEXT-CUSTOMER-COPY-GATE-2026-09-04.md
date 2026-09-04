# RychléVýpočty.cz V7 — Customer Copy Gate

**Platnost od:** 2026-09-04  
**Stav:** HARD GATE pro všechny nové i recovery kalkulačky.

## Proč tento gate existuje

Interní názvy návrhových konceptů, archetypů a vývojové terminologie nesmí prosakovat do textu pro návštěvníka. Originalita stránky se má projevit produktem a vizuální logikou, ne tím, že zákazník čte názvy jako `Salary Reverse Engine`, `Resolver`, `Rail`, `Lab`, `Desk`, `Guard`, `Lens`, `Studio`, `Runway` nebo jiný interní codename, který mu nepomáhá vyřešit jeho úkol.

## 1. Customer relevance test — HARD FAIL

Každý viditelný text musí odpovědět alespoň na jednu z těchto otázek:

1. Co mám zadat?
2. Co jsem právě spočítal?
3. Co výsledek znamená?
4. Co se změní, když změním vstup?
5. Jaký je rozsah / hranice výpočtu?
6. Co je můj další logický krok?
7. Proč můžu výsledku důvěřovat?

Pokud text nepomáhá ani v jednom bodě, **má se odstranit nebo přepsat**.

## 2. Interní názvy zůstávají interní

Povoleno v kódu, komentářích a interních QA dokumentech:

- názvy archetypů,
- pracovní názvy produktu,
- Golden Delta Card terminologie,
- designové codenames,
- názvy interních komponent.

Naopak v zákaznickém UI je bez konkrétního užitku zakázáno používat formulace typu:

- `engine`, `solver`, `resolver`, `rail`, `lab`, `desk`, `studio`, `guard`, `lens`, `stack`, `runway`, `blueprint`, `control room`, `reverse mode`,
- `product moment`, `archetype`, `signature visual`, `golden`, `build`, `recovery`, `QA`, `PASS`, `seq`,
- jiné interní názvy, které existují hlavně kvůli návrhu stránky, nikoli kvůli user jobu.

Výjimka: termín může zůstat, pokud je v daném oboru skutečně běžný pro českého uživatele a prokazatelně zlepšuje porozumění. Samotná originalita není důvod.

## 3. Čeština first

Pro běžný český user job používej normální české názvy:

- `Salary Reverse Engine` → `Hrubá mzda z čisté`,
- `Reverse Payslip` → `Výplatní páska`,
- `Negotiation Rail` → `Jak se změní hrubá při jiném čistém cíli`,
- `Net Target Console` → `Vaše zadání`,
- `solver` → `kalkulačka` / `výpočet` / konkrétní popis toho, co se děje.

Angličtina je v zákaznickém UI přípustná jen u skutečně zavedených pojmů nebo zkratek, které českému uživateli pomáhají (např. TCO, BMI), ne jako dekorativní vrstva.

## 4. Hero Copy Gate

Hero musí v prvních 2–3 větách vysvětlit:

- co kalkulačka spočítá,
- co má uživatel zadat,
- případně jednu důležitou hranici / benefit.

Hero nesmí vysvětlovat interní mechanismus stránky, pokud to není pro výsledek podstatné.

Preferuj:

> Víte, kolik chcete čistého. Kolik je to hrubého?

místo:

> Salary Reverse Engine / Net Target Resolver / solver dopočítá reverse payslip.

## 5. Visual label gate

Text uvnitř grafiky, dashboardu, pásky, timeline nebo jiného signature vizuálu se posuzuje stejně přísně jako běžný copy text.

Grafika nesmí používat interní codenames jen proto, aby působila technologicky nebo originálně.

Každý label má být pochopitelný bez vysvětlení mimo daný blok.

## 6. CTA Gate

CTA musí popisovat zákaznickou akci:

- `Spočítat hrubou mzdu`,
- `Porovnat dvě nabídky`,
- `Zobrazit rozpad nákladů`,
- `Přidat další scénář`.

Zakázané jsou interní / abstraktní CTA typu `Spustit engine`, `Otevřít resolver`, `Vstoupit do control room` apod.

## 7. Copy Density Gate

TOP stránka neznamená více slov.

- Nad kalkulačkou musí být minimum textu nutného k pochopení úkolu.
- Jedna myšlenka se nesmí opakovat v hero, proof bloku, calculator intro a resultu jinými slovy.
- Dekorativní mikrocopy se odstraní, pokud neplní customer relevance test.
- Post-result depth má přidávat rozhodovací hodnotu, ne textovou délku.

## 8. Povinný Customer Copy QA před user review

Před prvním náhledem:

1. Extrahuj nebo ručně projdi **veškerý viditelný text**.
2. Vyhledej interní návrhové termíny a codenames.
3. Ověř Customer relevance test u hero, kalkulačky, výsledku i post-result bloků.
4. Zkontroluj, že názvy interních archetypů mohou zůstat v CSS/JS třídách nebo komentářích, ale nejsou viditelné návštěvníkovi.
5. Proveď finální otázku: **Řekl by tuto větu normálně člověk, který vysvětluje výsledek zákazníkovi?** Pokud ne, přepiš ji.

Neprovedený Customer Copy QA = **HARD FAIL před user review**.

## 9. Release decision

Od této revize je pro všechny nové a recovery kalkulačky povinné:

**PRIMARY INTENT PASS + CALCULATION PASS + TOPIC DEPTH PASS + PAGE-LEVEL ORIGINALITY PASS + VISUAL DRIFT PASS + RENDER QA PASS + IDENTITY PASS + CUSTOMER COPY PASS.**

Originalita nesmí snižovat srozumitelnost. Interní produktový koncept je prostředek pro návrh, nikoli text pro zákazníka.
