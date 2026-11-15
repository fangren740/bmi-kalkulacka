import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderAboutStudio} from '../../rv3/engine/studio-about.mjs';
import {extractMain,scriptsOf,getCanonical} from '../../rv3/engine/renderer.mjs';

const source=readFileSync(new URL('../../o-nas.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../../rv3/sitewide/about.css',import.meta.url),'utf8');

test('O projektu: one individually authored preview, correct SEO and links',()=>{
 const {html,manifest}=renderAboutStudio(source);
 assert.equal(manifest.preview,'/rv3/studio/o-nas.html');
 assert.equal(manifest.previewOnly,true);
 assert.equal(manifest.browserQa,'NOT_VERIFIED');
 assert.equal(manifest.canonical,'https://rychlevypocty.cz/o-nas.html');
 assert.match(html,/<meta name="robots" content="noindex,nofollow,noarchive">/);
 assert.match(html,/href="\/rv3\/sitewide\/about.css"/);
 assert.match(html,/class="rv3t-about"/);
 assert.equal(getCanonical(html),getCanonical(source));
 assert.match(html,/Martin Šilinger/);
 assert.match(html,/bez přiděleného IČO/);
 assert.match(html,/mailto:rychlevypocty@seznam.cz/);
 assert.match(html,/logo-rv-v32.svg/);
 assert.equal((html.match(/<h1\b/gi)||[]).length,1);
 assert.equal((html.match(/<main\b/gi)||[]).length,1);
});

test('O projektu: preserve original factual copy and script blocks byte-identically',()=>{
 const {html}=renderAboutStudio(source);
 assert.deepEqual(scriptsOf(html),scriptsOf(source));
 for(const p of extractMain(source).match(/<p\b[^>]*>[\s\S]*?<\/p>/gi)||[]){
   assert.ok(html.includes(p),'Missing source paragraph: '+p.slice(0,60));
 }
 for(const url of [
  '/jak-pocitame.html','/redakcni-zasady.html','/kontakt.html',
  '/ochrana-osobnich-udaju.html','/cookies.html',
  'https://www.facebook.com/rychlevypocty',
  'https://www.instagram.com/rychlevypocty/'
 ])assert.ok(html.includes(url),'Missing source link '+url);
});

test('O projektu: 4 usable chapter anchors, no fake team or invented IČO',()=>{
 const {html}=renderAboutStudio(source);
 for(const id of ['provozovatel','proc','metodika','profily']){
  assert.match(html,new RegExp('id="'+id+'"'));
  assert.match(html,new RegExp('href="#'+id+'"'));
 }
 assert.match(html,/aria-label="Rychlá orientace na stránce"/);
 assert.doesNotMatch(html,/<script[^>]*src="https?:/i);
 assert.doesNotMatch(html,/class="rv3t-about"[^>]*\bonload=/i);
});

test('O projektu: refuse unknown canonical, false operator details or original robots',()=>{
 assert.throws(()=>renderAboutStudio(source.replace('https://rychlevypocty.cz/o-nas.html','https://example.org/o-nas.html')));
 assert.throws(()=>renderAboutStudio(source.replace('bez přiděleného IČO','registrovaná s.r.o.')));
 assert.throws(()=>renderAboutStudio(source.replace('content="index,follow"','content="noindex,nofollow"')));
});

test('O projektu: mobile typography, reduced-motion and focus support',()=>{
 assert.match(css,/@media\(max-width:620px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/\.rv3t-about \.content\{order:1/);
 assert.match(css,/\.rv3t-about \.trust-nav\{order:2/);
 assert.ok(css.length<18000,'Unnecessary styling payload');
});
