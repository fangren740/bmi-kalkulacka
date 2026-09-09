from pathlib import Path
import base64
import io
import json
import re
import shutil
import zipfile

ROOT = Path('.')
TMP = ROOT / '.tmp-tapety'
RELEASE_DATE = '2026-09-09'
NEW_URL = '/kalkulacka-tapet.html'


def require(condition, message):
    if not condition:
        raise SystemExit(f'INTEGRATION ERROR: {message}')


def replace_required(text, old, new, label, minimum=1):
    count = text.count(old)
    require(count >= minimum, f'{label}: expected at least {minimum} occurrence(s) of {old!r}, found {count}')
    return text.replace(old, new)


# 1) Reconstruct the approved release candidate and copy only production assets.
payload = ''.join((TMP / f'chunk_{i:02d}').read_text(encoding='utf-8').strip() for i in range(6))
raw = base64.b64decode(payload, validate=True)
with zipfile.ZipFile(io.BytesIO(raw)) as zf:
    prefix = 'RV_V7_TAPETY_RELEASE_CANDIDATE/'
    for filename in ('kalkulacka-tapet.html', 'tapety-core.js', 'tapety.css', 'tapety-page.js'):
        member = prefix + filename
        require(member in zf.namelist(), f'missing {member} in release archive')
        (ROOT / filename).write_bytes(zf.read(member))

html = (ROOT / 'kalkulacka-tapet.html').read_text(encoding='utf-8')
require('https://rychlevypocty.cz/kalkulacka-tapet.html' in html, 'candidate canonical URL missing')
require('/tapety-core.js?v=20260909-1' in html, 'candidate core script reference missing')
require('/tapety-page.js?v=20260909-1' in html, 'candidate page script reference missing')
require('/tapety.css?v=20260909-1' in html, 'candidate stylesheet reference missing')

# 2) Registry: insert tapety at the end of the reconstruction cluster and keep priorities unique.
registry_path = ROOT / 'calculators-registry.json'
registry = json.loads(registry_path.read_text(encoding='utf-8'))
items = registry['items']
require(not any(item.get('url') == NEW_URL for item in items), 'tapety already exists in registry')
require(len(items) == 131, f'expected 131 registry items before release, found {len(items)}')

for item in items:
    priority = item.get('priority')
    if isinstance(priority, int) and priority >= 94:
        item['priority'] = priority + 1

items.append({
    'id': 'kalkulacka-tapet',
    'type': 'calculator',
    'name': 'Kalkulačka tapet',
    'url': NEW_URL,
    'file': 'kalkulacka-tapet.html',
    'categoryId': 'rekonstrukce',
    'hubUrl': '/rekonstrukce.html',
    'shortDescription': 'Spočítejte doporučený počet rolí tapet podle celých pásů, ořezu, raportu a sesazení; výsledek doplní konkrétní řezný plán rolí.',
    'searchTerms': [
        'Kalkulačka tapet',
        'kalkulačka tapet počet rolí',
        'kolik rolí tapet potřebuji',
        'výpočet tapet na stěnu',
        'řezný plán tapet',
        'raport tapety',
        'sesazení tapety',
        'tapety role kalkulačka',
        'Rekonstrukce'
    ],
    'priority': 94,
    'status': 'published',
    'methodologyCheckedAt': RELEASE_DATE,
    'referenceYear': None,
    'seasonality': None,
    'relatedIds': [
        'kalkulacka-barvy-na-malovani',
        'kalkulacka-podlahy',
        'kalkulacka-nakladu-na-rekonstrukci-bytu-domu'
    ],
    'iconKey': 'rekonstrukce',
    'indexable': True,
    'inSitemap': True
})
items.sort(key=lambda item: item.get('priority', 10**9))
priorities = [item.get('priority') for item in items]
require(len(items) == 132, f'expected 132 registry items after release, found {len(items)}')
require(len(set(priorities)) == len(priorities), 'registry priority collision after insert')
require(priorities == list(range(1, 133)), 'registry priorities are not contiguous 1..132 after insert')
source = registry.get('source', '')
if 'tapety Gold release 2026-09-09' not in source:
    registry['source'] = source + ' + tapety Gold release 2026-09-09'
