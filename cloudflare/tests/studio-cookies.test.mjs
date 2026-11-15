import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {renderCookiesStudio,COOKIES_SECTIONS,STORAGE_KEYS} from '../../rv3/engine/studio-cookies.mjs';
import {extractMain,getCanonical} from '../../rv3/engine/renderer.mjs';

const from=path=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');
const source=from('cookies.html');
const template=from('rv3/engine/cookies.template.html');
const css=from('rv3/sitewide/cookies.css');
const art=from('rv3/assets/storage-drawer.svg');
const symbols=from('rv3/assets/about-icons.svg');
const result=()=>renderCookiesStudio(source,template);
const chunks=[...extractMain(source).matchAll(/<section class="card">([\s\S]*?)<\/section>/g)].map(x=>x[1]);

test('cookies: source Git blob pinned and all five original sections copied exactly',()=>{
 const gitSha=createHash('sha1').update('blob '+Buffer.byteLength(source,'utf8')+'\0'+source).digest('hex');
 assert.equal(gitSha,'68e9ba2b0db21a80dfdb5a7dc3443e17394eb56f');
 const {html,manifest}=result();
 assert.equal(chunks.length,5);
 assert.equal(COOKIES_SECTIONS.length,5);
 assert.equal(manifest.sections,5);
 assert.equal(manifest.sourceBodyVerbatim,true);
 assert.equal(manifest.source,'cookies.html');
 assert.equal(manifest.preview,'/rv3/studio/cookies.html');
 assert.equal(manifest.previewOnly,true);
 for(let i=0;i<5;i++){
  assert.ok(html.includes(chunks[i]),'Entire source section missing: '+i);
  assert.equal(html.split(chunks[i]).length,2,'Source copied more than once: '+i);
  assert.ok(chunks[i].includes('<h2>'+COOKIES_SECTIONS[i].heading+'</h2>'));
 }
 assert.notEqual(extractMain(html),extractMain(source),'Not the legacy page');
});

test('cookies: exact canonical/source schema retained and preview robots blocked',()=>{
 const {html,manifest}=result();
 assert.equal(manifest.canonical,'https://rychlevypocty.cz/cookies.html');
 assert.equal(getCanonical(html),getCanonical(source));
 assert.equal(manifest.title,'Cookies a lokální úložiště | RychléVýpočty.cz');
 assert.match(manifest.sourceSha256,/^[a-f0-9]{64}$/);
 assert.match(html,/<meta name="robots" content="noindex,nofollow,noarchive">/);
 assert.match(html,/<meta name="description" content="Přehled lokálního ukládání a URL parametrů používaných na RychléVýpočty.cz/);
 const ld=source.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1];
 assert.ok(ld&&html.includes(ld));
 assert.equal((html.match(/<script\b/gi)||[]).length,1,'One schema block, no extra JS');
 assert.equal((html.match(/<main\b/gi)||[]).length,1);
 assert.equal((html.match(/<h1\b/gi)||[]).length,1);
 for(const marker of ['{{JSONLD}}','{{HEADER}}','{{FOOTER}}',...COOKIES_SECTIONS.map((_,i)=>'{{CONTENT_'+i+'}}')])
  assert.ok(!html.includes(marker),'Unresolved marker '+marker);
});

