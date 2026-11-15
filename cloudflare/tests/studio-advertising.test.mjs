import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderAdvertisingStudio} from '../../rv3/engine/studio-advertising.mjs';
import {extractMain,getCanonical} from '../../rv3/engine/renderer.mjs';
const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const source=read('reklama-a-spoluprace.html');
const template=read('rv3/engine/advertising.template.html');
const css=read('rv3/sitewide/advertising.css');
const render=()=>renderAdvertisingStudio(source,template);
test('advertising: exact source sections remain in a unique user-focused shell',()=>{
 const {html,manifest}=render();
 const sections=[...extractMain(source).matchAll(/<section class="card">([\s\S]*?)<\/section>/g)].map(x=>x[1]);
 assert.equal(sections.length,2);assert.equal(manifest.sourceVerbatim,true);
 for(const part of sections)assert.equal(html.split(part).length,2);
 assert.match(html,/<h1 id="advertising-title">Kdy jde o radu a kdy o <em>reklamu\?<\/em><\/h1>/);
 assert.equal((html.match(/<main\b/g)||[]).length,1);
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
 assert.ok(!html.includes('rv-trust-v7.css')&&!html.includes('trust-nav'));
});
test('advertising: SEO unchanged, noindex preview and unverified claims labeled',()=>{
 const {html,manifest}=render();
 assert.equal(getCanonical(html),getCanonical(source));
 assert.match(html,/noindex,nofollow,noarchive/);
 assert.match(html,/Stav připravujeme k ověření/);
 assert.equal(manifest.contentReview,'BLOCKED_PENDING_ADS_AFFILIATE_AND_CONSENT_VERIFICATION');
 assert.equal(manifest.browserQa,'NOT_VERIFIED');
 assert.ok(html.indexOf('Stav připravujeme k ověření')<html.indexOf('Reklama ani placené spolupráce nejsou aktivní'));
 assert.equal((html.match(/<script\b/g)||[]).length,1);
 for(const link of ['/rv3/studio/redakcni-zasady.html','/rv3/studio/kontakt.html'])
  assert.ok(html.includes('href="'+link+'"'));
});
test('advertising: strict source lock and markup contract',()=>{
 assert.throws(()=>renderAdvertisingStudio(source.replace('Google AdSense','Google Ads'),template),/source changed/);
 assert.throws(()=>renderAdvertisingStudio(source,template.replace('noindex,nofollow,noarchive','index,follow')), /robots/);
 assert.throws(()=>renderAdvertisingStudio(source,template.replace('{{SECTION_1}}','')), /marker/);
});
test('advertising: responsive and keyboard-safe without new trackers',()=>{
 const {html}=render();
 assert.ok(html.includes('src="/logo-rv-v32.svg"'));
 assert.match(css,/@media\(max-width:600px\)/);
 assert.match(css,/focus-visible/);
 assert.match(css,/prefers-reduced-motion/);
 assert.ok(Buffer.byteLength(css)<10000);
 assert.ok(!html.includes('data-cookie-consent'));
 assert.ok(!html.includes('google-analytics.com'));
});
