from pathlib import Path
import base64
import io
import json
import re
import shutil
import zipfile

ROOT = Path('.')
TMP = ROOT / '.tmp-sklon'
NEW_URL = '/sklon-a-spad-kalkulacka.html'
NEW_ABS = 'https://rychlevypocty.cz/sklon-a-spad-kalkulacka.html'
RELEASE_DATE = '2026-09-10'


def require(condition, message):
    if not condition:
        raise SystemExit(f'INTEGRATION ERROR: {message}')


def replace_required(text, old, new, label, minimum=1):
    count = text.count(old)
    require(count >= minimum, f'{label}: expected at least {minimum} occurrence(s) of {old!r}, found {count}')
    return text.replace(old, new)


# 1) Reconstruct the exact locally QA'd production payload.
payload = ''.join((TMP / f'chunk_{i:02d}').read_text(encoding='utf-8').strip() for i in range(4))
raw = base64.b64decode(payload, validate=True)
with zipfile.ZipFile(io.BytesIO(raw)) as zf:
    wanted = ('sklon-a-spad-kalkulacka.html', 'sklon-spad-core.js', 'sklon-spad-page.js')
    names = set(zf.namelist())
    for filename in wanted:
        require(filename in names, f'missing {filename} in release archive')
        (ROOT / filename).write_bytes(zf.read(filename))

page = (ROOT / 'sklon-a-spad-kalkulacka.html').read_text(encoding='utf-8')
require(NEW_ABS in page, 'canonical/absolute production URL missing from calculator HTML')
require('/sklon-spad-core.js?v=20260910-1' in page, 'core script reference missing')
require('/sklon-spad-page.js?v=20260910-1' in page, 'page script reference missing')
require('index,follow' in page, 'calculator is not indexable')
require('rv-brand-v32' in page, 'V3.2 brand identity hook missing')

# 2) Registry: append without disturbing existing editorial priority semantics.
registry_path = ROOT / 'calculators-registry.json'
registry = json.loads(registry_path.read_text(encoding='utf-8'))
items = registry['items']
require(len(items) == 132, f'expected 132 registry items before release, found {len(items)}')
require(not any(item.get('url') == NEW_URL for item in items), 'calculator already exists in registry')
existing_priorities = [item.get('priority') for item in items if isinstance(item.get('priority'), int)]
new_priority = max(existing_priorities, default=0) + 1
items.append({
    'id': 'sklon-a-spad-kalkulacka',
    'type': 'calculator',
    'name': 'Kalkulačka sklonu a spádu',
    'url': NEW_URL,
    'file': 'sklon-a-spad-kalkulacka.html',
    'categoryId': 'stavba-domu',
    'hubUrl': '/stavba-domu.html',
    'shortDescription': 'Spočítejte sklon, převýšení nebo vodorovnou vzdálenost a převeďte výsledek mezi procenty, stupni, poměrem 1:x a cm/m.',
    'searchTerms': [
        'Kalkulačka sklonu a spádu',
        'sklon v procentech',
        'sklon ve stupních',
        'převod procent na stupně',
        'spád kalkulačka',
        'převýšení kalkulačka',
        'poměr 1:x sklon',
        'cm na metr spád',
        'sklon terasy',
        'sklon rampy',
        'spád potrubí',
        'Stavba domu'
    ],
    'priority': new_priority,
    'status': 'published',
    'methodologyCheckedAt': RELEASE_DATE,
    'referenceYear': None,
    'seasonality': None,
    'relatedIds': [
        'kalkulacka-betonu',
        'kalkulacka-sterku',
        'kalkulacka-dlazby-a-obkladu'
    ],
    'iconKey': 'stavba-domu',
    'indexable': True,
    'inSitemap': True
})
require(len(items) == 133, 'registry append failed')
source = registry.get('source', '')
if 'sklon/spád Gold release 2026-09-10' not in source:
    registry['source'] = source + ' + sklon/spád Gold release 2026-09-10'
