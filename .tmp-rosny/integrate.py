from pathlib import Path
import base64, io, json, re, shutil, zipfile

ROOT=Path('.')
TMP=ROOT/'.tmp-rosny'
NEW_URL='/rosny-bod-kalkulacka.html'
NEW_ABS='https://rychlevypocty.cz/rosny-bod-kalkulacka.html'
DATE='2026-09-11'

def req(c,m):
    if not c: raise SystemExit('INTEGRATION ERROR: '+m)

def rep(text, old, new, label, minimum=1):
    n=text.count(old); req(n>=minimum,f'{label}: {old!r} found {n}x'); return text.replace(old,new)

# payload
payload=(TMP/'chunk_00').read_text(encoding='utf-8').strip()
raw=base64.b64decode(payload, validate=True)
with zipfile.ZipFile(io.BytesIO(raw)) as z:
    for fn in ('rosny-bod-kalkulacka.html','rosny-bod-core.js','rosny-bod-page.js'):
        req(fn in z.namelist(),f'{fn} missing in payload')
        (ROOT/fn).write_bytes(z.read(fn))

page=(ROOT/'rosny-bod-kalkulacka.html').read_text(encoding='utf-8')
for needle in (NEW_ABS,'index,follow','/rv-brand-v32.css','/rosny-bod-core.js?v=20260911-1','/rosny-bod-page.js?v=20260911-1','WebApplication','Alduchov'):
    req(needle in page,f'page requirement missing: {needle}')

# registry
rp=ROOT/'calculators-registry.json'
r=json.loads(rp.read_text(encoding='utf-8'))
items=r['items']; req(len(items)==133,f'expected 133 registry items, got {len(items)}'); req(not any(i.get('url')==NEW_URL for i in items),'already in registry')
prio=max((i.get('priority') for i in items if isinstance(i.get('priority'),int)),default=0)+1
items.append({
'id':'rosny-bod-kalkulacka','type':'calculator','name':'Kalkulačka rosného bodu a kondenzace','url':NEW_URL,'file':'rosny-bod-kalkulacka.html','categoryId':'energie-a-domacnost','hubUrl':'/energie-a-domacnost.html',
'shortDescription':'Spočítejte rosný bod z teploty a relativní vlhkosti a ověřte, zda je konkrétní povrch nad nebo pod hranicí kondenzace.',
'searchTerms':['Kalkulačka rosného bodu','rosný bod kalkulačka','kondenzace na okně','kondenzace na stěně','relativní vlhkost','povrchová teplota','teplota rosného bodu','vlhkost v bytě','tepelný most kondenzace','Energie a domácnost'],
'priority':prio,'status':'published','methodologyCheckedAt':DATE,'referenceYear':None,'seasonality':None,'relatedIds':['naklady-na-vytapeni-kalkulacka','spotreba-klimatizace-kalkulacka','porovnani-vytapeni-kalkulacka'],'iconKey':'energie-a-domacnost','indexable':True,'inSitemap':True})
r['source']=r.get('source','')+' + rosný bod Gold release 2026-09-11'
rp.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# catalogue
cp=ROOT/'kalkulacky.html'; c=cp.read_text(encoding='utf-8'); req(NEW_URL not in c,'already in catalogue')
for old,new in [
('Online kalkulačky zdarma – 133 nástrojů','Online kalkulačky zdarma – 134 nástrojů'),
('133 online kalkulaček zdarma','134 online kalkulaček zdarma'),
('133 nástrojů v jednom přehledném katalogu','134 nástrojů v jednom přehledném katalogu'),
('133 online kalkulaček a praktických nástrojů','134 online kalkulaček a praktických nástrojů'),
('<span class="hero-number">133</span>','<span class="hero-number">134</span>'),
('133 reálných nástrojů','134 reálných nástrojů'),
('Filtrovat 133 nástrojů…','Filtrovat 134 nástrojů…'),
('<strong>133</strong> výsledků','<strong>134</strong> výsledků'),
('Katalog obsahuje všech 133 nástrojů.','Katalog obsahuje všech 134 nástrojů.')]: c=rep(c,old,new,'catalog total')
c,n=re.subn(r'(<button[^>]*data-category="all"[^>]*>.*?<b>)133(</b></button>)',r'\g<1>134\g<2>',c,count=1,flags=re.S); req(n==1,'all chip')
c,n=re.subn(r'(<button[^>]*data-category="energie-a-domacnost"[^>]*>.*?<b>)8(</b></button>)',r'\g<1>9\g<2>',c,count=1,flags=re.S); req(n==1,'energy chip')
marker=c.find('id="domain-energie-a-domacnost"'); req(marker>=0,'energy section not found')
ss=c.rfind('<section',0,marker); ee=c.find('</section>',marker)+len('</section>'); sec=c[ss:ee]
sec=rep(sec,'<b>8 nástrojů</b>','<b>9 nástrojů</b>','energy count'); sec=rep(sec,'<span>Zobrazit 8 nástrojů</span>','<span>Zobrazit 9 nástrojů</span>','energy mobile')
card='<a class="tool-card" data-category="energie-a-domacnost" data-search="kalkulačka rosného bodu rosný bod kondenzace vlhkost relativní vlhkost povrchová teplota okno stěna tepelný most energie domácnost" data-tool="" data-track-tool="/rosny-bod-kalkulacka.html" href="/rosny-bod-kalkulacka.html"><span class="tool-index">073</span><span class="tool-copy"><strong>Kalkulačka rosného bodu</strong><small>Rosný bod z teploty a vlhkosti plus kontrola povrchové kondenzace.</small></span><span class="tool-type">Vlhkost</span><span aria-hidden="true" class="tool-arrow">↗</span></a>'
pos=sec.rfind('</div></section>'); req(pos>=0,'energy insertion point'); sec=sec[:pos]+card+sec[pos:]; c=c[:ss]+sec+c[ee:]
count=0
def ren(m):
    global count; count+=1; return f'<span class="tool-index">{count:03d}</span>'
