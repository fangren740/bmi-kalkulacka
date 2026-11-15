import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderMethodologyStudio} from '../../rv3/engine/studio-methodology.mjs';
import {discountScenario,DISCOUNTS,formatVolume,MODEL_PRICE,MODEL_COST,mountMethodDemo} from '../../rv3/sitewide/methodology-demo.js';
import {extractMain,getCanonical} from '../../rv3/engine/renderer.mjs';

const read=path=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');
const source=read('jak-pocitame.html');
const template=read('rv3/engine/methodology.template.html');
const css=read('rv3/sitewide/methodology.css');
const artwork=read('rv3/assets/method-workbench.svg');
const dataset=read('data-a-benchmarky.html');
const output=()=>renderMethodologyStudio(source,template);

test('methodology: actual root source remains source of truth, not layout',()=>{
 const {html,manifest}=output();
 assert.notEqual(extractMain(html),extractMain(source));
 assert.equal(manifest.source,'jak-pocitame.html');
 assert.equal(manifest.kind,'bespoke-methodology-studio');
 assert.equal(manifest.preview,'/rv3/studio/jak-pocitame.html');
 assert.equal(manifest.previewOnly,true);
 assert.equal(manifest.designStatus,'VISUAL_REVIEW_PENDING');
 assert.equal(manifest.browserQa,'NOT_VERIFIED');
 for(const legacy of ['rv-trust-v7.css','trust-nav','hero-panel','class="card"'])
   assert.ok(!html.includes(legacy),'Legacy layout leaked: '+legacy);
});

test('methodology: SEO identity locked, noindex preview and unchanged JSON-LD',()=>{
 const {html,manifest}=output();
 assert.equal(manifest.canonical,getCanonical(source));
 assert.equal(getCanonical(html),getCanonical(source));
 assert.equal(manifest.title,'Jak počítáme | RychléVýpočty.cz');
 assert.match(manifest.sourceSha256,/^[a-f0-9]{64}$/);
 assert.match(html,/<meta name="robots" content="noindex,nofollow,noarchive">/);
 assert.match(html,/<title>Jak počítáme \| RychléVýpočty\.cz<\/title>/);
 assert.equal((html.match(/<main\b/gi)||[]).length,1);
 assert.equal((html.match(/<h1\b/gi)||[]).length,1);
 assert.equal((html.match(/<script\b/gi)||[]).length,2,'JSON-LD plus local enhancement only');
 const sourceSchema=source.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1];
 assert.ok(sourceSchema);
 assert.ok(html.includes(sourceSchema),'Structured data was not copied unchanged');
 assert.equal((html.match(/\{\{(?:JSONLD|HEADER|FOOTER)\}\}/g)||[]).length,0);
});

