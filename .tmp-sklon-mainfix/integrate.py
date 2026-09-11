from pathlib import Path
import json, re, shutil

ROOT = Path('.')
NEW_URL = '/sklon-a-spad-kalkulacka.html'
NEW_ABS = 'https://rychlevypocty.cz/sklon-a-spad-kalkulacka.html'
RELEASE_DATE = '2026-09-11'


def require(condition, message):
    if not condition:
        raise SystemExit(f'INTEGRATION ERROR: {message}')


def replace_required(text, old, new, label, minimum=1):
    count = text.count(old)
    require(count >= minimum, f'{label}: expected at least {minimum} occurrence(s), found {count}')
    return text.replace(old, new)

# Candidate copied by workflow from the already QA-passed release branch.
for filename in ('sklon-a-spad-kalkulacka.html','sklon-spad-core.js','sklon-spad-page.js'):
    require((ROOT/filename).exists(), f'missing copied candidate file {filename}')
page = (ROOT/'sklon-a-spad-kalkulacka.html').read_text(encoding='utf-8')
require(NEW_ABS in page, 'production canonical missing')
require('/sklon-spad-core.js?v=20260910-1' in page, 'core script reference missing')
require('/sklon-spad-page.js?v=20260910-1' in page, 'page script reference missing')
require('index,follow' in page, 'page is not indexable')
require('rv-brand-v32' in page, 'brand hook missing')

# Registry
registry_path = ROOT/'calculators-registry.json'
registry = json.loads(registry_path.read_text(encoding='utf-8'))
items = registry['items']
require(len(items) == 132, f'expected 132 registry items before release, found {len(items)}')
require(not any(i.get('url') == NEW_URL for i in items), 'calculator already exists in registry')
priorities = [i.get('priority') for i in items if isinstance(i.get('priority'), int)]
items.append({
  'id':'sklon-a-spad-kalkulacka','type':'calculator','name':'Kalkulačka sklonu a spádu',
  'url':NEW_URL,'file':'sklon-a-spad-kalkulacka.html','categoryId':'stavba-domu','hubUrl':'/stavba-domu.html',
  'shortDescription':'Spočítejte sklon, převýšení nebo vodorovnou vzdálenost a převeďte výsledek mezi procenty, stupni, poměrem 1:x a cm/m.',
  'searchTerms':['Kalkulačka sklonu a spádu','sklon v procentech','sklon ve stupních','převod procent na stupně','spád kalkulačka','převýšení kalkulačka','poměr 1:x sklon','cm na metr spád','sklon terasy','sklon rampy','spád potrubí','Stavba domu'],
  'priority':max(priorities, default=0)+1,'status':'published','methodologyCheckedAt':RELEASE_DATE,
  'referenceYear':None,'seasonality':None,
  'relatedIds':['kalkulacka-betonu','kalkulacka-sterku','kalkulacka-dlazby-a-obkladu'],
  'iconKey':'stavba-domu','indexable':True,'inSitemap':True
})
require(len(items)==133,'registry append failed')
if 'sklon/spád Gold release' not in registry.get('source',''):
    registry['source'] = registry.get('source','') + ' + sklon/spád Gold release 2026-09-11'
