#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / 'mesicni-mzda-z-hodinove-sazby-kalkulacka.html'
JS = ROOT / 'mesicni-mzda-z-hodinove-sazby.js'


def must_replace(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f'Missing expected fragment: {label}')
    return text.replace(old, new, 1)


def patch_html() -> None:
    text = HTML.read_text(encoding='utf-8')

    if 'rv-brand-v32.css' not in text:
        text = must_replace(
            text,
            '<link rel="stylesheet" href="mesicni-mzda-z-hodinove-sazby.css?v=20260728">',
            '<link rel="stylesheet" href="mesicni-mzda-z-hodinove-sazby.css?v=20260728">\n  <link rel="stylesheet" href="/rv-brand-v32.css?v=20260801-stable">\n  <link rel="stylesheet" href="/rv-social-links.css?v=20260907-1">\n  <link rel="icon" type="image/svg+xml" href="/favicon-rv-v32.svg?v=1">\n  <script defer src="/rv-brand-v32.js?v=20260801"></script>',
            'brand assets'
        )

    text = text.replace('<body data-mode="basic">', '<body class="rv-brand-v3 rv-brand-v32" data-mode="basic">', 1)
    text = text.replace('src="logo-rychlevypocty.svg" alt="RychléVýpočty.cz" width="190" height="38"', 'src="/logo-rv-v32.svg?v=1" alt="" width="295" height="48" decoding="async"', 1)
    text = text.replace('src="logo-rychlevypocty-footer.svg" alt="RychléVýpočty.cz" width="190" height="38"', 'src="/logo-rv-v32-inverse.svg?v=1" alt="" width="295" height="48" decoding="async"', 1)
    text = text.replace('<section class="hero">', '<section class="hero rv-identity-hero">', 1)
    text = text.replace('<section class="shell calculator-shell" id="kalkulacka">', '<section class="shell calculator-shell rv-brand-calculator" id="kalkulacka">', 1)
    text = text.replace('<aside class="result-panel" id="vysledek" aria-live="polite">', '<aside class="result-panel rv-brand-result" id="vysledek" aria-live="polite">', 1)
    text = text.replace('<footer class="site-footer">', '<footer class="site-footer rv-brand-footer">', 1)

    text = text.replace(
        '<span>Placený fond konkrétního měsíce</span><small>Zadejte hodiny, za které se počítá základní hodinová mzda.</small>',
        '<span>Základní placený fond bez přesčasů</span><small>Zadejte hodiny hrazené základní sazbou. Přesčasové hodiny přidejte níže jen tehdy, pokud skutečně splňují definici práce přesčas.</small>',
        1
    )
    text = text.replace(
        '<label class="field" for="overtimeHours"><span>Přesčasové hodiny</span><small>Hodiny placené nad základní fond.</small>',
        '<label class="field" for="overtimeHours"><span>Přesčasové hodiny</span><small>Zadejte jen hodiny, které skutečně splňují definici práce přesčas. U kratší pracovní doby není každá hodina nad sjednaný úvazek automaticky přesčasem.</small>',
        1
    )
    text = text.replace(
        '<article><span>03</span><div><strong>Přesčasová vrstva</strong><p>Za přesčas přičítáme základní odměnu a samostatný procentní příplatek. Procento lze vztáhnout k zadanému průměrnému výdělku.</p></div></article>',
        '<article><span>03</span><div><strong>Přesčasová vrstva</strong><p>Za skutečnou práci přesčas přičítáme dosaženou mzdu a samostatný příplatek. U kratší pracovní doby není samotné překročení sjednaného kratšího úvazku automaticky přesčasem; příplatek nejméně 25 % se váže k průměrnému výdělku.</p></div></article>',
        1
    )

    if 'Ověřené zdroje 2026' not in text:
        anchor = '<div class="method-limit"><strong>Hranice modelu</strong><p>Kalkulačka neurčuje právní nárok ani správnost výplatní pásky. Přepočet 52 ÷ 12 je praktický dlouhodobý převod hodinové sazby na průměrný měsíc; není to zákonný výpočet průměrného hrubého měsíčního výdělku podle § 356 zákoníku práce, který používá koeficient 4,348. Nástroj dále nezná rozvrh směn, umístění svátků, rozhodné období průměrného výdělku, placené náhrady, kolektivní smlouvu ani to, zda je přesčas zahrnut ve sjednané mzdě.</p></div>'
        extra = anchor + '<div class="method-limit"><strong>Ověřené zdroje 2026</strong><p><a href="https://mpsv.gov.cz/minimalni-mzda" target="_blank" rel="noopener">MPSV · minimální mzda 2026</a> · <a href="https://ppropo.mpsv.cz/zakon_262_2006" target="_blank" rel="noopener">Zákoník práce</a> · <a href="https://ppropo.mpsv.cz/XIX2Mzdanebonahradnivolnozapraci" target="_blank" rel="noopener">MPSV · mzda za práci přesčas</a>. Aktuálně ověřeno 11. 9. 2026.</p></div>'
        text = must_replace(text, anchor, extra, 'method sources')

    if 'class="rv-social-links"' not in text:
        footer_brand = '<div class="shell footer-grid"><div class="footer-brand"><img src="/logo-rv-v32-inverse.svg?v=1" alt="" width="295" height="48" decoding="async"><p>Praktické online kalkulačky pro mzdy, finance, bydlení, podnikání a každodenní rozhodování.</p></div>'
        socials = '<div class="shell footer-grid"><div class="footer-brand"><img src="/logo-rv-v32-inverse.svg?v=1" alt="" width="295" height="48" decoding="async"><p>Praktické online kalkulačky pro mzdy, finance, bydlení, podnikání a každodenní rozhodování.</p><div class="rv-social-links" role="group" aria-label="RychléVýpočty.cz na sociálních sítích"><a href="https://www.facebook.com/rychlevypocty" aria-label="RychléVýpočty.cz na Facebooku" rel="me noopener"><svg aria-hidden="true" viewBox="0 0 24 24"><path fill="currentColor" d="M13.7 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5H17V4.9c-.3 0-1.3-.1-2.4-.1-2.5 0-4.2 1.5-4.2 4.3V11H7.6v3h2.8v8h3.3z"/></svg></a><a href="https://www.instagram.com/rychlevypocty/" aria-label="RychléVýpočty.cz na Instagramu" rel="me noopener"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none"/></svg></a></div></div>'
        text = must_replace(text, footer_brand, socials, 'footer socials')

    text = text.replace('mesicni-mzda-z-hodinove-sazby.js?v=20260728', 'mesicni-mzda-z-hodinove-sazby.js?v=20260911-1', 1)
    HTML.write_text(text, encoding='utf-8')


