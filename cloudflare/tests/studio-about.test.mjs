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
 assert.deepEqual(manifest.css,['/rv3/catalog-v2.css','/rv3/catalog-v3-theme.css','/rv3/sitewide/about.css','/rv3/sitewide/about-icons.css']);
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
 for(const href of ['/rv3/poc/katalog-v2.html','/jak-pocitame.html','/redakcni-zasady.html','/kontakt.html']){
  assert.ok(html.includes('href="'+href+'"'),'Missing link '+href);
 }
 assert.ok(html.includes('aria-label="Drobečková navigace"'));
 assert.ok(html.includes('aria-label="Obsah stránky O projektu"'));
 for (const hash of ['#proc-vznikl','#nase-principy','#kdo-web-provozuje'])
   assert.ok(html.includes('href="'+hash+'"'), 'Missing quick jump '+hash);
 assert.match(aboutCss,/\.rv3a-chapters-links a/);
 assert.match(aboutCss,/\.rv3a-chapters-links\{display:grid;grid-template-columns:1fr 1fr/);
 assert.ok(html.includes('id="about-title"'));
 assert.ok(html.includes('kalkulačk'));
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


test('About: verifiable methods, transparent operation and valid sources',()=>{
 const {html}=build();
 const method=from('jak-pocitame.html');
 const editorial=from('redakcni-zasady.html');
 const privacy=from('ochrana-osobnich-udaju.html');
 const funding=from('reklama-a-spoluprace.html');
 const datasets=from('data-a-benchmarky.html');
 for(const url of ['/data-a-benchmarky.html','/jak-pocitame.html','/redakcni-zasady.html',
                   '/ochrana-osobnich-udaju.html']){
   assert.ok(html.includes('href="'+url+'"'),'Missing linked source '+url);
 }
 assert.match(html,/Podklady k vlastní kontrole/);
 assert.match(html,/Kontrolní příklady/);
 assert.match(method,/hraničních příkladech/);
 assert.match(method,/ručním výpočtem nebo nezávislou referencí/);
 assert.match(method,/Benchmarky zveřejňujeme i jako CSV/);
 assert.match(datasets,/Stáhnout CSV/);
 assert.match(html,/modelová data a CSV/);
 assert.match(editorial,/Jak používáme AI a automatizaci/);
 assert.match(editorial,/Finální odpovědnost/);
 assert.match(html,/AI a automatizaci/);
 assert.match(html,/odpovědnost za publikování zůstává provozovateli/);
 assert.match(privacy,/Běžné výpočty probíhají přímo v prohlížeči/);
 assert.match(privacy,/sdílené URL/);
 assert.ok(html.includes('href="/ochrana-osobnich-udaju.html"'));
 assert.match(funding,/Případný obchodní obsah jasně označíme/);
 assert.ok(!html.includes('rv3a-openness-item'));
 assert.doesNotMatch(html,/100% přesn|vždy správn|garantujeme výsledek|žádné údaje se nikdy neposílají/i);
});

test('About: customer-first page does not duplicate cookie and ad disclosures',()=>{
 const {html}=build();
 assert.ok(!html.includes('rv3a-openness'));
 assert.ok(!html.includes('Před sdílením URL'));
 assert.ok(html.includes('href="/ochrana-osobnich-udaju.html"'));
 assert.ok(html.includes('href="/rv3/studio/kontakt.html"'));
 assert.ok(html.includes('kdo-web-provozuje'));
});

test('About: authentic catalogue-style pictograms are linked, semantic and no-JS',()=>{
 const {html,manifest}=build();
 const sprite=from('rv3/assets/about-icons.svg');
 const polish=from('rv3/sitewide/about-icons.css');
 assert.equal(manifest.css.at(-1),'/rv3/sitewide/about-icons.css');
 assert.match(html,/href="\/rv3\/sitewide\/about-icons\.css"/);
 assert.match(sprite,/<svg\b/);
 for(const name of ['entry','sources','audit','exact','model','estimate','calculator','method','feedback','check','context']){
   assert.ok(sprite.includes('id="'+name+'"'),'Missing local SVG symbol '+name);
   assert.ok(html.includes("about-icons.svg#"+name),'Not used on actual page '+name);
 }
 assert.equal((html.match(/class="rv3a-step-icon"/g)||[]).length,3);
 assert.equal((html.match(/class="rv3a-line-icon"/g)||[]).length,3);
 assert.equal((html.match(/class="rv3a-open-art"/g)||[]).length,0);
 assert.equal((html.match(/class="rv3a-next-art"/g)||[]).length,3);
 assert.match(html,/aria-hidden="true" focusable="false"/);
 assert.equal((html.match(/<script\b/gi)||[]).length,1,'Pictograms must not add JS');
 assert.match(polish,/@media\(max-width:620px\)/);
 assert.match(polish,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(polish,/\.rv3a-page \.rv3a-next-grid a strong/);
 assert.ok(Buffer.byteLength(sprite,'utf8')<9000,'Vector asset should remain lightweight');
 assert.ok(Buffer.byteLength(polish,'utf8')<9000,'New CSS should remain lightweight');
});