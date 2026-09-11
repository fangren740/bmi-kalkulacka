from pathlib import Path
import base64, io, json, re, shutil, zipfile

ROOT=Path('.')
TMP=ROOT/'.tmp-forma'
URL='/prepocet-formy-na-peceni.html'
ABS='https://rychlevypocty.cz/prepocet-formy-na-peceni.html'
DATE='2026-09-11'

def req(cond,msg):
    if not cond: raise SystemExit('INTEGRATION ERROR: '+msg)

# Reconstruct locally QA'd production files.
payload=''.join((TMP/f'chunk_{i:02d}').read_text().strip() for i in range(2))
raw=base64.b64decode(payload,validate=True)
with zipfile.ZipFile(io.BytesIO(raw)) as z:
    for fn in ('prepocet-formy-na-peceni.html','prepocet-formy-core.js','prepocet-formy-page.js'):
        req(fn in z.namelist(),f'missing {fn}')
        (ROOT/fn).write_bytes(z.read(fn))

page=(ROOT/'prepocet-formy-na-peceni.html').read_text(encoding='utf-8')
req(ABS in page,'canonical missing')
req('index,follow' in page,'robots not indexable')
req('/rv-brand-v32.css' in page and '/rv-brand-v32.js' in page,'brand contract references missing')
req('/prepocet-formy-core.js?v=20260911-1' in page and '/prepocet-formy-page.js?v=20260911-1' in page,'script references missing')

# Registry.
rp=ROOT/'calculators-registry.json'
reg=json.loads(rp.read_text(encoding='utf-8'))
items=reg['items']
req(not any(x.get('url')==URL for x in items),'already in registry')
priority=max((x.get('priority') for x in items if isinstance(x.get('priority'),int)),default=0)+1
items.append({
 'id':'prepocet-formy-na-peceni','type':'calculator','name':'Přepočet receptu podle velikosti formy','url':URL,'file':'prepocet-formy-na-peceni.html',
 'categoryId':'matematika-a-prevody','hubUrl':'/matematika-a-prevody.html',
 'shortDescription':'Přepočítejte recept mezi kulatou, čtvercovou a obdélníkovou formou podle plochy nebo objemu a upravte množství surovin.',
 'searchTerms':['přepočet receptu podle formy','kalkulačka formy na pečení','velikost formy recept','kulatá forma přepočet','průměr formy recept','přepočet surovin','forma 20 cm 24 cm','Matematika a převody'],
 'priority':priority,'status':'published','methodologyCheckedAt':DATE,'referenceYear':None,'seasonality':None,
 'relatedIds':['prevodnik-jednotek','trojclenka-kalkulacka','procenta-kalkulacka'],'iconKey':'matematika-a-prevody','indexable':True,'inSitemap':True})
reg['source']=reg.get('source','')+' + přepočet formy Gold release 2026-09-11'
rp.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Main catalogue: increment totals and add to Matematika category.
cp=ROOT/'kalkulacky.html'; cat=cp.read_text(encoding='utf-8')
req(URL not in cat,'already in catalogue')
indices=re.findall(r'<span class="tool-index">\d{3}</span>',cat)
old_total=len(indices); req(old_total>=134,f'unexpected catalogue card count {old_total}')
new_total=old_total+1
for old,new in [
 (f'Online kalkulačky zdarma – {old_total} nástrojů',f'Online kalkulačky zdarma – {new_total} nástrojů'),
 (f'{old_total} online kalkulaček zdarma',f'{new_total} online kalkulaček zdarma'),
 (f'{old_total} nástrojů v jednom přehledném katalogu',f'{new_total} nástrojů v jednom přehledném katalogu'),
 (f'{old_total} online kalkulaček a praktických nástrojů',f'{new_total} online kalkulaček a praktických nástrojů'),
 (f'<span class="hero-number">{old_total}</span>',f'<span class="hero-number">{new_total}</span>'),
 (f'{old_total} reálných nástrojů',f'{new_total} reálných nástrojů'),
 (f'Filtrovat {old_total} nástrojů…',f'Filtrovat {new_total} nástrojů…'),
 (f'<strong>{old_total}</strong> výsledků',f'<strong>{new_total}</strong> výsledků'),
 (f'Katalog obsahuje všech {old_total} nástrojů.',f'Katalog obsahuje všech {new_total} nástrojů.')]:
    cat=cat.replace(old,new)
