RYCHLÉVÝPOČTY.CZ V8 — READ ME FIRST / JEDINÉ PROJEKTOVÉ INSTRUKCE
Aktivace: 16. 9. 2026

PROJEKT
Existující web https://rychlevypocty.cz/. Produkční repository fangren740/bmi-kalkulacka; aktuální main je source of truth. Nevytvářej nový projekt, neobnovuj staré ZIPy jako alternativní pravdu. Pracuj striktně jednu kalkulačku po druhé.

JEDINÁ HIERARCHIE
1. Aktuální explicitní zadání uživatele určuje cíl, rozsah a udělení schválení.
2. Tento soubor určuje závazný proces V8.
3. RV_VNEXT_MASTER_PROMPT.txt je jediný závazný upgrade prompt pro jednu kalkulačku; nesmí odporovat bodu 2.
4. Aktuální main, skutečný produkční kód, relevantní technické standardy, automatizované testy a CI jsou autoritou pro implementační fakta a neobcházené technické kontroly. Technické požadavky nesmějí samy změnit schvalovací proces.

PŘECHOD Z V7 — BEZ KONKURENČNÍCH PRAVIDEL
Tato V8 dvojice NAHRAZUJE procesní závaznost všech starších V7 / V-next workflow, master/strict promptů, quality/preview/no-regression/content/identity/method locků a AdSense finish instrukcí, i když uvnitř historického dokumentu stojí ACTIVE, MANDATORY, RELEASE-BLOCKING nebo POVINNĚ ČÍST. Nenačítej starý mandatory prompt stack jako další instrukce. Dokumenty ponech v repozitáři pouze jako datové, historické a odborné reference; vyzvedni z nich dosud platnou znalost, kterou V8 nepřebíjí. Staré kvóty slov, batching, ZIP-first postupy, absolutní povinnost preview přímo v chatu a alternativní DONE definice neplatí. Existující technické CI, ochrany metodiky a ne-regresní testy se nevypínají. Kolizi technického testu s V8 nezakrývej ani neobcházej: vyřeš příčinu před releasem. Nevytvářej další řídicí dokumenty.

JEDNA KALKULAČKA / MINIMÁLNÍ DIFF
Před úpravou otevři aktuální LIVE desktop + mobile a odpovídající HTML/CSS/JS, sdílené závislosti a relevantní testy na main. Inventarizuj existující funkce, výpočty, režimy, obsah, metodiku, SEO a silné stránky. Zvol KEEP / POLISH / REBUILD podle konkrétního důvodu, zachovávej engine a měň cíleně. Žádná významná regrese proti LIVE bez výslovně schválené výjimky. U redesignu porovnej aktuální LIVE, #74 cista-mzda-kalkulacka.html, dvě relevantní S-tier reference a poslední schválený Gold mesicni-mzda-z-hodinove-sazby-kalkulacka.html. Přenes kvalitu, nikoli šablonu. Neposílej uživateli slabé první pokusy.

SPRÁVNOST / OBSAH / BRAND
Ověř výpočty, validaci, krajní stavy a podle rizika M0–M4 také proměnlivé parametry, metodiku, skutečné aktuální primární zdroje a konkrétní disclaimer. Nedeklaruj ověření, které neproběhlo. Hloubka obsahu podle tématu, žádné mechanické kvóty slov a žádná SEO vata. Respektuj RV V3.2 identitu, existující oficiální assety, topic-native vizuál, celý footer a sociální odkazy. Header standardně používá logo-rv-v32.svg. Footer variantu neurčuj jen podle názvu historického locku: vyber správný skutečný brand asset podle kontrastu a ověř jeho vykreslené barvy. Zkontroluj CSS filter, opacity, jiné přebarvení, síťové načtení SVG, cache/versioning a skutečný pixelový výsledek desktop + mobil. Pouhá přítomnost img/src není vizuální QA.

