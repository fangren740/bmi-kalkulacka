from pathlib import Path
import re

START = "/* RV BLOCK1 RC 49-58 QA PASS3 2026-09-07 START */"
END = "/* RV BLOCK1 RC 49-58 QA PASS3 2026-09-07 END */"

path = Path("trip-split-vnext.css")
text = path.read_text(encoding="utf-8")
text = re.sub(re.escape(START) + r".*?" + re.escape(END), "", text, flags=re.S).rstrip()
rules = r'''
.trip55-receipt-stack>article>span{color:#8a514a!important}
.trip55-receipt-stack>article.is-shared>span{color:#147347!important}
'''
path.write_text(text + "\n\n" + START + "\n" + rules.strip() + "\n" + END + "\n", encoding="utf-8")
print("Applied final mobile receipt-label contrast repair for sequence 55.")
