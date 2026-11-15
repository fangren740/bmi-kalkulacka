import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {renderPrivacyStudio,PRIVACY_TOPICS} from '../../rv3/engine/studio-privacy.mjs';
import {extractMain,getCanonical} from '../../rv3/engine/renderer.mjs';

const from=path=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');
const source=from('ochrana-osobnich-udaju.html');
const template=from('rv3/engine/privacy.template.html');
const css=from('rv3/sitewide/privacy.css');
const artwork=from('rv3/assets/privacy-flow.svg');
const icons=from('rv3/assets/about-icons.svg');
const cookies=from('cookies.html');
const contact=from('kontakt.html');
const output=()=>renderPrivacyStudio(source,template);
const originalLegal=[...extractMain(source).matchAll(/<section class="card">([\s\S]*?)<\/section>/g)].map(m=>m[1]);

test('privacy: Git source fingerprint pin and all seven exact source sections retained',()=>{
 assert.equal(createHash('sha1').update('blob '+Buffer.byteLength(source,'utf8')+'\0'+source).digest('hex'),
  '74c09875753ba7eac387ec10b871b5fd04ffe845');
 const {html,manifest}=output();
 assert.equal(originalLegal.length,7);
 assert.equal(manifest.legalSectionCount,7);
 assert.equal(manifest.sourceLegalContentUnmodified,true);
 assert.equal(manifest.kind,'bespoke-privacy-reading-room');
 assert.equal(manifest.previewOnly,true);
 assert.equal(manifest.source,'ochrana-osobnich-udaju.html');
 assert.equal(manifest.preview,'/rv3/studio/ochrana-osobnich-udaju.html');
 assert.notEqual(extractMain(html),extractMain(source),'No legacy trust DOM must remain');
 for(let i=0;i<originalLegal.length;i++){
  assert.ok(html.includes(originalLegal[i]),'Source legal section changed or missing: '+i);
  assert.equal(html.split(originalLegal[i]).length,2,'Duplicate/missing legal source section '+i);
 }
 assert.equal(originalLegal.map(s=>(s.match(/<p(?:\s|>)/g)||[]).length).reduce((a,b)=>a+b,0),17);
 assert.equal((html.match(/class="rv3p-chapter"/g)||[]).length,7);
});

test('privacy: source SEO identity/structured data locked; preview noindex only',()=>{
 const {html,manifest}=output();
 assert.equal(manifest.canonical,getCanonical(source));
 assert.equal(getCanonical(html),getCanonical(source));
 assert.equal(manifest.title,'Ochrana osobních údajů | RychléVýpočty.cz');
 assert.match(manifest.sourceSha256,/^[a-f0-9]{64}$/);
 assert.match(html,/<meta name="robots" content="noindex,nofollow,noarchive">/);
 assert.match(html,/<meta name="description" content="Informace o zpracování osobních údajů na RychléVýpočty.cz/);
 assert.equal((html.match(/<main\b/gi)||[]).length,1);
 assert.equal((html.match(/<h1\b/gi)||[]).length,1);
 assert.equal((html.match(/<script\b/gi)||[]).length,1,'Only original legal structured data, no unnecessary enhancer');
 const schema=source.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1];
 assert.ok(schema&&html.includes(schema),'Original PrivacyPolicy graph changed');
 for(const mark of ['{{JSONLD}}','{{HEADER}}','{{FOOTER}}','{{LEGAL_0}}','{{LEGAL_6}}'])
  assert.ok(!html.includes(mark),'Unresolved template token '+mark);
});