c=re.sub(r'<span class="tool-index">\d{3}</span>',ren,c); req(count==134,f'catalog cards {count}')
cp.write_text(c,encoding='utf-8')

# energy hub
hp=ROOT/'energie-a-domacnost.html'; h=hp.read_text(encoding='utf-8'); req(NEW_URL not in h,'already in hub')
for old,new in [('8 praktických kalkulaček','9 praktických kalkulaček'),('8 nástrojů','9 nástrojů'),('8 kalkulaček','9 kalkulaček')]: h=h.replace(old,new)
pat=re.compile(r'<script type="application/ld\+json">(.*?)</script>',re.S); done=False
def upd(m):
    global done
    try:d=json.loads(m.group(1))
    except:return m.group(0)
    if d.get('@type')=='ItemList' and d.get('name')=='Kalkulačky pro energie a domácnost':
        req(d.get('numberOfItems')==8,'hub JSON count'); els=d.get('itemListElement') or []; req(len(els)==8,'hub JSON items')
        els.append({'@type':'ListItem','position':9,'name':'Rosný bod a kondenzace','url':NEW_ABS}); d['numberOfItems']=9; d['itemListElement']=els; done=True
        return '<script type="application/ld+json">'+json.dumps(d,ensure_ascii=False,separators=(',',':'))+'</script>'
    return m.group(0)
h=pat.sub(upd,h); req(done,'hub JSON not updated')
# append visible tool card in tools section
start=h.find('class="tools-section"'); req(start>=0,'tools section missing'); end=h.find('</section>',start); req(end>start,'tools end missing')
sub=h[start:end]
# infer common card insertion immediately before last closing tool grid container in tools section
newcard='<a class="tool-card" href="/rosny-bod-kalkulacka.html"><span class="tool-no">09</span><div class="tool-icon">◌</div><h3>Rosný bod a kondenzace</h3><p>Rosný bod z teploty a vlhkosti plus kontrola povrchové kondenzace.</p><span class="tool-go">Spočítat rosný bod ↗</span></a>'
# choose before final </div></section> equivalent: last two div closings in section content
p=sub.rfind('</div>'); req(p>=0,'hub insert pos'); sub=sub[:p]+newcard+sub[p:]; h=h[:start]+sub+h[end:]
hp.write_text(h,encoding='utf-8')

# sitemap
sp=ROOT/'sitemap.xml'; s=sp.read_text(encoding='utf-8'); req(NEW_ABS not in s,'already sitemap')
block=f'\n<url>\n<loc>{NEW_ABS}</loc>\n<lastmod>{DATE}</lastmod>\n<changefreq>monthly</changefreq>\n<priority>0.84</priority>\n</url>\n'; req('</urlset>' in s,'urlset missing'); sp.write_text(s.replace('</urlset>',block+'</urlset>',1),encoding='utf-8')

# global search index
ip=ROOT/'rv-tool-index.js'; x=ip.read_text(encoding='utf-8'); req(NEW_URL not in x,'already index'); e=x.rfind('];'); req(e>=0,'index end')
entry='  {\n    "title": "Kalkulačka rosného bodu",\n    "url": "/rosny-bod-kalkulacka.html",\n    "type": "Vlhkost a kondenzace",\n    "desc": "Rosný bod z teploty a relativní vlhkosti plus kontrola povrchové kondenzace.",\n    "keywords": "rosný bod kondenzace relativní vlhkost povrchová teplota okno stěna tepelný most energie domácnost"\n  }\n'
prefix=x[:e].rstrip(); req(prefix.endswith('}'),'index malformed'); ip.write_text(prefix+',\n'+entry+x[e:],encoding='utf-8')

# assertions
rr=json.loads(rp.read_text(encoding='utf-8')); req(len(rr['items'])==134,'registry total'); req(sum(i.get('url')==NEW_URL for i in rr['items'])==1,'registry duplicate'); req(NEW_URL in cp.read_text(encoding='utf-8'),'catalog missing'); req(NEW_URL in hp.read_text(encoding='utf-8'),'hub missing'); req(NEW_ABS in sp.read_text(encoding='utf-8'),'sitemap missing'); req(NEW_URL in ip.read_text(encoding='utf-8'),'index missing')
wf=ROOT/'.github/workflows/rosny-release.yml'
if wf.exists(): wf.unlink()
shutil.rmtree(TMP)
print('Rosny bod integration complete: 134 catalogue tools, 9 energy tools, registry + hub + sitemap + search integrated.')
