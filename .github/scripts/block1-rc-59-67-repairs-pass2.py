from pathlib import Path
import re

MARK_START = '/* RV BLOCK1 RC 59-67 QA PASS2 2026-09-07 START */'
MARK_END = '/* RV BLOCK1 RC 59-67 QA PASS2 2026-09-07 END */'

patches = {
    'kalendar-jmen-vnext.css': r'''
.name65-radar .name65-section-head .name65-micro{color:#8ee3b3}
''',
    'statni-svatky-vnext.css': r'''
.holiday66-runway .holiday66-section-head .holiday66-micro,
.holiday66-method .holiday66-section-head .holiday66-micro{color:#8ee3b3}
''',
    'splatkovy-prostor-vnext.css': r'''
.pay67-runway .pay67-section-head .pay67-micro{color:#8ee3b3}
.pay67-advanced summary>small{color:#526579}
''',
}

for name, css in patches.items():
    p = Path(name)
    text = p.read_text(encoding='utf-8')
    text = re.sub(re.escape(MARK_START) + r'.*?' + re.escape(MARK_END) + r'\s*', '', text, flags=re.S)
    text = text.rstrip() + '\n\n' + MARK_START + '\n' + css.strip() + '\n' + MARK_END + '\n'
    p.write_text(text, encoding='utf-8')