test('privacy: catalog brand with its own artwork, local icons and responsive reading room',()=>{
 const {html,manifest}=output();
 assert.ok(html.includes('src="/logo-rv-v32.svg"'));
 assert.ok(html.includes('src="/rv3/assets/privacy-flow.svg"'));
 assert.equal(manifest.art,'/rv3/assets/privacy-flow.svg');
 assert.deepEqual(manifest.css,['/rv3/catalog-v2.css','/rv3/catalog-v3-theme.css','/rv3/sitewide/privacy.css']);
 for(const path of manifest.css)assert.ok(html.includes('href="'+path+'"'));
 assert.match(artwork,/<title\b/);
 assert.match(artwork,/<desc\b/);
 assert.match(artwork,/url\(#shadow\)/);
 assert.match(artwork,/TECHNICKÁ DATA/);
 assert.match(css,/font-family:Georgia/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/@media\(max-width:620px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/overflow-wrap:anywhere/);
 assert.match(css,/position:sticky/);
 for(const topic of PRIVACY_TOPICS){
  assert.ok(html.includes('id="'+topic.id+'"'),'Chapter missing '+topic.id);
  assert.ok(html.includes('href="#'+topic.id+'"'),'Sidebar missing '+topic.id);
  assert.ok(icons.includes('id="'+topic.glyph+'"'),'Icon undefined: '+topic.glyph);
  assert.ok(html.includes('about-icons.svg#'+topic.glyph),'Icon unused: '+topic.glyph);
 }
 assert.equal((html.match(/class="rv3p-chapter"/g)||[]).length,7);
 assert.ok(html.includes('href="#plne-zneni"'));
 assert.ok(!html.includes('data-url-inspector'));
 assert.ok(Buffer.byteLength(artwork,'utf8')<9500);
 assert.ok(Buffer.byteLength(css,'utf8')<19000);
 for(const legacy of ['rv-trust-v7.css','trust-nav','hero-panel'])
  assert.ok(!html.includes(legacy));
});

test('privacy: legal content retains recipients, bases, rights and actual outbound source links',()=>{
 const {html}=output();
 for(const phrase of [
  'Martin Šilinger','rychlevypocty@seznam.cz',
  'čl. 6 odst. 1 písm. f GDPR','čl. 6 odst. 1 písm. b GDPR',
  'čl. 6 odst. 1 písm. c GDPR',
  'Seznam.cz, a.s.','GitHub, Inc.','GitHub B.V.',
  'standardní smluvní doložky EU','Právním základem',
  'Přístup, oprava, výmaz a další možnosti',
  'Úřadu pro ochranu osobních údajů'
 ])assert.ok(html.includes(phrase),'Source legal evidence missing: '+phrase);
 for(const url of [
  'https://o-seznam.cz/napoveda/email/smluvni-podminky/',
  'https://o-seznam.cz/pravni-informace/ochrana-udaju/email/',
  'https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages',
  'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement',
  'https://uoou.gov.cz/'
 ])assert.ok(html.includes('href="'+url+'"'),'Legal official source missing: '+url);
 assert.ok(cookies.includes('rv_catalog_favorites_v1'));
 assert.ok(contact.includes('Martin Šilinger'));
 assert.ok(html.includes('href="/cookies.html"'));
 assert.ok(html.includes('href="/rv3/studio/kontakt.html"'));
});

test('privacy: unresolved operational assertions are not silently rewritten or falsely certified',()=>{
 const {html,manifest}=output();
 assert.equal(manifest.legalReviewStatus,'BLOCKED_PENDING_TRACKING_CONTACT_AND_HOSTING_VERIFICATION');
 assert.equal(manifest.designStatus,'VISUAL_REVIEW_PENDING');
 assert.equal(manifest.browserQa,'NOT_VERIFIED');
 assert.ok(html.includes('Web nemá uživatelské účty, přihlášení, newsletter ani kontaktní formulář.'));
 assert.ok(html.includes('Google Analytics nyní není aktivní'));
 assert.ok(html.includes('Hosting prostřednictvím GitHub Pages'));
 assert.ok(html.includes('věcný audit probíhá'));
 assert.ok(html.includes('Zásady jsou převzaty beze změn'));
 assert.doesNotMatch(html,/audit úspěšně dokončen|100% GDPR|garantujeme bezpečnost|certifikovaný GDPR|bez jakéhokoli rizika/i);
});

test('privacy: editorial review removes filler, keeps direct navigation and no extra data entry',()=>{
 const {html}=output();
 assert.match(html,/<h1 id="privacy-title">Ochrana <em>osobních údajů\.<\/em><\/h1>/);
 assert.ok(html.includes('href="#plne-zneni"'));
 assert.ok(html.includes('href="#prava"'));
 assert.ok(html.includes('aria-label="Obsah zásad ochrany osobních údajů"'));
 assert.equal((html.match(/class="rv3p-chapter"/g)||[]).length,7);
 assert.ok(!html.includes('data-url-inspector'));
 assert.ok(!html.includes('rv3p-share'));
 assert.ok(!html.includes('rv3p-map'));
 assert.ok(!html.includes('rv3p-next'));
 assert.ok(!html.includes('privacy-inspect.js'));
 assert.ok(!html.includes('href="#prehled"'));
 assert.ok(!html.includes('<form'));
 assert.ok(!html.includes('<input'));
 assert.ok(css.length<11000,'No unused styles from removed marketing sections');
 assert.ok(template.length<8500,'Preview template should remain concise');
});

test('privacy: source mutation of any legal paragraph, section or provenance fails closed',()=>{
 assert.throws(()=>renderPrivacyStudio(source.replace('Martin Šilinger','Fiktivní správce'),template),/fingerprint/);
 assert.throws(()=>renderPrivacyStudio(source.replace('čl. 6 odst. 1 písm. f GDPR','čl. 6 odst. 1 písm. a GDPR'),template),/fingerprint/);
 assert.throws(()=>renderPrivacyStudio(source.replace('<section class="card">','<section>'),template),/fingerprint/);
 assert.throws(()=>renderPrivacyStudio(source.replace('content="index,follow"','content="noindex,nofollow"'),template),/fingerprint/);
 assert.throws(()=>renderPrivacyStudio(source,template.replace('noindex,nofollow,noarchive','index,follow')), /robots|noindex/i);
 assert.throws(()=>renderPrivacyStudio(source,template.replace('https://rychlevypocty.cz/ochrana-osobnich-udaju.html','https://fake.test/')), /template privacy SEO/i);
 assert.throws(()=>renderPrivacyStudio(source,template.replace('{{LEGAL_6}}','')), /missing or duplicated/i);
});

test('privacy: no unreviewed release — all stage gates are exposed',()=>{
 const {html,manifest}=output();
 assert.equal(manifest.previewOnly,true);
 assert.equal(manifest.sourceLegalContentUnmodified,true);
 assert.match(manifest.legalReviewStatus,/BLOCKED/);
 assert.ok(html.includes('Ochrana osobních údajů'));
 assert.ok(html.includes('Technický provoz'));
 assert.ok(html.includes('Přístup, oprava, výmaz'));
 assert.ok(html.includes('SOUKROMÍ A DŮVĚRA'));
 assert.ok(html.includes('Před zveřejněním ověřujeme analytiku'));
});