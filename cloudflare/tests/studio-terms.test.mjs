import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderTermsStudio,TERMS_TOPICS} from '../../rv3/engine/studio-terms.mjs';
import {extractMain,getCanonical} from '../../rv3/engine/renderer.mjs';
const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const source=read('podminky-pouziti.html');
const template=read('rv3/engine/terms.template.html');
const css=read('rv3/sitewide/terms.css');
const render=()=>renderTermsStudio(source,template);
test('terms: all eight exact source chapters intact, no invented legal assertions',()=>{
 const {html,manifest}=render();
 const chunks=[...extractMain(source).matchAll(/<section class="card">([\s\S]*?)<\/section>/g)].map(x=>x[1]);
 assert.equal(chunks.length,8);assert.equal(manifest.chapters,8);
 assert.equal(manifest.sourceChaptersVerbatim,true);
 for(const chapter of chunks)assert.equal(html.split(chapter).length,2);
 assert.equal((html.match(/<main\b/g)||[]).length,1);
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
});
test('terms: eight working anchor routes and authentic contact',()=>{
 const {html}=render();
 for(const [id] of TERMS_TOPICS){
  assert.ok(html.includes('id="'+id+'"'));
  assert.ok(html.includes('href="#'+id+'"'));
 }
 assert.ok(html.includes('mailto:rychlevypocty@seznam.cz'));
 assert.ok(html.includes('src="/logo-rv-v32.svg"'));
});
test('terms: SEO invariants with preview noindex',()=>{
 const {html,manifest}=render();
 assert.equal(getCanonical(html),getCanonical(source));
 assert.match(html,/noindex,nofollow,noarchive/);
 assert.equal(manifest.previewOnly,true);
 assert.equal(manifest.browserQa,'NOT_VERIFIED');
 assert.equal((html.match(/<script\b/g)||[]).length,1);
 assert.ok(!html.includes('rv-trust-v7.css'));
});
test('terms: fail-closed source and preview checks',()=>{
 assert.throws(()=>renderTermsStudio(source.replace('Narušování provozu','Úpravy provozu'),template),/fingerprint/);
 assert.throws(()=>renderTermsStudio(source,template.replace('noindex,nofollow,noarchive','index,follow')),/robots/);
 assert.throws(()=>renderTermsStudio(source,template.replace('{{TERM_7}}','')),/marker/);
});
test('terms: compact responsive typography and accessible navigation',()=>{
 assert.match(css,/@media\(max-width:600px\)/);
 assert.match(css,/focus-visible/);
 assert.match(css,/prefers-reduced-motion/);
 assert.ok(Buffer.byteLength(css,'utf8')<6000);
 const {html}=render();
 assert.ok(!html.includes('Testovací návrh'));
 assert.ok(!html.includes('před zveřejněním'));
});
