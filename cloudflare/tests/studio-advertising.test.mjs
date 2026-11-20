import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderAdvertisingStudio} from '../../rv3/engine/studio-advertising.mjs';
import {getCanonical} from '../../rv3/engine/renderer.mjs';
const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const source=read('reklama-a-spoluprace.html');
const template=read('rv3/engine/advertising.template.html');
const css=read('rv3/sitewide/advertising.css');
const render=()=>renderAdvertisingStudio(source,template);

test('advertising: brief customer-first copy, no temporary ad status or technical disclaimers',()=>{
 const {html,manifest}=render();
 for(const important of ['Reklama a <em>spolupráce.</em>','nástroje zdarma','Jak poznáte reklamní obsah',
  'Výsledky kalkulaček zůstávají nezávislé','Máte zájem o spolupráci?'])
  assert.ok(html.includes(important),'Missing customer information: '+important);
 for(const unwanted of ['nejsou aktivní','Stav připravujeme k ověření','momentálně nenačítají',
  'před zveřejněním','GA4','AdSense','PŘÍPADNÉ OBCHODNÍ SDĚLENÍ'])
  assert.ok(!html.includes(unwanted),'Transient or internal copy leaked: '+unwanted);
 assert.equal(manifest.copyApproach,'evergreen-reviewed-paraphrase');
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
 assert.equal((html.match(/<main\b/g)||[]).length,1);
});
test('advertising: original URL identity and source fingerprint protected',()=>{
 const {html,manifest}=render();
 assert.equal(getCanonical(html),getCanonical(source));
 assert.match(html,/noindex,nofollow,noarchive/);
 assert.match(html,/<title>Reklama a spolupráce \| RychléVýpočty.cz<\/title>/);
 assert.equal(manifest.previewOnly,true);
 assert.equal(manifest.browserQa,'NOT_VERIFIED');
 assert.equal((html.match(/<script\b/g)||[]).length,1);
 assert.throws(()=>renderAdvertisingStudio(source.replace('Google AdSense','Google Ads'),template),/source changed/);
 assert.throws(()=>renderAdvertisingStudio(source,template.replace('noindex,nofollow,noarchive','index,follow')), /robots/);
});
test('advertising: real contact and legal navigation',()=>{
 const {html}=render();
 for(const link of ['mailto:rychlevypocty@seznam.cz','/rv3/studio/cookies.html',
 '/rv3/studio/ochrana-osobnich-udaju.html'])
  assert.ok(html.includes(link),'Missing link '+link);
 assert.ok(html.includes('src="/logo-rv-v32.svg"'));
 assert.ok(!html.includes('rv-trust-v7.css'));
});
test('advertising: mobile, keyboard and low CSS budget',()=>{
 assert.match(css,/@media\(max-width:600px\)/);
 assert.match(css,/focus-visible/);
 assert.match(css,/prefers-reduced-motion/);
 assert.ok(Buffer.byteLength(css,'utf8')<4800);
});
