import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderAboutStudio} from '../../rv3/engine/studio-about.mjs';
import {extractMain,getCanonical} from '../../rv3/engine/renderer.mjs';

const source=readFileSync(new URL('../../o-nas.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../../rv3/sitewide/about.css',import.meta.url),'utf8');
const build=()=>renderAboutStudio(source);

test('O projektu: complete rebuild, NOT a restyled copy of the legacy page',()=>{
 const {html,manifest}=build();
 assert.equal(manifest.preview,'/rv3/studio/o-nas.html');
 assert.equal(manifest.kind,'individual-rebuilt-trust-page');
 assert.equal(manifest.previewOnly,true);
 assert.equal(manifest.browserQa,'NOT_VERIFIED');
 assert.equal(manifest.designStatus,'NEW_FROM_SCRATCH_OWNER_REVIEW_PENDING');
 assert.notEqual(extractMain(html),extractMain(source),'must not reuse legacy main');
 assert.match(html,/Čísla jsou začátek/);
 assert.match(html,/Rozhodnutí je cíl/);
 assert.match(html,/rv3a-visual/);
 assert.match(html,/rv3a-method-steps/);
 assert.match(html,/rv3a-owner/);
 assert.match(html,/rv3a-next-grid/);
 for(const legacy of ['rv-trust-v7.css','trust-nav','hero-panel','class="card"','hero-facts']){
  assert.equal(html.includes(legacy),false,'Legacy page structure leaked: '+legacy);
 }
});

test('O projektu: preserve verified identity, original SEO and social provenance',()=>{
 const {html,manifest}=build();
 assert.equal(manifest.canonical,getCanonical(source));
 assert.equal(manifest.title,'O projektu | RychléVýpočty.cz');
 assert.match(manifest.productionSourceSha256,/^[a-f0-9]{64}$/);
 assert.equal(getCanonical(html),getCanonical(source));
 assert.match(html,/<meta name="robots" content="noindex,nofollow,noarchive">/);
 assert.match(html,/<meta name="description" content="Kdo provozuje RychléVýpočty.cz/);
 assert.match(html,/<title>O projektu \| RychléVýpočty.cz<\/title>/);
 assert.equal((html.match(/<h1\b/gi)||[]).length,1);
 assert.equal((html.match(/<main\b/gi)||[]).length,1);
 assert.match(html,/Martin Šilinger/);
 assert.match(html,/bez přiděleného IČO/);
 assert.match(html,/mailto:rychlevypocty@seznam.cz/);
 assert.match(html,/https:\/\/www.facebook.com\/rychlevypocty/);
 assert.match(html,/https:\/\/www.instagram.com\/rychlevypocty\//);
 assert.match(html,/src="\/logo-rv-v32.svg"/);
 assert.match(html,/<script type="application\/ld\+json">/);
 assert.equal((html.match(/<script\b/gi)||[]).length,1,'no new client scripts or trackers');
});

test('O projektu: decision-first navigation, 5 real sections and useful actions',()=>{
 const {html}=build();
 const ids=['main','proc-existujeme','jak-pracujeme','kdo-za-webem-stoji'];
 for(const id of ids)assert.ok(html.includes('id="'+id+'"'), 'Missing landmark '+id);
 for(const url of ['/rv3/poc/katalog-v2.html','/situace.html','/jak-pocitame.html',
    '/redakcni-zasady.html','/kontakt.html']){
  assert.ok(html.includes('href="'+url+'"'), 'Missing action '+url);
 }
 assert.match(html,/Ilustrace postupu · není to skutečný výpočet/);
 assert.match(html,/Bez registrace/);
 assert.match(html,/Přesný|přesné/);
 assert.match(html,/modelové/);
 assert.match(html,/orientační/);
});

test('O projektu: fails closed when source identity/SEO/social cannot be verified',()=>{
 assert.throws(()=>renderAboutStudio(source.replace('https://rychlevypocty.cz/o-nas.html','https://example.org/o-nas.html')),/canonical/i);
 assert.throws(()=>renderAboutStudio(source.replace('bez přiděleného IČO','registrovaná s.r.o.')),/operator/i);
 assert.throws(()=>renderAboutStudio(source.replace('content="index,follow"','content="noindex,nofollow"')),/robots/i);
 assert.throws(()=>renderAboutStudio(source.replace('https://www.facebook.com/rychlevypocty','https://example.org')),/social/i);
});

test('O projektu: bespoke mobile-first styles / no old trust stylesheet',()=>{
 const {html}=build();
 assert.match(html,/href="\/rv3\/sitewide\/foundation.css"/);
 assert.match(html,/href="\/rv3\/sitewide\/about.css"/);
 assert.match(html,/class="rv3w-page rv3a-page"/);
 assert.match(css,/@media\(max-width:830px\)/);
 assert.match(css,/@media\(max-width:580px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/grid-template-columns:1fr/);
 assert.ok(Buffer.byteLength(css,'utf8')<25000,'About CSS should remain lightweight');
 assert.doesNotMatch(css,/\.trust-nav|\.hero-panel|\.site-header/);
});
