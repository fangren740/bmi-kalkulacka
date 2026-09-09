from pathlib import Path

path = Path('.tmp-tapety/integrate.py')
text = path.read_text(encoding='utf-8')
old = "require('131 nástrojů' not in catalog and '131 kalkulaček' not in catalog, 'stale 131 count remains in catalogue')"
new = "catalog = catalog.replace('131 nástrojů', '132 nástrojů').replace('131 kalkulaček', '132 kalkulaček')\nrequire('131 nástrojů' not in catalog and '131 kalkulaček' not in catalog, 'stale 131 count remains in catalogue after count normalization')"
if old not in text:
    raise SystemExit('catalog count normalization patch target missing')
path.write_text(text.replace(old, new, 1), encoding='utf-8')
print('Integrator catalogue count normalization patched.')
