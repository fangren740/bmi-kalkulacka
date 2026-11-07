import json,urllib.request,urllib.error,ssl,time,concurrent.futures
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin,urlsplit,urldefrag
import xml.etree.ElementTree as ET
ROOT=Path.cwd();OUT=ROOT/'seo50-output';OUT.mkdir(exist_ok=True)
urls=['http://rychlevypocty.cz/sitemap.xml','https://www.rychlevypocty.cz/planovac-dovolene.html','https://www.rychlevypocty.cz/kolik-me-stoji-dite-kalkulacka.html','https://www.rychlevypocty.cz/kalkulacka-slozeneho-uroku.html','https://rychlevypocty.cz/dpp-nebo-dpc-co-se-vyplati.html','https://rychlevypocty.cz/index.html','https://www.rychlevypocty.cz/prevodnik-men.html','https://rychlevypocty.cz/situace.html','https://rychlevypocty.cz/rekonstrukce.html','https://rychlevypocty.cz/osvc-danova-kalkulacka.html','https://rychlevypocty.cz/kalkulacka-prescasu.html','https://rychlevypocty.cz/navratnost-fotovoltaiky-kalkulacka.html']
class Page(HTMLParser):
 def __init__(self):super().__init__();self.links=[];self.canonical=[];self.robots=[]
 def handle_starttag(self,t,a):
  a=dict(a)
  if t=='a' and 'href'in a:self.links.append(a['href'])
  if t=='link' and a.get('rel')=='canonical':self.canonical.append(a.get('href'))
  if t=='meta' and a.get('name','').lower()=='robots':self.robots.append(a.get('content'))
class Redirect(urllib.request.HTTPRedirectHandler):
 def __init__(self):self.chain=[]
 def redirect_request(self,req,fp,code,msg,headers,newurl):self.chain.append(dict(url=req.full_url,status=code,location=newurl));return super().redirect_request(req,fp,code,msg,headers,newurl)
def fetch(url):
 red=Redirect();opener=urllib.request.build_opener(red);row={'url':url,'redirects':red.chain}
 try:
  with opener.open(urllib.request.Request(url,headers={'User-Agent':'RychleVypocty-SEO-verification/1.0'}),timeout=25) as res:
   body=res.read().decode('utf-8','replace');p=Page();p.feed(body);row.update(status=res.status,final_url=res.url,canonical=p.canonical,robots=p.robots,x_robots_tag=res.headers.get('X-Robots-Tag'),content_type=res.headers.get('Content-Type'))
 except urllib.error.HTTPError as e:row.update(status=e.code,final_url=e.url,error=str(e))
 except Exception as e:row.update(error=repr(e))
 return row
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:results=list(ex.map(fetch,urls))
(OUT/'http.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
# Static graph from the exact checked-out commit: source hyperlinks, not JS guesses.
links={};pages={}
for f in ROOT.glob('*.html'):
 p=Page();p.feed(f.read_text());pages[f.name]=p;links[f.name]=[urljoin('https://rychlevypocty.cz/'+f.name,x) for x in p.links]
sitemap=set(ET.parse(ROOT/'sitemap.xml').getroot().itertext());sitemap={x.strip() for x in sitemap if x.strip().startswith('http')}
graph={}
for url in urls:
 path=urlsplit(url).path.lstrip('/') or 'index.html';p=pages.get(path);incoming=[name for name,hrefs in links.items() if any(urlsplit(h).path.lstrip('/')==path and not urlsplit(h).query for h in hrefs)]
 graph[url]={'exists':p is not None or path=='sitemap.xml','canonical':p.canonical if p else [],'robots':p.robots if p else [],'in_sitemap_exact':url in sitemap,'in_sitemap_nonwww':'https://rychlevypocty.cz/'+path in sitemap,'incoming_source_pages':incoming}
bad=[]
for name,hrefs in links.items():
 for h in hrefs:
  u=urlsplit(h)
  if u.hostname in ['rychlevypocty.cz','www.rychlevypocty.cz']:
   path=u.path.lstrip('/') or 'index.html'
   if path.endswith('.html') and path not in pages:bad.append({'source':name,'target':h})
(OUT/'graph.json').write_text(json.dumps(graph,ensure_ascii=False,indent=2));(OUT/'broken-internal.json').write_text(json.dumps(bad,ensure_ascii=False,indent=2))
print(json.dumps({'http':results,'broken_internal':bad},ensure_ascii=False))
# Guard only verified behavior; do not equate successful fetches with Google indexing.
failures=[]
for row in results:
 url=row['url'];status=row.get('status')
 if url.endswith('/prevodnik-men.html'):
  if status!=404:failures.append(url+': review changed retired-URL behavior')
  continue
 if status!=200:failures.append(url+': expected final HTTP 200; '+str(row))
 if url.startswith(('http:','https://www.')):
  if len(row['redirects'])!=1 or row['redirects'][0]['status']!=301:failures.append(url+': expected one permanent redirect')
 if row.get('final_url','').endswith('.html'):
  expected='https://rychlevypocty.cz/'+urlsplit(url).path.lstrip('/')
  if url.endswith('/index.html'):expected='https://rychlevypocty.cz/'
  if url.endswith('/dpp-nebo-dpc-co-se-vyplati.html'):expected='https://rychlevypocty.cz/dpp-vs-dpc-vs-pracovni-pomer.html'
  if row.get('canonical')!=[expected]:failures.append(url+': unexpected canonical '+str(row.get('canonical')))
for row in results:
 if row.get('status')!=200 or not row.get('final_url','').endswith('.html'):continue
 noindex=any('noindex' in x.lower() for x in row.get('robots',[]))
 expected_noindex=row['url'].endswith('/dpp-nebo-dpc-co-se-vyplati.html')
 if noindex!=expected_noindex:failures.append(row['url']+': unexpected noindex state')
if bad:failures.append('Broken source hyperlinks: '+str(bad))
assert not failures,'\n'.join(failures)
print('PASS: 12 verified URL behaviors and source hyperlinks; this is not an indexing verdict')
