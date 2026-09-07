from pathlib import Path
import re

START = "/* RV BLOCK1 BUSINESS QA PASS2 2026-09-07 START */"
END = "/* RV BLOCK1 BUSINESS QA PASS2 2026-09-07 END */"

blocks = {
    "osvc-vs-sro-vnext.css": r'''
.ovs-heatmap-card>header>div>p.ovs-section-kicker{color:#526579}
''',
    "podnikatelska-rezerva-vnext.css": r'''
.br-mode>div:first-child small{color:#526579}
.br-decision span{color:#147347}
.br-matrix>thead>tr>th{color:#526579}
.br-anatomy-stack>article>span{color:#147347}
''',
    "min-price-vnext.css": r'''
section.container>ol>li>span{color:#964510}
section.container>ol>li>div>p{color:#526579}
.mp-review-ledger>article>div>small{color:#526579}
.mp-section-head>div>p.mp-eyebrow{color:#526579}
article>header>div>small{color:#526579}
#priklad>.container>p.mp-eyebrow,#priklad>.container>p{color:#526579}
#benchmark .mp-section-head>div>p.mp-eyebrow{color:#526579}
.mp-benchmark-matrix tbody th small,.mp-benchmark-matrix tbody td small{color:#42596a}
#metodika .mp-section-head>div>p.mp-eyebrow,#metodika .mp-section-head>p,#metodika .mp-disclaimer{color:#526579}
''',
    "discount-vnext.css": r'''
.ds-calculator-head .ds-mode button:not(.is-active)>small{color:#526579;opacity:1}
.ds-matrix-wrap .ds-matrix .ds-matrix-rowhead>small{color:#526579}
.ds-matrix-wrap .ds-matrix .ds-cell>small{color:#42596a}
''',
    "price-change-vnext.css": r'''
.pc-mirror-section .pc-kicker{color:#8ee3b3}
#metodika .pc-kicker,#metodika .pc-section-head>p,#metodika .pc-formulas>div>span{color:#526579}
''',
}

for name, rules in blocks.items():
    path = Path(name)
    text = path.read_text(encoding="utf-8")
    text = re.sub(re.escape(START) + r".*?" + re.escape(END), "", text, flags=re.S).rstrip()
    path.write_text(text + "\n\n" + START + "\n" + rules.strip() + "\n" + END + "\n", encoding="utf-8")

print(f"Applied pass-2 overrides to {len(blocks)} CSS files.")
