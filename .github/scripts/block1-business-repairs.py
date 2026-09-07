from pathlib import Path
import re

MARK_START = "/* RV BLOCK1 BUSINESS QA OVERRIDES 2026-09-07 START */"
MARK_END = "/* RV BLOCK1 BUSINESS QA OVERRIDES 2026-09-07 END */"
VERSION = "20260907-qa1"

blocks = {
    "pausalni-vydaje-vnext.css": r'''
.pv-form-block>label small,.pv-advanced summary span,.pv-form-note,.pv-saving span,.pv-saving small,.pv-method-title small,.pv-method-card dt,.pv-break-copy p,.pv-break-legend,.pv-result-note p,.pv-data-grid article span,.pv-cap-grid p,.pv-cap-source p,.pv-context-flow p,.pv-example-grid p,.pv-related p{color:#526579}
.pv-section-kicker,.pv-break-copy>span,.pv-context-flow article:not(.is-result)>span,.pv-example-grid>article>span,.pv-related span{color:#964510}
.pv-context-flow article.is-result>span{color:#147347}
''',
    "pausalni-dan-vnext.css": r'''
.pd-field label small,.pd-advanced summary small,.pd-form-note,.pd-result-head p,.pd-delta span,.pd-delta small,.pd-money-compare article>div,.pd-money-compare article>small,.pd-runway-grid article small,.pd-result-next p,.pd-section-head>p,.pd-adoption>p,.pd-adoption>small,.pd-model>p,.pd-model>small,.pd-model-cases span,.pd-timeline span,.pd-timeline small{color:#526579}
.pd-section-kicker,.pd-data-label span,.pd-example-grid span{color:#964510}
.pd-method-grid article>span{color:#1769aa}
.pd-method-grid a{display:inline-flex;align-items:center;min-height:30px;padding-block:2px}
''',
    "zamestnanec-vs-osvc-vnext.css": r'''
.cvo-field label small,.cvo-input span,.cvo-private,.cvo-budget-chip span,.cvo-budget-chip small,.cvo-compare article>span,.cvo-compare article>small,.cvo-compare dt,.cvo-delta small,.cvo-advanced-result span,.cvo-matrix th,.cvo-benchmark-foot span,.scenario-card span,.scenario-card small,.cvo-table-wrap th,.cvo-section-head>p,.cvo-related-links span{color:#526579}
.cvo-section-kicker,.cvo-method-grid article>span{color:#964510}
.cvo-example-grid span{color:#147347}
.cvo-parity-box>div:first-child span,.cvo-parity-box>div:first-child small{color:#c7dce8}
.cvo-parity-box>div:last-child span,.cvo-parity-box>div:last-child small{color:#526b62}
.cvo-waterfall .cvo-section-kicker{color:#8de2b3}
.cvo-related .cvo-section-kicker{color:#147347}
''',
    "osvc-vs-sro-vnext.css": r'''
.ovs-field label small,.ovs-input span,.ovs-advanced summary span,.ovs-privacy,.ovs-decision-head p,.ovs-break p,.ovs-node span,.ovs-section-head>p,.ovs-benchmark-meta p,.ovs-heatmap-card header>p,.ovs-heat-corner,.ovs-heat-corner span,.ovs-heat-legend,.ovs-heat-legend span,.ovs-data-caveat,.ovs-reason p,.ovs-detail .ovs-section-head>p,.ovs-method-grid p,.ovs-example-grid p,.ovs-related-links span{color:#526579}
.ovs-section-kicker,.ovs-method-grid article>span{color:#964510}
.ovs-flow .ovs-section-kicker{color:#7ee0a6}
.ovs-related .ovs-section-kicker{color:#147347}
''',
    "podnikatelska-rezerva-vnext.css": r'''
.br-runway-scale span,.br-runway-foot span,.br-mode small,.br-presets>span,.br-step legend small,.field>small,.br-input b,.br-form-note,.br-result-head p,.br-result-line-label span,.br-result-line>p,.br-metric-grid span,.br-metric-grid small,.br-decision p,.br-actions-grid p,.br-benchmark .br-section-head>p,.br-benchmark-summary span,.br-benchmark-summary p,.br-matrix th,.br-benchmark-note p,.br-benchmark-note em,.br-anatomy-stack article p,.br-anatomy-stack article b,.br-anatomy-stack article>span,.br-playbook .br-section-head>p,.br-timeline article p,.br-related-links a>span{color:#526579}
.br-section-kicker,.br-result-label,.br-method-card>span{color:#964510}
.br-scenarios .br-section-kicker{color:#7be0ae}
.scenario-card:not(.is-current) dt{color:#c7dce8}
.scenario-card.is-current dt{color:#526579}
.br-related .br-section-kicker{color:#147347}
.br-footer-grid>div>a{display:flex;align-items:center;min-height:30px;margin-block:3px}
''',
    "obrat-pro-cilovy-zisk-vnext.css": r'''
.tp-mode small,.tp-presets>span,.tp-step legend small,.tp-choice small,.field>small,.tp-note,.tp-answer span,.tp-answer small,.tp-waterfall-card span,.tp-revenue-ladder-head,.tp-revenue-labels,.tp-metric-grid span,.tp-why p,.tp-next small,.tp-trustline,.tp-plan-copy>p,.tp-plan-cards p,.tp-formula-row small,.tp-boundary li,.tp-related-links a>span{color:#526579}
.tp-section-kicker,.tp-waterfall>span,.tp-boundary>span,.tp-next div span{color:#964510}
.tp-levers .tp-section-kicker{color:#7ce0aa}
.tp-related .tp-section-kicker{color:#147347}
.tp-footer-grid>div>a{display:flex;align-items:center;min-height:30px;margin-block:3px}
''',
    "min-price-vnext.css": r'''
.mp-calculator-head p,.mp-input-head p,.price-input b,.price-fields label>small,.price-optional summary small,.price-privacy,.mp-ladder em small,.mp-customer-prices span,.price-verdict>span,.price-section-title>p,.mp-section-head>p,.mp-three-levels article p,.mp-scenario-grid article p,.mp-scenario-grid article li,.mp-review-ledger article small,.mp-review-ledger article section p,.mp-review-note>span,.mp-stress-tests article p,.mp-stress-tests article dt,.mp-stress-conclusion p,.mp-benchmark-matrix .mp-matrix-label,tbody th small,tbody td small,.mp-benchmark-note p,.mp-benchmark-source,.mp-decision-grid article p,.mp-formulas span,.mp-disclaimer,.mp-boundary-grid article p{color:#526579}
.mp-eyebrow,.price-kicker{color:#964510}
.mp-result-primary>span{color:#c7dce8}
.mp-result-primary p{color:#d5e5ed}
.mp-ladder em small{color:#526579}
.rv-brand-method>a,.footer-grid>div>a{display:flex;align-items:center;min-height:30px;margin-block:3px}
''',
    "discount-vnext.css": r'''
.ds-mode button:not(.is-active) small,.ds-input-head p,.ds-form-note,.ds-result-primary span,.ds-result-primary small,.ds-receipt-head,.ds-receipt-lines span,.ds-discount-rail-head,.ds-section-head>p,.ds-benchmark-finding p,.ds-matrix-corner strong,.ds-matrix-corner small,.ds-matrix-rowhead small,.ds-matrix-cell small,.ds-formula-list span{color:#526579}
.ds-mode button.is-active small{color:#d9e6ed;opacity:1}
.ds-eyebrow{color:#964510}
.ds-benchmark-finding>span{color:#147347}
.footer-grid>div>a{display:flex;align-items:center;min-height:30px;margin-block:3px}
''',
    "price-change-vnext.css": r'''
.pc-mirror-head span,.pc-mirror-head b,.pc-ticket span,.pc-ticket small,.pc-depth button:not(.is-active) span,.pc-panel label>small,.pc-input b,.pc-privacy,.pc-primary span,.pc-primary small,.pc-price-bridge span,.pc-price-bridge small,.pc-result-grid span,.pc-result-grid small,.pc-section-head>p,.pc-ladder-card span,.pc-ladder-card small,.pc-benchmark-finding p,.pc-method .pc-section-head>p,.pc-formula-row span{color:#526579}
.pc-depth button.is-active span{color:#526579}
.pc-return-card span{color:#c7dce8}
.pc-return-card p{color:#d6e5ed}
.pc-demo-step:not(.middle) span{color:#c4d9e4}
.pc-demo-step.middle span{color:#526579}
.pc-kicker{color:#964510}
.pc-benchmark-finding>span{color:#147347}
.footer-grid>div>a{display:flex;align-items:center;min-height:30px;margin-block:3px}
''',
    "commission-vnext.css": r'''
.cm-ladder-head span,.cm-ladder-head b,.cm-step span,.cm-step small,.cm-task button:not(.is-active) span,.cm-field label>small,.cm-advanced summary>span small,.cm-form-note,.cm-result-head p,.cm-effective span,.cm-effective small,.cm-breakdown span,.cm-breakdown small,.cm-metrics span,.cm-explain p,.cm-section-head>p,.cm-anatomy-grid p,.cm-method-grid span,.cm-method-grid p,.related-intro>p,.related-card small{color:#526579}
.cm-task button.is-active span{color:#a9e5c4}
.cm-benchmark-grid article:not(.is-focus) span,.cm-benchmark-grid article:not(.is-focus) small{color:#c7dce8}
.cm-benchmark-grid article.is-focus span,.cm-benchmark-grid article.is-focus small{color:#526579}
.cm-benchmark-finding span{color:#8ee5b4}
.cm-benchmark-finding p{color:#d4e4ec}
.cm-kicker{color:#964510}
.cm-benchmark .cm-kicker{color:#83e2ac}
.related-intro .cm-kicker{color:#147347}
''',
}

