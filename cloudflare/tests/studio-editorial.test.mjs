import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderEditorialStudio} from '../../rv3/engine/studio-editorial.mjs';
import {createReportMailto,mountEditorialReport,REPORT_TYPES,REPORT_EMAIL} from '../../rv3/sitewide/editorial-report.js';
import {extractMain,getCanonical} from '../../rv3/engine/renderer.mjs';

const from=path=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');
const source=from('redakcni-zasady.html');
const template=from('rv3/engine/editorial.template.html');
const css=from('rv3/sitewide/editorial.css');
const svg=from('rv3/assets/editorial-desk.svg');
const methodology=from('jak-pocitame.html');
const about=from('o-nas.html');
const funding=from('reklama-a-spoluprace.html');
const render=()=>renderEditorialStudio(source,template);

test('editorial: original source is a locked factual basis, never a layout template',()=>{
 const {html,manifest}=render();
 assert.equal(manifest.kind,'bespoke-editorial-studio');
 assert.equal(manifest.source,'redakcni-zasady.html');
 assert.equal(manifest.preview,'/rv3/studio/redakcni-zasady.html');
 assert.equal(manifest.previewOnly,true);
 assert.equal(manifest.designStatus,'VISUAL_REVIEW_PENDING');
 assert.equal(manifest.browserQa,'NOT_VERIFIED');
 assert.notEqual(extractMain(html),extractMain(source));
 for(const legacy of ['rv-trust-v7.css','trust-nav','hero-panel','class="card"']){
  assert.ok(!html.includes(legacy),'Unexpected old layout '+legacy);
 }
});

test('editorial: SEO canonical, metadata, original structured data and preview noindex',()=>{
 const {html,manifest}=render();
 assert.equal(getCanonical(html),getCanonical(source));
 assert.equal(manifest.canonical,'https://rychlevypocty.cz/redakcni-zasady.html');
 assert.equal(manifest.title,'Redakční zásady | RychléVýpočty.cz');
 assert.match(manifest.sourceSha256,/^[a-f0-9]{64}$/);
 assert.match(html,/<meta name="robots" content="noindex,nofollow,noarchive">/);
 assert.match(html,/<meta name="description" content="Jak RychléVýpočty\.cz vybírají témata/);
 assert.equal((html.match(/<main\b/g)||[]).length,1);
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
 assert.equal((html.match(/<script\b/g)||[]).length,2,'Only source JSON-LD plus local mail enhancer');
 const schema=source.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1];
 assert.ok(schema&&html.includes(schema));
 for(const marker of ['{{JSONLD}}','{{HEADER}}','{{FOOTER}}'])assert.ok(!html.includes(marker));
});

