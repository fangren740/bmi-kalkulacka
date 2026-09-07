from pathlib import Path
import re

START = "/* RV BLOCK1 FINANCE QA PASS2 2026-09-07 START */"
END = "/* RV BLOCK1 FINANCE QA PASS2 2026-09-07 END */"

blocks = {
    "housing-check-vnext.css": r'''
#benchmark .hc-section-kicker,.hc-section-head--dark .hc-section-kicker{color:#f0c38a!important}
''',
    "property-ceiling-vnext.css": r'''
#benchmark .pc-section-kicker,.pc-section-head-dark .pc-section-kicker{color:#f0c38a!important}
''',
    "own-funds-vnext.css": r'''
#benchmark .of-section-kicker{color:#f0c38a!important}
''',
    "rent-buy-vnext.css": r'''
.rvm-mode>button.is-active>small,.rvm-mode>button:not(.is-active)>small{color:#526579!important;opacity:1!important}
#metodika>.rvm-shell>div>p{color:#526579!important}
''',
    "fixace-hypoteky-vnext-v2.css": r'''
.fix2-data .rv-micro-label{color:#8ee3b3!important}
''',
}

for name, rules in blocks.items():
    path = Path(name)
    text = path.read_text(encoding="utf-8")
    text = re.sub(re.escape(START) + r".*?" + re.escape(END), "", text, flags=re.S).rstrip()
    path.write_text(text + "\n\n" + START + "\n" + rules.strip() + "\n" + END + "\n", encoding="utf-8")

print(f"Applied finance pass-2 overrides to {len(blocks)} CSS files.")