html_assets = {
    "pausalni-vydaje-kalkulacka.html": "pausalni-vydaje-vnext.css",
    "pausalni-dan-kalkulacka.html": "pausalni-dan-vnext.css",
    "zamestnanec-vs-osvc-kalkulacka.html": "zamestnanec-vs-osvc-vnext.css",
    "osvc-vs-sro-kalkulacka.html": "osvc-vs-sro-vnext.css",
    "kalkulacka-potrebne-rezervy-podnikani.html": "podnikatelska-rezerva-vnext.css",
    "obrat-pro-cilovy-zisk-kalkulacka.html": "obrat-pro-cilovy-zisk-vnext.css",
    "minimalni-prodejni-cena-kalkulacka.html": "min-price-vnext.css",
    "kalkulacka-slevy.html": "discount-vnext.css",
    "zdrazeni-a-zlevneni-kalkulacka.html": "price-change-vnext.css",
    "kalkulacka-provize.html": "commission-vnext.css",
}

for css_name, rules in blocks.items():
    path = Path(css_name)
    text = path.read_text(encoding="utf-8")
    text = re.sub(re.escape(MARK_START) + r".*?" + re.escape(MARK_END), "", text, flags=re.S).rstrip()
    path.write_text(text + "\n\n" + MARK_START + rules.strip() + "\n" + MARK_END + "\n", encoding="utf-8")

for html_name, asset in html_assets.items():
    path = Path(html_name)
    text = path.read_text(encoding="utf-8")
    pattern = rf"(/{re.escape(asset)}\?v=)[^\"']+"
    text2, count = re.subn(pattern, rf"\g<1>{VERSION}", text, count=1)
    if count != 1:
        raise RuntimeError(f"Expected one stylesheet cache-buster for {html_name} -> {asset}, got {count}")
    path.write_text(text2, encoding="utf-8")

print(f"Patched {len(blocks)} CSS files and {len(html_assets)} HTML cache-busters.")
