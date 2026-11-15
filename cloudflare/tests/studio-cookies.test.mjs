import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {renderCookiesStudio,COOKIES_SECTIONS,STORAGE_KEYS} from '../../rv3/engine/studio-cookies.mjs';
import {extractMain,getCanonical} from '../../rv3/engine/renderer.mjs';

const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const source=read('cookies.html'),template=read('rv3/engine/cookies.template.html');
const css=read('rv3/sitewide/cookies.css'),art=read('rv3/assets/storage-drawer.svg');
const icons=read('rv3/assets/about-icons.svg');
const build=()=>renderCookiesStudio(source,template);

test('cookies customer-first: original source identity remains pinned for audit',()=>{
 const hash=createHash('sha1').update('blob '+Buffer.byteLength(source,'utf8')+'\0'+source).digest('hex');
 assert.equal(hash,'68e9ba2b0db21a80dfdb5a7dc3443e17394eb56f');
 const {manifest}=build();
 assert.equal(manifest.kind,'bespoke-cookies-reference');
 assert.equal(manifest.sourceInventoryShaPinned,true);
 assert.equal(manifest.sourceInventoryReviewed,false);
 assert.equal(manifest.storageKeys,9);
 assert.equal(manifest.technicalKeysExposed,0);
 assert.equal(manifest.sections,5);
 assert.equal(STORAGE_KEYS.length,9);
 assert.equal(COOKIES_SECTIONS.length,5);
});

test('cookies customer-first: technical keys, tables and unverified claims removed from visitor page',()=>{
 const {html}=build();
 for(const key of STORAGE_KEYS) assert.ok(!html.includes(key),'Technical key exposed '+key);
 assert.doesNotMatch(html,/<table\b|<tr\b|<td\b|<th\b|data-table|data-label="Klíč"/);
 assert.ok(!html.includes('Těchto devět klíčů'));
 assert.ok(!html.includes('Google Analytics, Google AdSense ani jiné reklamní'));
 assert.ok(!html.includes('Tyto technologie nyní nejsou aktivní'));
 assert.ok(html.includes('Netechnické cookies a podobné technologie'));
 assert.ok(html.includes('Toto je neprodukční návrh.'));
 assert.ok(!html.includes('source fingerprint'));
});

test('cookies customer-first: visitors get a short plain-language answer and deletion instructions',()=>{
 const {html}=build();
 assert.match(html,/<h1 id="cookies-title">Cookies a <em>vaše nastavení\.<\/em><\/h1>/);
 assert.ok(html.includes('oblíbené kalkulačky, vybraná jména'));
 assert.ok(html.includes('ve vašem prohlížeči'));
 assert.ok(html.includes('Odstranění dat webu může vymazat i další uložené předvolby'));
 for(const id of ['ulozeni','smazani','mereni'])assert.ok(html.includes('id="'+id+'"')&&html.includes('href="#'+id+'"')===false||html.includes('id="'+id+'"'));
 assert.ok(html.includes('href="#ulozeni"')&&html.includes('href="#smazani"'));
 assert.ok(html.includes('rychlevypocty.cz'));
 assert.ok(!html.includes('<form')&&!html.includes('<input')&&!html.includes('<button'));
});

test('cookies customer-first: preserve source canonical, JSON-LD, preview-only index block',()=>{
 const {html,manifest}=build();
 assert.equal(getCanonical(html),getCanonical(source));
 assert.equal(manifest.canonical,'https://rychlevypocty.cz/cookies.html');
 assert.equal(manifest.title,'Cookies a lokální úložiště | RychléVýpočty.cz');
 assert.ok(html.includes('Jak na RychléVýpočty.cz fungují cookies a uložená nastavení'));
 assert.ok(!html.includes('včetně přesných spouštěčů'));
 assert.equal(manifest.preview,'/rv3/studio/cookies.html');
 assert.equal(manifest.previewOnly,true);
 assert.match(html,/<meta name="robots" content="noindex,nofollow,noarchive">/);
 assert.match(manifest.sourceSha256,/^[a-f0-9]{64}$/);
 const origLd=source.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1];
 assert.ok(origLd&&html.includes(origLd));
 assert.equal((html.match(/<script\b/gi)||[]).length,1,'No new JS, just source JSON-LD');
 assert.equal((html.match(/<main\b/gi)||[]).length,1);
 assert.equal((html.match(/<h1\b/gi)||[]).length,1);
 for(const token of ['{{JSONLD}}','{{HEADER}}','{{FOOTER}}'])
  assert.ok(!html.includes(token));
});

