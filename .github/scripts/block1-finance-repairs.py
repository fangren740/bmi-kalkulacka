from pathlib import Path
import re

START = "/* RV BLOCK1 FINANCE QA OVERRIDES 2026-09-07 START */"
END = "/* RV BLOCK1 FINANCE QA OVERRIDES 2026-09-07 END */"
VERSION = "20260907-qa1"

blocks = {
    "housing-check-vnext.css": r'''
.hc-field label small,.hc-field .hc-input>span,.hc-advanced summary>span,.hc-form-note,.hc-payment>span,.hc-payment>small,.hc-gates article div>p,.hc-result-metrics>div>span,.hc-result-note>p,.hc-data-public>div>small,.hc-data-public>div>p,.hc-scenario-rail>article>p,.hc-explain-steps>article>div>p,.hc-formulas>article>span,.hc-related-head>p,.hc-related-grid>a>span,.hc-related-grid>a>small{color:#526579!important}
.hc-section-kicker{color:#964510!important}
.hc-gate-no{color:#8a3c1d!important}
''',
    "property-ceiling-vnext.css": r'''
.pc-row>span>small,.pc-row .pc-input>em,.pc-advanced summary small,.pc-form-note,.pc-result-payment>span,.pc-result-payment>small,.pc-limit-card>span,.pc-limit-card>p,.pc-result-ledger>div>span,.pc-result-note>p,.pc-stress-mini>div>span,.pc-stress-mini>p,.pc-market-card div>small,.pc-market-card>p,.pc-rule-grid>article>span,.pc-rule-grid>article>p,.pc-formulas>article>span,.pc-example-grid>article>span,.pc-example-grid>article>p,.pc-guide .pc-section-head>p,.pc-guide-grid>article>p,.pc-related-head>p,.pc-related-grid>a>span,.pc-related-grid>a>small{color:#526579!important}
.pc-section-kicker{color:#964510!important}
''',
    "own-funds-vnext.css": r'''
.of-stack-head>span,.of-stack-key>span,.of-stack-foot>div>span,.of-row>span>small,.of-row .of-input>em,.of-advanced summary small,.of-form-note,.of-result-top>div>p,.of-result-gap>span,.of-result-gap>small,.of-ledger>div>span,.of-ledger>div>small,.of-funding-line>span,.of-funding-line>small strong,.of-funding-line>small span,.of-result-note>p,.of-rule-card div>small,.of-rule-card>p,.of-formulas>article>span,.of-scenario-grid>article>p,.of-related-head>p,.of-related-grid>a>span,.of-related-grid>a>small{color:#526579!important}
.of-section-kicker{color:#964510!important}
''',
    "property-total-vnext.css": r'''
.pt-section-kicker{color:#964510!important}
.pt-timeline-grid>article>p{color:#526579!important}
''',
    "housing-monthly-vnext.css": r'''
.hm-section-head>p,.hm-form-cap>strong,.hm-mode-switch>button.is-active>small,.hm-row>span>small,.hm-row .hm-input>em,.hm-form-note,.hm-calculator-disclaimer>p,.hm-scope-warning>p,.hm-formula>article>span,.hm-related-head>p,.hm-related-grid>a>small{color:#526579!important}
.hm-section-kicker{color:#964510!important}
#metodika .hm-section-kicker,#metodika .hm-section-head>p,#metodika .hm-section-head p,#metodika .hm-shell>div>p,#metodika .hm-shell>div>p>strong{color:#526579!important}
''',
    "rent-buy-vnext.css": r'''
.rvm-form-brand>span,.rvm-mode>button>small,.rvm-field>small,.rvm-field .rvm-input>b,.rvm-horizon .rvm-input>b,.rvm-result-head p,.rvm-result-note>p,.rvm-flow>article>span,.rvm-flow>article>p,#metodika .rvm-section-head>p,#metodika .rvm-section-head p,.rvm-formulas>div>span,.rvm-related-head>p,.rvm-related-grid>a>span,.rvm-related-grid>a>small{color:#526579!important}
.rvm-kicker{color:#964510!important}
.rvm-related-head>div>span{color:#0f603b!important}
.rvm-footer-grid>div>a{display:flex;align-items:center;min-height:30px;margin-block:3px}
''',
    "fixace-hypoteky-vnext-v2.css": r'''
.fix2-proof-top>span,.fix2-strip .container>div>small,.fix2-common .input-unit>b,.fix2-common label>small,.fix2-offer legend small,.fix2-field-grid .input-unit>b,.fix2-offer>p,.fix2-ruler-head>span,.fix2-scale-labels>span,.fix2-example .container>div>p,.fix2-paper>div>small,.fix2-related-grid>a>span,.fix2-disclaimer .container>p{color:#526579!important}
.fix2-path-label>span,.fix2-section-head .rv-micro-label,#souvisejici-kalkulacky .rv-micro-label{color:#0f603b!important}
.container>ol>li>b{color:#12639a!important}
''',
    "refinancovani-hypoteky-vnext.css": r'''
.refi2-field>small,#metodika .refi2-section-head>p,.refi2-disclaimer .container>p{color:#526579!important}
.refi2-micro,.refi2-check-card>b{color:#0f603b!important}
''',
    "mimoradna-splatka-hypoteky-vnext-v3.css": r'''
#formModeText,.dc-underbench>article>span,.dc-path-divider>span,table thead th,#metodika .dc-section-head>p{color:#526579!important}
.dc-micro,.dc-check-grid>article>span{color:#0f603b!important}
''',
}

html_assets = {
    "muzu-si-dovolit-bydleni.html": "housing-check-vnext.css",
    "muzu-si-dovolit-nemovitost-kalkulacka.html": "property-ceiling-vnext.css",
    "kalkulacka-vlastnich-zdroju-na-koupi-nemovitosti.html": "own-funds-vnext.css",
    "kalkulacka-celkove-ceny-nemovitosti.html": "property-total-vnext.css",
    "mesicni-naklady-na-bydleni-kalkulacka.html": "housing-monthly-vnext.css",
    "porovnani-najem-vs-hypoteka-kalkulacka.html": "rent-buy-vnext.css",
    "porovnani-fixace-hypoteky-kalkulacka.html": "fixace-hypoteky-vnext-v2.css",
    "refinancovani-hypoteky-kalkulacka.html": "refinancovani-hypoteky-vnext.css",
    "mimoradna-splatka-hypoteky-kalkulacka.html": "mimoradna-splatka-hypoteky-vnext-v3.css",
}

for css_name, rules in blocks.items():
    path = Path(css_name)
    text = path.read_text(encoding="utf-8")
    text = re.sub(re.escape(START) + r".*?" + re.escape(END), "", text, flags=re.S).rstrip()
    path.write_text(text + "\n\n" + START + "\n" + rules.strip() + "\n" + END + "\n", encoding="utf-8")

for html_name, asset in html_assets.items():
    path = Path(html_name)
    text = path.read_text(encoding="utf-8")
    pattern = rf"(/{re.escape(asset)}\?v=)[^\"']+"
    text2, count = re.subn(pattern, rf"\g<1>{VERSION}", text, count=1)
    if count != 1:
        raise RuntimeError(f"Expected one stylesheet cache-buster for {html_name} -> {asset}, got {count}")
    path.write_text(text2, encoding="utf-8")

print(f"Patched {len(blocks)} finance CSS files and {len(html_assets)} HTML cache-busters.")
