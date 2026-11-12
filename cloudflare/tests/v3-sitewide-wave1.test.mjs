import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderHubWave1,HUB_WAVE1_ROUTES} from '../../rv3/engine/sitewide-hubs.mjs';
import {extractMain,scriptsOf,getCanonical} from '../../rv3/engine/renderer.mjs';

const read=path=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');
const css=read('rv3/sitewide/foundation.css')+read('rv3/sitewide/hub-wave1.css');

test('Wave 1: finance and OSVC keep original main, scripts, canonical and title byte-for-byte',()=>{
 assert.deepEqual(HUB_WAVE1_ROUTES.map(x=>x.source),['finance-a-hypoteky.html','osvc-a-freelancing.html']);
 for(const route of HUB_WAVE1_ROUTES){
  const source=read(route.source);
  const {html,manifest}=renderHubWave1(source,route);
  assert.equal(extractMain(html),extractMain(source),'main changed '+route.source);
  assert.deepEqual(scriptsOf(html),scriptsOf(source),'scripts changed '+route.source);
  assert.equal(getCanonical(html),getCanonical(source),'canonical changed '+route.source);
  assert.equal(html.toLowerCase().split('<h1').length,source.toLowerCase().split('<h1').length);
  assert.ok(html.includes('<meta name="robots" content="noindex,nofollow,noarchive">'));
  assert.equal(html.split('name="robots"').length-1,1);
  assert.ok(html.includes('href="/rv3/sitewide/foundation.css"'));
  assert.ok(html.includes('href="/rv3/sitewide/hub-wave1.css"'));
  assert.ok(html.includes('class="rv3w-legacy" hidden inert aria-hidden="true"'));
  assert.ok(html.includes('src="/logo-rv-v32.svg"'));
  assert.ok(html.includes('rv3w-'+route.family));
  assert.equal(manifest.status,'preview-only-browser-unverified');
  assert.match(manifest.preserveMainSha256,/^[a-f0-9]{64}$/);
 }
});

test('Wave 1 adapters fail closed: no generic unknown URL rewrites',()=>{
 const source=read('osvc-a-freelancing.html');
 assert.throws(()=>renderHubWave1(source,{source:'superdavka-kalkulacka.html',family:'osvc'}),/Unapproved/);
 assert.throws(()=>renderHubWave1(source,{source:'osvc-a-freelancing.html',family:'finance'}),/Unapproved/);
});

test('Wave 1 shared visual system is scoped and responsive, with accessible navigation',()=>{
 assert.ok(css.includes('.rv3w-page'));
 assert.ok(css.includes('max-width:580px'));
 assert.ok(css.includes('prefers-reduced-motion'));
 assert.ok(css.includes(':focus-visible'));
 assert.ok(css.includes('.rv3d-footer-brand img'));
 assert.ok(!css.includes('url(https://'));
 const shell=read('rv3/engine/shell-v2.mjs');
 assert.ok(shell.includes('logo-rv-v32.svg'));
 assert.ok(shell.includes('aria-current="page"'));
 const builder=read('scripts/build-v3-engine-poc.mjs');
 assert.ok(builder.includes('HUB_WAVE1_ROUTES'));
 assert.ok(builder.includes("path.join(output,'rv3','wave1')"));
});
