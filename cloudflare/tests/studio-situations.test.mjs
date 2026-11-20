import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseSituations,renderSituationsStudio} from '../../rv3/engine/studio-situations.mjs';
import {getCanonical} from '../../rv3/engine/renderer.mjs';
const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const source=read('situace.html'),template=read('rv3/engine/situations.template.html');
const css=read('rv3/sitewide/situations.css'),js=read('rv3/sitewide/situations.js');
test('situations: 28 unique source-backed decisions across seven topics',()=>{
 const a=parseSituations(source);
 assert.equal(a.length,28);assert.equal(new Set(a.map(x=>x.id)).size,28);
 assert.equal(new Set(a.map(x=>x.title)).size,28);
 assert.equal(new Set(a.map(x=>x.group)).size,7);
 for(const g of new Set(a.map(x=>x.group)))assert.equal(a.filter(s=>s.group===g).length,4);
 for(const s of a)assert.equal(s.links.length,2);
});
test('situations: canonical and structured data copied into noindexed new design',()=>{
 const {html,manifest}=renderSituationsStudio(source,template);
 assert.equal(getCanonical(html),getCanonical(source));
 assert.match(html,/noindex,nofollow,noarchive/);
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
 assert.equal((html.match(/<main\b/g)||[]).length,1);
 assert.equal((html.match(/class="rv3s-card"/g)||[]).length,28);
 assert.equal((html.match(/application\/ld\+json/g)||[]).length,2);
 assert.equal(manifest.sourceSituationCount,28);
 assert.equal(manifest.sourceLinkCount,56);
 assert.equal(manifest.browserQa,'NOT_VERIFIED');
});
test('situations: all original situation links retained and visibly actionable',()=>{
 const {html}=renderSituationsStudio(source,template);
 for(const item of parseSituations(source)){
  assert.ok(html.includes(item.title));
  for(const link of item.links)assert.ok(html.includes('href="'+link.url+'"'));
 }
 assert.ok(html.includes('src="/logo-rv-v32.svg"'));
 assert.ok(!html.includes('rv-trust-v7.css'));
});
test('situations: source and schema fail closed on drift',()=>{
 assert.throws(()=>parseSituations(source.replace('data-topic="Peníze doma"','data-topic="Rozpočet"')),/fingerprint/);
 assert.throws(()=>renderSituationsStudio(source,template.replace('noindex,nofollow,noarchive','index,follow')),/robots/);
 assert.throws(()=>renderSituationsStudio(source,template.replace('{{GROUPS}}','')),/placeholder/);
});
test('situations: progressive search and mobile access without tracking',()=>{
 assert.match(js,/normalize\('NFD'\)/);
 assert.match(js,/aria-pressed/);
 assert.match(js,/addEventListener\('input'/);
 assert.match(js,/addEventListener\('submit'/);
 assert.match(css,/@media\(max-width:520px\)/);
 assert.match(css,/focus-visible/);
 assert.match(css,/prefers-reduced-motion/);
 assert.ok(!js.includes('localStorage'));
 assert.ok(!js.includes('fetch('));
});