registry_path.write_text(json.dumps(registry, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

# Catalogue
catalog_path = ROOT/'kalkulacky.html'
catalog = catalog_path.read_text(encoding='utf-8')
require(NEW_URL not in catalog,'calculator already exists in catalogue')
require(len(re.findall(r'<span class="tool-index">\d{3}</span>',catalog))==132,'expected 132 catalogue cards before release')
for old,new in [
('Online kalkulačky zdarma – 132 nástrojů','Online kalkulačky zdarma – 133 nástrojů'),
('132 online kalkulaček zdarma','133 online kalkulaček zdarma'),
('132 nástrojů v jednom přehledném katalogu','133 nástrojů v jednom přehledném katalogu'),
('132 online kalkulaček a praktických nástrojů','133 online kalkulaček a praktických nástrojů'),
('<span class="hero-number">132</span>','<span class="hero-number">133</span>'),
('132 reálných nástrojů','133 reálných nástrojů'),
('Filtrovat 132 nástrojů…','Filtrovat 133 nástrojů…'),
('<strong>132</strong> výsledků','<strong>133</strong> výsledků'),
('Katalog obsahuje všech 132 nástrojů.','Katalog obsahuje všech 133 nástrojů.')]:
    catalog = replace_required(catalog,old,new,'catalog total')
catalog,n = re.subn(r'(<button[^>]*data-category="all"[^>]*>.*?<b>)132(</b></button>)',r'\g<1>133\g<2>',catalog,count=1,flags=re.S)
require(n==1,'all chip count update failed')
catalog,n = re.subn(r'(<button[^>]*data-category="stavba-domu"[^>]*>.*?<b>)11(</b></button>)',r'\g<1>12\g<2>',catalog,count=1,flags=re.S)
require(n==1,'stavba chip count update failed')
marker = catalog.find('id="domain-stavba-domu"')
require(marker>=0,'stavba catalogue section missing')
ss = catalog.rfind('<section',0,marker); se = catalog.find('</section>',marker)
require(ss>=0 and se>=0,'stavba section bounds missing')
se += len('</section>')
stavba = catalog[ss:se]
stavba = replace_required(stavba,'<b>11 nástrojů</b>','<b>12 nástrojů</b>','stavba section count')
stavba = replace_required(stavba,'<span>Zobrazit 11 nástrojů</span>','<span>Zobrazit 12 nástrojů</span>','stavba mobile count')
card = ('<a class="tool-card" data-category="stavba-domu" data-search="kalkulačka sklonu a spádu sklon v procentech stupně poměr 1:x cm/m převýšení vodorovná vzdálenost spád terasy rampy potrubí stavba domu" data-tool="" data-track-tool="/sklon-a-spad-kalkulacka.html" href="/sklon-a-spad-kalkulacka.html">'
'<span class="tool-index">117</span><span class="tool-copy"><strong>Kalkulačka sklonu a spádu</strong><small>Převod %, °, 1:x a cm/m plus výpočet převýšení a vodorovné vzdálenosti.</small></span><span class="tool-type">Sklon</span><span aria-hidden="true" class="tool-arrow">↗</span></a>')
pos=stavba.rfind('</div></section>'); require(pos>=0,'stavba card insert point missing')
stavba=stavba[:pos]+card+stavba[pos:]
catalog=catalog[:ss]+stavba+catalog[se:]
counter=0
def renumber(m):
    global counter
    counter += 1
    return f'<span class="tool-index">{counter:03d}</span>'
catalog=re.sub(r'<span class="tool-index">\d{3}</span>',renumber,catalog)
require(counter==133,f'expected 133 cards, found {counter}')
catalog_path.write_text(catalog,encoding='utf-8')

# Stavba hub
hub_path=ROOT/'stavba-domu.html'; hub=hub_path.read_text(encoding='utf-8')
require(NEW_URL not in hub,'calculator already exists in stavba hub')
hub=hub.replace('11 praktických kalkulaček','12 praktických kalkulaček')
hub=hub.replace('11 stavebních nástrojů','12 stavebních nástrojů')
hub=hub.replace('11 stavebních kalkulaček','12 stavebních kalkulaček')
updated=False
script_re=re.compile(r'<script type="application/ld\+json">(.*?)</script>',re.S)
def upd(match):
    global updated
    try: data=json.loads(match.group(1))
    except Exception: return match.group(0)
    if data.get('@type')=='ItemList' and data.get('name')=='Kalkulačky pro stavbu domu':
        require(data.get('numberOfItems')==11,'unexpected hub ItemList count')
        els=data.get('itemListElement') or []; require(len(els)==11,'unexpected hub ItemList elements')
        els.append({'@type':'ListItem','position':12,'name':'Kalkulačka sklonu a spádu','url':NEW_ABS})
        data['numberOfItems']=12; data['itemListElement']=els; updated=True
        return '<script type="application/ld+json">'+json.dumps(data,ensure_ascii=False,separators=(',',':'))+'</script>'
    return match.group(0)
hub=script_re.sub(upd,hub); require(updated,'hub ItemList not updated')
ts=hub.find('<section class="tools" id="tools">'); te=hub.find('<section class="logic">',ts)
require(ts>=0 and te>ts,'hub tools section missing')
tools=hub[ts:te]
hub_card=('<a class="tool" href="/sklon-a-spad-kalkulacka.html"><div class="tool-top"><span class="tool-no">12</span><span class="tool-badge">% / ° / 1:x</span></div><div class="tool-icon"><svg viewBox="0 0 24 24"><path d="M3 19h18M5 19 19 8M19 8v11M7 17a4 4 0 0 1 3-3"/></svg></div><h3>Sklon, spád a převýšení</h3><p>Převod procent, stupňů, poměru a cm/m plus výpočet převýšení nebo vodorovné vzdálenosti.</p><span class="tool-go">Spočítat sklon ↗</span></a>')
pos=tools.rfind('</div></div></section>'); require(pos>=0,'hub card insert point missing')
tools=tools[:pos]+hub_card+tools[pos:]
hub=hub[:ts]+tools+hub[te:]
require('12 stavebních nástrojů' in hub,'hub visible count missing')
hub_path.write_text(hub,encoding='utf-8')

# Sitemap
sitemap_path=ROOT/'sitemap.xml'; sitemap=sitemap_path.read_text(encoding='utf-8')
require(NEW_ABS not in sitemap,'calculator already exists in sitemap')
block=f'\n<url>\n<loc>{NEW_ABS}</loc>\n<lastmod>{RELEASE_DATE}</lastmod>\n<changefreq>monthly</changefreq>\n<priority>0.84</priority>\n</url>\n'
require('</urlset>' in sitemap,'sitemap closing tag missing')
sitemap=sitemap.replace('</urlset>',block+'</urlset>',1)
sitemap_path.write_text(sitemap,encoding='utf-8')

# Search index
idx_path=ROOT/'rv-tool-index.js'; idx=idx_path.read_text(encoding='utf-8')
require(NEW_URL not in idx,'calculator already exists in search index')
end=idx.rfind('];'); require(end>=0,'search index closing token missing')
entry='''  {\n    "title": "Kalkulačka sklonu a spádu",\n    "url": "/sklon-a-spad-kalkulacka.html",\n    "type": "Sklon a spád",\n    "desc": "Převod %, °, 1:x a cm/m plus výpočet převýšení a vodorovné vzdálenosti.",\n    "keywords": "Kalkulačka sklonu spádu procenta stupně poměr 1:x cm/m převýšení vodorovná vzdálenost terasa rampa potrubí Stavba domu"\n  }\n'''
prefix=idx[:end].rstrip(); require(prefix.endswith('}'),'search index tail unexpected')
idx=prefix+',\n'+entry+idx[end:]
idx_path.write_text(idx,encoding='utf-8')

# Final assertions
require(len(json.loads(registry_path.read_text(encoding='utf-8'))['items'])==133,'registry final count wrong')
require(NEW_URL in catalog_path.read_text(encoding='utf-8'),'catalog integration missing')
require(NEW_URL in hub_path.read_text(encoding='utf-8'),'hub integration missing')
require(NEW_ABS in sitemap_path.read_text(encoding='utf-8'),'sitemap integration missing')
require(NEW_URL in idx_path.read_text(encoding='utf-8'),'search integration missing')

# One-off release machinery must not ship.
workflow=ROOT/'.github/workflows/sklon-mainfix-release.yml'
if workflow.exists(): workflow.unlink()
shutil.rmtree(ROOT/'.tmp-sklon-mainfix')
print('Integrated sklon/spad onto current main baseline: registry 133, Stavba 12, catalogue+sitemap+search updated.')
