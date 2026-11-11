import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {renderStudioCatalog} from '../../rv3/engine/catalog.mjs';
const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const src=read('rv-tool-index.js');
const items=JSON.parse(src.slice(src.indexOf('['),src.lastIndexOf(']')+1));

test('Studio directory is static-first and includes all 135 validated local destinations',()=>{
 const {html,report}=renderStudioCatalog(items);
 assert.equal(report.tools,135);
 assert.equal(report.groups.length,9);
 assert.equal(report.groups.reduce((sum,g)=>sum+g.count,0),135);
 assert.equal((html.match(/data-tool-card/g)||[]).length,135);
 assert.equal((html.match(/class="rv3c-group"/g)||[]).length,9);
 assert.ok(html.includes('id="rv3c-search"'));
 assert.ok(html.includes('role="status" aria-live="polite"'));
 assert.ok(html.includes('content="noindex,nofollow,noarchive"'));
 assert.ok(html.includes('<main id="main">'));
 assert.ok(html.includes('<title>Studio katalog V3'));
 assert.ok(!html.includes('<base '),'in-page anchors must not point to the root');
 const anchors=[...html.matchAll(/<article class="rv3c-card"[\s\S]*?<a href="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(anchors.length,135);
 assert.deepEqual(anchors.slice().sort(),items.map(x=>x.url).slice().sort());
 for(const href of anchors){
  const target=fileURLToPath(new URL('../../'+href.substring(1),import.meta.url));
  assert.ok(existsSync(target),'missing catalog route '+href);
 }
 assert.ok(!/<script(?![^>]*src=)/i.test(html),'no inline bootloader needed for catalog');
});

test('user search is local, accessible and works without JavaScript for navigation',()=>{
 const script=read('rv3/catalog-studio.js');
 const css=read('rv3/catalog-studio.css');
 assert.ok(!script.includes('fetch('),'user queries must never leave browser');
 assert.ok(!script.includes('localStorage'),'search should not persist personal queries');
 for(const term of ['aria-pressed','aria-live','data-category','data-search','normalize','Escape','ctrlKey','apply()']){
  assert.ok(script.includes(term)||read('rv3/engine/catalog.mjs').includes(term),'missing UX behavior '+term);
 }
 assert.ok(css.includes('max-width:480px'));
 assert.ok(css.includes('prefers-reduced-motion'));
 assert.ok(css.length<11000);
 const html=renderStudioCatalog(items).html;
 assert.ok(html.includes('id="rv3c-empty" class="rv3c-empty" hidden'));
 assert.equal((html.match(/<article class="rv3c-card" data-tool-card/g)||[]).length,135,
  'all tool links must be present in initial HTML and visible without JS');
});

test('catalog rejects stale source ordering, invalid paths and unsafe HTML injection',()=>{
 assert.throws(()=>renderStudioCatalog(items.slice(0,134)),/exactly 135/);
 const permuted=[...items];[permuted[0],permuted[1]]=[permuted[1],permuted[0]];
 assert.throws(()=>renderStudioCatalog(permuted),/Source order changed/);
 const invalid=items.map(x=>({...x}));invalid[12].url='/../private.html';
 assert.throws(()=>renderStudioCatalog(invalid),/Invalid\/duplicate/);
 const encoded=items.map(x=>({...x}));encoded[10].title='Název <img src=x onerror=alert(1)>';
 const html=renderStudioCatalog(encoded).html;
 assert.ok(!html.includes('<img src=x onerror='),'HTML-like titles must be escaped');
 assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
});

test('Cloudflare generator builds the catalog under /rv3/poc/ only',()=>{
 const generator=read('scripts/build-v3-engine-poc.mjs');
 assert.ok(generator.includes("renderStudioCatalog(tools)"));
 assert.ok(generator.includes("'studio-katalog.html'"));
 assert.ok(generator.includes("reports.push(studio.report)"));
 assert.ok(!generator.includes("'../index.html'"));
});