registry_path.write_text(json.dumps(registry, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# 3) Main catalogue: 132 -> 133, Stavba 11 -> 12, add the card, then renumber card indices.
catalog_path = ROOT / 'kalkulacky.html'
catalog = catalog_path.read_text(encoding='utf-8')
require(NEW_URL not in catalog, 'calculator already exists in catalogue')
require(len(re.findall(r'<span class="tool-index">\d{3}</span>', catalog)) == 132, 'expected 132 catalogue cards before release')

count_replacements = [
    ('Online kalkulačky zdarma – 132 nástrojů', 'Online kalkulačky zdarma – 133 nástrojů'),
    ('132 online kalkulaček zdarma', '133 online kalkulaček zdarma'),
    ('132 nástrojů v jednom přehledném katalogu', '133 nástrojů v jednom přehledném katalogu'),
    ('132 online kalkulaček a praktických nástrojů', '133 online kalkulaček a praktických nástrojů'),
    ('<span class="hero-number">132</span>', '<span class="hero-number">133</span>'),
    ('132 reálných nástrojů', '133 reálných nástrojů'),
    ('Filtrovat 132 nástrojů…', 'Filtrovat 133 nástrojů…'),
    ('<strong>132</strong> výsledků', '<strong>133</strong> výsledků'),
    ('Katalog obsahuje všech 132 nástrojů.', 'Katalog obsahuje všech 133 nástrojů.')
]
for old, new in count_replacements:
    catalog = replace_required(catalog, old, new, f'catalog total count {old}')

catalog, n = re.subn(r'(<button[^>]*data-category="all"[^>]*>.*?<b>)132(</b></button>)', r'\g<1>133\g<2>', catalog, count=1, flags=re.S)
require(n == 1, 'catalog all chip count update failed')
catalog, n = re.subn(r'(<button[^>]*data-category="stavba-domu"[^>]*>.*?<b>)11(</b></button>)', r'\g<1>12\g<2>', catalog, count=1, flags=re.S)
require(n == 1, 'catalog Stavba chip count update failed')

section_marker = 'id="domain-stavba-domu"'
marker = catalog.find(section_marker)
require(marker >= 0, 'Stavba catalogue section not found')
section_start = catalog.rfind('<section', 0, marker)
section_end = catalog.find('</section>', marker)
require(section_start >= 0 and section_end >= 0, 'Stavba catalogue section boundaries not found')
section_end += len('</section>')
stavba = catalog[section_start:section_end]
stavba = replace_required(stavba, '<b>11 nástrojů</b>', '<b>12 nástrojů</b>', 'Stavba catalogue section count')
stavba = replace_required(stavba, '<span>Zobrazit 11 nástrojů</span>', '<span>Zobrazit 12 nástrojů</span>', 'Stavba mobile count')
card = ('<a class="tool-card" data-category="stavba-domu" '
        'data-search="kalkulačka sklonu a spádu sklon v procentech stupně poměr 1:x cm/m převýšení vodorovná vzdálenost spád terasy rampy potrubí stavba domu" '
        'data-tool="" data-track-tool="/sklon-a-spad-kalkulacka.html" href="/sklon-a-spad-kalkulacka.html">'
        '<span class="tool-index">117</span><span class="tool-copy"><strong>Kalkulačka sklonu a spádu</strong>'
        '<small>Převod %, °, 1:x a cm/m plus výpočet převýšení a vodorovné vzdálenosti.</small></span>'
        '<span class="tool-type">Sklon</span><span aria-hidden="true" class="tool-arrow">↗</span></a>')
insert_at = stavba.rfind('</div></section>')
require(insert_at >= 0, 'Stavba catalogue card insertion point not found')
stavba = stavba[:insert_at] + card + stavba[insert_at:]
catalog = catalog[:section_start] + stavba + catalog[section_end:]

counter = 0
def renumber(match):
    global counter
    counter += 1
    return f'<span class="tool-index">{counter:03d}</span>'
catalog = re.sub(r'<span class="tool-index">\d{3}</span>', renumber, catalog)
require(counter == 133, f'expected 133 catalogue cards after insert, found {counter}')
require(catalog.count(NEW_URL) >= 2, 'new calculator URL missing from catalogue')
# Catch stale top-level counts without assuming every number 132 is obsolete in unrelated content.
require('132 reálných nástrojů' not in catalog and 'Filtrovat 132 nástrojů' not in catalog, 'stale catalogue total count remains')
catalog_path.write_text(catalog, encoding='utf-8')

# 4) Stavba domu hub: 11 -> 12 and append the new calculator card.
hub_path = ROOT / 'stavba-domu.html'
hub = hub_path.read_text(encoding='utf-8')
require(NEW_URL not in hub, 'calculator already exists in Stavba hub')
hub = hub.replace('11 praktických kalkulaček', '12 praktických kalkulaček')
hub = hub.replace('11 stavebních nástrojů', '12 stavebních nástrojů')
hub = hub.replace('11 stavebních kalkulaček', '12 stavebních kalkulaček')

# Update the ItemList JSON-LD structurally rather than by string surgery.
script_re = re.compile(r'<script type="application/ld\+json">(.*?)</script>', re.S)
updated_itemlist = False
def update_jsonld(match):
    global updated_itemlist
    raw_json = match.group(1)
    try:
        data = json.loads(raw_json)
    except Exception:
        return match.group(0)
    if data.get('@type') == 'ItemList' and data.get('name') == 'Kalkulačky pro stavbu domu':
        require(data.get('numberOfItems') == 11, 'unexpected Stavba ItemList count before release')
        elements = data.get('itemListElement') or []
        require(len(elements) == 11, 'unexpected Stavba ItemList element count before release')
        elements.append({'@type':'ListItem','position':12,'name':'Kalkulačka sklonu a spádu','url':NEW_ABS})
        data['numberOfItems'] = 12
        data['itemListElement'] = elements
        updated_itemlist = True
        return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '</script>'
    return match.group(0)
hub = script_re.sub(update_jsonld, hub)
require(updated_itemlist, 'Stavba ItemList JSON-LD was not updated')

tools_start = hub.find('<section class="tools" id="tools">')
require(tools_start >= 0, 'Stavba hub tools section not found')
tools_end = hub.find('<section class="logic">', tools_start)
require(tools_end > tools_start, 'Stavba hub tools section end not found')
tools = hub[tools_start:tools_end]
new_hub_card = ('<a class="tool" href="/sklon-a-spad-kalkulacka.html"><div class="tool-top"><span class="tool-no">12</span>'
                '<span class="tool-badge">% / ° / 1:x</span></div><div class="tool-icon"><svg viewBox="0 0 24 24">'
                '<path d="M3 19h18M5 19 19 8M19 8v11M7 17a4 4 0 0 1 3-3"/></svg></div>'
                '<h3>Sklon, spád a převýšení</h3><p>Převod procent, stupňů, poměru a cm/m plus výpočet převýšení nebo vodorovné vzdálenosti.</p>'
                '<span class="tool-go">Spočítat sklon ↗</span></a>')
insert_at = tools.rfind('</div></div></section>')
require(insert_at >= 0, 'Stavba hub tool-grid insertion point not found')
tools = tools[:insert_at] + new_hub_card + tools[insert_at:]
hub = hub[:tools_start] + tools + hub[tools_end:]
require(hub.count(NEW_URL) >= 2, 'new calculator missing from Stavba hub or JSON-LD')
require('12 stavebních nástrojů' in hub, 'Stavba hub visible count not updated')
hub_path.write_text(hub, encoding='utf-8')

# 5) Sitemap.
sitemap_path = ROOT / 'sitemap.xml'
sitemap = sitemap_path.read_text(encoding='utf-8')
require(NEW_ABS not in sitemap, 'calculator already exists in sitemap')
block = f'''\n<url>\n<loc>{NEW_ABS}</loc>\n<lastmod>{RELEASE_DATE}</lastmod>\n<changefreq>monthly</changefreq>\n<priority>0.84</priority>\n</url>\n'''
require('</urlset>' in sitemap, 'sitemap closing urlset not found')
sitemap = sitemap.replace('</urlset>', block + '</urlset>', 1)
sitemap_path.write_text(sitemap, encoding='utf-8')

# 6) Homepage/global tool index.
index_path = ROOT / 'rv-tool-index.js'
index_js = index_path.read_text(encoding='utf-8')
require(NEW_URL not in index_js, 'calculator already exists in global tool index')
end = index_js.rfind('];')
require(end >= 0, 'global tool index closing token not found')
entry = '''  {\n    "title": "Kalkulačka sklonu a spádu",\n    "url": "/sklon-a-spad-kalkulacka.html",\n    "type": "Sklon a spád",\n    "desc": "Převod %, °, 1:x a cm/m plus výpočet převýšení a vodorovné vzdálenosti.",\n    "keywords": "Kalkulačka sklonu spádu procenta stupně poměr 1:x cm/m převýšení vodorovná vzdálenost terasa rampa potrubí Stavba domu"\n  }\n'''
prefix = index_js[:end].rstrip()
require(prefix.endswith('}'), 'global tool index does not end with an object')
index_js = prefix + ',\n' + entry + index_js[end:]
index_path.write_text(index_js, encoding='utf-8')

# 7) Integration assertions before repo-wide gates.
registry_check = json.loads(registry_path.read_text(encoding='utf-8'))
require(sum(1 for item in registry_check['items'] if item.get('url') == NEW_URL) == 1, 'registry URL count is not exactly one')
require(len(registry_check['items']) == 133, 'registry total is not 133')
require('Online kalkulačky zdarma – 133 nástrojů' in catalog_path.read_text(encoding='utf-8'), 'catalogue total title is not 133')
require('<b>12 nástrojů</b>' in catalog_path.read_text(encoding='utf-8')[section_start:section_start+len(stavba)+500], 'Stavba catalogue count is not 12')
require('12 stavebních nástrojů' in hub_path.read_text(encoding='utf-8'), 'Stavba hub count is not 12')
require(NEW_ABS in sitemap_path.read_text(encoding='utf-8'), 'sitemap integration missing')
require(NEW_URL in index_path.read_text(encoding='utf-8'), 'global search index integration missing')

# Remove one-off transport/workflow machinery from the final release commit.
workflow_path = ROOT / '.github/workflows/sklon-release.yml'
if workflow_path.exists():
    workflow_path.unlink()
shutil.rmtree(TMP)
print('Sklon/spád integration complete: 133 catalogue tools, 12 Stavba tools, registry + hub + sitemap + search integrated.')
