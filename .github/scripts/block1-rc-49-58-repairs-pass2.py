from pathlib import Path
import re

START = "/* RV BLOCK1 RC 49-58 QA PASS2 2026-09-07 START */"
END = "/* RV BLOCK1 RC 49-58 QA PASS2 2026-09-07 END */"

blocks = {
    "kalkulacka-splatky-auta-vnext-v5.css": r'''
#trailCaption{color:#526579!important}
''',
    "prodej-nemovitosti-vnext.css": r'''
.sale54-flow .sale54-micro,#metodika .sale54-micro{color:#8ee3b3!important}
''',
    "trip-split-vnext.css": r'''
.trip55-mode-switch>button.is-active>span{color:#8ee3b3!important}
''',
    "bmi-vnext.css": r'''
#klasifikace .bmi57-micro{color:#8ee3b3!important}
''',
}

for name, rules in blocks.items():
    path = Path(name)
    text = path.read_text(encoding="utf-8")
    text = re.sub(re.escape(START) + r".*?" + re.escape(END), "", text, flags=re.S).rstrip()
    path.write_text(text + "\n\n" + START + "\n" + rules.strip() + "\n" + END + "\n", encoding="utf-8")

print(f"Applied RC 49-58 pass-2 overrides to {len(blocks)} CSS files.")
