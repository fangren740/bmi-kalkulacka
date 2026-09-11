from pathlib import Path
p=Path('prepocet-formy-page.js')
s=p.read_text(encoding='utf-8')
old='row.className="ing-row";'
new='row.className="tr ing-row";'
if old not in s:
    raise SystemExit('row class marker not found')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('row class aligned with ingredient editor CSS')
