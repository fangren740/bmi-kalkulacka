from pathlib import Path
import re

MARK_START = '/* RV BLOCK1 RC 71-74 QA OVERRIDES 2026-09-07 START */'
MARK_END = '/* RV BLOCK1 RC 71-74 QA OVERRIDES 2026-09-07 END */'

patches = {
'slozeny-urok-vnext.css': r'''
.cmp71-input>b,
.cmp71-advanced summary>small#advancedSummary,
.cmp71-privacy,
.cmp71-result-grid article>span,
.cmp71-result-grid article>small,
.cmp71-result-note>span#resultNoteText,
.cmp71-ladder .cmp71-section-head>p,
.cmp71-ladder-card>em,
.cmp71-goal-field>div>b,
.cmp71-sensitivity .cmp71-section-head>p,
.cmp71-scenario>small,
.cmp71-related .cmp71-section-head>p{color:#526579}
.cmp71-section-head .cmp71-micro{color:#147347}
#benchmark .cmp71-fees-copy .cmp71-micro,
.cmp71-method .cmp71-section-head .cmp71-micro{color:#8ee3b3}
''',
'navratnost-investice-vnext.css': r'''
.roi72-mode>button,
.roi72-form-foot,
.roi72-runway-head>div>span,
.roi72-runway-head .roi72-legend>span,
.roi72-zero-label,
.roi72-runway-insight>div>span,
.roi72-compare-board article.is-featured>p,
.roi72-method-flow article.is-total>div>p,
.roi72-example>div.container>div>p,
.roi72-example-paper>span,
.roi72-example-paper>div>i,
.roi72-mistake-grid article>span,
.roi72-related .roi72-section-head>p{color:#526579}
.roi72-section-head .roi72-micro,
.roi72-example>div.container>div>span.roi72-micro{color:#147347}
''',
'inflace-vnext.css': r'''
.inf73-task button>div>small,
.inf73-task button>span,
.inf73-context>p,
.inf73-mirror article>span,
.inf73-mirror article>div>b,
.inf73-mirror article>small,
.inf73-next>span,
.inf73-corridor-scale>span,
.inf73-data-head>span,
#benchmark .inf73-data-proof>p,
#jak-cist .inf73-section-head>p,
.inf73-example-paper>div>b,
.inf73-mistake-grid article>span{color:#526579}
.inf73-section-head .inf73-micro{color:#147347}
''',
'cista-mzda-vnext.css': r'''
.salary74-mode>button,
.salary74-form-foot,
.salary74-cost-line>small,
.salary74-flow article>span,
.salary74-flow article>small,
.salary74-data-head>span,
.salary74-data-rows article>span,
.salary74-data-rows article>small,
.salary74-example>div.container>div>p,
.salary74-example-slip>span,
.salary74-mistake-grid article>span{color:#526579}
.salary74-data-proof>span,
.salary74-section-head .salary74-micro,
.salary74-example>div.container>div>span.salary74-micro{color:#147347}
'''
}

html_versions = {
'kalkulacka-slozeneho-uroku.html': ('slozeny-urok-vnext.css', '20260907-qa1'),
'navratnost-investice-kalkulacka.html': ('navratnost-investice-vnext.css', '20260907-qa1'),
'inflace-kalkulacka.html': ('inflace-vnext.css', '20260907-qa1'),
'cista-mzda-kalkulacka.html': ('cista-mzda-vnext.css', '20260907-qa1'),
}

for name, css in patches.items():
    p = Path(name)
    text = p.read_text(encoding='utf-8')
    text = re.sub(re.escape(MARK_START) + r'.*?' + re.escape(MARK_END) + r'\s*', '', text, flags=re.S)
    text = text.rstrip() + '\n\n' + MARK_START + '\n' + css.strip() + '\n' + MARK_END + '\n'
    p.write_text(text, encoding='utf-8')

for name, (asset, version) in html_versions.items():
    p = Path(name)
    text = p.read_text(encoding='utf-8')
    pat = re.compile(r'(/' + re.escape(asset) + r')\?v=[^"\']+')
    text2, count = pat.subn(r'\1?v=' + version, text, count=1)
    if count != 1:
        raise SystemExit(f'Expected one cachebuster for {asset} in {name}, got {count}')
    p.write_text(text2, encoding='utf-8')
