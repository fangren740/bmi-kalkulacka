import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderHomepageStudio} from '../../rv3/engine/sitewide-home.mjs';
import {extractMain,scriptsOf,getCanonical} from '../../rv3/engine/renderer.mjs';

const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const source=read('index.html');
const {html,manifest}=renderHomepageStudio(source);

test('Page studio homepage retains its own salary tool, user paths and 100% source script/main semantics',()=>{
 assert.equal(extractMain(html),extractMain(source));
 assert.deepEqual(scriptsOf(html),scriptsOf(source));
 assert.equal(getCanonical(html),'https://rychlevypocty.cz/');
 assert.equal(manifest.canonical,'https://rychlevypocty.cz/');
 assert.equal(manifest.status,'PREVIEW_DESIGN_ITERATION_NOT_FINAL');
 assert.ok(html.includes('id="offer-before"')&&html.includes('id="offer-after"'));
 assert.ok(html.includes('id="offer-difference"'));
 assert.ok(html.includes('id="tool-search"'));
 assert.ok(html.includes('data-intent-root'));
 assert.ok(html.includes('class="rv3w-home"'));
 assert.ok(html.includes('href="/rv3/sitewide/homepage.css"'));
 assert.ok(html.includes('content="noindex,nofollow,noarchive"'));
 assert.equal(html.split('name="robots"').length-1,1);
 assert.equal((html.toLowerCase().split('<h1').length-1),1);
 assert.equal(html.split('src="/logo-rv-v32.svg"').length-1,2);
});

test('Homepage stays user-friendly without additional heavy libraries or hidden copies',()=>{
 const css=read('rv3/sitewide/homepage.css');
 assert.ok(css.length<12000,'Unique homepage CSS too large');
 assert.ok(css.includes('.rv3w-home .first-screen'));
 assert.ok(css.includes('.rv3w-home .decision-board'));
 assert.ok(css.includes('.rv3w-home .rv3-footer-brand>a{background:transparent'));
 assert.ok(css.includes('max-width:580px'));
 assert.ok(css.includes('prefers-reduced-motion'));
 assert.ok(css.includes('.rv3w-home .hero-search .search-keystroke{display:none}'),'Preview must not display a fake search CTA');
 assert.match(source,/<span class="search-keystroke">HLEDAT ↗<\/span>/,'Root source affordance remains unchanged');
 assert.ok(!css.includes('@import'));
 assert.ok(!css.includes('url("http'));
 const builder=read('scripts/build-v3-engine-poc.mjs');
 assert.ok(builder.includes('renderHomepageStudio'));
 assert.ok(builder.includes("path.join(hubFolder,'index.html')"));
});

test('Canonical-URL drift is rejected and original homepage cannot mutate accidentally',()=>{
 assert.throws(()=>renderHomepageStudio(source.replace('https://rychlevypocty.cz/"><link rel="icon"',
   'https://rychlevypocty.cz/index.html"><link rel="icon"')),/Unexpected homepage semantics/);
});
