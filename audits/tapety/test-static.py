"""Static checks only. Not a browser/accessibility certification."""
from html.parser import HTMLParser
from pathlib import Path
import gzip, json, re, hashlib
ROOT=Path(__file__).resolve().parents[2]
class Document(HTMLParser):
 def __init__(self):
  super().__init__();self.nodes=[];self.stack=[];self.scripts=[];self.script=None
 def handle_starttag(self,tag,attrs):
  attrs=dict(attrs);self.nodes.append((tag,attrs,tuple(self.stack)))
  if tag=='script' and attrs.get('type')=='application/ld+json':self.script=''
  if tag not in ['meta','link','img','input','br','hr']:self.stack.append(tag)
 def handle_endtag(self,tag):
  if tag=='script' and self.script is not None:self.scripts.append(self.script);self.script=None
  if tag in self.stack:self.stack=self.stack[:len(self.stack)-1-self.stack[::-1].index(tag)]
 def handle_data(self,data):
  if self.script is not None:self.script+=data
s=Document();s.feed((ROOT/'kalkulacka-tapet.html').read_text())
ids=[a['id'] for _,a,_ in s.nodes if 'id' in a]
assert len(ids)==len(set(ids)), 'duplicate IDs'
labels={a.get('for') for t,a,_ in s.nodes if t=='label'}
for t,a,parents in s.nodes:
 if t in ['input','select']:
  assert a.get('name'),a
  assert a.get('id') in labels or 'label' in parents,a
 for id in a.get('aria-describedby','').split():assert id in ids,id
assert sum(t=='h1' for t,_,_ in s.nodes)==1
assert any(t=='link' and a.get('rel')=='canonical' and a.get('href')=='https://rychlevypocty.cz/kalkulacka-tapet.html' for t,a,_ in s.nodes)
assert any(t=='meta' and a.get('name')=='robots' and a.get('content')=='noindex,follow' for t,a,_ in s.nodes)
assert {json.loads(j)['@type'] for j in s.scripts}=={'BreadcrumbList','WebApplication'}
base=json.loads((ROOT/'audits/tapety/base-assets.json').read_text())
refs=[]
for t,a,_ in s.nodes:
 for attr in ['href','src']:
  u=a.get(attr,'')
  if u.startswith('/') and not u.startswith('//'):
   path=u.split('?')[0].split('#')[0].lstrip('/')
   assert path=='' or path in base or (ROOT/path).exists(),path
   refs.append(path)
assets=['kalkulacka-tapet.html','tapety.css','tapety-core.js','tapety-page.js','rv-brand-v32.css','logo-rv-v32.svg','logo-rv-v32-inverse.svg','favicon-rv-v32.svg','rv-brand-field-v32.svg']
sizes={p:{'bytes':len((ROOT/p).read_bytes()),'gzipBytes':len(gzip.compress((ROOT/p).read_bytes())),'sha256':hashlib.sha256((ROOT/p).read_bytes()).hexdigest()} for p in assets}
# Nominal palette contrast, not computed-style coverage.
def luminance(h):
 c=[int(h[i:i+2],16)/255 for i in (1,3,5)];c=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in c];return sum(a*b for a,b in zip(c,[.2126,.7152,.0722]))
def contrast(a,b):
 x,y=sorted([luminance(a),luminance(b)]);return (y+.05)/(x+.05)
pairs=[('#132b46','#ffffff'),('#475467','#ffffff'),('#475467','#f5f7fa'),('#ffffff','#175cd3'),('#c9d8e9','#0b2543'),('#e1e9f2','#0b2543'),('#b42318','#ffffff'),('#854a0e','#ffffff'),('#125c3c','#eaf4ee'),('#e1e9f2','#071a33'),('#a1e4b6','#071a33')]
ratios=[{'foreground':a,'background':b,'ratio':round(contrast(a,b),2)} for a,b in pairs]
assert all(x['ratio']>=4.5 for x in ratios)
assert contrast('#768395','#ffffff')>=3
report={'staticChecks':'PASS','scope':'HTML source only, not computed browser state','localReferencesChecked':len(refs),'assets':sizes,'gzipTotal':sum(s['gzipBytes'] for s in sizes.values()),'paletteContrast':ratios,'viewports':{str(w):'NOT TESTED — browser policy blocked local preview' for w in [320,390,768,1024,1366,1440]}}
(ROOT/'audits/tapety/static-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(f"PASS: unique IDs, labels, error associations, schema syntax, canonical, preview noindex, {len(refs)} local references, nominal palette contrast.")
print(f"Initial asset gzip estimate: {report['gzipTotal']} bytes (not measured HTTP transfer).")