def patch_js() -> None:
    text = JS.read_text(encoding='utf-8')
    old_set_error = 'function setError(id,message){const el=$(id);if(el)el.textContent=message||""}'
    new_set_error = 'function setError(id,message){const el=$(id);if(el)el.textContent=message||"";const inputId=id.endsWith("Error")?id.slice(0,-5):"";const input=inputId?$(inputId):null;if(input){input.setAttribute("aria-invalid",message?"true":"false");if(message)input.setAttribute("aria-describedby",id);}}'
    text = must_replace(text, old_set_error, new_set_error, 'aria-invalid handling')

    old_run = 'function run(){\n    const {valid,values}=validate();\n    if(!valid)return;\n    render(values,calculate(values));\n  }'
    new_run = '''function renderInvalid(){
    ["heroMonthly","heroWeekly","heroAnnual","heroShift","monthlyTotal","baseMonthly","extraMonthly","annualTotal","effectiveHourly"].forEach(id=>setText(id,"—"));
    setText("heroBasis","opravte označená pole");
    setText("heroNote","Výsledek je dočasně skrytý, aby nezůstala zobrazena stará částka po neplatném zadání.");
    setText("resultStatus","Doplňte vstupy");
    setText("resultFormula","Výsledek se zobrazí po opravě označených polí.");
    setText("interpretationTitle","Výsledek není aktuální.");
    setText("interpretationText","Opravte neplatné nebo neúplné vstupy. Kalkulačka záměrně neponechává předchozí výsledek.");
    setText("minimumHeadline","Čeká na platné vstupy");
    setText("minimumText","Kontrolu minima zobrazíme až po opravě vstupů.");
  }

  function run(){
    const {valid,values}=validate();
    if(!valid){renderInvalid();return;}
    render(values,calculate(values));
  }'''
    text = must_replace(text, old_run, new_run, 'stale result handling')

    JS.write_text(text, encoding='utf-8')


def main() -> None:
    patch_html()
    patch_js()
    print('MESICNI_MZDA_V7_PATCH_OK')


if __name__ == '__main__':
    main()
