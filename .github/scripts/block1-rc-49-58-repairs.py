from pathlib import Path
import re

START = "/* RV BLOCK1 RC 49-58 QA OVERRIDES 2026-09-07 START */"
END = "/* RV BLOCK1 RC 49-58 QA OVERRIDES 2026-09-07 END */"
VERSION = "20260907-qa1"

blocks = {
    "investovat-vs-splatit-hypoteku-vnext-v5.css": r'''
.hurdle-micro,#basicTab>b,#proTab>b,.hurdle-formula-paper>span{color:#0f603b!important}
#hurdleForm .hurdle-fields label>small,.hurdle-form-actions>span{color:#526579!important}
''',
    "leasing-kalkulacka-vnext-v4.css": r'''
.ls-micro,.ls-audit-card>span,.ls-sources>a>span{color:#0f603b!important}
.ls-fields .ls-field>small,.ls-calc-grid>.ls-panel>div,.ls-audit-list li>div>small,.ls-sources>a>small{color:#526579!important}
''',
    "kalkulacka-splatky-auta-vnext-v5.css": r'''
.afc-micro,.afc-audit-ledger>div>b{color:#0f603b!important}
.afc-field .afc-input>b,.afc-field>small,.afc-pro>summary>i,#benchmark .afc-section-head>p,.afc-bench-spotlights>article>span,.afc-bench-reading>div>p,.afc-formula>span,.afc-method-notes>div>p{color:#526579!important}
''',
    "pohony-auta-vnext.css": r'''
.ptx-field .ptx-input>b,.ptx-share>small,.ptx-result-delta>span,.ptx-result-delta>small,.ptx-mixer-copy>p,.ptx-mixer-scale>span,.ptx-mixer-numbers>div>small,.ptx-mixer-visual>p,#ownershipDetails summary span>small,.ptx-road-axis>span,.ptx-decision-lead>p,.ptx-check .ptx-section-head>p,.ptx-check-grid>article>p,.ptx-related .ptx-section-head>p,.ptx-related-grid>a>small{color:#526579!important}
#bod-zlomu .ptx-micro{color:#8ee3b3!important}
.ptx-decision>div.container>article>span{color:#12639a!important}
''',
    "ev-nabijeni-vnext.css": r'''
.evx-live-row>div>span,.evx-field .evx-input>b,.evx-profiles label span>small,#advanced summary span>small,.evx-bottleneck-title>span,.evx-pipe>div>span,#srovnani .evx-compare-copy>p,.evx-related-grid>a>small{color:#526579!important}
.evx-block-head>span,.evx-pipe>div.is-result>strong,.evx-why-grid>article>span,.evx-check-grid>article>b,.evx-related-grid>a>span{color:#0f603b!important}
''',
    "prodej-nemovitosti-vnext.css": r'''
.sale54-statement-top>span,.sale54-statement-id>span,#heroNote,.sale54-live-row>div>span,.sale54-block-head>div>small,.sale54-field>small,.sale54-commission-mode label span>small,.sale54-mode-row>div>span,.sale54-mode-switch>button,.sale54-form-actions>span,#sensitivityNote,.sale54-formula-card>div>small,.sale54-check-grid>article>p,#faq .sale54-section-head>p,.sale54-related-grid>a>small{color:#526579!important}
.sale54-net-stamp>span{color:#0f603b!important}
.sale54-micro{color:#12639a!important}
''',
    "trip-split-vnext.css": r'''
.trip55-micro,#resultMode,.trip55-method-note>div>span,.trip55-related-grid>a>span{color:#0f603b!important}
.trip55-mode-switch button>small,.trip55-mode-switch button>span,.trip55-field .trip55-input>b,.trip55-fuel-helper summary span>small,.trip55-driver-rule label span>small,.trip55-result-total>span,.trip55-share>span,.trip55-share>small,.trip55-ledger-copy>p,.trip55-receipt-stack article.is-shared>small,.trip55-fairness-track>article>em,.trip55-related .trip55-section-head>p{color:#526579!important}
.trip55-fairness-track>article>span{background:#147347!important;color:#fff!important}
''',
    "kalorie-vnext.css": r'''
.kcal56-micro,.kcal56-anatomy-board>article.is-total>span{color:#0f603b!important}
.kcal56-calibrate .kcal56-micro,#metodika .kcal56-micro{color:#8ee3b3!important}
.kcal56-choice-row label span>small,.kcal56-field .kcal56-input>b,#aktivita .kcal56-pal-rule>span,.kcal56-anatomy .kcal56-section-head>p,.kcal56-example .kcal56-section-head>p,.kcal56-related .kcal56-section-head>p{color:#526579!important}
''',
    "bmi-vnext.css": r'''
.bmi57-micro{color:#0f603b!important}
.bmi57-field .bmi57-input>b,#heightHelp,#weightHelp,.bmi57-privacy,.bmi57-result-scale-head>span,.bmi57-result-facts>article>span,.bmi57-result-trust>span,.bmi57-waist-copy>.bmi57-note,.bmi57-ruler-head>span,.bmi57-ruler-labels>div>span,#pas .bmi57-ruler>p,.bmi57-source-list>a>span{color:#526579!important}
''',
    "vek-vnext.css": r'''
.age58-micro{color:#0f603b!important}
#milniky .age58-micro{color:#8ee3b3!important}
#advanced>summary>small,.age58-privacy,#metodika .age58-section-head>p,.age58-faq .age58-section-head>p{color:#526579!important}
''',
}

html_assets = {
    "investovat-vs-splatit-hypoteku-kalkulacka.html": "investovat-vs-splatit-hypoteku-vnext-v5.css",
    "leasing-kalkulacka.html": "leasing-kalkulacka-vnext-v4.css",
    "kalkulacka-splatky-auta.html": "kalkulacka-splatky-auta-vnext-v5.css",
    "benzin-vs-diesel-vs-elektro-kalkulacka.html": "pohony-auta-vnext.css",
    "nabijeni-elektromobilu-kalkulacka.html": "ev-nabijeni-vnext.css",
    "naklady-na-prodej-nemovitosti-kalkulacka.html": "prodej-nemovitosti-vnext.css",
    "kalkulacka-rozdeleni-nakladu-na-cestu.html": "trip-split-vnext.css",
    "kaloricka-kalkulacka.html": "kalorie-vnext.css",
    "bmi-kalkulacka.html": "bmi-vnext.css",
    "vypocet-veku.html": "vek-vnext.css",
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

print(f"Patched {len(blocks)} RC CSS files and {len(html_assets)} HTML cache-busters.")
