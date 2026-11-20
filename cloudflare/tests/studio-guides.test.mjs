import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseGuides,renderGuidesStudio} from '../../rv3/engine/studio-guides.mjs';
import {getCanonical} from '../../rv3/engine/renderer.mjs';
const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const source=read('navody.html'),tpl=read('rv3/engine/guides.template.html');
const css=read('rv3/sitewide/guides.css'),js=read('rv3/sitewide/guides.js');
test('guides: 34 original source links, five curated collections and three extra areas',()=>{
 const data=parseGuides(source);
 assert.equal(data.groups.length,5);assert.equal(data.extras.length,3);
 assert.equal(data.count,34);
 assert.equal(new Set([...data.groups.flatMap(g=>g.guides.map(x=>x.url)),...data.extras.map(x=>x.url)]).size,34);
});
test('guides: all real guide and calculator destinations preserved',()=>{
 const data=parseGuides(source),{html,manifest}=renderGuidesStudio(source,tpl);
 const links=data.groups.flatMap(g=>[g.hub,...g.guides.map(x=>x.url),...g.calculators.map(x=>x.url)]).concat(data.extras.flatMap(x=>[x.url,x.calculator]));
 for(const url of links)assert.ok(html.includes('href="'+url+'"'),'Missing guide/related link '+url);
 assert.equal(manifest.uniqueGuideDestinations,34);
 assert.equal((html.match(/data-guide(?:\s|>)/g)||[]).length,34);
});
test('guides: source SEO and two structured data blocks remain noindexed in preview',()=>{
 const {html,manifest}=renderGuidesStudio(source,tpl);
 assert.equal(getCanonical(html),getCanonical(source));
 assert.match(html,/noindex,nofollow,noarchive/);
 assert.equal((html.match(/application\/ld\+json/g)||[]).length,2);
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
 assert.equal((html.match(/<main\b/g)||[]).length,1);
 assert.equal(manifest.browserQa,'NOT_VERIFIED');
 assert.ok(html.includes('src="/logo-rv-v32.svg"'));
});
test('guides: fail closed on source/SEO drift',()=>{
 assert.throws(()=>parseGuides(source.replace('34 praktických návodů','33 praktických návodů')),/SHA drift/);
 assert.throws(()=>renderGuidesStudio(source,tpl.replace('noindex,nofollow,noarchive','index,follow')),/template/);
 assert.throws(()=>renderGuidesStudio(source,tpl.replace('{{EXTRAS}}','')),/token/);
});
test('guides: accessible light search and mobile without tracking',()=>{
 assert.match(js,/normalize\('NFD'\)/);
 assert.match(js,/addEventListener\('input'/);
 assert.match(js,/addEventListener\('submit'/);
 assert.match(css,/@media\(max-width:650px\)/);
 assert.match(css,/focus-visible/);
 assert.match(css,/prefers-reduced-motion/);
 assert.ok(!js.includes('localStorage')&&!js.includes('fetch('));
});
