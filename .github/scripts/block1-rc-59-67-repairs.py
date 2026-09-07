from pathlib import Path
import re

MARK_START = '/* RV BLOCK1 RC 59-67 QA OVERRIDES 2026-09-07 START */'
MARK_END = '/* RV BLOCK1 RC 59-67 QA OVERRIDES 2026-09-07 END */'

patches = {
'pracovni-dny-vnext.css': r'''
.wd59-modebar #modeAdd>span,.wd59-modebar #modeYear>span{color:#526579}
.wd59-modebar #modeAdd>small,.wd59-modebar #modeYear>small,.wd59-settings summary small,.wd59-privacy,.wd59-metrics article>span,.wd59-reading p,.wd59-interval-legend span{color:#526579}
.wd59-day>span{color:#526579}.wd59-day>small{color:#42596a}
.wd59-section-head .wd59-micro{color:#147347}.wd59-year .wd59-section-head .wd59-micro,.wd59-year .wd59-holiday-ledger .wd59-micro{color:#8ee3b3}
.wd59-holiday-item>span{color:#8ee3b3}.wd59-holiday-item>small{color:#b8cad7}.wd59-holiday-item.is-weekend{opacity:1}
.wd59-method .wd59-section-head>p,.wd59-faq .wd59-section-head>p{color:#526579}
''',
'dny-do-data-vnext.css': r'''
.dd60-start-anchor>span,.dd60-custom summary small,.dd60-privacy,.dd60-week-pack>div:last-child>span,.dd60-calendar-break>span,.dd60-calendar-break>small,.dd60-metrics article>span{color:#526579}
.dd60-section-head .dd60-micro{color:#147347}.dd60-months .dd60-section-head .dd60-micro{color:#8ee3b3}
.dd60-choice-map a.is-current>span{color:#147347}.dd60-choice-map a.is-current>small{color:#526579}
.dd60-method .dd60-section-head>p,.dd60-faq .dd60-section-head>p{color:#526579}
''',
'planovac-dovolene-vnext.css': r'''
.vac61-fields label>small,.vac61-advanced summary small,.vac61-model-grid>div>span,.vac61-strategy>small,.vac61-strategy>em,.vac61-month-card header>span{color:#526579}
.vac61-section-head .vac61-micro{color:#147347}.vac61-section-head>p{color:#526579}
.vac61-weekdays>span{color:#42596a}
.vac61-day{color:#344f66}.vac61-day.is-weekend{color:#526579}.vac61-day.is-past{opacity:1;color:#526579}
''',
'pujcka-vnext.css': r'''
.loan63-input>b,.loan63-details summary>small,.loan63-kpis article>span,.loan63-costbar-labels>span,.loan63-rate-scenarios article.is-current>span{color:#526579}
.loan63-section-head .loan63-micro{color:#147347}.loan63-method .loan63-section-head .loan63-micro{color:#8ee3b3}
.loan63-anatomy .loan63-section-head>p,.loan63-faq .loan63-section-head>p{color:#526579}
.loan63-next-route>div>span{color:#3f6685}
''',
'kalendar-jmen-vnext.css': r'''
.name65-or>span,.name65-privacy,.name65-result-meta article>span,.name65-saved-empty{color:#526579}
.name65-section-head .name65-micro,#moji-lide .name65-micro{color:#147347}
#moji-lide>div.container>div>p,#metodika .name65-section-head>p{color:#526579}
''',
'statni-svatky-vnext.css': r'''
.holiday66-shop-grid label>span>small,.holiday66-form-note,#resultDate,.holiday66-result-facts>div>span,.holiday66-clock-hours>span{color:#526579}
.holiday66-section-head .holiday66-micro{color:#147347}
.holiday66-clock>div.container>div>p,.holiday66-related .holiday66-section-head>p{color:#526579}
''',
'splatkovy-prostor-vnext.css': r'''
.pay67-input>b,.pay67-details summary>small,.pay67-privacy,.pay67-gauge-labels>span,.pay67-result-grid article>span,.pay67-result-grid article>small,.pay67-stress-board article>div>small{color:#526579}
.pay67-section-head .pay67-micro{color:#147347}
.pay67-section-head>p{color:#526579}
.pay67-stress-board article.is-stress>span#stressLabel{color:#8a5510}
.pay67-method-flow article.is-total>div>p{color:#526579}
'''
}

html_versions = {
'pracovni-dny-kalkulacka.html': ('pracovni-dny-vnext.css', '20260907-qa1'),
'kolik-dni-do-data.html': ('dny-do-data-vnext.css', '20260907-qa1'),
'planovac-dovolene.html': ('planovac-dovolene-vnext.css', '20260907-qa1'),
'kalkulacka-pujcky.html': ('pujcka-vnext.css', '20260907-qa1'),
'kalendar-jmen.html': ('kalendar-jmen-vnext.css', '20260907-qa1'),
'statni-svatky-a-otevrene-obchody.html': ('statni-svatky-vnext.css', '20260907-qa1'),
'kolik-muzu-splacet-kalkulacka.html': ('splatkovy-prostor-vnext.css', '20260907-qa1'),
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