test('methodology: same catalog brand but individually crafted sections and icons',()=>{
 const {html,manifest}=output();
 assert.ok(html.includes('href="/rv3/catalog-v2.css"'));
 assert.ok(html.includes('href="/rv3/catalog-v3-theme.css"'));
 assert.ok(html.includes('href="/rv3/sitewide/methodology.css"'));
 assert.deepEqual(manifest.css,['/rv3/catalog-v2.css','/rv3/catalog-v3-theme.css','/rv3/sitewide/methodology.css']);
 assert.ok(html.includes('src="/logo-rv-v32.svg"'));
 assert.ok(html.includes('src="/rv3/assets/method-workbench.svg"'));
 assert.ok(artwork.includes('<title')&&artwork.includes('<desc')&&artwork.includes('url(#shadow)'));
 assert.equal(manifest.art,'/rv3/assets/method-workbench.svg');
 assert.match(css,/font-family:Georgia/);
 assert.match(css,/font-style:italic/);
 assert.match(css,/@media\(max-width:620px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/:focus-visible/);
 for(const id of ['priklad','postup','typy','aktualizace']){
   assert.ok(html.includes('id="'+id+'"'));
   assert.ok(html.includes('href="#'+id+'"'));
 }
 assert.equal((html.match(/class="rv3m-step"/g)||[]).length,5);
 assert.equal((html.match(/class="rv3m-type rv3m-type-/g)||[]).length,3);
 assert.ok(html.includes('aria-label="Obsah metodiky"'));
 assert.ok(Buffer.byteLength(artwork,'utf8')<10000);
 assert.ok(Buffer.byteLength(css,'utf8')<20000);
});

test('methodology: worked example is not made up, and points to real dataset and CSV',()=>{
 const {html}=output();
 assert.ok(html.includes('href="/data-a-benchmarky.html#dataset-sleva-objem"'));
 assert.ok(dataset.includes('id="dataset-sleva-objem"'));
 assert.ok(dataset.includes('href="/sleva-vs-potrebny-objem-prodeje-benchmark.csv"'));
 assert.ok(dataset.includes('Cena 1 000 Kč · variabilní náklad 600 Kč · sleva 10 %'));
 assert.ok(dataset.includes('+33,3 % prodejů'));
 assert.ok(html.includes('Nejde o předpověď poptávky.'));
 assert.ok(html.includes('data-needed-volume aria-live="polite"'));
 assert.ok(html.includes('data-after-contribution'));
 assert.equal((html.match(/data-discount="/g)||[]).length,DISCOUNTS.length);
 assert.equal((html.match(/aria-pressed="true"/g)||[]).length,1);
});

test('methodology: real math for 0, 5, 10, 15 and 20 percent is deterministic',()=>{
 assert.equal(MODEL_PRICE,1000);
 assert.equal(MODEL_COST,600);
 assert.deepEqual(DISCOUNTS,[0,5,10,15,20]);
 const values=DISCOUNTS.map(discountScenario);
 assert.deepEqual(values.map(v=>Math.round(v.afterPrice)),[1000,950,900,850,800]);
 assert.deepEqual(values.map(v=>Math.round(v.afterContribution)),[400,350,300,250,200]);
 const expected=[0,14.2857142857,33.3333333333,60,100];
 for(let i=0;i<values.length;i++)
   assert.ok(Math.abs(values[i].volumeIncreasePercent-expected[i])<0.00001,'Discount '+DISCOUNTS[i]);
 assert.equal(formatVolume(values[2].volumeIncreasePercent),'+33,3 %');
 assert.equal(formatVolume(values[4].volumeIncreasePercent),'+100,0 %');
});

test('methodology: reject invalid calculations rather than create impossible savings',()=>{
 for(const rate of [-1,40,100,NaN,Infinity,-Infinity,'10',null])
   assert.throws(()=>discountScenario(rate),RangeError);
 assert.equal(mountMethodDemo(null),false);
});

test('methodology: source title, canonical, facts and identity fail closed',()=>{
 assert.throws(()=>renderMethodologyStudio(source.replace('https://rychlevypocty.cz/jak-pocitame.html','https://fake.test/jak-pocitame.html'),template),/canonical/i);
 assert.throws(()=>renderMethodologyStudio(source.replace('Referenční rok','Starý rok'),template),/methodology claim/);
 assert.throws(()=>renderMethodologyStudio(source.replace('content="index,follow"','content="noindex,nofollow"'),template),/robots/);
 assert.throws(()=>renderMethodologyStudio(source,template.replace('name="robots" content="noindex,nofollow,noarchive"','name="robots" content="index,follow"')),/noindex/);
 assert.throws(()=>renderMethodologyStudio(source,template.replace('https://rychlevypocty.cz/jak-pocitame.html','https://fake.test/method')),/identity drift/i);
});

test('methodology: real update/feedback and source URLs, not placeholder links',()=>{
 const {html}=output();
 for(const link of [
  '/data-a-benchmarky.html#dataset-sleva-objem','/data-a-benchmarky.html',
  '/redakcni-zasady.html','/kontakt.html','/rv3/studio/o-nas.html','/rv3/poc/katalog-v2.html'
 ])assert.ok(html.includes('href="'+link+'"'),'Missing important link '+link);
 assert.ok(html.includes('Pravidla se mění.'));
 assert.ok(html.includes('ručním přepočtem'));
 assert.ok(html.includes('Ověřit model a stáhnout CSV'));
 assert.ok(!html.includes('nikdy se nemýlí')&&!html.includes('100% přesný'));
 assert.match(html,/data-method-demo/);
});
