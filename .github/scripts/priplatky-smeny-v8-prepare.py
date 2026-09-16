#!/usr/bin/env python3
"""One-time guarded source patch. Only used on V8 review branch; never deployed."""
from pathlib import Path
import subprocess

js = Path('priplatky-smeny.js')
html = Path('kalkulacka-priplatku-za-smeny.html')
expected = {
    str(js): '57fdbf982a12d3c5fa304aaecab3a2a3737b328a',
    str(html): 'fb80936bfc7081948b2f2517528642076f06e0e8',
}
for path, sha in expected.items():
    actual = subprocess.check_output(['git', 'hash-object', path], text=True).strip()
    if actual != sha:
        raise SystemExit(f'ABORT: {path} moved: {actual} != {sha}')


def replace_once(text, old, new, name):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'ABORT: expected exactly one {name}, got {count}')
    return text.replace(old, new, 1)


s = js.read_text(encoding='utf-8')
s = replace_once(
    s,
    "if (breakStart >= end || breakEnd <= start) return { error:'Zadaná přestávka neleží uvnitř směny.' };",
    "if (breakStart < start || breakEnd > end) return { error:'Neplacená přestávka musí celá ležet uvnitř směny.' };",
    'entire break inside shift',
)
s = replace_once(
    s,
    "if(!shift || shift.error){ ['workTrack','nightTrack','weekendTrack','holidayTrack'].forEach(id=>$(id)?.replaceChildren()); return; }",
    "if(!shift || shift.error){\n      ['workTrack','nightTrack','weekendTrack','holidayTrack'].forEach(id=>$(id)?.replaceChildren());\n      ['timelineStart','timelineEnd','timelineRange','autoWorked','autoNight','autoWeekend','autoHoliday'].forEach(id=>setText(id,'—'));\n      return;\n    }",
    'stale timeline',
)
s = replace_once(
    s,
    '  function calculate() {',
    '''  function clearInvalidResults() {
    // Validation errors must not leave plausible amounts in the result, hero,
    // payslip comparison or share/print actions.
    ['cashBonus','basePay','totalPay','repeatBonus','heroBonus','heroTotal',
     'auditExpected','benchmarkPhv','nightLegalKc','weekendLegalKc',
     'overtimeLegalKc','holidayLegalKc'].forEach(id=>setText(id,'—'));
    ['timeOff','heroWorked','heroLeave'].forEach(id=>setText(id,'—'));
    setText('resultSummary','Opravte neplatné zadání.');
    setText('heroCaption','Neplatné zadání');
    setText('overlapText','Opravte údaje pro nový výpočet.');
    setText('auditMessage','Nejprve opravte zadání směny.');
    $('breakdownList').replaceChildren();
    $('overlapChips').replaceChildren();
    $('auditResult').classList.remove('is-good','is-warn','is-bad');
    const note=$('resultNote')?.querySelector('p');
    if(note) note.textContent='Výsledek nelze vypočítat, dokud neopravíte označené údaje.';
    ['copyResult','copyLink','printResult'].forEach(id=>{ const el=$(id); if(el)el.disabled=true; });
  }

  function calculate() {''',
    'invalid result guard',
)
s = replace_once(
    s,
    "    if(errors.length){ errorBox.hidden=false; errorBox.textContent=errors.join(' '); }\n    else errorBox.hidden=true;",
    '''    if(errors.length){
      errorBox.hidden=false;
      errorBox.textContent=errors.join(' ');
      lastCalc=null;
      clearInvalidResults();
      return null;
    }
    errorBox.hidden=true;
    ['copyResult','copyLink','printResult'].forEach(id=>{ const el=$(id); if(el)el.disabled=false; });''',
    'return before invalid calculation',
)
s = replace_once(
    s,
    "  function renderAudit() {\n    if(!lastCalc) return;",
    "  function renderAudit() {\n    if(!lastCalc){ setText('auditExpected','—'); setText('auditMessage','Nejprve opravte zadání směny.'); return; }",
    'stale payslip result',
)
h = html.read_text(encoding='utf-8')
h = replace_once(
    h,
    '/priplatky-smeny.js?v=20260818-a11y1',
    '/priplatky-smeny.js?v=20260916-v8-validation1',
    'JS cache version',
)
js.write_text(s, encoding='utf-8')
html.write_text(h, encoding='utf-8')
print('PASS: guarded two-file hotfix applied; source hash and unique snippets verified')