test('cookies: all nine storage keys and their 54 six-field descriptions preserved',()=>{
 const {html,manifest}=result();
 assert.equal(manifest.storageKeys,9);
 assert.ok(html.includes('U plánovače dovolené a směnového kalendáře se popis ukládání neshoduje'));
 assert.ok(html.indexOf('Kontrola aktuálnosti seznamu')<html.indexOf('<h2>Co se ukládá, kdy a jak se údaje odstraní</h2>'));

 assert.equal(STORAGE_KEYS.length,9);
 for(const key of STORAGE_KEYS){
  assert.ok(html.includes('data-label="Klíč">'+key+'</td>'),'Missing original key '+key);
  assert.ok(chunks[2].includes(key));
 }
 const originalCells=[...chunks[2].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map(x=>x[0]);
 assert.equal(originalCells.length,54);
 for(const cell of originalCells)assert.ok(html.includes(cell),'Technical detail lost '+cell.slice(0,60));
 const outputRows=(html.match(/<tr><td class="key" data-label="Klíč">/g)||[]).length;
 assert.equal(outputRows,9);
 for(const heading of ['Klíč','Účel a obsah','Přesný spouštěč','Výslovná volba','Uchování','Odstranění'])
  assert.ok(html.includes('<th>'+heading+'</th>'),'Missing table header '+heading);
});

test('cookies: user value first — straightforward navigation and intact original advice',()=>{
 const {html}=result();
 for(const id of ['rozdily','polozky','vymazani','odkazy','mereni'])
  assert.ok(html.includes('id="'+id+'"')&&html.includes('href="#'+id+'"'));
 assert.match(html,/<h1 id="cookies-title">Cookies a <em>lokální úložiště\.<\/em><\/h1>/);
 assert.match(html,/class="rv3k-button rv3k-primary" href="#polozky"/);
 assert.ok(html.includes('Před odesláním zkontrolujte adresu'));
 assert.ok(html.includes('data webu'));
 assert.ok(html.includes('URL může obsahovat zadané hodnoty'));
 for(const link of ['/rv3/studio/ochrana-osobnich-udaju.html','/rv3/studio/kontakt.html'])
  assert.ok(html.includes('href="'+link+'"'));
 assert.ok(!html.includes('rv-trust-v7.css')&&!html.includes('trust-nav')&&!html.includes('hero-panel'));
 assert.ok(!html.includes('<form')&&!html.includes('<input')&&!html.includes('type="button"'));
});

test('cookies: original editorial assertions remain visible but are explicitly pending operational verification',()=>{
 const {html,manifest}=result();
 assert.equal(manifest.factualReviewStatus,'BLOCKED_PENDING_ANALYTICS_CMP_AND_STORAGE_CODE_VERIFICATION');
 assert.equal(manifest.designStatus,'VISUAL_REVIEW_PENDING');
 assert.equal(manifest.browserQa,'NOT_VERIFIED');
 assert.ok(html.includes('Google Analytics, Google AdSense ani jiné reklamní nebo analytické technologie'));
 assert.ok(html.includes('Stav analytiky, reklamy a správy souhlasu musí před vydáním V3 potvrdit'));
 assert.ok(html.indexOf('Stav analytiky, reklamy a správy souhlasu') <
           html.indexOf('<h2>Tyto technologie nyní nejsou aktivní</h2>'),
  'Warning must come BEFORE unverified legacy claim');
 assert.doesNotMatch(html,/audit dokončen|v souladu s GDPR|garantujeme bezpečnost|žádné riziko|vždy přesné/i);
});

test('cookies: clear brand language, original art, real symbols and responsive records',()=>{
 const {html,manifest}=result();
 assert.ok(html.includes('src="/logo-rv-v32.svg"'));
 assert.equal(manifest.art,'/rv3/assets/storage-drawer.svg');
 assert.ok(html.includes('src="/rv3/assets/storage-drawer.svg"'));
 assert.deepEqual(manifest.css,['/rv3/catalog-v2.css','/rv3/catalog-v3-theme.css','/rv3/sitewide/cookies.css']);
 for(const path of manifest.css)assert.ok(html.includes('href="'+path+'"'));
 assert.match(art,/<title\b/);assert.match(art,/<desc\b/);
 assert.match(art,/url\(#shadow\)/);
 assert.match(art,/9 POLOŽEK/);
 assert.match(css,/font-family:Georgia/);
 assert.match(css,/focus-visible/);
 assert.match(css,/@media\(max-width:680px\)/);
 assert.match(css,/data-label/);
 assert.match(css,/\.rv3k-storage \.data-table td:before/);
 assert.match(css,/overflow-wrap:anywhere/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 for(const glyph of COOKIES_SECTIONS.map(x=>x.glyph)){
  assert.ok(symbols.includes('id="'+glyph+'"'),'Original icon glyph missing '+glyph);
  assert.ok(html.includes('about-icons.svg#'+glyph));
 }
 assert.ok(Buffer.byteLength(art,'utf8')<7000);
 assert.ok(Buffer.byteLength(css,'utf8')<14000);
 assert.ok(Buffer.byteLength(template,'utf8')<8000);
});

test('cookies: deterministic fail-closed source checks for SEO, storage and content drift',()=>{
 assert.throws(()=>renderCookiesStudio(source.replace('rv_catalog_favorites_v1','rv_catalog_favorites_v2'),template),/fingerprint/);
 assert.throws(()=>renderCookiesStudio(source.replace('Google Analytics ani reklamní technologie','Google Analytics nebo reklamní technologie'),template),/fingerprint/);
 assert.throws(()=>renderCookiesStudio(source.replace('https://rychlevypocty.cz/cookies.html','https://fake.test/cookies.html'),template),/fingerprint/);
 assert.throws(()=>renderCookiesStudio(source.replace('<section class="card">','<section>'),template),/fingerprint/);
 assert.throws(()=>renderCookiesStudio(source,template.replace('noindex,nofollow,noarchive','index,follow')), /identity|robots/);
 assert.throws(()=>renderCookiesStudio(source,template.replace('https://rychlevypocty.cz/cookies.html','https://wrong.test/')), /identity/);
 assert.throws(()=>renderCookiesStudio(source,template.replace('{{CONTENT_4}}','')), /placeholder/);
});

test('cookies: no extra app logic or automatic access to saved browser information',()=>{
 const {html}=result();
 assert.ok(!html.includes('localStorage.getItem'));
 assert.ok(!html.includes('localStorage.removeItem'));
 assert.ok(!html.includes('document.cookie'));
 assert.ok(!html.includes('navigator.clipboard'));
 assert.ok(!html.includes('data-cookie-consent'));
 assert.equal((html.match(/<script\b/gi)||[]).length,1);
 assert.ok(!html.includes('src="/rv3/sitewide/cookies.js"'));
 assert.ok(html.includes('Data webu')||html.includes('data webu'));
});