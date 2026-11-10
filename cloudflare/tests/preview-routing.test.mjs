import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import worker from '../preview-worker.mjs';
const config=JSON.parse(fs.readFileSync(new URL('../../wrangler.jsonc',import.meta.url),'utf8'));

test('deployment strictly preview-only and exact .html routes',()=>{
 assert.equal(config.name,'rychlevypocty-v3-preview');
 assert.equal(config.assets.html_handling,'none');
 assert.equal(config.assets.not_found_handling,'404-page');
 assert.equal(config.assets.run_worker_first,true);
 assert.equal(config.assets.binding,'ASSETS');
 assert.equal(config.preview_urls,true);
 assert.ok(!Object.hasOwn(config,'routes'));
 assert.ok(!Object.hasOwn(config,'route'));
});

function fakeAssets(){
 const paths=[];
 return {paths, ASSETS:{async fetch(req){
   const p=new URL(req.url).pathname;paths.push(p);
   if(p==='/unknown-url.html')return new Response('<h1>404</h1>',{status:404,headers:{'Content-Type':'text/html'}});
   return new Response(p,{status:200,headers:{'Content-Type':p.endsWith('.css')?'text/css':'text/html','Location':'/never-redirect'}});
 }}};
}
for(const name of ['/', '/cista-mzda-kalkulacka.html','/mzdy-a-prace.html','/kalkulacka-priplatku-za-smeny.html','/rv3/site.css','/rv3/salary-engine.js','/sitemap.xml']){
 test('no redirects; noindex for '+name,async()=>{
   const {paths,ASSETS}=fakeAssets();
   const r=await worker.fetch(new Request('https://preview.example.test'+name),{ASSETS});
   assert.equal(r.status,200);
   assert.ok(![301,302,307,308].includes(r.status));
   assert.match(r.headers.get('X-Robots-Tag'),/noindex/);
   assert.equal(paths[0],name==='/'?'/index.html':name);
 });
}
test('robots blocks indexing',async()=>{
 const {ASSETS}=fakeAssets();
 const r=await worker.fetch(new Request('https://preview.example.test/robots.txt'),{ASSETS});
 assert.equal(r.status,200);
 assert.match(await r.text(),/Disallow: \/\s*$/m);
 assert.match(r.headers.get('X-Robots-Tag'),/noindex/);
});
test('404 has real 404 status, not SPA fallback',async()=>{
 const {ASSETS}=fakeAssets();
 const r=await worker.fetch(new Request('https://preview.example.test/unknown-url.html'),{ASSETS});
 assert.equal(r.status,404);
 assert.match(r.headers.get('X-Robots-Tag'),/noindex/);
});
test('HEAD and invalid HTTP methods',async()=>{
 const {ASSETS}=fakeAssets();
 const h=await worker.fetch(new Request('https://preview.example.test/',{method:'HEAD'}),{ASSETS});
 assert.equal(h.status,200);assert.equal(await h.text(),'');assert.match(h.headers.get('X-Robots-Tag'),/noindex/);
 const x=await worker.fetch(new Request('https://preview.example.test/',{method:'POST'}),{ASSETS});
 assert.equal(x.status,405);assert.match(x.headers.get('X-Robots-Tag'),/noindex/);
});
