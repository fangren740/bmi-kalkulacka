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
   assert.ok(!/<script\\b[^>]*\\bsrc="https?:\\/\\//.test(h),p+' loads remote JS');
   for(const tag of h.match(/<link\\b[^>]*>/g)||[]){
     if(/rel="stylesheet"/.test(tag))assert.ok(!/href="https?:\\/\\//.test(tag),p+' loads remote CSS');
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