IDENTITA KANDIDÁTA JIŽ PŘED PREVIEW
Založ samostatnou větev z ověřeného main a vytvoř dokončený produktový commit. PŘED poskytnutím preview eviduj commit SHA, výchozí main SHA, release manifest obsahující SHA-256 všech změněných produktových souborů, přesné identity používaných sdílených závislostí a assetů, způsob a identitu preview a předem povolený rozsah administrativního release diffu. Manifest musí být dohledatelný jako review artefakt a jeho hash musí být známý před schválením. Manifest vytvořený po schválení nebo zaměněný kandidát jsou FAIL.

VĚRNÉ PREVIEW
Preferuj interaktivní HTML preview přímo v chatu, pouze pokud opravdu provozuje totožné produkční HTML/CSS/JS a assety kandidáta. Není-li to možné, použij dostupný skutečný izolovaný webový náhled, otevři jej a ověř, že funguje, odpovídá kandidátovi a nemění produkci. Screenshot, mockup, ZIP, zdrojový odkaz ani produkční stránka vydávaná za kandidáta náhled nenahradí. Pokud věrné preview nelze poskytnout, řekni přesně proč; schválení kandidáta si nevyžaduj. Po produktové změně vytvoř nový commit, manifest, preview a nové schválení.

JEDINÝ RELEASE TOK
PREVIEW → SCHVÁLENÍ → AUDIT → DEPLOY → LIVE KONTROLA.
PREVIEW = dokončený interně otestovaný kandidát + fungující věrný náhled + commit a manifest.
SCHVÁLENÍ = explicitní souhlas uživatele s konkrétním commitem, manifestem a preview; V8 jako proces není souhlas s konkrétním produkčním deployem.
AUDIT = kontrola identity/hashe, diffu vůči aktuálnímu main, relevantní browser/regression QA a povinných CI. Nový main znamená znovu ověřit kompatibilitu, ne přepsat cizí práci.
DEPLOY = jen schválený/auditovaný produkt přes PR a GitHub do main, bez auto-merge před schválením.
LIVE KONTROLA = otevři skutečnou URL a ověř servírovanou identitu HTML/CSS/JS/assetů, interakce, rendering včetně footeru a loga, Pages/Live Health a podle dopadu PageSpeed/Lighthouse. DONE pouze po úspěšné produkční kontrole.
Po schválení je bez nového kola povolen jen předem deklarovaný, explicitně auditovaný administrativní diff trackerů/markerů/release metadat, nikoliv změna produktu. Každá jiná úprava HTML/CSS/JS/assetu/obsahu/chování vyžaduje nové preview i schválení. Blokující problém: oprava s novým schválením nebo rollback, nikdy tichý hotfix.

AUDIT PODLE DOPADU
HOTFIX: minimální diff, reprodukce konkrétní závady, cílený test opravy a okolních funkcí, relevantní browser a vizuální QA, všechny existující povinné CI. Změna CSS/brand/assetu = také pixelové ověření barev, CSS filtrů, síťových assetů a cache. Změna sdílené závislosti rozšíří test na závislé kalkulačky.
REDESIGN: kompletní funkční a obsahová regrese, metodika/zdroje, SEO, a11y, interaktivní browser QA, full-page desktop + mobile (včetně 320/390/768/1440 px dle relevance), vizuální branding a produkční PSI/Lighthouse mobile + desktop. U ostatních zásahů rozsah urči podle skutečného dopadu. Existující CI nikdy nezaměňuj za test konkrétní kalkulačky, pokud ji doopravdy netestuje.

KOMUNIKACE
GitHub operace provádí asistent; žádné rutinní manuální ZIPy. Před schválením předlož věrný preview, stručné změny, kandidátní commit, manifest/hash a případné otevřené problémy; potom STOP. Po nasazení sděl produkční URL, kandidátní a release commit, kontrolu identity, výsledky auditů, LIVE výsledek a DONE/FAIL. Nepřecházej automaticky na další kalkulačku. Nikdy neoznačuj plán, zelené nesouvisející CI, pouhý merge ani neprovedený test za dokončenou práci.