test('editorial: brand, bespoke illustration and catalogue art direction',()=>{
 const {html,manifest}=render();
 assert.ok(html.includes('src="/logo-rv-v32.svg"'));
 assert.ok(html.includes('href="/rv3/catalog-v2.css"'));
 assert.ok(html.includes('href="/rv3/catalog-v3-theme.css"'));
 assert.ok(html.includes('href="/rv3/sitewide/editorial.css"'));
 assert.deepEqual(manifest.css,['/rv3/catalog-v2.css','/rv3/catalog-v3-theme.css','/rv3/sitewide/editorial.css']);
 assert.equal(manifest.art,'/rv3/assets/editorial-desk.svg');
 assert.ok(html.includes('src="/rv3/assets/editorial-desk.svg"'));
 assert.ok(svg.includes('<title')&&svg.includes('<desc')&&svg.includes('url(#shadow)'));
 assert.ok(svg.includes('PRIMÁRNÍ ZDROJE')&&svg.includes('REDAKČNÍ ZÁSADY'));
 assert.match(css,/font-family:Georgia/);
 assert.match(css,/font-style:italic/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/@media\(max-width:620px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.ok(Buffer.byteLength(svg,'utf8')<10000);
 assert.ok(Buffer.byteLength(css,'utf8')<20000);
});

test('editorial: clear page journey and meaningful illustrated content',()=>{
 const {html}=render();
 for(const id of ['proces','zdroje','ai','nahlasit']){
  assert.ok(html.includes('id="'+id+'"'));
  assert.ok(html.includes('href="#'+id+'"'));
 }
 assert.match(html,/aria-label="Obsah redakčních zásad"/);
 assert.equal((html.match(/class="rv3e-questions"/g)||[]).length,1);
 assert.equal((html.match(/class="rv3e-number"/g)||[]).length,4);
 assert.equal((html.match(/class="rv3e-source-art"/g)||[]).length,3);
 assert.equal((html.match(/class="rv3e-ai-part rv3e-ai-/g)||[]).length,3);
 assert.ok(html.includes('AI může pomáhat.'));
 assert.ok(html.includes('Martin Šilinger'));
 assert.ok(html.includes('Opravy po upozornění'));
 assert.match(html,/focusable="false"/);
 assert.equal((html.match(/<form\b/g)||[]).length,1);
});

test('editorial: language remains grounded in actual editorial policy, no invented experts or guarantees',()=>{
 const {html}=render();
 for(const phrase of [
  'Začínáme konkrétní otázkou','Zdroje hledáme co nejblíže původnímu pravidlu',
  'Jak používáme AI a automatizaci','Finální odpovědnost','Na doložené chyby reagujeme opravou'
 ])assert.ok(source.includes(phrase));
 assert.ok(source.includes('Martin Šilinger'));
 assert.ok(source.includes('mailto:rychlevypocty@seznam.cz'));
 assert.match(html,/AI výstup není automaticky ověřený zdroj/);
 assert.match(html,/odpovídá provozovatel/);
 assert.doesNotMatch(html,/100% přesn|certifikovan|garantujeme opravu do|právní poradenství zajistí|tým odborníků|každý obsah automaticky ověřen/i);
 assert.ok(funding.includes('Případný obchodní obsah jasně označíme'));
});

test('editorial: linked evidence, actual destinations and control-page continuity',()=>{
 const {html}=render();
 for(const route of [
  '/rv3/poc/katalog-v2.html','/rv3/studio/jak-pocitame.html','/rv3/studio/o-nas.html',
  '/data-a-benchmarky.html','/reklama-a-spoluprace.html',
  '/ochrana-osobnich-udaju.html'
 ])assert.ok(html.includes('href="'+route+'"'),'Missing '+route);
 assert.ok(methodology.includes('Referenční rok, datum nebo verzi'));
 assert.ok(about.includes('rychlevypocty@seznam.cz'));
});

test('editorial: mailto report is encoded, user-owned and not a network submission',()=>{
 assert.equal(REPORT_EMAIL,'rychlevypocty@seznam.cz');
 assert.equal(REPORT_TYPES.length,4);
 const url=createReportMailto({
  type:'Chybný výpočet',page:'/cista-mzda-kalkulacka.html',
  detail:'Vstup 30 000 Kč; očekáváno X, vrací Y. & <test>'
 });
 assert.ok(url.startsWith('mailto:rychlevypocty@seznam.cz?subject='));
 const query=new URL(url.replace('mailto:','https://example.test/')).searchParams;
 assert.equal(query.get('subject'),'RychléVýpočty.cz — Chybný výpočet');
 assert.ok(query.get('body').includes('Stránka: /cista-mzda-kalkulacka.html'));
 assert.ok(query.get('body').includes('& <test>'));
 assert.ok(!url.includes('<test>')&&!url.includes('30000 Kč'));
 const {html}=render();
 assert.match(html,/data-editorial-report/);
 assert.match(html,/Nic se neposílá automaticky/);
 assert.match(html,/Nevkládejte citlivé osobní údaje/);
 assert.match(html,/href="mailto:rychlevypocty@seznam.cz/);
 assert.match(html,/type="submit"/);
 assert.match(html,/data-editorial-report action="mailto:rychlevypocty@seznam.cz" method="post" enctype="text\/plain"/);
 assert.match(html,/data-editorial-status/);
});

test('editorial: mail generator rejects missing or excessive information',()=>{
 const good={type:'Chybný výpočet',page:'/kalkulacky.html',detail:'Chybný výsledek'};
 for(const bad of [
  {...good,type:'Pokoutné přepsání'}, {...good,type:''},
  {...good,page:''},{...good,page:' '.repeat(3)}, {...good,page:'x'.repeat(251)},
  {...good,detail:' '},{...good,detail:'x'.repeat(1801)}
 ])assert.throws(()=>createReportMailto(bad),TypeError);
 assert.equal(mountEditorialReport(null,()=>{}),false);
});

test('editorial: form only opens a user-triggered mailto and honors native control values',()=>{
 const nodes={
  '[name="type"]':{value:'Neaktuální údaj nebo zdroj'},
  '[name="page"]':{value:'/jak-pocitame.html'},
  '[name="detail"]':{value:'Novější metodika má jinou verzi.'},
  '[data-editorial-status]':{textContent:''}
 };
 let callback=null;
 const form={
  querySelector:key=>nodes[key],
  addEventListener:(event,fn)=>{assert.equal(event,'submit');callback=fn}
 };
 const opened=[];
 assert.equal(mountEditorialReport(form,url=>opened.push(url)),true);
 assert.ok(typeof callback==='function');
 let prevented=false;
 callback({preventDefault(){prevented=true;}});
 assert.equal(prevented,true);
 assert.equal(opened.length,1);
 assert.ok(opened[0].startsWith('mailto:rychlevypocty@seznam.cz?'));
 assert.ok(nodes['[data-editorial-status]'].textContent.includes('odeslání'));
 nodes['[name="detail"]'].value='';
 callback({preventDefault(){}});
 assert.equal(opened.length,1,'Invalid form must not open another URL');
 assert.ok(nodes['[data-editorial-status]'].textContent.includes('Doplňte'));
});

test('editorial: mutated source identities and preview robots fail closed',()=>{
 assert.throws(()=>renderEditorialStudio(source.replace('https://rychlevypocty.cz/redakcni-zasady.html','https://fake.test/redakcni-zasady.html'),template),/Canonical/);
 assert.throws(()=>renderEditorialStudio(source.replace('Začínáme konkrétní otázkou','Začínáme bez otázky'),template),/Verified editorial claim/);
 assert.throws(()=>renderEditorialStudio(source.replace('Martin Šilinger','Nepodložený tým'),template),/(Verified editorial claim|owner provenance)/);
 assert.throws(()=>renderEditorialStudio(source.replace('content="index,follow"','content="noindex,nofollow"'),template),/robots/);
 assert.throws(()=>renderEditorialStudio(source,template.replace('noindex,nofollow,noarchive','index,follow')), /noindex/);
 assert.throws(()=>renderEditorialStudio(source,template.replace('https://rychlevypocty.cz/redakcni-zasady.html','https://fake.test/test')), /identity/);
});
