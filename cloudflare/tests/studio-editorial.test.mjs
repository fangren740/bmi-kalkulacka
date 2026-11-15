import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderEditorialStudio} from '../../rv3/engine/studio-editorial.mjs';
import {extractMain,getCanonical} from '../../rv3/engine/renderer.mjs';

const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const source=read('redakcni-zasady.html');
const template=read('rv3/engine/editorial.template.html');
const css=read('rv3/sitewide/editorial.css');
const art=read('rv3/assets/editorial-desk.svg');
const render=()=>renderEditorialStudio(source,template);

test('editorial customer-first: root factual source and SEO identity preserved',()=>{
 const {html,manifest}=render();
 assert.equal(manifest.kind,'bespoke-editorial-studio');
 assert.equal(manifest.source,'redakcni-zasady.html');
 assert.equal(manifest.preview,'/rv3/studio/redakcni-zasady.html');
 assert.equal(manifest.previewOnly,true);
 assert.equal(getCanonical(html),getCanonical(source));
 assert.equal(manifest.title,'Redakční zásady | RychléVýpočty.cz');
 assert.match(html,/<meta name="robots" content="noindex,nofollow,noarchive">/);
 const json=source.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1];
 assert.ok(json&&html.includes(json));
 assert.equal((html.match(/<main\b/g)||[]).length,1);
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
 assert.equal((html.match(/<script\b/g)||[]).length,1,'No second reporting-form script');
 assert.notEqual(extractMain(html),extractMain(source));
 for(const legacy of ['rv-trust-v7.css','trust-nav','hero-panel','class="card"'])
  assert.ok(!html.includes(legacy));
});

test('editorial customer-first: keeps distinct purpose, relevant AI transparency and sources',()=>{
 const {html}=render();
 for(const phrase of ['AI může pomáhat.','Martin Šilinger','AI výstup není automaticky ověřený zdroj',
                      'odpovídá provozovatel'])
  assert.ok(html.includes(phrase),'Meaningful policy missing: '+phrase);
 for(const phrase of ['Začínáme konkrétní otázkou','Zdroje hledáme co nejblíže původnímu pravidlu',
                      'Jak používáme AI a automatizaci','Finální odpovědnost','Na doložené chyby reagujeme opravou'])
  assert.ok(source.includes(phrase),'Original source drift: '+phrase);
 assert.doesNotMatch(html,/100% přesn|certifikovan|garantujeme opravu do|tým odborníků/);
});

test('editorial customer-first: redundant error-report form and empty final promotion removed',()=>{
 const {html,manifest}=render();
 assert.ok(html.includes('id="nahlasit"'));
 assert.ok(html.includes('href="/rv3/studio/kontakt.html"'));
 assert.ok(html.includes('Našli jste chybu?'));
 assert.ok(!html.includes('data-editorial-report'));
 assert.ok(!html.includes('editorial-report.js'));
 assert.ok(!html.includes('<form'));
 assert.ok(!html.includes('rv3e-final'));
 assert.ok(!html.includes('Vysvětlit. Doložit.'));
 assert.ok(!('enhancement' in manifest));
});

test('editorial customer-first: page flow is concise and useful',()=>{
 const {html}=render();
 for(const id of ['proces','zdroje','ai','nahlasit'])
  assert.ok(html.includes('id="'+id+'"')&&html.includes('href="#'+id+'"'),'Missing '+id);
 assert.ok(html.includes('aria-label="Obsah redakčních zásad"'));
 assert.equal((html.match(/class="rv3e-questions"/g)||[]).length,1);
 assert.equal((html.match(/class="rv3e-number"/g)||[]).length,4);
 assert.equal((html.match(/class="rv3e-source-art"/g)||[]).length,3);
 assert.equal((html.match(/class="rv3e-ai-part rv3e-ai-/g)||[]).length,3);
});

test('editorial customer-first: uses V3 brand, accessible focus, local art and mobile layout',()=>{
 const {html,manifest}=render();
 assert.deepEqual(manifest.css,['/rv3/catalog-v2.css','/rv3/catalog-v3-theme.css','/rv3/sitewide/editorial.css']);
 assert.ok(html.includes('src="/logo-rv-v32.svg"'));
 assert.ok(html.includes('src="/rv3/assets/editorial-desk.svg"'));
 assert.ok(art.includes('<title')&&art.includes('<desc')&&art.includes('url(#shadow)'));
 assert.ok(art.includes('PRIMÁRNÍ ZDROJE'));
 assert.match(css,/font-family:Georgia/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/@media\(max-width:620px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.ok(Buffer.byteLength(css,'utf8')<20000);
 for(const marker of ['{{JSONLD}}','{{HEADER}}','{{FOOTER}}'])assert.ok(!html.includes(marker));
});

test('editorial customer-first: valid navigation to published background sources',()=>{
 const {html}=render();
 assert.ok(html.includes('href="/rv3/poc/katalog-v2.html"'));
 assert.ok(html.includes('href="/rv3/studio/kontakt.html"'));
 assert.ok(html.includes('href="/redakcni-zasady.html"'));
 assert.ok(html.includes('href="/ochrana-osobnich-udaju.html"'));
});

test('editorial customer-first: source and preview mutations are rejected',()=>{
 assert.throws(()=>renderEditorialStudio(source.replace('https://rychlevypocty.cz/redakcni-zasady.html','https://fake.test/'),template),/Canonical/);
 assert.throws(()=>renderEditorialStudio(source.replace('Martin Šilinger','Fiktivní tým'),template),/Verified|provenance/);
 assert.throws(()=>renderEditorialStudio(source.replace('content="index,follow"','content="noindex,nofollow"'),template),/robots/);
 assert.throws(()=>renderEditorialStudio(source,template.replace('noindex,nofollow,noarchive','index,follow')), /noindex/);
 assert.throws(()=>renderEditorialStudio(source,template.replace('{{JSONLD}}','')), /marker/);
});

test('editorial customer-first: no privacy or false legal guarantee pasted into editorial copy',()=>{
 const {html}=render();
 assert.ok(!html.includes('localStorage.getItem'));
 assert.ok(!html.includes('rv_catalog_favorites_v1'));
 assert.ok(!html.includes('analytics consent'));
 assert.ok(!html.includes('GDPR certifikace'));
 assert.ok(!html.includes('kontaktni-formular.php'));
});