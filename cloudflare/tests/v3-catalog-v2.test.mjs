import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {renderCatalogV2} from '../../rv3/engine/catalog-v2.mjs';
import {normalizeCzech,isGenericQuery,rankTools} from '../../rv3/catalog-v2-search-core.mjs';
const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const source=read('rv-tool-index.js');
const tools=JSON.parse(source.slice(source.indexOf('['),source.lastIndexOf(']')+1));
const taxonomy=JSON.parse(read('rv3/engine/catalog-v2.taxonomy.json'));
const render=()=>renderCatalogV2(tools,taxonomy);
const byUrl=new Map(tools.map(x=>[x.url,x]));

test('decision-first navigation: six fast paths, eight collapsed areas, no card wall',()=>{
 const {html,report}=render();
 assert.equal(report.total,135);
 assert.equal(report.groups.length,8);
 assert.equal(report.groups.reduce((a,x)=>a+x.count,0),135);
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
 assert.equal((html.match(/class="rv3d-quick-ordinal"/g)||[]).length,6);
 assert.equal((html.match(/<details class="rv3d-domain"/g)||[]).length,8);
 assert.equal((html.match(/<details class="rv3d-more-tools"/g)||[]).length,8);
 assert.ok(!html.includes('<details class="rv3d-domain" open'),'all domains should be collapsed by default');
 assert.ok(!html.includes('class="rv3c-card"'),'never show 135 cards to users by default');
 assert.ok(html.includes('id="rv3d-search"'));
 assert.ok(html.includes('aria-expanded="false"'));
 assert.ok(html.includes('<noscript>'));
 assert.ok(html.includes('id="main"'));
 assert.ok(html.includes('content="noindex,nofollow,noarchive"'));
 assert.ok(!html.includes('<base '),'in-page anchors must not be redirected');
 assert.ok(Buffer.byteLength(html,'utf8')<125000,'HTML transfer-source budget exceeded');
});

