import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderAboutStudio} from '../../rv3/engine/studio-about.mjs';
import {extractMain,getCanonical} from '../../rv3/engine/renderer.mjs';

const from=path=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');
const source=from('o-nas.html');
const aboutCss=from('rv3/sitewide/about.css');
const catalogBase=from('rv3/catalog-v2.css');
const catalogTheme=from('rv3/catalog-v3-theme.css');
const svg=from('rv3/assets/about-story.svg');
const build=()=>renderAboutStudio(source);

test('About: a genuinely new composition without legacy trust-page DOM',()=>{
 const {html,manifest}=build();
 assert.notEqual(extractMain(html),extractMain(source));
 for(const old of ['rv-trust-v7.css','trust-nav','hero-panel','hero-facts','class="card"']){
  assert.equal(html.includes(old),false,'Old component leaked: '+old);
 }
 assert.equal(manifest.kind,'catalog-aligned-bespoke-about');
 assert.equal(manifest.preview,'/rv3/studio/o-nas.html');
 assert.equal(manifest.previewOnly,true);
 assert.equal(manifest.designStatus,'VISUAL_REVIEW_PENDING');
 assert.equal(manifest.browserQa,'NOT_VERIFIED');
 assert.ok(html.includes('Nejde jen o číslo.'));
 assert.ok(html.includes('Jde o to mu rozumět.'));
});

test('About: genuinely uses catalog CSS, original logo and bespoke art',()=>{
 const {html,manifest}=build();
 assert.deepEqual(manifest.css,['/rv3/catalog-v2.css','/rv3/catalog-v3-theme.css','/rv3/sitewide/about.css']);
 for(const css of manifest.css) assert.ok(html.includes('href="'+css+'"'),css);
 assert.match(html,/class="rv3d-page rv3a-page"/);
 assert.match(html,/\/logo-rv-v32\.svg/);
 assert.match(html,/src="\/rv3\/assets\/about-story\.svg"/);
 assert.equal(manifest.art,'/rv3/assets/about-story.svg');
 assert.match(svg,/<svg\b/);
 assert.match(svg,/<title\b/);
 assert.match(svg,/<desc\b/);
 assert.ok(svg.includes('url(#shadow)'));
 assert.ok(svg.includes('k rozhodnutí'));
 assert.match(catalogBase,/Georgia/);
 assert.match(catalogTheme,/\.rv3d-hero/);
 assert.match(aboutCss,/\.rv3a-page :is\(h1,h2\) em\{font-family:Georgia/);
 assert.match(aboutCss,/font-style:italic/);
 assert.doesNotMatch(aboutCss,/\.trust-nav|\.hero-panel|\.site-header/);
});

test('About: preserve source truth, consent-neutral content and preview SEO safety',()=>{
 const {html,manifest}=build();
 assert.equal(manifest.title,'O projektu | RychléVýpočty.cz');
 assert.equal(manifest.canonical,getCanonical(source));
 assert.equal(getCanonical(html),getCanonical(source));
 assert.match(manifest.sourceSha256,/^[a-f0-9]{64}$/);
 assert.match(html,/<title>O projektu \| RychléVýpočty\.cz<\/title>/);
 assert.match(html,/<meta name="robots" content="noindex,nofollow,noarchive">/);
 assert.equal((html.match(/<h1\b/gi)||[]).length,1);
 assert.equal((html.match(/<main\b/gi)||[]).length,1);
 assert.match(html,/Martin Šilinger/);
 assert.match(html,/bez přiděleného IČO/);
 assert.match(html,/mailto:rychlevypocty@seznam.cz/);
 assert.match(html,/www.facebook.com\/rychlevypocty/);
 assert.match(html,/www.instagram.com\/rychlevypocty/);
 assert.match(html,/<script type="application\/ld\+json">/);
 assert.equal((html.match(/<script\b/gi)||[]).length,1,'No tracking or runtime JS added');
});

test('About: accessible chapters, links and no fabricated numerical results',()=>{
 const {html}=build();
 for(const anchor of ['main','proc-vznikl','nase-principy','kdo-web-provozuje']){
  assert.ok(html.includes('id="'+anchor+'"'),'Missing anchor '+anchor);
 }
 for(const href of ['/rv3/poc/katalog-v2.html','/situace.html','/jak-pocitame.html','/redakcni-zasady.html','/kontakt.html']){
  assert.ok(html.includes('href="'+href+'"'),'Missing link '+href);
 }
 assert.ok(html.includes('aria-label="Drobečková navigace"'));
 assert.ok(html.includes('id="about-title"'));
 assert.ok(html.includes('kalkulačka'));
 assert.ok(html.includes('orientační'));
});

test('About: source identity mutations fail closed',()=>{
 assert.throws(()=>renderAboutStudio(source.replace('https://rychlevypocty.cz/o-nas.html','https://fake.test/o-nas.html')),/Canonical/);
 assert.throws(()=>renderAboutStudio(source.replace('bez přiděleného IČO','s.r.o.')),/provenance/);
 assert.throws(()=>renderAboutStudio(source.replace('content="index,follow"','content="noindex,nofollow"')),/robots/);
 assert.throws(()=>renderAboutStudio(source.replace('href="https://www.facebook.com/rychlevypocty"','href="https://fake.test"')),/social/);
});

test('About: responsive behavior and reduced motion are explicit, styles bounded',()=>{
 assert.match(aboutCss,/@media\(max-width:850px\)/);
 assert.match(aboutCss,/@media\(max-width:620px\)/);
 assert.match(aboutCss,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(aboutCss,/:focus-visible/);
 assert.match(aboutCss,/\.rv3a-process-grid\{grid-template-columns:1fr/);
 assert.match(aboutCss,/\.rv3a-hero-grid\{grid-template-columns:1fr/);
 assert.ok(Buffer.byteLength(aboutCss,'utf8')<18000);
 assert.ok(Buffer.byteLength(svg,'utf8')<12000);
});
