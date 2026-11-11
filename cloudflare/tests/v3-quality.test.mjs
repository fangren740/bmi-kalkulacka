import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const read=path=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');
const pages=[
 ['index.html','https://rychlevypocty.cz/'],
 ['mzdy-a-prace.html','https://rychlevypocty.cz/mzdy-a-prace.html'],
 ['cista-mzda-kalkulacka.html','https://rychlevypocty.cz/cista-mzda-kalkulacka.html']
];

test('SEO semantics retain unique canonical titles, visible landmarks and true JSON-LD',()=>{
 for(const [path,canonical] of pages){
  const h=read(path);
  const title=h.match(/<title>([^<]+)<\/title>/g)||[];
  assert.equal(title.length,1,path+' title duplication');
  assert.equal((h.match(/<meta name="description" /g)||[]).length,1,path+' description duplication');
  assert.equal((h.match(/<meta property="og:title" /g)||[]).length,1,path+' OG title duplication');
  assert.equal((h.match(/<h1\b/g)||[]).length,1,path+' must have one main heading');
  assert.ok(h.includes('rel="canonical" href="'+canonical+'"'),path+' canonical');
  const schemaBlocks=[...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.equal(schemaBlocks.length,1,path+' JSON-LD count');
  const graph=JSON.parse(schemaBlocks[0][1])['@graph'];
  assert.ok(graph.find(x=>x['@type']==='Organization'));
  assert.ok(graph.find(x=>x['@type']==='WebSite'));
  assert.ok(graph.find(x=>x.url===canonical));
  if(path!=='index.html')assert.ok(graph.find(x=>x['@type']==='BreadcrumbList'));
  assert.ok(h.includes('id="main"'),path+' skip target missing');
  const divOpen=(h.match(/<div\b/g)||[]).length;
  const divClose=(h.match(/<\/div>/g)||[]).length;
  assert.equal(divOpen,divClose,path+' div nesting count mismatch');
  assert.equal((h.match(/<section\b/g)||[]).length,(h.match(/<\/section>/g)||[]).length,path+' section count mismatch');
 }
});

test('all pilot internal links and critical OG assets resolve to existing repository files',()=>{
 for(const [path] of pages){
  const h=read(path);
  for(const m of h.matchAll(/(?:href|src)="(\/[^"#?]+)[^"]*"/g)){
   const pathname=m[1]; if(pathname==='/')continue;
   const target=new URL('../../'+pathname.substring(1),import.meta.url);
   assert.ok(existsSync(fileURLToPath(target)),path+' missing link or asset: '+pathname);
  }
  const og=h.match(/<meta property="og:image" content="https:\/\/rychlevypocty\.cz\/([^"]+)"/);
  assert.ok(og,path+' missing OG artwork');
  assert.ok(existsSync(fileURLToPath(new URL('../../'+og[1],import.meta.url))),path+' OG image not found');
 }
});

test('evidence-first premium footer remains consistent on all pilot pages',()=>{
 const all=pages.map(([p])=>read(p).match(/<footer class="rv3-site-footer"[\s\S]*?<\/footer>/)?.[0]);
 for(const f of all){
  assert.ok(f,'footer missing');
  for(const href of ['kalkulacka-priplatku-za-smeny.html','jak-pocitame.html','redakcni-zasady.html','ochrana-osobnich-udaju.html','podminky-pouziti.html','kontakt.html']){
   assert.ok(f.includes('href="/'+href+'"'),'footer missing '+href);
  }
 }
 assert.ok(all.every(x=>x===all[0]),'shared footer drift between pilot pages');
 assert.ok(pages.every(([p])=>read(p).includes('class="rv3-footer-prelude"')),'methodology prelude missing');
});

test('fast static asset budget, preview SEO isolation, no remote fonts or dependency scripts',()=>{
 const css=read('rv3/foundation.css');
 const js=read('rv3/product-ui.js');
 assert.ok(Buffer.byteLength(css,'utf8')<53000,'CSS budget exceeded: '+css.length);
 assert.ok(Buffer.byteLength(js,'utf8')<16000,'UI JS budget exceeded: '+js.length);
 assert.ok(css.includes('.rv3-site-footer')&&css.includes('.shift-timebar'));
 assert.ok(!css.includes('.disc-disc'),'retired meaningless decorative disc survived CSS reduction');
 for(const [p] of pages){
  const h=read(p);
  const scriptTags=h.split('<script').slice(1).map(tag=>tag.split('>')[0]);
  const styleTags=h.split('<link').slice(1).map(tag=>tag.split('>')[0]).filter(tag=>tag.includes('rel="stylesheet"'));
  for(const tag of [...scriptTags,...styleTags]){
    assert.ok(!tag.includes('src="http')&&!tag.includes('href="http'),p+' loads external runtime resource');
  }
 }
 const worker=read('cloudflare/preview-worker.mjs');
 assert.ok(worker.includes("h.set('X-Robots-Tag','noindex, nofollow, noarchive')"),'preview noindex missing');
 assert.ok(worker.includes('Disallow: /'),'preview robots blocking missing');
 assert.ok(worker.includes("url.pathname='/index.html'"),'root asset mapping missing');
});

test('night-shift artwork shows a truthful 12-hour time split with labels',()=>{
 const home=read('index.html');
 assert.ok(home.includes('aria-label="Příklad dvanáctihodinové směny'));
 assert.ok(home.includes('--hours:3')&&home.includes('--hours:8')&&home.includes('--hours:1'));
 assert.ok(home.includes('19:00')&&home.includes('22:00')&&home.includes('06:00')&&home.includes('07:00'));
});

test('search inventory covers actual existing tools and is fetched only on demand',()=>{
 const source=read('rv-tool-index.js');
 const items=JSON.parse(source.slice(source.indexOf('['),source.lastIndexOf(']')+1));
 assert.ok(items.length>=100,'original real catalog was unexpectedly truncated');
 for(const item of items){
  assert.ok(item.url.startsWith('/')&&item.url.endsWith('.html'),'invalid tool URL: '+item.url);
  assert.ok(existsSync(fileURLToPath(new URL('../..'+item.url,import.meta.url))),'catalog dead link: '+item.url);
 }
 const ui=read('rv3/product-ui.js');
 assert.ok(ui.includes("fetch('/rv3/tool-search-index.json'"),'search should load the verified index lazily');
 const build=read('scripts/build-cloudflare-preview.mjs');
 assert.ok(build.includes("writeFile(path.join(output,'rv3/tool-search-index.json')"),'build must emit the search asset');
 assert.ok(build.includes("Invalid search destination:"),'build must reject stale destinations');
});

test('bottom-of-page rhythm: no duplicate motivational green sections',()=>{
 const home=read('index.html');
 const css=read('rv3/foundation.css');
 assert.ok(!home.includes('class="closing-note"'),'remove repetitive green stripe above trust prelude');
 assert.ok(!css.includes('.closing-note{'),'retired section stylesheet must not bloat CSS');
 assert.ok(css.includes('.rv3-footer-prelude{background:#fff;'),'trust prelude is distinct neutral surface');
 const trust=home.indexOf('class="rv3-footer-prelude"'),catalog=home.indexOf('class="library-section"');
 assert.ok(catalog>=0&&trust>catalog,'trust section must follow the catalog');
 assert.equal((home.match(/Nedáváme vám/g)||[]).length,1,'unique trust message');
});

test('mobile safe contracts for search and large calculated numbers',()=>{
 const css=read('rv3/foundation.css');
 assert.ok(css.includes('.first-screen{overflow:visible;z-index:1}'),'overlay must not be clipped by hero');
 assert.ok(css.includes('.hero-search .finder-results{max-height:')&&css.includes('overflow-y:auto'),'search overlay must fit viewport');
 assert.ok(css.includes('.answer-number{white-space:normal;overflow-wrap:anywhere}'),'offer result must wrap safely');
 assert.ok(css.includes('.studio-calc-workspace .calc-result-main strong{white-space:normal;overflow-wrap:anywhere}'),'salary result must wrap safely');
});

test('2026 salary educational section retains source depth and honest traceability',()=>{
 const h=read('cista-mzda-kalkulacka.html');
 assert.ok(h.indexOf('id="s-form"')<h.indexOf('id="podrobna-metodika"'));
 for(const item of ['7,1 %','4,5 %','24,8 %','2 570 Kč','146 901 Kč','2 350 416 Kč','35 600 Kč','60 210 Kč'])assert.ok(h.includes(item),'missing 2026 parameter '+item);
 for(const domain of ['financnisprava.gov.cz','mpsv.gov.cz','www.cssz.gov.cz','www.vzp.cz'])assert.ok(h.includes(domain),'source missing: '+domain);
 assert.ok((h.match(/<details><summary>/g)||[]).length>=5);
 assert.ok(Buffer.byteLength(read('rv3/salary-guide.css'),'utf8')<4000);
});

test('shared footer back-to-top link returns to page top, not main content',()=>{
 for(const [path] of pages){
  const html=read(path);
  assert.ok(html.includes('<body id="top">'),path+' needs top anchor');
  assert.ok(html.includes('class="rv3-footer-top" href="#top"'),path+' back to top destination');
 }
});