test('cookies customer-first: brand-aligned but no padding content, real local artwork',()=>{
 const {html,manifest}=build();
 assert.ok(html.includes('src="/logo-rv-v32.svg"'));
 assert.ok(html.includes('src="/rv3/assets/storage-drawer.svg"'));
 assert.deepEqual(manifest.css,['/rv3/catalog-v2.css','/rv3/catalog-v3-theme.css','/rv3/sitewide/cookies.css']);
 assert.match(art,/<title\b/);assert.match(art,/<desc\b/);
 assert.ok(art.includes('NASTAVENÍ'));
 assert.match(css,/font-family:Georgia/);
 assert.match(css,/@media\(max-width:620px\)/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 for(const name of ['entry','privacy','audit'])
  assert.ok(icons.includes('id="'+name+'"')&&html.includes('about-icons.svg#'+name));
 assert.ok(Buffer.byteLength(css,'utf8')<7000);
 assert.ok(Buffer.byteLength(template,'utf8')<6000);
 assert.doesNotMatch(html,/rv-trust-v7\.css|trust-nav|hero-panel/);
});

test('cookies customer-first: real related destinations and no invented certifications',()=>{
 const {html,manifest}=build();
 assert.ok(html.includes('href="/rv3/studio/ochrana-osobnich-udaju.html"'));
 assert.ok(html.includes('href="/rv3/studio/kontakt.html"'));
 assert.equal(manifest.factualReviewStatus,'BLOCKED_PENDING_ANALYTICS_CMP_AND_STORAGE_CODE_VERIFICATION');
 assert.equal(manifest.browserQa,'NOT_VERIFIED');
 assert.equal(manifest.designStatus,'VISUAL_REVIEW_PENDING');
 assert.doesNotMatch(html,/certifikován[oýa] GDPR|100% GDPR|garantujeme soukromí|vždy bez cookies/i);
});

test('cookies customer-first: factual source change requires manual audit',()=>{
 assert.throws(()=>renderCookiesStudio(source.replace('rv_catalog_favorites_v1','new-key'),template),/fingerprint/);
 assert.throws(()=>renderCookiesStudio(source.replace('Google Analytics ani reklamní technologie','jiné technologie'),template),/fingerprint/);
 assert.throws(()=>renderCookiesStudio(source.replace('https://rychlevypocty.cz/cookies.html','https://fake.test/cookies.html'),template),/fingerprint/);
 assert.throws(()=>renderCookiesStudio(source,template.replace('noindex,nofollow,noarchive','index,follow')), /identity|robots/);
 assert.throws(()=>renderCookiesStudio(source,template.replace('https://rychlevypocty.cz/cookies.html','https://fake.test/')), /identity/);
 assert.throws(()=>renderCookiesStudio(source,template.replace('{{FOOTER}}','')), /placeholder/);
});

test('cookies customer-first: no needless visitor interaction and no auto data access',()=>{
 const {html}=build();
 assert.ok(!html.includes('localStorage.getItem')&&!html.includes('document.cookie'));
 assert.ok(!html.includes('sessionStorage')&&!html.includes('navigator.clipboard'));
 assert.ok(!html.includes('src="/rv3/sitewide/cookies.js"'));
 assert.ok(!html.includes('rv-catalog-workspace.js'));
 assert.equal((html.match(/<script\b/gi)||[]).length,1);
});