test('all 135 real tools are present exactly once inside accessible category details',()=>{
 const {html}=render();
 const paths=[...html.matchAll(/class="rv3d-tool-link [^"]+" href="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(paths.length,135);
 assert.equal(new Set(paths).size,135);
 assert.deepEqual(paths.slice().sort(),tools.map(x=>x.url).sort());
 for(const path of paths){
   assert.ok(existsSync(fileURLToPath(new URL('../../'+path.slice(1),import.meta.url))),'broken URL: '+path);
 }
 const quickLinks=[...html.matchAll(/<li><a href="([^"]+)"><span class="rv3d-quick-ordinal"/g)].map(x=>x[1]);
 assert.deepEqual(quickLinks,taxonomy.quickRoutes.map(x=>x.url));
 assert.equal((html.match(/<div class="rv3d-domain-column">/g)||[]).length,2,'independent columns prevent holes');
 assert.ok(html.includes('class="rv3d-domain-count"'));
});

test('Czech search prefers relevant tools, supports diacritics and normal questions',()=>{
 assert.equal(normalizeCzech(' PříPLAtky  ZA  SMĚNY '),'priplatky za smeny');
 const chosen=new Set(taxonomy.quickRoutes.map(r=>r.url));
 const categories=new Map(taxonomy.groups.flatMap(g=>g.routes.map(url=>[url,g.title])));
 const index=tools.map(item=>({
  href:item.url,title:item.title,description:item.desc,
  search:[item.title,taxonomy.aliases[item.url]||'',categories.get(item.url),item.type,item.desc,item.keywords].filter(Boolean).join(' ').slice(0,260),
  quick:chosen.has(item.url)
 }));
 const cases=[
  ['čistá mzda','/cista-mzda-kalkulacka.html'],
  ['kolik dostanu na účet','/cista-mzda-kalkulacka.html'],
  ['hypotéka','/hypotecni-kalkulacka.html'],
  ['dpp','/dpp-dpc-kalkulacka.html'],
  ['příplatky za směny','/kalkulacka-priplatku-za-smeny.html'],
  ['dovolená','/kalkulacka-dovolene.html'],
  ['pracák','/podpora-v-nezamestnanosti-kalkulacka.html'],
  ['procenta','/procenta-kalkulacka.html']
 ];
 for(const [query,target] of cases){
   const found=rankTools(index,query).slice(0,5).map(x=>x.href);
   assert.ok(found.includes(target),query+' did not suggest expected '+target+'; got '+found.join(', '));
 }
 for(const [q,expected] of [
  ['čistá mzda','/cista-mzda-kalkulacka.html'],
  ['hypotéka','/hypotecni-kalkulacka.html'],
  ['dovolená','/kalkulacka-dovolene.html']
 ]){
  assert.equal(rankTools(index,q)[0]?.href,expected,'the direct calculator should be #1 for '+q);
 }
 assert.deepEqual(rankTools(index,'xyzqplmzzx'),[]);
 assert.deepEqual(rankTools(index,'a'),[]);
 for(const query of ['kolik','jak','na','jak mi','co mam','kolik mi']) {
  assert.deepEqual(rankTools(index,query),[],'stopword-only search should not show arbitrary tools: '+query);
 }
});


test('typo recovery is conservative: exact results first, one full-word typo only',()=>{
 const chosen=new Set(taxonomy.quickRoutes.map(r=>r.url));
 const categories=new Map(taxonomy.groups.flatMap(g=>g.routes.map(url=>[url,g.title])));
 const index=tools.map(item=>({
  href:item.url,title:item.title,description:item.desc,
  search:[item.title,taxonomy.aliases[item.url]||'',categories.get(item.url),item.type,item.desc,item.keywords].filter(Boolean).join(' ').slice(0,260),
  quick:chosen.has(item.url)
 }));
 for(const [query,target] of [
  ['hipoteka','/hypotecni-kalkulacka.html'],
  ['hypotkea','/hypotecni-kalkulacka.html'],
  ['dovloena','/kalkulacka-dovolene.html'],
  ['priplatki za smeny','/kalkulacka-priplatku-za-smeny.html']
 ]){
  assert.equal(rankTools(index,query)[0]?.href,target,'one typo should recover '+query);
 }
 assert.equal(rankTools(index,'hypotéka')[0]?.href,'/hypotecni-kalkulacka.html');
 assert.deepEqual(rankTools(index,'xzzqprmn'),[],'unknown words should not create irrelevant matches');
 assert.deepEqual(rankTools(index,'a'),[],'short queries must not trigger typo search');
});

test('taxonomy and routing fail closed rather than silently dropping or inventing pages',()=>{
 assert.throws(()=>renderCatalogV2(tools.slice(1),taxonomy),/expected 135/);
 const t=structuredClone(taxonomy);
 t.groups[0].routes[0]='/made-up-calculator.html';
 assert.throws(()=>renderCatalogV2(tools,t),/Missing or duplicate route/);
 const duplicate=structuredClone(taxonomy);
 duplicate.groups[0].routes.push(duplicate.groups[1].routes[0]);
 assert.throws(()=>renderCatalogV2(tools,duplicate),/Missing or duplicate route/);
 const malicious=tools.map(x=>({...x}));
 malicious[0].title='<img src=x onerror=alert(1)>';
 const html=renderCatalogV2(malicious,taxonomy).html;
 assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'),'must escape source metadata');
 assert.ok(!html.includes('<img src=x onerror=alert(1)>'),'unsafe HTML entered generated page');
});

test('no remote JS, no query logging, keyboard and mobile accessibility built in',()=>{
 const html=render().html;
 const ui=read('rv3/catalog-v2-ui.mjs');
 const css=read('rv3/catalog-v2.css');
 const shell=read('rv3/engine/shell-v2.mjs');
 assert.equal((html.match(/<script\b/g)||[]).length,1);
 assert.ok(html.includes('type="module" src="/rv3/catalog-v2-ui.mjs"'));
 assert.ok(!ui.includes('fetch(')&&!ui.includes('localStorage')&&!ui.includes('sendBeacon'),'local search should not track queries');
 assert.ok(ui.includes('ArrowDown')&&ui.includes('ArrowUp')&&ui.includes('Escape')&&ui.includes('ctrlKey'));
 assert.ok(ui.includes('aria-expanded'));
 assert.ok(html.includes('role="status" aria-live="polite"'));
 assert.ok(css.includes('max-width:580px')&&css.includes('prefers-reduced-motion'));
 assert.ok(css.includes('.rv3d-domain-grid{display:grid'));
 assert.ok(css.includes('.rv3d-domain-column'));
 assert.ok(shell.includes('logo-rv-v32.svg'));
 assert.ok(Buffer.byteLength(css,'utf8')<18000,'CSS must not become bloated');
 assert.ok(Buffer.byteLength(ui,'utf8')<6000,'search UI JS must stay lightweight');
 const build=read('scripts/build-v3-engine-poc.mjs');
 assert.ok(build.includes("renderCatalogV2(tools,taxonomy)"));
 assert.ok(build.includes("'katalog-v2.html'"));
});

test('generic Czech questions receive a clarification hint, not a false no-match',()=>{
 const ui=read('rv3/catalog-v2-ui.mjs');
 assert.ok(ui.includes("import {isGenericQuery,rankTools}"), 'generic-query logic must be shared with ranking');
 assert.ok(!ui.includes('const genericWords=new Set'), 'do not duplicate stopword dictionaries');
 assert.ok(ui.includes('isGenericQuery(input.value)'), 'detect intent-free queries');
 assert.ok(ui.includes('Upřesněte, co chcete spočítat'), 'give a helpful refinement prompt');
 assert.ok(ui.includes('Upřesněte dotaz'), 'accessible live status must distinguish generic questions');
 assert.ok(ui.includes('Pro tento dotaz nemáme shodu'), 'keep the genuine no-result state');
});


test('generic-query hints use the same normalized stopwords as the search engine',()=>{
 for(const query of ['kolik','jak mi','co mám','Kolik mi','JAK SE','vypocet','KALKULAČKA']){
  assert.equal(isGenericQuery(query),true,query+' should request clarification');
  assert.deepEqual(rankTools([{title:'Něco',search:'kolik jak výpočet',quick:true}],query),[],query+' must not show arbitrary results');
 }
 for(const query of ['','   ','hypotéka','kolik dostanu na účet','podpora na pracáku']){
  assert.equal(isGenericQuery(query),false,query+' should not be treated as generic');
 }
});
