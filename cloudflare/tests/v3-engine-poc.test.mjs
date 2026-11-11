import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {POC_ROUTES,renderPrototypePage,extractMain,scriptsOf,getCanonical} from '../../rv3/engine/renderer.mjs';
const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
test('three different architectures render with one safe shared shell',()=>{
 assert.deepEqual(POC_ROUTES.map(x=>x.type),['catalog','external-js','inline-js']);
 for(const route of POC_ROUTES){
  const source=read(route.source);
  const {html,manifest}=renderPrototypePage(source,route);
  assert.equal(extractMain(html),extractMain(source),route.source+' main changed');
  assert.deepEqual(scriptsOf(html),scriptsOf(source),route.source+' scripts changed');
  assert.equal(getCanonical(html),getCanonical(source),route.source+' canonical changed');
  assert.equal((html.match(/<h1\b/gi)||[]).length,(source.match(/<h1\b/gi)||[]).length);
  assert.ok(html.includes('<base href="/">'),'asset base');
  assert.ok(html.includes('class="rv3e-footer"'));
  assert.ok(html.includes('class="rv3e-header"'));
  assert.ok(html.includes('hidden inert aria-hidden="true"'));
  assert.ok(html.includes('content="noindex,nofollow"'));
  assert.ok(html.includes('/rv3/poc-theme.css'));
  assert.equal(manifest.source,route.source);
  assert.equal(manifest.status,'preview-only-browser-unverified');
  assert.match(manifest.sourceMainSha256,/^[a-f0-9]{64}$/);
 }
});
test('fail-closed on unknown routes and broken SEO metadata',()=>{
 const source=read('hypotecni-kalkulacka.html');
 assert.throws(()=>renderPrototypePage(source,{source:'superdavka-kalkulacka.html',type:'external-js'}),/Unapproved/);
 assert.throws(()=>renderPrototypePage(source.replace(/<main\b/i,'<section'),POC_ROUTES[1]),/Missing main/);
 assert.throws(()=>renderPrototypePage(source.replace(/<link\b(?=[^>]*rel="canonical")[^>]*>/i,''),POC_ROUTES[1]),/Missing canonical/);
});
test('lightweight accessible prototype integration is included in Cloudflare build',()=>{
 const css=read('rv3/poc-theme.css');
 assert.ok(css.includes('@media(max-width:820px)'));
 assert.ok(css.includes('focus-visible'));
 assert.ok(css.includes('prefers-reduced-motion'));
 assert.ok(!css.includes('@import'));
 assert.ok(css.length<10000);
 const build=read('scripts/build-cloudflare-preview.mjs');
 assert.ok(build.includes('buildPrototype({root,output})'));
 assert.ok(build.includes("ent.name==='engine'"));
});
