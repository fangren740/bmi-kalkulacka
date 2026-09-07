from pathlib import Path
import re

START = "/* RV BLOCK1 BUSINESS QA PASS3 2026-09-07 START */"
END = "/* RV BLOCK1 BUSINESS QA PASS3 2026-09-07 END */"

blocks = {
    "podnikatelska-rezerva-vnext.css": r'''
.br-anatomy-stack>article>span{color:#0f603b!important}
''',
    "min-price-vnext.css": r'''
#cenovy-stres-test article>header>div>small{color:#526579!important}
#priklad>div>p.mp-eyebrow,#priklad>div>p{color:#526579!important}
#metodika>div.container>div>p.mp-eyebrow,#metodika>div.container>div>p{color:#526579!important}
#metodika>div.container>p.mp-disclaimer{color:#526579!important}
''',
    "discount-vnext.css": r'''
.ds-matrix-wrap .ds-matrix .ds-cell.risk-inf>small{color:#d7e6ef!important}
''',
    "price-change-vnext.css": r'''
#metodika>div.container>div>p{color:#526579!important}
''',
}

for name, rules in blocks.items():
    path = Path(name)
    text = path.read_text(encoding="utf-8")
    text = re.sub(re.escape(START) + r".*?" + re.escape(END), "", text, flags=re.S).rstrip()
    path.write_text(text + "\n\n" + START + "\n" + rules.strip() + "\n" + END + "\n", encoding="utf-8")

print(f"Applied pass-3 overrides to {len(blocks)} CSS files.")