cat,n=re.subn(r'(<button[^>]*data-category="all"[^>]*>.*?<b>)\d+(</b></button>)',lambda m:m.group(1)+str(new_total)+m.group(2),cat,count=1,flags=re.S);req(n==1,'all chip')
# increment math chip dynamically
pat=r'(<button[^>]*data-category="matematika-a-prevody"[^>]*>.*?<b>)(\d+)(</b></button>)'
m=re.search(pat,cat,re.S);req(m,'math chip missing');math_old=int(m.group(2));math_new=math_old+1
cat=re.sub(pat,lambda x:x.group(1)+str(math_new)+x.group(3),cat,count=1,flags=re.S)
marker=cat.find('id="domain-matematika-a-prevody"');req(marker>=0,'math catalogue section missing')
ss=cat.rfind('<section',0,marker);se=cat.find('</section>',marker)+len('</section>');req(ss>=0 and se>ss,'math section boundaries')
sec=cat[ss:se]
sec=re.sub(r'<b>(\d+) nástrojů</b>',lambda m:f'<b>{int(m.group(1))+1} nástrojů</b>',sec,count=1)
sec=re.sub(r'<span>Zobrazit (\d+) nástrojů</span>',lambda m:f'<span>Zobrazit {int(m.group(1))+1} nástrojů</span>',sec,count=1)
card='<a class="tool-card" data-category="matematika-a-prevody" data-search="přepočet receptu podle formy forma na pečení kulatá čtvercová obdélníková průměr plocha objem suroviny matematika převody" data-tool="" data-track-tool="/prepocet-formy-na-peceni.html" href="/prepocet-formy-na-peceni.html"><span class="tool-index">999</span><span class="tool-copy"><strong>Přepočet receptu podle formy</strong><small>Kulatá, čtvercová a obdélníková forma, poměr ploch nebo objemů a přepočet surovin.</small></span><span class="tool-type">Recept</span><span aria-hidden="true" class="tool-arrow">↗</span></a>'
ins=sec.rfind('</div></section>');req(ins>=0,'math card insertion point');sec=sec[:ins]+card+sec[ins:];cat=cat[:ss]+sec+cat[se:]
counter=0
def renum(m):
 global counter;counter+=1;return f'<span class="tool-index">{counter:03d}</span>'
cat=re.sub(r'<span class="tool-index">\d{3}</span>',renum,cat);req(counter==new_total,f'catalogue total {counter} != {new_total}')
cp.write_text(cat,encoding='utf-8')

# Math hub: add a dedicated practical geometry group and update visible totals.
hp=ROOT/'matematika-a-prevody.html'; hub=hp.read_text(encoding='utf-8');req(URL not in hub,'already in math hub')
hub=hub.replace('5 hlavních nástrojů','6 hlavních nástrojů').replace('Pět kalkulaček, které řeší většinu běžných úloh.','Šest kalkulaček pro základní i praktické přepočty.').replace('5 nástrojů pro matematiku a převody','6 nástrojů pro matematiku a převody')
new_group='<section class="tool-group"><div class="tool-group-head"><span class="group-code">C</span><div><h3>Praktický přepočet receptu podle geometrie</h3><p>Když měníte tvar nebo velikost formy a chcete zachovat správný poměr dávky.</p></div><span class="tool-count">1 nástroj</span></div><div class="tool-list"><a class="tool-link" href="/prepocet-formy-na-peceni.html"><span class="tool-no">06</span><span class="tool-copy"><strong>Přepočet receptu podle velikosti formy</strong><small>Kulatá, čtvercová a obdélníková forma, plocha nebo objem a automatický přepočet surovin.</small></span><span class="tool-arrow">→</span></a></div></section>'
needle='</div></div></section><section class="section section-muted" id="kontrola">';req(needle in hub,'math hub tools boundary missing');hub=hub.replace(needle,new_group+'</div></div></section><section class="section section-muted" id="kontrola">',1)
hp.write_text(hub,encoding='utf-8')

# Sitemap.
sp=ROOT/'sitemap.xml'; sm=sp.read_text(encoding='utf-8');req(ABS not in sm,'already in sitemap');req('</urlset>' in sm,'urlset missing')
sm=sm.replace('</urlset>',f'\n<url>\n<loc>{ABS}</loc>\n<lastmod>{DATE}</lastmod>\n<changefreq>monthly</changefreq>\n<priority>0.84</priority>\n</url>\n</urlset>',1);sp.write_text(sm,encoding='utf-8')

# Global search index.
ip=ROOT/'rv-tool-index.js'; idx=ip.read_text(encoding='utf-8');req(URL not in idx,'already in search index');end=idx.rfind('];');req(end>=0,'search index end missing')
entry='  {\n    "title": "Přepočet receptu podle velikosti formy",\n    "url": "/prepocet-formy-na-peceni.html",\n    "type": "Přepočet receptu",\n    "desc": "Kulatá, čtvercová a obdélníková forma, poměr ploch nebo objemů a automatický přepočet surovin.",\n    "keywords": "přepočet receptu forma pečení průměr kulatá čtvercová obdélníková plocha objem suroviny"\n  }\n'
idx=idx[:end].rstrip()+',\n'+entry+idx[end:];ip.write_text(idx,encoding='utf-8')

# Final assertions and remove one-off machinery before commit.
req(sum(1 for x in json.loads(rp.read_text(encoding='utf-8'))['items'] if x.get('url')==URL)==1,'registry duplicate/missing')
req(URL in cp.read_text(encoding='utf-8'),'catalogue missing');req(URL in hp.read_text(encoding='utf-8'),'hub missing');req(ABS in sp.read_text(encoding='utf-8'),'sitemap missing');req(URL in ip.read_text(encoding='utf-8'),'search missing')
wf=ROOT/'.github/workflows/forma-release.yml'
if wf.exists(): wf.unlink()
shutil.rmtree(TMP)
print(f'Form recipe integration complete: {new_total} catalogue tools; Matematika {math_old}->{math_new}.')