registry_path.write_text(json.dumps(registry, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# 3) Static catalogue: total 131 -> 132, reconstruction 7 -> 8, insert card, then renumber all cards.
catalog_path = ROOT / 'kalkulacky.html'
catalog = catalog_path.read_text(encoding='utf-8')
require(NEW_URL not in catalog, 'tapety already exists in catalogue')
require(len(re.findall(r'<span class="tool-index">\d{3}</span>', catalog)) == 131, 'expected 131 catalogue tool indexes before release')

catalog = replace_required(catalog, 'Online kalkulačky zdarma – 131 nástrojů', 'Online kalkulačky zdarma – 132 nástrojů', 'catalog title/OG title')
catalog = replace_required(catalog, '131 online kalkulaček zdarma', '132 online kalkulaček zdarma', 'catalog descriptions')
catalog = replace_required(catalog, '131 nástrojů v jednom přehledném katalogu', '132 nástrojů v jednom přehledném katalogu', 'catalog OG description')
catalog = replace_required(catalog, '131 online kalkulaček a praktických nástrojů', '132 online kalkulaček a praktických nástrojů', 'catalog schema description')
catalog = replace_required(catalog, '<span class="hero-number">131</span>', '<span class="hero-number">132</span>', 'catalog hero count')
catalog = replace_required(catalog, '<span>131 reálných nástrojů</span>', '<span>132 reálných nástrojů</span>', 'catalog hero proof')
catalog = replace_required(catalog, 'Filtrovat 131 nástrojů…', 'Filtrovat 132 nástrojů…', 'catalog filter placeholder')
catalog = replace_required(catalog, '<strong>131</strong> výsledků', '<strong>132</strong> výsledků', 'catalog result count')

all_chip_pattern = re.compile(r'(<button[^>]*data-category="all"[^>]*>.*?<b>)131(</b></button>)', re.S)
catalog, n = all_chip_pattern.subn(r'\g<1>132\g<2>', catalog, count=1)
require(n == 1, f'catalog all-category chip update count={n}')

recon_chip_pattern = re.compile(r'(<button[^>]*data-category="rekonstrukce"[^>]*>.*?<b>)7(</b></button>)', re.S)
catalog, n = recon_chip_pattern.subn(r'\g<1>8\g<2>', catalog, count=1)
require(n == 1, f'catalog reconstruction chip update count={n}')

section_start = catalog.find('<section', catalog.find('data-domain="rekonstrukce"') - 400)
marker = catalog.find('data-domain="rekonstrukce"')
require(marker >= 0 and section_start >= 0, 'reconstruction catalogue section not found')
section_end = catalog.find('</section>', marker)
require(section_end >= 0, 'reconstruction catalogue section closing tag not found')
section_end += len('</section>')
recon = catalog[section_start:section_end]
recon = recon.replace('7 nástrojů', '8 nástrojů')
card = ('<a class="tool-card" data-category="rekonstrukce" '
        'data-search="kalkulačka tapet počet rolí tapety řezný plán raport sesazení ořez stěna rekonstrukce" '
        'data-tool="" data-track-tool="/kalkulacka-tapet.html" href="/kalkulacka-tapet.html">'
        '<span class="tool-index">094</span><span class="tool-copy"><strong>Kalkulačka tapet</strong>'
        '<small>Celé pásy, ořez, raport, sesazení a konkrétní řezný plán jednotlivých rolí.</small></span>'
        '<span class="tool-type">Tapety</span><span aria-hidden="true" class="tool-arrow">↗</span></a>')
insert_at = recon.rfind('</div></section>')
require(insert_at >= 0, 'catalog reconstruction card insertion point not found')
recon = recon[:insert_at] + card + recon[insert_at:]
catalog = catalog[:section_start] + recon + catalog[section_end:]

counter = 0
def renumber(match):
    global counter
    counter += 1
    return f'<span class="tool-index">{counter:03d}</span>'
catalog = re.sub(r'<span class="tool-index">\d{3}</span>', renumber, catalog)
require(counter == 132, f'expected 132 catalogue cards after insert, renumbered {counter}')
require(catalog.count(NEW_URL) >= 2, 'tapety URL missing from catalogue after insert')
require('131 nástrojů' not in catalog and '131 kalkulaček' not in catalog, 'stale 131 count remains in catalogue')
catalog_path.write_text(catalog, encoding='utf-8')

# 4) Reconstruction hub: update tool counts and add tapety to POVR group.
hub_path = ROOT / 'rekonstrukce.html'
hub = hub_path.read_text(encoding='utf-8')
require(NEW_URL not in hub, 'tapety already exists in reconstruction hub')
hub = hub.replace('7 kalkulaček', '8 kalkulaček')
hub = replace_required(hub, '7 primárních nástrojů', '8 primárních nástrojů', 'reconstruction hero proof')
hub = replace_required(hub, '7 primárních výpočtů', '8 primárních výpočtů', 'reconstruction tools eyebrow')

povr_marker = hub.find('<span class="tool-code">POVR</span>')
require(povr_marker >= 0, 'POVR tool group not found')
povr_start = hub.rfind('<section class="tool-group">', 0, povr_marker)
povr_end = hub.find('</section>', povr_marker)
require(povr_start >= 0 and povr_end >= 0, 'POVR tool group boundaries not found')
povr_end += len('</section>')
povr = hub[povr_start:povr_end]
povr = replace_required(povr, '<span class="tool-count">3 nástroje</span>', '<span class="tool-count">4 nástroje</span>', 'POVR count')
hub_link = ('<a class="tool-link" href="/kalkulacka-tapet.html"><span class="tool-num">08</span><span>'
            '<strong>Kalkulačka tapet</strong><small>Celé pásy, ořez, raport, sesazení a konkrétní řezný plán jednotlivých rolí.</small>'
            '</span><span class="tool-arrow">→</span></a>')
insert_at = povr.rfind('</div></section>')
require(insert_at >= 0, 'POVR hub insertion point not found')
povr = povr[:insert_at] + hub_link + povr[insert_at:]
hub = hub[:povr_start] + povr + hub[povr_end:]
require(hub.count(NEW_URL) >= 1, 'tapety URL missing from reconstruction hub after insert')
hub_path.write_text(hub, encoding='utf-8')

# 5) Sitemap.
sitemap_path = ROOT / 'sitemap.xml'
sitemap = sitemap_path.read_text(encoding='utf-8')
require('https://rychlevypocty.cz/kalkulacka-tapet.html' not in sitemap, 'tapety already exists in sitemap')
url_block = f'''\n<url>\n<loc>https://rychlevypocty.cz/kalkulacka-tapet.html</loc>\n<lastmod>{RELEASE_DATE}</lastmod>\n<changefreq>monthly</changefreq>\n<priority>0.84</priority>\n</url>\n'''
require('</urlset>' in sitemap, 'sitemap closing urlset not found')
sitemap = sitemap.replace('</urlset>', url_block + '</urlset>', 1)
sitemap_path.write_text(sitemap, encoding='utf-8')

# 6) Homepage/global search index.
index_path = ROOT / 'rv-tool-index.js'
index_js = index_path.read_text(encoding='utf-8')
require(NEW_URL not in index_js, 'tapety already exists in rv-tool-index.js')
end = index_js.rfind('];')
require(end >= 0, 'rv-tool-index.js array closing token not found')
entry = '''  {\n    "title": "Kalkulačka tapet",\n    "url": "/kalkulacka-tapet.html",\n    "type": "Tapety",\n    "desc": "Celé pásy, ořez, raport, sesazení a konkrétní řezný plán jednotlivých rolí.",\n    "keywords": "Kalkulačka tapet tapety počet rolí tapet řezný plán raport sesazení ořez stěna rekonstrukce Rekonstrukce"\n  }\n'''
prefix = index_js[:end].rstrip()
require(prefix.endswith('}'), 'rv-tool-index.js last entry does not end with object')
index_js = prefix + ',\n' + entry + index_js[end:]
index_path.write_text(index_js, encoding='utf-8')

# 7) Final integration assertions.
registry_check = json.loads(registry_path.read_text(encoding='utf-8'))
require(sum(1 for item in registry_check['items'] if item.get('url') == NEW_URL) == 1, 'registry tapety URL count is not exactly one')
require('Online kalkulačky zdarma – 132 nástrojů' in catalog_path.read_text(encoding='utf-8'), 'catalog 132 title missing')
require('8 primárních nástrojů' in hub_path.read_text(encoding='utf-8'), 'reconstruction 8-tool proof missing')
require('https://rychlevypocty.cz/kalkulacka-tapet.html' in sitemap_path.read_text(encoding='utf-8'), 'sitemap tapety URL missing')
require(NEW_URL in index_path.read_text(encoding='utf-8'), 'global tool index tapety URL missing')

# Remove one-off transport/integration machinery from the release commit.
workflow_path = ROOT / '.github/workflows/tapety-release.yml'
if workflow_path.exists():
    workflow_path.unlink()
shutil.rmtree(TMP)
print('Tapety integration complete: 132 catalogue tools, 8 reconstruction tools, sitemap + global search integrated.')
